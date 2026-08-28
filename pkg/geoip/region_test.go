package geoip

import "testing"

func TestParseRegion(t *testing.T) {
	legacy := parseRegion("中国|0|广东省|深圳市|电信")
	if legacy.Country != "中国" || legacy.Province != "广东省" || legacy.City != "深圳市" || legacy.ISP != "电信" {
		t.Fatalf("legacy fields: %+v", legacy)
	}
	if legacy.Label != "中国 广东省 深圳市" {
		t.Fatalf("legacy label=%q", legacy.Label)
	}

	v3 := parseRegion("中国|江苏省|南京市|0|CN")
	if v3.Country != "中国" || v3.Province != "江苏省" || v3.City != "南京市" {
		t.Fatalf("v3 fields: %+v", v3)
	}
	if v3.Label != "中国 江苏省 南京市" {
		t.Fatalf("v3 label=%q", v3.Label)
	}

	us := parseRegion("United States|California|0|Google LLC|US")
	if us.Country != "United States" || us.Province != "California" || us.ISP != "Google LLC" {
		t.Fatalf("us fields: %+v", us)
	}
	if us.Label != "United States California" {
		t.Fatalf("us label=%q", us.Label)
	}
}

func TestClassifyNonPublic(t *testing.T) {
	if loc := classifyNonPublic("127.0.0.1"); loc == nil || loc.Label != "本机回环" {
		t.Fatalf("loopback: %+v", loc)
	}
	if loc := classifyNonPublic("192.168.1.1"); loc == nil || loc.Label != "内网" {
		t.Fatalf("private: %+v", loc)
	}
}

// Kind is what lets the UI render these in the reader's language — the labels
// above are Chinese to match ip2region, which only ships Chinese place names.
func TestClassifyNonPublicKind(t *testing.T) {
	cases := map[string]Kind{
		"127.0.0.1":   KindLoopback,
		"::1":         KindLoopback,
		"192.168.1.1": KindPrivate,
		"10.0.0.7":    KindPrivate,
		"169.254.1.1": KindPrivate,
		"0.0.0.0":     KindUnspecified,
		"not-an-ip":   KindInvalid,
	}
	for ip, want := range cases {
		loc := classifyNonPublic(ip)
		if loc == nil {
			t.Fatalf("%s: got nil, want kind %q", ip, want)
		}
		if loc.Kind != want {
			t.Errorf("%s: kind=%q, want %q", ip, loc.Kind, want)
		}
	}

	// Public addresses must stay unmarked so the xdb result is shown verbatim.
	if loc := classifyNonPublic("8.8.8.8"); loc != nil {
		t.Errorf("public address classified as %+v, want nil", loc)
	}
}
