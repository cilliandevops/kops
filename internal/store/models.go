package store

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Labels is a custom type of map[string]string for GORM storage
type Labels map[string]string

// Value - implements driver.Valuer interface, called by GORM when writing
func (l Labels) Value() (driver.Value, error) {
	if l == nil {
		return nil, nil
	}
	return json.Marshal(l)
}

// Scan - implements sql.Scanner interface, called by GORM when reading
func (l *Labels) Scan(value interface{}) error {
	if value == nil {
		*l = nil
		return nil
	}
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, &l)
}

// Cluster is the GORM model for the cluster table in the database, designed for enterprise-level management
type Cluster struct {
	// --- Core Identity ---
	// ID is the unique, immutable identifier for the cluster, using UUID. This is the internal primary key
	ID string `gorm:"type:varchar(36);primary_key" json:"id"`
	// Name is the user-defined, memorable display name for the cluster, must be unique
	Name string `gorm:"type:varchar(100);unique;not null" json:"name"`

	// --- Connection Information ---
	// KubeconfigData stores the encrypted kubeconfig content itself, not the path
	// This makes the application completely environment-independent with excellent portability
	KubeconfigData []byte `gorm:"type:blob;not null" json:"-"`

	// --- Metadata and Description ---
	// Description is a detailed description of the cluster's purpose, location, etc.
	Description string `gorm:"type:text" json:"description"`
	// Provider is the cloud service provider or environment, e.g., "aws", "gcp", "minikube", "on-premise"
	Provider string `gorm:"type:varchar(50)" json:"provider"`
	// Environment marks the cluster's environment, such as "production", "staging", "development"
	Environment string `gorm:"type:varchar(50);index" json:"environment"`
	// Region is the geographical region where the cluster is located, e.g., "us-east-1", "asia-northeast1"
	Region string `gorm:"type:varchar(50)" json:"region"`
	// Version stores the detected Kubernetes Master version number
	Version string `gorm:"type:varchar(20)" json:"version"`

	// --- Status and Labels ---
	// Status is the cluster status set by administrators, such as "Active", "Maintenance", "Inactive"
	Status string `gorm:"type:varchar(50);default:'Active'" json:"status"`
	// Labels provides flexible key-value pair labels for grouping, filtering, and policy application, a key feature for enterprise management
	Labels Labels `gorm:"type:json" json:"labels"`

	// --- Audit Information ---
	// GORM automatically manages CreatedAt and UpdatedAt timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// User represents a user in the system
type User struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	Username      string     `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Email         string     `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	PasswordHash  string     `gorm:"column:password;type:text;not null" json:"-"`
	DisplayName   string     `gorm:"type:text" json:"display_name"`
	AvatarURL     string     `gorm:"type:text" json:"avatar_url"`
	IsActive      bool       `gorm:"default:true" json:"is_active"`
	EmailVerified bool       `gorm:"default:false" json:"email_verified"`
	// MustChangePassword forces the client to show a change-password gate after login.
	MustChangePassword bool       `gorm:"default:false" json:"must_change_password"`
	LastLoginAt        *time.Time `gorm:"column:last_login" json:"last_login_at"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
	DeletedAt          *time.Time `gorm:"index" json:"-"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}

// HashPassword hashes the user's password using bcrypt
func (u *User) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hashedPassword)
	return nil
}

// CheckPassword verifies the provided password against the stored hash
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

// BeforeCreate GORM hook to hash password before creating user
func (u *User) BeforeCreate(tx *gorm.DB) error {
	// If PasswordHash doesn't start with $2a$, $2b$, or $2y$, assume it's a plain password that needs hashing
	if len(u.PasswordHash) > 0 && !strings.HasPrefix(u.PasswordHash, "$2") {
		return u.HashPassword(u.PasswordHash)
	}
	return nil
}

// Role represents a role in the RBAC system
type Role struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"name"`
	DisplayName string    `gorm:"type:varchar(100);not null" json:"display_name"`
	Description string    `gorm:"type:text" json:"description"`
	IsSystem    bool      `gorm:"default:false" json:"is_system"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName specifies the table name for Role model
func (Role) TableName() string {
	return "roles"
}

// UserRole represents the many-to-many relationship between users and roles
type UserRole struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"not null;index" json:"user_id"`
	RoleID     uint      `gorm:"not null;index" json:"role_id"`
	AssignedBy uint      `json:"assigned_by"`
	AssignedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"assigned_at"`

	// Foreign key relationships
	User           User  `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Role           Role  `gorm:"foreignKey:RoleID;constraint:OnDelete:CASCADE" json:"-"`
	AssignedByUser *User `gorm:"foreignKey:AssignedBy" json:"-"`
}

// TableName specifies the table name for UserRole model
func (UserRole) TableName() string {
	return "user_roles"
}

// OAuthProvider represents OAuth provider information for a user
type OAuthProvider struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	UserID         uint       `gorm:"not null;index" json:"user_id"`
	Provider       string     `gorm:"type:varchar(50);not null" json:"provider"`
	ProviderUserID string     `gorm:"type:varchar(100);not null" json:"provider_user_id"`
	AccessToken    string     `gorm:"type:text" json:"-"`
	RefreshToken   string     `gorm:"type:text" json:"-"`
	ExpiresAt      *time.Time `json:"expires_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`

	// Foreign key relationship
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

// TableName specifies the table name for OAuthProvider model
func (OAuthProvider) TableName() string {
	return "oauth_providers"
}

// AuditLog represents audit log entries for security and compliance
type AuditLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     *uint     `gorm:"index" json:"user_id"`
	Action     string    `gorm:"type:varchar(100);not null;index" json:"action"`
	Resource   string    `gorm:"type:varchar(100);index" json:"resource"`
	ResourceID string    `gorm:"type:varchar(100)" json:"resource_id"`
	IPAddress  string    `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent  string    `gorm:"type:text" json:"user_agent"`
	Details    string    `gorm:"type:json" json:"details"`
	CreatedAt  time.Time `gorm:"index" json:"created_at"`

	// Foreign key relationship
	User *User `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"-"`
}

// TableName specifies the table name for AuditLog model
func (AuditLog) TableName() string {
	return "audit_logs"
}

// LoginAttempt represents login attempt tracking for security
type LoginAttempt struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     *uint     `gorm:"index" json:"user_id"`
	Username   string    `gorm:"type:varchar(50);index" json:"username"`
	IPAddress  string    `gorm:"type:varchar(45);index" json:"ip_address"`
	UserAgent  string    `gorm:"type:text" json:"user_agent"`
	Success    bool      `gorm:"index" json:"success"`
	FailReason string    `gorm:"type:varchar(255)" json:"fail_reason"`
	CreatedAt  time.Time `gorm:"index" json:"created_at"`

	// Foreign key relationship
	User *User `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"-"`
}

// TableName specifies the table name for LoginAttempt model
func (LoginAttempt) TableName() string {
	return "login_attempts"
}

// UserSession represents active user sessions for session management
type UserSession struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	SessionID string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"session_id"`
	IPAddress string    `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent string    `gorm:"type:text" json:"user_agent"`
	CreatedAt time.Time `json:"created_at"`
	LastSeen  time.Time `json:"last_seen"`
	ExpiresAt time.Time `gorm:"index" json:"expires_at"`
	IsActive  bool      `gorm:"default:true;index" json:"is_active"`

	// Foreign key relationship
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

// TableName specifies the table name for UserSession model
func (UserSession) TableName() string {
	return "user_sessions"
}

// TimelineStatusSample is a periodic / change-driven health sample for Timeline.
type TimelineStatusSample struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ClusterID string    `gorm:"type:varchar(36);not null;index:idx_tl_cluster_sampled;index:idx_tl_resource_time,priority:1" json:"cluster_id"`
	Namespace string    `gorm:"type:varchar(253);not null;index:idx_tl_resource_time,priority:2" json:"namespace"`
	Kind      string    `gorm:"type:varchar(64);not null;index:idx_tl_resource_time,priority:3" json:"kind"`
	Name      string    `gorm:"type:varchar(253);not null;index:idx_tl_resource_time,priority:4" json:"name"`
	UID       string    `gorm:"type:varchar(64)" json:"uid"`
	AppGroup  string    `gorm:"type:varchar(253);index" json:"app_group"`
	Status    string    `gorm:"type:varchar(32);not null" json:"status"`
	Reason    string    `gorm:"type:varchar(256)" json:"reason"`
	SampledAt time.Time `gorm:"not null;index:idx_tl_cluster_sampled;index:idx_tl_resource_time,priority:5" json:"sampled_at"`
}

func (TimelineStatusSample) TableName() string {
	return "timeline_status_samples"
}

// Environment binds a cluster + namespace + purpose (test/staging/prod/other).
type Environment struct {
	ID          string    `gorm:"type:varchar(36);primary_key" json:"id"`
	Name        string    `gorm:"type:varchar(100);not null;uniqueIndex:idx_env_name" json:"name"`
	ClusterID   string    `gorm:"type:varchar(36);not null;index" json:"cluster_id"`
	Namespace   string    `gorm:"type:varchar(253);not null" json:"namespace"`
	Purpose     string    `gorm:"type:varchar(32);not null;index" json:"purpose"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (Environment) TableName() string { return "environments" }

// AccessGrant scopes a user to a cluster and optional namespace.
// Empty Namespace means the whole cluster.
type AccessGrant struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_grant_user_scope" json:"user_id"`
	ClusterID string    `gorm:"type:varchar(36);not null;uniqueIndex:idx_grant_user_scope" json:"cluster_id"`
	Namespace string    `gorm:"type:varchar(253);not null;uniqueIndex:idx_grant_user_scope" json:"namespace"`
	CreatedAt time.Time `json:"created_at"`
}

func (AccessGrant) TableName() string { return "access_grants" }

// RoleNavPolicy hides sidebar entries for a role. It is a blocklist so menus
// added by later releases show up without an admin editing every role, and it
// only shapes the sidebar — API access is still governed by Casbin.
type RoleNavPolicy struct {
	RoleName string `gorm:"type:varchar(50);primaryKey" json:"role_name"`
	// JSON arrays of nav group titleKeys / item paths.
	HiddenGroups string    `gorm:"type:text" json:"-"`
	HiddenItems  string    `gorm:"type:text" json:"-"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (RoleNavPolicy) TableName() string { return "role_nav_policies" }
