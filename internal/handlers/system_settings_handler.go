package handlers

import (
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/ciliverse/cilikube/configs"
	"github.com/ciliverse/cilikube/pkg/k8s"
	"github.com/ciliverse/cilikube/pkg/utils"
)

// SystemSettingsHandler handles system settings operations for administrators
type SystemSettingsHandler struct {
	config *configs.Config
}

// NewSystemSettingsHandler creates a new SystemSettingsHandler instance
func NewSystemSettingsHandler(config *configs.Config) *SystemSettingsHandler {
	return &SystemSettingsHandler{config: config}
}

func (h *SystemSettingsHandler) cfg() *configs.Config {
	if h.config != nil {
		return h.config
	}
	return configs.GlobalConfig
}

// GetSystemInfo gets basic system information
func (h *SystemSettingsHandler) GetSystemInfo(c *gin.Context) {
	cfg := h.cfg()
	version := readVersion()
	env := "production"
	if cfg != nil && cfg.Server.Mode == "debug" {
		env = "development"
	}

	systemInfo := gin.H{
		"version":     version,
		"build_time":  time.Now().UTC().Format(time.RFC3339),
		"go_version":  runtime.Version(),
		"environment": env,
		"features": gin.H{
			"oauth_enabled":     cfg != nil && cfg.OAuth.GitHub.Enabled && cfg.OAuth.GitHub.ClientID != "",
			"rbac_enabled":      cfg != nil && cfg.Database.Enabled,
			"audit_log_enabled": cfg != nil && cfg.Security.Audit.LogAdminActions,
			"metrics_enabled":    cfg == nil || cfg.Preferences.FeatureFlags.AdvancedMetrics,
			"ai_enabled":         cfg != nil && cfg.AI.Enabled && (cfg.AI.Provider == "mock" || cfg.AI.APIKey != ""),
			"prometheus_enabled": cfg != nil && cfg.Prometheus.Enabled && cfg.Prometheus.URL != "",
		},
	}

	utils.ApiSuccess(c, systemInfo, "System information retrieved successfully")
}

// GetOAuthSettings gets OAuth provider settings
func (h *SystemSettingsHandler) GetOAuthSettings(c *gin.Context) {
	cfg := h.cfg()
	if cfg == nil {
		utils.ApiError(c, http.StatusInternalServerError, "Configuration not available")
		return
	}

	configured := cfg.OAuth.GitHub.ClientID != ""
	oauthSettings := gin.H{
		"providers": []gin.H{
			{
				"name":              "github",
				"display_name":      "GitHub",
				"enabled":           cfg.OAuth.GitHub.Enabled,
				"configured":        configured,
				"login_ready":       cfg.OAuth.GitHub.Enabled && configured,
				"icon":              "github",
				"description":       "Login with your GitHub account",
				"redirect_url":      cfg.OAuth.GitHub.RedirectURL,
				"client_id":         cfg.OAuth.GitHub.ClientID,
				"client_secret_set": cfg.OAuth.GitHub.ClientSecret != "",
			},
		},
		"settings": gin.H{
			"allow_registration": cfg.OAuth.AllowRegistration,
			"auto_link_accounts": cfg.OAuth.AutoLinkAccounts,
		},
	}

	utils.ApiSuccess(c, oauthSettings, "OAuth settings retrieved successfully")
}

// UpdateOAuthSettings updates OAuth provider settings
func (h *SystemSettingsHandler) UpdateOAuthSettings(c *gin.Context) {
	cfg := h.cfg()
	if cfg == nil {
		utils.ApiError(c, http.StatusInternalServerError, "Configuration not available")
		return
	}

	var req struct {
		AllowRegistration bool    `json:"allow_registration"`
		AutoLinkAccounts  bool    `json:"auto_link_accounts"`
		GitHubEnabled     *bool   `json:"github_enabled"`
		GitHubClientID    *string `json:"github_client_id"`
		GitHubClientSecret *string `json:"github_client_secret"`
		GitHubRedirectURL *string `json:"github_redirect_url"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "Invalid request data", err.Error())
		return
	}

	cfg.OAuth.AllowRegistration = req.AllowRegistration
	cfg.OAuth.AutoLinkAccounts = req.AutoLinkAccounts
	if req.GitHubEnabled != nil {
		cfg.OAuth.GitHub.Enabled = *req.GitHubEnabled
	}
	if req.GitHubClientID != nil {
		cfg.OAuth.GitHub.ClientID = strings.TrimSpace(*req.GitHubClientID)
	}
	if req.GitHubClientSecret != nil {
		secret := strings.TrimSpace(*req.GitHubClientSecret)
		// Empty string means "leave unchanged" so UI can omit re-sending secrets
		if secret != "" {
			cfg.OAuth.GitHub.ClientSecret = secret
		}
	}
	if req.GitHubRedirectURL != nil {
		// Empty means leave unchanged (UI placeholder must not wipe a saved callback).
		if u := strings.TrimSpace(*req.GitHubRedirectURL); u != "" {
			cfg.OAuth.GitHub.RedirectURL = u
		}
	}
	if strings.TrimSpace(cfg.OAuth.GitHub.RedirectURL) == "" {
		cfg.OAuth.GitHub.RedirectURL = "https://cilikube.cillian.website/login/oauth/callback"
	}

	if err := configs.SaveGlobalConfig(); err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "Failed to save OAuth settings", err.Error())
		return
	}

	response := gin.H{
		"allow_registration": cfg.OAuth.AllowRegistration,
		"auto_link_accounts": cfg.OAuth.AutoLinkAccounts,
		"github_enabled":     cfg.OAuth.GitHub.Enabled,
		"github_configured":  cfg.OAuth.GitHub.ClientID != "",
		"github_login_ready": cfg.OAuth.GitHub.Enabled && cfg.OAuth.GitHub.ClientID != "",
		"updated_at":         time.Now().UTC().Format(time.RFC3339),
	}

	utils.ApiSuccess(c, response, "OAuth settings updated successfully")
}

// GetSecuritySettings gets security-related settings
func (h *SystemSettingsHandler) GetSecuritySettings(c *gin.Context) {
	cfg := h.cfg()
	if cfg == nil {
		utils.ApiError(c, http.StatusInternalServerError, "Configuration not available")
		return
	}

	securitySettings := gin.H{
		"password_policy": gin.H{
			"min_length":        cfg.Security.Password.MinLength,
			"require_uppercase": cfg.Security.Password.RequireUppercase,
			"require_lowercase": cfg.Security.Password.RequireLowercase,
			"require_numbers":   cfg.Security.Password.RequireNumbers,
			"require_symbols":   cfg.Security.Password.RequireSymbols,
			"password_history":  cfg.Security.Password.PasswordHistory,
		},
		"session_settings": gin.H{
			"session_timeout": int(cfg.Security.Session.IdleTimeout.Seconds()),
			"max_sessions":    cfg.Security.Session.MaxConcurrentSessions,
			"require_2fa":     cfg.Security.Session.Require2FA,
		},
		"audit_settings": gin.H{
			"log_login_attempts": cfg.Security.Audit.LogLoginAttempts,
			"log_api_calls":      cfg.Security.Audit.LogAPICalls,
			"log_admin_actions":  cfg.Security.Audit.LogAdminActions,
			"retention_days":     cfg.Security.Audit.RetentionDays,
		},
	}

	utils.ApiSuccess(c, securitySettings, "Security settings retrieved successfully")
}

// UpdateSecuritySettings updates security-related settings
func (h *SystemSettingsHandler) UpdateSecuritySettings(c *gin.Context) {
	cfg := h.cfg()
	if cfg == nil {
		utils.ApiError(c, http.StatusInternalServerError, "Configuration not available")
		return
	}

	var req struct {
		PasswordPolicy struct {
			MinLength        int  `json:"min_length"`
			RequireUppercase bool `json:"require_uppercase"`
			RequireLowercase bool `json:"require_lowercase"`
			RequireNumbers   bool `json:"require_numbers"`
			RequireSymbols   bool `json:"require_symbols"`
			PasswordHistory  int  `json:"password_history"`
		} `json:"password_policy"`
		SessionSettings struct {
			SessionTimeout int  `json:"session_timeout"`
			MaxSessions    int  `json:"max_sessions"`
			Require2FA     bool `json:"require_2fa"`
		} `json:"session_settings"`
		AuditSettings struct {
			LogLoginAttempts bool `json:"log_login_attempts"`
			LogAPICalls      bool `json:"log_api_calls"`
			LogAdminActions  bool `json:"log_admin_actions"`
			RetentionDays    int  `json:"retention_days"`
		} `json:"audit_settings"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "Invalid request data", err.Error())
		return
	}

	if req.PasswordPolicy.MinLength > 0 {
		cfg.Security.Password.MinLength = req.PasswordPolicy.MinLength
	}
	cfg.Security.Password.RequireUppercase = req.PasswordPolicy.RequireUppercase
	cfg.Security.Password.RequireLowercase = req.PasswordPolicy.RequireLowercase
	cfg.Security.Password.RequireNumbers = req.PasswordPolicy.RequireNumbers
	cfg.Security.Password.RequireSymbols = req.PasswordPolicy.RequireSymbols
	if req.PasswordPolicy.PasswordHistory >= 0 {
		cfg.Security.Password.PasswordHistory = req.PasswordPolicy.PasswordHistory
	}

	if req.SessionSettings.SessionTimeout > 0 {
		cfg.Security.Session.IdleTimeout = time.Duration(req.SessionSettings.SessionTimeout) * time.Second
	}
	if req.SessionSettings.MaxSessions > 0 {
		cfg.Security.Session.MaxConcurrentSessions = req.SessionSettings.MaxSessions
	}
	cfg.Security.Session.Require2FA = req.SessionSettings.Require2FA

	cfg.Security.Audit.LogLoginAttempts = req.AuditSettings.LogLoginAttempts
	cfg.Security.Audit.LogAPICalls = req.AuditSettings.LogAPICalls
	cfg.Security.Audit.LogAdminActions = req.AuditSettings.LogAdminActions
	if req.AuditSettings.RetentionDays > 0 {
		cfg.Security.Audit.RetentionDays = req.AuditSettings.RetentionDays
	}

	if err := configs.SaveGlobalConfig(); err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "Failed to save security settings", err.Error())
		return
	}

	utils.ApiSuccess(c, req, "Security settings updated successfully")
}

// GetSystemPreferences gets system preferences
func (h *SystemSettingsHandler) GetSystemPreferences(c *gin.Context) {
	cfg := h.cfg()
	if cfg == nil {
		utils.ApiError(c, http.StatusInternalServerError, "Configuration not available")
		return
	}

	preferences := gin.H{
		"ui_settings": gin.H{
			"default_theme":    cfg.Preferences.UI.DefaultTheme,
			"default_language": cfg.Preferences.UI.DefaultLanguage,
			"items_per_page":   cfg.Preferences.UI.ItemsPerPage,
			"auto_refresh":     cfg.Preferences.UI.AutoRefresh,
			"refresh_interval": cfg.Preferences.UI.RefreshInterval,
		},
		"notification_settings": gin.H{
			"email_notifications":   cfg.Preferences.Notifications.EmailNotifications,
			"browser_notifications": cfg.Preferences.Notifications.BrowserNotifications,
			"notification_types":    cfg.Preferences.Notifications.NotificationTypes,
		},
		"feature_flags": gin.H{
			"beta_features":    cfg.Preferences.FeatureFlags.BetaFeatures,
			"experimental_ui":  cfg.Preferences.FeatureFlags.ExperimentalUI,
			"advanced_metrics": cfg.Preferences.FeatureFlags.AdvancedMetrics,
		},
	}

	utils.ApiSuccess(c, preferences, "System preferences retrieved successfully")
}

// UpdateSystemPreferences updates system preferences
func (h *SystemSettingsHandler) UpdateSystemPreferences(c *gin.Context) {
	cfg := h.cfg()
	if cfg == nil {
		utils.ApiError(c, http.StatusInternalServerError, "Configuration not available")
		return
	}

	var req struct {
		UISettings struct {
			DefaultTheme    string `json:"default_theme"`
			DefaultLanguage string `json:"default_language"`
			ItemsPerPage    int    `json:"items_per_page"`
			AutoRefresh     bool   `json:"auto_refresh"`
			RefreshInterval int    `json:"refresh_interval"`
		} `json:"ui_settings"`
		NotificationSettings struct {
			EmailNotifications   bool     `json:"email_notifications"`
			BrowserNotifications bool     `json:"browser_notifications"`
			NotificationTypes    []string `json:"notification_types"`
		} `json:"notification_settings"`
		FeatureFlags struct {
			BetaFeatures    bool `json:"beta_features"`
			ExperimentalUI  bool `json:"experimental_ui"`
			AdvancedMetrics bool `json:"advanced_metrics"`
		} `json:"feature_flags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "Invalid request data", err.Error())
		return
	}

	if req.UISettings.DefaultTheme != "" {
		cfg.Preferences.UI.DefaultTheme = req.UISettings.DefaultTheme
	}
	if req.UISettings.DefaultLanguage != "" {
		cfg.Preferences.UI.DefaultLanguage = req.UISettings.DefaultLanguage
	}
	if req.UISettings.ItemsPerPage > 0 {
		cfg.Preferences.UI.ItemsPerPage = req.UISettings.ItemsPerPage
	}
	cfg.Preferences.UI.AutoRefresh = req.UISettings.AutoRefresh
	if req.UISettings.RefreshInterval > 0 {
		cfg.Preferences.UI.RefreshInterval = req.UISettings.RefreshInterval
	}

	cfg.Preferences.Notifications.EmailNotifications = req.NotificationSettings.EmailNotifications
	cfg.Preferences.Notifications.BrowserNotifications = req.NotificationSettings.BrowserNotifications
	if req.NotificationSettings.NotificationTypes != nil {
		cfg.Preferences.Notifications.NotificationTypes = req.NotificationSettings.NotificationTypes
	}

	cfg.Preferences.FeatureFlags.BetaFeatures = req.FeatureFlags.BetaFeatures
	cfg.Preferences.FeatureFlags.ExperimentalUI = req.FeatureFlags.ExperimentalUI
	cfg.Preferences.FeatureFlags.AdvancedMetrics = req.FeatureFlags.AdvancedMetrics

	if err := configs.SaveGlobalConfig(); err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "Failed to save system preferences", err.Error())
		return
	}

	utils.ApiSuccess(c, req, "System preferences updated successfully")
}

// GetAISettings returns AI assistant settings (API key never returned).
func (h *SystemSettingsHandler) GetAISettings(c *gin.Context) {
	cfg := h.cfg()
	if cfg == nil {
		utils.ApiError(c, http.StatusInternalServerError, "Configuration not available")
		return
	}
	provider := cfg.AI.Provider
	if provider == "" {
		provider = "mock"
	}
	utils.ApiSuccess(c, gin.H{
		"enabled":      cfg.AI.Enabled,
		"provider":     provider,
		"base_url":     cfg.AI.BaseURL,
		"model":        cfg.AI.Model,
		"api_key_set":  cfg.AI.APIKey != "",
		"ready":        cfg.AI.Enabled && (provider == "mock" || cfg.AI.APIKey != ""),
	}, "AI settings retrieved successfully")
}

// UpdateAISettings updates AI assistant settings.
func (h *SystemSettingsHandler) UpdateAISettings(c *gin.Context) {
	cfg := h.cfg()
	if cfg == nil {
		utils.ApiError(c, http.StatusInternalServerError, "Configuration not available")
		return
	}
	var req struct {
		Enabled  *bool   `json:"enabled"`
		Provider *string `json:"provider"`
		BaseURL  *string `json:"base_url"`
		Model    *string `json:"model"`
		APIKey   *string `json:"api_key"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "Invalid request data", err.Error())
		return
	}
	if req.Enabled != nil {
		cfg.AI.Enabled = *req.Enabled
	}
	if req.Provider != nil {
		p := strings.TrimSpace(strings.ToLower(*req.Provider))
		if p != "mock" && p != "openai" {
			utils.ApiError(c, http.StatusBadRequest, "provider must be mock or openai")
			return
		}
		cfg.AI.Provider = p
	}
	if req.BaseURL != nil {
		cfg.AI.BaseURL = strings.TrimSpace(*req.BaseURL)
	}
	if req.Model != nil {
		cfg.AI.Model = strings.TrimSpace(*req.Model)
	}
	if req.APIKey != nil {
		key := strings.TrimSpace(*req.APIKey)
		if key != "" {
			cfg.AI.APIKey = key
		}
	}
	if err := configs.SaveGlobalConfig(); err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "Failed to save AI settings", err.Error())
		return
	}
	h.GetAISettings(c)
}

// GetPrometheusSettings returns Prometheus integration settings.
func (h *SystemSettingsHandler) GetPrometheusSettings(c *gin.Context) {
	cfg := h.cfg()
	if cfg == nil {
		utils.ApiError(c, http.StatusInternalServerError, "Configuration not available")
		return
	}
	mode := "off"
	if k8s.IsShowcase() && (!cfg.Prometheus.Enabled || strings.TrimSpace(cfg.Prometheus.URL) == "") {
		mode = "showcase"
	} else if cfg.Prometheus.Enabled && strings.TrimSpace(cfg.Prometheus.URL) != "" {
		mode = "remote"
	}
	utils.ApiSuccess(c, gin.H{
		"enabled": cfg.Prometheus.Enabled,
		"url":     cfg.Prometheus.URL,
		"timeout": cfg.Prometheus.Timeout.String(),
		"mode":    mode,
		"showcase": k8s.IsShowcase(),
	}, "Prometheus settings retrieved successfully")
}

// UpdatePrometheusSettings updates Prometheus integration settings.
func (h *SystemSettingsHandler) UpdatePrometheusSettings(c *gin.Context) {
	cfg := h.cfg()
	if cfg == nil {
		utils.ApiError(c, http.StatusInternalServerError, "Configuration not available")
		return
	}
	var req struct {
		Enabled *bool   `json:"enabled"`
		URL     *string `json:"url"`
		Timeout *string `json:"timeout"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "Invalid request data", err.Error())
		return
	}
	if req.Enabled != nil {
		cfg.Prometheus.Enabled = *req.Enabled
	}
	if req.URL != nil {
		cfg.Prometheus.URL = strings.TrimSpace(*req.URL)
	}
	if req.Timeout != nil {
		raw := strings.TrimSpace(*req.Timeout)
		if raw != "" {
			d, err := time.ParseDuration(raw)
			if err != nil || d <= 0 {
				utils.ApiError(c, http.StatusBadRequest, "timeout must be a positive duration (e.g. 15s)")
				return
			}
			cfg.Prometheus.Timeout = d
		}
	}
	if err := configs.SaveGlobalConfig(); err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "Failed to save Prometheus settings", err.Error())
		return
	}
	h.GetPrometheusSettings(c)
}

func readVersion() string {
	if v := os.Getenv("CILIKUBE_VERSION"); v != "" {
		return v
	}
	data, err := os.ReadFile("VERSION")
	if err != nil {
		return "1.5.0"
	}
	return strings.TrimSpace(string(data))
}
