package service

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/ciliverse/cilikube/configs"
	"github.com/ciliverse/cilikube/internal/store"
	"github.com/ciliverse/cilikube/pkg/geoip"
)

// AuditService provides audit and monitoring functionality
type AuditService struct {
	store  store.Store
	config *configs.Config
}

// NewAuditService creates a new AuditService instance
func NewAuditService(store store.Store, config *configs.Config) *AuditService {
	return &AuditService{
		store:  store,
		config: config,
	}
}

// SecurityEvent represents a security-related event
type SecurityEvent struct {
	Type      string                 `json:"type"`
	Severity  string                 `json:"severity"`
	UserID    *uint                  `json:"user_id,omitempty"`
	Username  string                 `json:"username,omitempty"`
	IPAddress string                 `json:"ip_address"`
	UserAgent string                 `json:"user_agent"`
	Resource  string                 `json:"resource"`
	Action    string                 `json:"action"`
	Result    string                 `json:"result"`
	Details   map[string]interface{} `json:"details,omitempty"`
	Timestamp time.Time              `json:"timestamp"`
	RequestID string                 `json:"request_id,omitempty"`
	SessionID string                 `json:"session_id,omitempty"`
}

// AuditEventType defines types of audit events
type AuditEventType string

const (
	// Authentication events
	EventTypeLogin          AuditEventType = "login"
	EventTypeLoginFailed    AuditEventType = "login_failed"
	EventTypeLogout         AuditEventType = "logout"
	EventTypePasswordChange AuditEventType = "password_change"
	EventTypeAccountLocked  AuditEventType = "account_locked"

	// Authorization events
	EventTypePermissionDenied AuditEventType = "permission_denied"
	EventTypeRoleAssigned     AuditEventType = "role_assigned"
	EventTypeRoleRemoved      AuditEventType = "role_removed"

	// Resource access events
	EventTypeResourceAccess AuditEventType = "resource_access"
	EventTypeResourceCreate AuditEventType = "resource_create"
	EventTypeResourceUpdate AuditEventType = "resource_update"
	EventTypeResourceDelete AuditEventType = "resource_delete"

	// System events
	EventTypeSystemConfig AuditEventType = "system_config"
	EventTypeUserManage   AuditEventType = "user_manage"

	// Security events
	EventTypeSuspiciousActivity AuditEventType = "suspicious_activity"
	EventTypeSecurityViolation  AuditEventType = "security_violation"
	EventTypeRateLimitExceeded  AuditEventType = "rate_limit_exceeded"
)

// EventSeverity defines severity levels for events
type EventSeverity string

const (
	SeverityInfo     EventSeverity = "info"
	SeverityWarning  EventSeverity = "warning"
	SeverityError    EventSeverity = "error"
	SeverityCritical EventSeverity = "critical"
)

// LogAPIRequest implements auth.APIAuditLogger for HTTP audit middleware.
func (s *AuditService) LogAPIRequest(userID *uint, username, ip, userAgent, resource, action, result, severity string, details map[string]interface{}) error {
	if s.config != nil && !s.config.Security.Audit.LogAPICalls {
		// Still record auth/admin failures even when general API audit is disabled
		if result == "success" && resource != "auth" && resource != "admin" && resource != "users" && resource != "roles" && resource != "settings" {
			return nil
		}
	}

	return s.LogSecurityEvent(SecurityEvent{
		Type:      "api_request",
		Severity:  severity,
		UserID:    userID,
		Username:  username,
		IPAddress: ip,
		UserAgent: userAgent,
		Resource:  resource,
		Action:    action,
		Result:    result,
		Details:   details,
		Timestamp: time.Now(),
	})
}

// LogSecurityEvent logs a security event
func (s *AuditService) LogSecurityEvent(event SecurityEvent) error {
	// Set timestamp if not provided
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now()
	}

	// Merge username into details so list UIs can show who acted without a join
	details := event.Details
	if details == nil {
		details = map[string]interface{}{}
	}
	if event.Username != "" {
		if _, ok := details["username"]; !ok {
			details["username"] = event.Username
		}
	}
	if event.Result != "" {
		if _, ok := details["result"]; !ok {
			details["result"] = event.Result
		}
	}

	detailsJSON := ""
	if jsonBytes, err := json.Marshal(details); err == nil {
		detailsJSON = string(jsonBytes)
	}

	// Create audit log entry
	auditLog := &store.AuditLog{
		UserID:     event.UserID,
		Action:     string(event.Type),
		Resource:   event.Resource,
		ResourceID: event.Action,
		IPAddress:  event.IPAddress,
		UserAgent:  event.UserAgent,
		Details:    detailsJSON,
		CreatedAt:  event.Timestamp,
	}

	return s.store.CreateAuditLog(auditLog)
}

// LogAuthenticationEvent logs authentication-related events
func (s *AuditService) LogAuthenticationEvent(eventType AuditEventType, userID *uint, username, ipAddress, userAgent string, success bool, details map[string]interface{}) error {
	severity := SeverityInfo
	if !success {
		severity = SeverityWarning
	}

	result := "success"
	if !success {
		result = "failure"
	}

	event := SecurityEvent{
		Type:      string(eventType),
		Severity:  string(severity),
		UserID:    userID,
		Username:  username,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Resource:  "authentication",
		Action:    string(eventType),
		Result:    result,
		Details:   details,
		Timestamp: time.Now(),
	}

	return s.LogSecurityEvent(event)
}

// LogResourceAccessEvent logs resource access events
func (s *AuditService) LogResourceAccessEvent(userID uint, username, resource, action, ipAddress, userAgent string, success bool, details map[string]interface{}) error {
	severity := SeverityInfo
	if !success {
		severity = SeverityWarning
	}

	result := "success"
	if !success {
		result = "failure"
	}

	event := SecurityEvent{
		Type:      string(EventTypeResourceAccess),
		Severity:  string(severity),
		UserID:    &userID,
		Username:  username,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Resource:  resource,
		Action:    action,
		Result:    result,
		Details:   details,
		Timestamp: time.Now(),
	}

	return s.LogSecurityEvent(event)
}

// DetectAnomalousActivity analyzes audit logs to detect suspicious patterns
func (s *AuditService) DetectAnomalousActivity() ([]SecurityThreat, error) {
	var threats []SecurityThreat

	// Detect multiple failed logins from same IP
	if ipThreats, err := s.detectFailedLoginsByIP(); err == nil {
		threats = append(threats, ipThreats...)
	}

	// Detect unusual access patterns
	if accessThreats, err := s.detectUnusualAccessPatterns(); err == nil {
		threats = append(threats, accessThreats...)
	}

	// Detect privilege escalation attempts
	if privThreats, err := s.detectPrivilegeEscalation(); err == nil {
		threats = append(threats, privThreats...)
	}

	// Detect brute force attacks
	if bruteForceThreats, err := s.detectBruteForceAttacks(); err == nil {
		threats = append(threats, bruteForceThreats...)
	}

	return threats, nil
}

// SecurityThreat represents a detected security threat
type SecurityThreat struct {
	Type        string                 `json:"type"`
	Severity    EventSeverity          `json:"severity"`
	Description string                 `json:"description"`
	IPAddress   string                 `json:"ip_address,omitempty"`
	UserID      *uint                  `json:"user_id,omitempty"`
	Username    string                 `json:"username,omitempty"`
	Count       int                    `json:"count"`
	FirstSeen   time.Time              `json:"first_seen"`
	LastSeen    time.Time              `json:"last_seen"`
	Details     map[string]interface{} `json:"details"`
}

// detectFailedLoginsByIP detects multiple failed logins from the same IP
func (s *AuditService) detectFailedLoginsByIP() ([]SecurityThreat, error) {
	var threats []SecurityThreat

	// Get failed login attempts from the last hour
	since := time.Now().Add(-1 * time.Hour)
	logs, _, err := s.store.GetAuditLogsByAction("login_failed", 0, 1000)
	if err != nil {
		return threats, err
	}

	// Group by IP address
	ipFailures := make(map[string][]store.AuditLog)
	for _, log := range logs {
		if log.CreatedAt.After(since) && log.IPAddress != "" {
			ipFailures[log.IPAddress] = append(ipFailures[log.IPAddress], *log)
		}
	}

	// Check for suspicious patterns
	for ip, failures := range ipFailures {
		if len(failures) >= 10 { // 10 or more failures from same IP
			threat := SecurityThreat{
				Type:        "brute_force_login",
				Severity:    SeverityError,
				Description: fmt.Sprintf("Multiple failed login attempts (%d) from IP %s", len(failures), ip),
				IPAddress:   ip,
				Count:       len(failures),
				FirstSeen:   failures[len(failures)-1].CreatedAt, // Oldest
				LastSeen:    failures[0].CreatedAt,               // Newest
				Details: map[string]interface{}{
					"failed_attempts": len(failures),
					"time_window":     "1 hour",
				},
			}
			threats = append(threats, threat)
		}
	}

	return threats, nil
}

// detectUnusualAccessPatterns detects unusual access patterns
func (s *AuditService) detectUnusualAccessPatterns() ([]SecurityThreat, error) {
	var threats []SecurityThreat

	// Get recent audit logs
	since := time.Now().Add(-24 * time.Hour)
	logs, _, err := s.store.ListAuditLogs(0, 1000)
	if err != nil {
		return threats, err
	}

	// Group by user and analyze patterns
	userActivity := make(map[uint][]store.AuditLog)
	for _, log := range logs {
		if log.CreatedAt.After(since) && log.UserID != nil {
			userActivity[*log.UserID] = append(userActivity[*log.UserID], *log)
		}
	}

	for userID, activities := range userActivity {
		// Check for unusual time patterns (access outside normal hours)
		offHoursCount := 0
		uniqueIPs := make(map[string]bool)

		for _, activity := range activities {
			hour := activity.CreatedAt.Hour()
			// Consider 22:00-06:00 as off-hours
			if hour >= 22 || hour <= 6 {
				offHoursCount++
			}
			if activity.IPAddress != "" {
				uniqueIPs[activity.IPAddress] = true
			}
		}

		// Alert if significant off-hours activity
		if offHoursCount > 5 {
			threat := SecurityThreat{
				Type:        "unusual_access_time",
				Severity:    SeverityWarning,
				Description: fmt.Sprintf("User %d has %d activities during off-hours", userID, offHoursCount),
				UserID:      &userID,
				Count:       offHoursCount,
				FirstSeen:   activities[len(activities)-1].CreatedAt,
				LastSeen:    activities[0].CreatedAt,
				Details: map[string]interface{}{
					"off_hours_activities": offHoursCount,
					"total_activities":     len(activities),
				},
			}
			threats = append(threats, threat)
		}

		// Alert if access from many different IPs
		if len(uniqueIPs) > 5 {
			threat := SecurityThreat{
				Type:        "multiple_ip_access",
				Severity:    SeverityWarning,
				Description: fmt.Sprintf("User %d accessed from %d different IP addresses", userID, len(uniqueIPs)),
				UserID:      &userID,
				Count:       len(uniqueIPs),
				FirstSeen:   activities[len(activities)-1].CreatedAt,
				LastSeen:    activities[0].CreatedAt,
				Details: map[string]interface{}{
					"unique_ips":       len(uniqueIPs),
					"total_activities": len(activities),
				},
			}
			threats = append(threats, threat)
		}
	}

	return threats, nil
}

// detectPrivilegeEscalation detects potential privilege escalation attempts
func (s *AuditService) detectPrivilegeEscalation() ([]SecurityThreat, error) {
	var threats []SecurityThreat

	// Get recent permission denied events
	since := time.Now().Add(-1 * time.Hour)
	logs, _, err := s.store.GetAuditLogsByAction("permission_denied", 0, 500)
	if err != nil {
		return threats, err
	}

	// Group by user
	userDenials := make(map[uint][]store.AuditLog)
	for _, log := range logs {
		if log.CreatedAt.After(since) && log.UserID != nil {
			userDenials[*log.UserID] = append(userDenials[*log.UserID], *log)
		}
	}

	// Check for excessive permission denials
	for userID, denials := range userDenials {
		if len(denials) >= 20 { // 20 or more denials in an hour
			threat := SecurityThreat{
				Type:        "privilege_escalation_attempt",
				Severity:    SeverityError,
				Description: fmt.Sprintf("User %d has %d permission denials in the last hour", userID, len(denials)),
				UserID:      &userID,
				Count:       len(denials),
				FirstSeen:   denials[len(denials)-1].CreatedAt,
				LastSeen:    denials[0].CreatedAt,
				Details: map[string]interface{}{
					"permission_denials": len(denials),
					"time_window":        "1 hour",
				},
			}
			threats = append(threats, threat)
		}
	}

	return threats, nil
}

// detectBruteForceAttacks detects brute force attacks across different attack vectors
func (s *AuditService) detectBruteForceAttacks() ([]SecurityThreat, error) {
	var threats []SecurityThreat

	// Get recent audit logs
	since := time.Now().Add(-30 * time.Minute)
	logs, _, err := s.store.ListAuditLogs(0, 1000)
	if err != nil {
		return threats, err
	}

	// Group by IP and count different types of failures
	ipActivity := make(map[string]map[string]int)
	ipFirstSeen := make(map[string]time.Time)
	ipLastSeen := make(map[string]time.Time)

	for _, log := range logs {
		if log.CreatedAt.After(since) && log.IPAddress != "" {
			if ipActivity[log.IPAddress] == nil {
				ipActivity[log.IPAddress] = make(map[string]int)
			}

			// Count failed actions
			if strings.Contains(log.Action, "failed") || strings.Contains(log.Action, "denied") {
				ipActivity[log.IPAddress][log.Action]++
			}

			// Track time range
			if ipFirstSeen[log.IPAddress].IsZero() || log.CreatedAt.Before(ipFirstSeen[log.IPAddress]) {
				ipFirstSeen[log.IPAddress] = log.CreatedAt
			}
			if ipLastSeen[log.IPAddress].IsZero() || log.CreatedAt.After(ipLastSeen[log.IPAddress]) {
				ipLastSeen[log.IPAddress] = log.CreatedAt
			}
		}
	}

	// Analyze patterns
	for ip, activities := range ipActivity {
		totalFailures := 0
		for _, count := range activities {
			totalFailures += count
		}

		if totalFailures >= 15 { // 15 or more failures in 30 minutes
			threat := SecurityThreat{
				Type:        "brute_force_attack",
				Severity:    SeverityCritical,
				Description: fmt.Sprintf("Potential brute force attack from IP %s with %d failed attempts", ip, totalFailures),
				IPAddress:   ip,
				Count:       totalFailures,
				FirstSeen:   ipFirstSeen[ip],
				LastSeen:    ipLastSeen[ip],
				Details: map[string]interface{}{
					"total_failures": totalFailures,
					"attack_types":   activities,
					"time_window":    "30 minutes",
				},
			}
			threats = append(threats, threat)
		}
	}

	return threats, nil
}

// GetAuditReport generates an audit report for a specific time period
func (s *AuditService) GetAuditReport(startTime, endTime time.Time, userID *uint) (*AuditReport, error) {
	report := &AuditReport{
		StartTime: startTime,
		EndTime:   endTime,
		UserID:    userID,
	}

	// Inclusive [start, end] — matches /audit/logs SQL filters (was exclusive Before/After and missed 1h windows).
	logs, _, err := s.store.QueryAuditLogs(store.AuditLogQuery{
		UserID:    userID,
		StartTime: &startTime,
		EndTime:   &endTime,
		Offset:    0,
		Limit:     10000,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get audit logs: %w", err)
	}

	actionCounts := make(map[string]int)
	userCounts := make(map[uint]int)
	ipCounts := make(map[string]int)

	for _, log := range logs {
		actionCounts[log.Action]++
		if log.UserID != nil {
			userCounts[*log.UserID]++
		}
		if log.IPAddress != "" {
			ipCounts[log.IPAddress]++
		}
	}

	report.TotalEvents = len(logs)
	report.Events = logs
	report.ActionSummary = actionCounts
	report.UserActivity = userCounts
	report.IPActivity = ipCounts

	report.LoginAttempts = actionCounts["login"] + actionCounts["login_failed"]
	report.FailedLogins = actionCounts["login_failed"]
	report.PermissionDenials = actionCounts["permission_denied"]

	if report.LoginAttempts > 0 {
		report.LoginSuccessRate = float64(actionCounts["login"]) / float64(report.LoginAttempts) * 100
	}

	return report, nil
}

// AuditReport represents an audit report
type AuditReport struct {
	StartTime         time.Time         `json:"start_time"`
	EndTime           time.Time         `json:"end_time"`
	UserID            *uint             `json:"user_id,omitempty"`
	TotalEvents       int               `json:"total_events"`
	LoginAttempts     int               `json:"login_attempts"`
	FailedLogins      int               `json:"failed_logins"`
	LoginSuccessRate  float64           `json:"login_success_rate"`
	PermissionDenials int               `json:"permission_denials"`
	Events            []*store.AuditLog `json:"events"`
	ActionSummary     map[string]int    `json:"action_summary"`
	UserActivity      map[uint]int      `json:"user_activity"`
	IPActivity        map[string]int    `json:"ip_activity"`
}

// GetSecurityMetrics returns security metrics for a relative lookback from now.
func (s *AuditService) GetSecurityMetrics(period time.Duration) (*SecurityMetrics, error) {
	end := time.Now()
	return s.GetSecurityMetricsInWindow(end.Add(-period), end)
}

// GetSecurityMetricsInWindow returns security metrics for an absolute time window.
func (s *AuditService) GetSecurityMetricsInWindow(start, end time.Time) (*SecurityMetrics, error) {
	if end.Before(start) {
		return nil, fmt.Errorf("end_time must be after start_time")
	}

	logs, _, err := s.store.QueryAuditLogs(store.AuditLogQuery{
		StartTime: &start,
		EndTime:   &end,
		Offset:    0,
		Limit:     10000,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get audit logs: %w", err)
	}

	period := end.Sub(start)
	if period <= 0 {
		period = time.Hour
	}
	metrics := &SecurityMetrics{
		Period:    period,
		Timestamp: time.Now(),
	}

	for _, log := range logs {
		metrics.TotalEvents++

		switch log.Action {
		case "login":
			metrics.SuccessfulLogins++
		case "login_failed":
			metrics.FailedLogins++
		case "permission_denied":
			metrics.PermissionDenials++
		}

		if strings.Contains(log.Action, "failed") || strings.Contains(log.Action, "denied") {
			metrics.SecurityViolations++
		}
	}

	hours := period.Hours()
	if hours > 0 {
		metrics.EventsPerHour = float64(metrics.TotalEvents) / hours
		metrics.FailedLoginsPerHour = float64(metrics.FailedLogins) / hours
	}

	return metrics, nil
}

// GeoBucket is one region aggregation (hits + unique IPs).
type GeoBucket struct {
	Country  string `json:"country"`
	Province string `json:"province,omitempty"`
	City     string `json:"city,omitempty"`
	Label    string `json:"label,omitempty"`
	Hits     int    `json:"hits"`
	Visitors int    `json:"visitors"`
}

// GeoIPRow is one client IP with region and hit count.
type GeoIPRow struct {
	IP     string `json:"ip"`
	Hits   int    `json:"hits"`
	Region string `json:"region,omitempty"`
	// RegionKind is set for non-public addresses so the client can localise them.
	RegionKind string    `json:"region_kind,omitempty"`
	Country    string    `json:"country,omitempty"`
	Province   string    `json:"province,omitempty"`
	City       string    `json:"city,omitempty"`
	ISP        string    `json:"isp,omitempty"`
	LastSeen   time.Time `json:"last_seen,omitempty"`
}

// GeoStats is geography + IP breakdown for the audit window.
type GeoStats struct {
	StartTime     time.Time   `json:"start_time"`
	EndTime       time.Time   `json:"end_time"`
	TotalHits     int         `json:"total_hits"`
	TotalVisitors int         `json:"total_visitors"`
	UnknownHits   int         `json:"unknown_hits"`
	Countries     []GeoBucket `json:"countries"`
	Provinces     []GeoBucket `json:"provinces"`
	Cities        []GeoBucket `json:"cities"`
	IPs           []GeoIPRow  `json:"ips"`
}

type geoAgg struct {
	hits int
	ips  map[string]struct{}
}

func (a *geoAgg) add(ip string) {
	a.hits++
	if ip == "" {
		return
	}
	if a.ips == nil {
		a.ips = make(map[string]struct{})
	}
	a.ips[ip] = struct{}{}
}

func (a *geoAgg) visitors() int {
	if a == nil {
		return 0
	}
	return len(a.ips)
}

type ipAgg struct {
	hits       int
	lastSeen   time.Time
	country    string
	province   string
	city       string
	isp        string
	region     string
	regionKind string
}

// GetGeoStats aggregates audit IPs into country / province / city / IP tables.
func (s *AuditService) GetGeoStats(startTime, endTime time.Time) (*GeoStats, error) {
	if endTime.Before(startTime) {
		return nil, fmt.Errorf("end_time must be after start_time")
	}

	logs, _, err := s.store.QueryAuditLogs(store.AuditLogQuery{
		StartTime: &startTime,
		EndTime:   &endTime,
		Offset:    0,
		Limit:     10000,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get audit logs: %w", err)
	}

	out := &GeoStats{
		StartTime: startTime,
		EndTime:   endTime,
	}

	countries := map[string]*geoAgg{}
	provinces := map[string]*geoAgg{}
	cities := map[string]*geoAgg{}
	byIP := map[string]*ipAgg{}
	resolver := geoip.Default()

	for _, log := range logs {
		out.TotalHits++
		ip := strings.TrimSpace(log.IPAddress)
		if ip == "" {
			out.UnknownHits++
			continue
		}

		loc := resolver.Lookup(ip)
		country, province, city, isp, region, regionKind := "", "", "", "", "", ""
		if loc != nil {
			country = strings.TrimSpace(loc.Country)
			province = strings.TrimSpace(loc.Province)
			city = strings.TrimSpace(loc.City)
			isp = strings.TrimSpace(loc.ISP)
			region = strings.TrimSpace(loc.Label)
			regionKind = string(loc.Kind)
		}
		if country == "" {
			out.UnknownHits++
			country = ""
			region = ""
			regionKind = ""
		}

		ia := byIP[ip]
		if ia == nil {
			ia = &ipAgg{}
			byIP[ip] = ia
		}
		ia.hits++
		if log.CreatedAt.After(ia.lastSeen) {
			ia.lastSeen = log.CreatedAt
		}
		if ia.country == "" && country != "" {
			ia.country, ia.province, ia.city, ia.isp = country, province, city, isp
			ia.region, ia.regionKind = region, regionKind
		}

		if country == "" {
			continue
		}
		if countries[country] == nil {
			countries[country] = &geoAgg{}
		}
		countries[country].add(ip)

		if province != "" && province != "0" {
			pk := country + "|" + province
			if provinces[pk] == nil {
				provinces[pk] = &geoAgg{}
			}
			provinces[pk].add(ip)
		}
		if city != "" && city != "0" {
			ck := country + "|" + province + "|" + city
			if cities[ck] == nil {
				cities[ck] = &geoAgg{}
			}
			cities[ck].add(ip)
		}
	}

	out.TotalVisitors = len(byIP)
	out.Countries = sortGeoBuckets(countries, func(k string, a *geoAgg) GeoBucket {
		return GeoBucket{Country: k, Label: k, Hits: a.hits, Visitors: a.visitors()}
	}, 30)
	out.Provinces = sortGeoBuckets(provinces, func(k string, a *geoAgg) GeoBucket {
		parts := strings.SplitN(k, "|", 2)
		country, province := parts[0], ""
		if len(parts) > 1 {
			province = parts[1]
		}
		label := province
		if country != "" && country != "中国" && country != "China" {
			label = country + " · " + province
		}
		return GeoBucket{
			Country: country, Province: province, Label: label,
			Hits: a.hits, Visitors: a.visitors(),
		}
	}, 40)
	out.Cities = sortGeoBuckets(cities, func(k string, a *geoAgg) GeoBucket {
		parts := strings.SplitN(k, "|", 3)
		country, province, city := parts[0], "", ""
		if len(parts) > 1 {
			province = parts[1]
		}
		if len(parts) > 2 {
			city = parts[2]
		}
		label := city
		if province != "" {
			label = province + " · " + city
		}
		return GeoBucket{
			Country: country, Province: province, City: city, Label: label,
			Hits: a.hits, Visitors: a.visitors(),
		}
	}, 40)

	ips := make([]GeoIPRow, 0, len(byIP))
	for ip, a := range byIP {
		ips = append(ips, GeoIPRow{
			IP: ip, Hits: a.hits, Region: a.region, RegionKind: a.regionKind,
			Country: a.country, Province: a.province, City: a.city, ISP: a.isp,
			LastSeen: a.lastSeen,
		})
	}
	sort.Slice(ips, func(i, j int) bool {
		if ips[i].Hits != ips[j].Hits {
			return ips[i].Hits > ips[j].Hits
		}
		return ips[i].LastSeen.After(ips[j].LastSeen)
	})
	if len(ips) > 50 {
		ips = ips[:50]
	}
	out.IPs = ips

	return out, nil
}

func sortGeoBuckets(m map[string]*geoAgg, build func(string, *geoAgg) GeoBucket, limit int) []GeoBucket {
	out := make([]GeoBucket, 0, len(m))
	for k, a := range m {
		out = append(out, build(k, a))
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Hits != out[j].Hits {
			return out[i].Hits > out[j].Hits
		}
		return out[i].Visitors > out[j].Visitors
	})
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out
}

// SecurityMetrics represents security metrics
type SecurityMetrics struct {
	Period              time.Duration `json:"period"`
	Timestamp           time.Time     `json:"timestamp"`
	TotalEvents         int           `json:"total_events"`
	SuccessfulLogins    int           `json:"successful_logins"`
	FailedLogins        int           `json:"failed_logins"`
	PermissionDenials   int           `json:"permission_denials"`
	SecurityViolations  int           `json:"security_violations"`
	EventsPerHour       float64       `json:"events_per_hour"`
	FailedLoginsPerHour float64       `json:"failed_logins_per_hour"`
}

// StartMonitoring starts the continuous monitoring process
func (s *AuditService) StartMonitoring() {
	// Run anomaly detection every 5 minutes
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			threats, err := s.DetectAnomalousActivity()
			if err != nil {
				fmt.Printf("Error detecting anomalous activity: %v\n", err)
				continue
			}

			// Log detected threats
			for _, threat := range threats {
				s.LogSecurityEvent(SecurityEvent{
					Type:      threat.Type,
					Severity:  string(threat.Severity),
					IPAddress: threat.IPAddress,
					UserID:    threat.UserID,
					Username:  threat.Username,
					Resource:  "security_monitoring",
					Action:    "threat_detected",
					Result:    "detected",
					Details: map[string]interface{}{
						"threat_description": threat.Description,
						"threat_count":       threat.Count,
						"first_seen":         threat.FirstSeen,
						"last_seen":          threat.LastSeen,
						"threat_details":     threat.Details,
					},
				})
			}

			// In a real implementation, you might want to:
			// - Send alerts to administrators
			// - Trigger automated responses
			// - Update security dashboards
		}
	}()
}

// Helper methods for audit handler

// GetAuditLogsByUserID gets audit logs for a specific user with pagination
func (s *AuditService) GetAuditLogsByUserID(userID uint, offset, limit int) (interface{}, int64, error) {
	return s.store.GetAuditLogsByUserID(userID, offset, limit)
}

// GetAuditLogsByAction gets audit logs for a specific action with pagination
func (s *AuditService) GetAuditLogsByAction(action string, offset, limit int) (interface{}, int64, error) {
	return s.store.GetAuditLogsByAction(action, offset, limit)
}

// GetAllAuditLogs gets all audit logs with pagination
func (s *AuditService) GetAllAuditLogs(offset, limit int) (interface{}, int64, error) {
	return s.store.ListAuditLogs(offset, limit)
}

// QueryAuditLogs lists audit logs with optional user/action/time filters.
func (s *AuditService) QueryAuditLogs(q store.AuditLogQuery) (interface{}, int64, error) {
	return s.store.QueryAuditLogs(q)
}
