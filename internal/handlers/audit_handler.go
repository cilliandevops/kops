package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ciliverse/cilikube/internal/service"
	"github.com/ciliverse/cilikube/internal/store"
	"github.com/ciliverse/cilikube/pkg/geoip"
	"github.com/gin-gonic/gin"
)

// auditLogView is the admin UI payload: parsed details + IP region.
type auditLogView struct {
	ID         uint                   `json:"id"`
	UserID     *uint                  `json:"user_id"`
	Username   string                 `json:"username,omitempty"`
	Action     string                 `json:"action"`
	Resource   string                 `json:"resource"`
	ResourceID string                 `json:"resource_id"`
	IPAddress  string                 `json:"ip_address"`
	UserAgent  string                 `json:"user_agent"`
	Details    map[string]interface{} `json:"details"`
	CreatedAt  time.Time              `json:"created_at"`

	Path       string  `json:"path,omitempty"`
	Method     string  `json:"method,omitempty"`
	StatusCode int     `json:"status_code,omitempty"`
	Result     string  `json:"result,omitempty"`
	DurationMs float64 `json:"duration_ms,omitempty"`

	Region string `json:"region,omitempty"`
	// RegionKind is set for non-public addresses so the client can localise them;
	// public IPs resolve to Chinese-only ip2region names in Region.
	RegionKind string `json:"region_kind,omitempty"`
	Country    string `json:"country,omitempty"`
	Province   string `json:"province,omitempty"`
	City       string `json:"city,omitempty"`
	ISP        string `json:"isp,omitempty"`
}

func toAuditLogView(log *store.AuditLog) auditLogView {
	if log == nil {
		return auditLogView{}
	}
	details := map[string]interface{}{}
	if strings.TrimSpace(log.Details) != "" {
		_ = json.Unmarshal([]byte(log.Details), &details)
	}
	username, _ := details["username"].(string)
	path, _ := details["path"].(string)
	method, _ := details["method"].(string)
	result, _ := details["result"].(string)
	var statusCode int
	switch v := details["status_code"].(type) {
	case float64:
		statusCode = int(v)
	case int:
		statusCode = v
	case json.Number:
		if n, err := v.Int64(); err == nil {
			statusCode = int(n)
		}
	}
	var durationMs float64
	switch v := details["duration_ms"].(type) {
	case float64:
		durationMs = v
	case int:
		durationMs = float64(v)
	case json.Number:
		if n, err := v.Float64(); err == nil {
			durationMs = n
		}
	}
	ua := log.UserAgent
	if ua == "" {
		if s, ok := details["user_agent"].(string); ok {
			ua = s
		}
	}
	ip := log.IPAddress
	if ip == "" {
		if s, ok := details["ip"].(string); ok {
			ip = s
		}
	}
	view := auditLogView{
		ID:         log.ID,
		UserID:     log.UserID,
		Username:   username,
		Action:     log.Action,
		Resource:   log.Resource,
		ResourceID: log.ResourceID,
		IPAddress:  ip,
		UserAgent:  ua,
		Details:    details,
		CreatedAt:  log.CreatedAt,
		Path:       path,
		Method:     method,
		StatusCode: statusCode,
		Result:     result,
		DurationMs: durationMs,
	}
	if loc := geoip.Default().Lookup(ip); loc != nil {
		view.Region = loc.Label
		view.RegionKind = string(loc.Kind)
		view.Country = loc.Country
		view.Province = loc.Province
		view.City = loc.City
		view.ISP = loc.ISP
	}
	return view
}

// parseAuditPeriod accepts Go durations plus day units (e.g. 7d → 168h).
func parseAuditPeriod(periodStr string) (time.Duration, error) {
	periodStr = strings.TrimSpace(periodStr)
	if periodStr == "" {
		return 0, fmt.Errorf("empty period")
	}
	if strings.HasSuffix(periodStr, "d") {
		days, err := strconv.ParseFloat(strings.TrimSuffix(periodStr, "d"), 64)
		if err != nil || days <= 0 {
			return 0, fmt.Errorf("invalid day period: %s", periodStr)
		}
		return time.Duration(days * 24 * float64(time.Hour)), nil
	}
	return time.ParseDuration(periodStr)
}

type AuditHandler struct {
	auditService *service.AuditService
}

func NewAuditHandler(auditService *service.AuditService) *AuditHandler {
	return &AuditHandler{
		auditService: auditService,
	}
}

// GetAuditLogs gets audit logs with pagination and filtering
// @Summary Get audit logs
// @Description Get audit logs with optional filtering by user, action, and time range
// @Tags Audit
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Param user_id query int false "Filter by user ID"
// @Param action query string false "Filter by action"
// @Param start_time query string false "Start time (RFC3339 format)"
// @Param end_time query string false "End time (RFC3339 format)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Router /api/v1/audit/logs [get]
func (h *AuditHandler) GetAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	userIDStr := c.Query("user_id")
	action := c.Query("action")
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize

	var startTime, endTime *time.Time
	if startTimeStr != "" {
		t, parseErr := time.Parse(time.RFC3339, startTimeStr)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid start_time format. Use RFC3339 format.",
			})
			return
		}
		startTime = &t
	}
	if endTimeStr != "" {
		t, parseErr := time.Parse(time.RFC3339, endTimeStr)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid end_time format. Use RFC3339 format.",
			})
			return
		}
		endTime = &t
	}

	q := store.AuditLogQuery{
		Action:    action,
		StartTime: startTime,
		EndTime:   endTime,
		Offset:    offset,
		Limit:     pageSize,
	}
	if userIDStr != "" {
		userID, parseErr := strconv.ParseUint(userIDStr, 10, 32)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid user_id format",
			})
			return
		}
		uid := uint(userID)
		q.UserID = &uid
	}

	rawLogs, total, err := h.auditService.QueryAuditLogs(q)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get audit logs: " + err.Error(),
		})
		return
	}

	logs, _ := rawLogs.([]*store.AuditLog)
	views := make([]auditLogView, 0, len(logs))
	for _, log := range logs {
		views = append(views, toAuditLogView(log))
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Retrieved successfully",
		"data": gin.H{
			"logs":      views,
			"total":     total,
			"page":      page,
			"page_size": pageSize,
		},
	})
}

// GetAuditReport generates an audit report for a specific time period
// @Summary Get audit report
// @Description Generate comprehensive audit report for specified time period
// @Tags Audit
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param start_time query string true "Start time (RFC3339 format)"
// @Param end_time query string true "End time (RFC3339 format)"
// @Param user_id query int false "Filter by user ID"
// @Success 200 {object} service.AuditReport
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Router /api/v1/audit/report [get]
func (h *AuditHandler) GetAuditReport(c *gin.Context) {
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")
	userIDStr := c.Query("user_id")

	if startTimeStr == "" || endTimeStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "start_time and end_time are required",
		})
		return
	}

	startTime, err := time.Parse(time.RFC3339, startTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid start_time format. Use RFC3339 format.",
		})
		return
	}

	endTime, err := time.Parse(time.RFC3339, endTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid end_time format. Use RFC3339 format.",
		})
		return
	}

	var userID *uint
	if userIDStr != "" {
		uid, err := strconv.ParseUint(userIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid user_id format",
			})
			return
		}
		uidUint := uint(uid)
		userID = &uidUint
	}

	report, err := h.auditService.GetAuditReport(startTime, endTime, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to generate audit report: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Report generated successfully",
		"data":    report,
	})
}

// GetSecurityMetrics gets security metrics for monitoring
// @Summary Get security metrics
// @Description Get security metrics for the specified time period
// @Tags Audit
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param period query string false "Time period (e.g., '24h', '7d', '30d')" default("24h")
// @Param start_time query string false "Absolute start (RFC3339); used with end_time"
// @Param end_time query string false "Absolute end (RFC3339); used with start_time"
// @Success 200 {object} service.SecurityMetrics
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Router /api/v1/audit/metrics [get]
func (h *AuditHandler) GetSecurityMetrics(c *gin.Context) {
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	var metrics *service.SecurityMetrics
	var err error

	if startTimeStr != "" && endTimeStr != "" {
		startTime, parseErr := time.Parse(time.RFC3339, startTimeStr)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid start_time format. Use RFC3339 format.",
			})
			return
		}
		endTime, parseErr := time.Parse(time.RFC3339, endTimeStr)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid end_time format. Use RFC3339 format.",
			})
			return
		}
		metrics, err = h.auditService.GetSecurityMetricsInWindow(startTime, endTime)
	} else {
		periodStr := c.DefaultQuery("period", "24h")
		period, parseErr := parseAuditPeriod(periodStr)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid period format. Use duration format like '24h', '7d', etc.",
			})
			return
		}
		metrics, err = h.auditService.GetSecurityMetrics(period)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get security metrics: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Metrics retrieved successfully",
		"data":    metrics,
	})
}

// GetGeoStats aggregates visitor geography for the audit time window.
// @Summary Get audit geo stats
// @Description Country / province / city visitor counts from audit IPs (ip2region)
// @Tags Audit
// @Produce json
// @Security BearerAuth
// @Param start_time query string true "Start time (RFC3339)"
// @Param end_time query string true "End time (RFC3339)"
// @Success 200 {object} service.GeoStats
// @Router /api/v1/audit/geo [get]
func (h *AuditHandler) GetGeoStats(c *gin.Context) {
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")
	if startTimeStr == "" || endTimeStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "start_time and end_time are required",
		})
		return
	}
	startTime, err := time.Parse(time.RFC3339, startTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid start_time format. Use RFC3339 format.",
		})
		return
	}
	endTime, err := time.Parse(time.RFC3339, endTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid end_time format. Use RFC3339 format.",
		})
		return
	}

	stats, err := h.auditService.GetGeoStats(startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get geo stats: " + err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "ok",
		"data":    stats,
	})
}

// DetectThreats detects security threats and anomalous activities
// @Summary Detect security threats
// @Description Analyze audit logs to detect potential security threats
// @Tags Audit
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Router /api/v1/audit/threats [get]
func (h *AuditHandler) DetectThreats(c *gin.Context) {
	threats, err := h.auditService.DetectAnomalousActivity()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to detect threats: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Threat detection completed",
		"data": gin.H{
			"threats": threats,
			"count":   len(threats),
		},
	})
}

// GetUserActivity gets activity summary for a specific user
// @Summary Get user activity
// @Description Get detailed activity summary for a specific user
// @Tags Audit
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param user_id path int true "User ID"
// @Param period query string false "Time period (e.g., '24h', '7d', '30d')" default("7d")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Router /api/v1/audit/users/{user_id}/activity [get]
func (h *AuditHandler) GetUserActivity(c *gin.Context) {
	userIDStr := c.Param("user_id")
	periodStr := c.DefaultQuery("period", "7d")

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid user_id format",
		})
		return
	}

	period, err := parseAuditPeriod(periodStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid period format. Use duration format like '24h', '7d', etc.",
		})
		return
	}

	startTime := time.Now().Add(-period)
	endTime := time.Now()
	uid := uint(userID)

	report, err := h.auditService.GetAuditReport(startTime, endTime, &uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get user activity: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "User activity retrieved successfully",
		"data":    report,
	})
}

// GetSystemActivity gets overall system activity summary
// @Summary Get system activity
// @Description Get overall system activity and statistics
// @Tags Audit
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param period query string false "Time period (e.g., '24h', '7d', '30d')" default("24h")
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Router /api/v1/audit/system/activity [get]
func (h *AuditHandler) GetSystemActivity(c *gin.Context) {
	periodStr := c.DefaultQuery("period", "24h")

	period, err := parseAuditPeriod(periodStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid period format. Use duration format like '24h', '7d', etc.",
		})
		return
	}

	startTime := time.Now().Add(-period)
	endTime := time.Now()

	// Get system-wide report
	report, err := h.auditService.GetAuditReport(startTime, endTime, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get system activity: " + err.Error(),
		})
		return
	}

	// Get security metrics
	metrics, err := h.auditService.GetSecurityMetrics(period)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to get security metrics: " + err.Error(),
		})
		return
	}

	// Detect current threats
	threats, err := h.auditService.DetectAnomalousActivity()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to detect threats: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "System activity retrieved successfully",
		"data": gin.H{
			"report":         report,
			"metrics":        metrics,
			"active_threats": threats,
			"summary": gin.H{
				"period":             periodStr,
				"total_events":       report.TotalEvents,
				"active_threats":     len(threats),
				"login_success_rate": report.LoginSuccessRate,
			},
		},
	})
}

// Helper methods for the audit handler

func (h *AuditHandler) GetAuditLogsByUserID(userID uint, offset, limit int) (interface{}, int64, error) {
	return h.auditService.GetAuditLogsByUserID(userID, offset, limit)
}

func (h *AuditHandler) GetAuditLogsByAction(action string, offset, limit int) (interface{}, int64, error) {
	return h.auditService.GetAuditLogsByAction(action, offset, limit)
}

func (h *AuditHandler) GetAllAuditLogs(offset, limit int) (interface{}, int64, error) {
	return h.auditService.GetAllAuditLogs(offset, limit)
}
