// Package geoip resolves client IP addresses to approximate regions (offline ip2region).
package geoip

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/lionsoul2014/ip2region/binding/golang/service"
)

const (
	defaultDBRelPath = "data/ip2region_v4.xdb"
	defaultDBURL     = "https://cdn.jsdelivr.net/gh/lionsoul2014/ip2region@master/data/ip2region_v4.xdb"
)

// Kind identifies an address the xdb cannot place, so the UI can localise it.
// Real lookups leave it empty: ip2region only ships Chinese place names, and
// translating those is out of scope.
type Kind string

const (
	KindLoopback    Kind = "loopback"
	KindPrivate     Kind = "private"
	KindUnspecified Kind = "unspecified"
	KindInvalid     Kind = "invalid"
)

// Location is a parsed ip2region result.
type Location struct {
	Country  string `json:"country,omitempty"`
	Province string `json:"province,omitempty"`
	City     string `json:"city,omitempty"`
	ISP      string `json:"isp,omitempty"`
	// Label is a short display string, e.g. "中国 广东省 深圳市".
	Label string `json:"label,omitempty"`
	// Kind is set only for non-public addresses; clients should render their own
	// wording for it and fall back to Label when empty.
	Kind Kind `json:"kind,omitempty"`
	// Raw is the original pipe-separated ip2region string.
	Raw string `json:"raw,omitempty"`
}

// Resolver looks up IP regions. Safe for concurrent use after Init.
type Resolver struct {
	mu       sync.RWMutex
	svc      *service.Ip2Region
	cache    map[string]*Location
	dbPath   string
	initOnce sync.Once
	initErr  error
}

var defaultResolver = &Resolver{}

// Default returns the process-wide resolver.
func Default() *Resolver { return defaultResolver }

// Init loads (or downloads) the IPv4 xdb and prepares the searcher.
// dbPath empty → CILIKUBE_IP2REGION_DB or data/ip2region_v4.xdb.
func (r *Resolver) Init(dbPath string) error {
	r.initOnce.Do(func() {
		r.cache = make(map[string]*Location)
		path := strings.TrimSpace(dbPath)
		if path == "" {
			path = strings.TrimSpace(os.Getenv("CILIKUBE_IP2REGION_DB"))
		}
		if path == "" {
			path = defaultDBRelPath
		}
		r.dbPath = path
		if err := ensureDB(path); err != nil {
			r.initErr = err
			return
		}
		svc, err := service.NewIp2RegionWithPath(path, "")
		if err != nil {
			r.initErr = fmt.Errorf("open ip2region db: %w", err)
			return
		}
		r.svc = svc
	})
	return r.initErr
}

// Lookup returns region info for ip. Private / invalid IPs get a local label.
// If the DB is unavailable, returns nil (callers should show "-").
func (r *Resolver) Lookup(ip string) *Location {
	ip = strings.TrimSpace(ip)
	if ip == "" {
		return nil
	}
	if loc := classifyNonPublic(ip); loc != nil {
		return loc
	}
	if err := r.Init(""); err != nil || r.svc == nil {
		return nil
	}

	r.mu.RLock()
	if cached, ok := r.cache[ip]; ok {
		r.mu.RUnlock()
		return cached
	}
	r.mu.RUnlock()

	raw, err := r.svc.Search(ip)
	if err != nil || strings.TrimSpace(raw) == "" {
		return nil
	}
	loc := parseRegion(raw)
	r.mu.Lock()
	if len(r.cache) < 4096 {
		r.cache[ip] = loc
	}
	r.mu.Unlock()
	return loc
}

func classifyNonPublic(ipStr string) *Location {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return &Location{Label: "无效地址", Country: "无效地址", Kind: KindInvalid}
	}
	if ip.IsLoopback() {
		return &Location{Label: "本机回环", Country: "本机回环", Kind: KindLoopback}
	}
	if ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
		return &Location{Label: "内网", Country: "内网", Kind: KindPrivate}
	}
	if ip.IsUnspecified() {
		return &Location{Label: "未指定", Country: "未指定", Kind: KindUnspecified}
	}
	return nil
}

// parseRegion turns ip2region pipe strings into Location.
//
// Current xdb (v3+):  国家|省份|城市|ISP|国家代码   e.g. 中国|江苏省|南京市|0|CN
// Legacy xdb:         国家|区域|省份|城市|ISP     e.g. 中国|0|广东省|深圳市|电信
func parseRegion(raw string) *Location {
	parts := strings.Split(raw, "|")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
		if parts[i] == "0" || parts[i] == "内网IP" {
			parts[i] = ""
		}
	}
	for len(parts) < 5 {
		parts = append(parts, "")
	}

	var country, province, city, isp string
	// Legacy: second field empty/region code and third looks like province/city.
	if parts[1] == "" && parts[2] != "" {
		country, province, city, isp = parts[0], parts[2], parts[3], parts[4]
	} else {
		country, province, city, isp = parts[0], parts[1], parts[2], parts[3]
		// Trailing ISO country code (CN/US) is not an ISP name.
		if isp == "" && len(parts[4]) == 2 {
			// keep isp empty; ISO is unused in UI
		}
	}

	loc := &Location{
		Country:  country,
		Province: province,
		City:     city,
		ISP:      isp,
		Raw:      raw,
	}
	var bits []string
	for _, s := range []string{loc.Country, loc.Province, loc.City} {
		if s != "" && (len(bits) == 0 || bits[len(bits)-1] != s) {
			bits = append(bits, s)
		}
	}
	loc.Label = strings.Join(bits, " ")
	if loc.Label == "" && loc.ISP != "" {
		loc.Label = loc.ISP
	}
	if loc.Label == "" {
		loc.Label = raw
	}
	return loc
}

func ensureDB(path string) error {
	if st, err := os.Stat(path); err == nil && st.Size() > 1024 {
		return nil
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	url := strings.TrimSpace(os.Getenv("CILIKUBE_IP2REGION_URL"))
	if url == "" {
		url = defaultDBURL
	}
	tmp := path + ".tmp"
	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("download ip2region db: %w (set CILIKUBE_IP2REGION_DB to a local .xdb)", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download ip2region db: HTTP %d", resp.StatusCode)
	}
	f, err := os.OpenFile(tmp, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(f, resp.Body)
	closeErr := f.Close()
	if copyErr != nil {
		_ = os.Remove(tmp)
		return copyErr
	}
	if closeErr != nil {
		_ = os.Remove(tmp)
		return closeErr
	}
	if err := os.Rename(tmp, path); err != nil {
		_ = os.Remove(tmp)
		return err
	}
	return nil
}
