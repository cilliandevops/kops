package store

import (
	"fmt"
	"time"

	"github.com/ciliverse/cilikube/configs"
	"github.com/ciliverse/cilikube/pkg/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// NewStore creates a new store instance based on configuration
func NewStore(config *configs.Config) (Store, error) {
	storageType := config.GetStorageType()

	switch storageType {
	case "memory":
		return NewMemoryStore(), nil
	case "database":
		return NewDatabaseStore(config)
	default:
		return nil, fmt.Errorf("unsupported storage type: %s", storageType)
	}
}

// NewDatabaseStore creates a new database-backed store
func NewDatabaseStore(config *configs.Config) (Store, error) {
	// Get database connection
	db, err := database.GetDB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database connection: %w", err)
	}

	// Create database store
	store := &DatabaseStore{
		db: db,
	}

	return store, nil
}

// DatabaseStore implements Store interface using GORM
type DatabaseStore struct {
	db *gorm.DB
}

// Initialize implements Store interface for database
func (s *DatabaseStore) Initialize() error {
	// Auto-migrate all tables
	if err := s.db.AutoMigrate(
		&Cluster{},
		&User{},
		&Role{},
		&UserRole{},
		&OAuthProvider{},
		&AuditLog{},
		&LoginAttempt{},
		&UserSession{},
		&TimelineStatusSample{},
		&Environment{},
		&AccessGrant{},
		&RoleNavPolicy{},
	); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	// Create default roles if they don't exist
	if err := s.createDefaultRoles(); err != nil {
		return fmt.Errorf("failed to create default roles: %w", err)
	}

	// Create default admin user if it doesn't exist
	if err := s.createDefaultAdminUser(); err != nil {
		return fmt.Errorf("failed to create default admin user: %w", err)
	}

	return nil
}

// Close implements Store interface for database store
func (s *DatabaseStore) Close() error {
	sqlDB, err := s.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// createDefaultRoles creates the default system roles
func (s *DatabaseStore) createDefaultRoles() error {
	roles := []*Role{
		{
			Name:        "admin",
			DisplayName: "Administrator",
			Description: "System administrator with all permissions",
			IsSystem:    true,
		},
		{
			Name:        "editor",
			DisplayName: "Editor",
			Description: "Can edit most resources, but cannot manage users and clusters",
			IsSystem:    true,
		},
		{
			Name:        "viewer",
			DisplayName: "Viewer",
			Description: "Can only view resources, cannot perform modification operations",
			IsSystem:    true,
		},
	}

	for _, role := range roles {
		// Check if role already exists
		var existingRole Role
		result := s.db.Where("name = ?", role.Name).First(&existingRole)
		if result.Error == nil {
			continue // Role already exists
		}

		// Create role
		if err := s.db.Create(role).Error; err != nil {
			return fmt.Errorf("failed to create role %s: %w", role.Name, err)
		}
	}

	return nil
}

// createDefaultAdminUser creates the default admin user
func (s *DatabaseStore) createDefaultAdminUser() error {
	// Check if admin user already exists
	var existingUser User
	result := s.db.Where("username = ?", "admin").First(&existingUser)
	if result.Error == nil {
		return nil // Admin user already exists
	}

	// Create admin user
	adminUser := &User{
		Username:           "admin",
		Email:              "admin@cilikube.com",
		DisplayName:        "System Administrator",
		IsActive:           true,
		EmailVerified:      true,
		MustChangePassword: true,
	}

	// Hash password
	if err := adminUser.HashPassword("12345678"); err != nil {
		return fmt.Errorf("failed to hash admin password: %w", err)
	}

	// Create user
	if err := s.db.Create(adminUser).Error; err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	// Get admin role
	var adminRole Role
	if err := s.db.Where("name = ?", "admin").First(&adminRole).Error; err != nil {
		return fmt.Errorf("failed to find admin role: %w", err)
	}

	// Assign admin role to admin user
	userRole := &UserRole{
		UserID: adminUser.ID,
		RoleID: adminRole.ID,
	}

	if err := s.db.Create(userRole).Error; err != nil {
		return fmt.Errorf("failed to assign admin role: %w", err)
	}

	return nil
}

// === DatabaseStore Cluster Methods ===

func (s *DatabaseStore) CreateCluster(cluster *Cluster) error {
	if cluster.ID == "" {
		cluster.ID = uuid.NewString()
	}
	return s.db.Create(cluster).Error
}

func (s *DatabaseStore) GetClusterByID(id string) (*Cluster, error) {
	var cluster Cluster
	err := s.db.First(&cluster, "id = ?", id).Error
	return &cluster, err
}

func (s *DatabaseStore) GetClusterByName(name string) (*Cluster, error) {
	var cluster Cluster
	err := s.db.First(&cluster, "name = ?", name).Error
	return &cluster, err
}

func (s *DatabaseStore) GetAllClusters() ([]Cluster, error) {
	var clusters []Cluster
	err := s.db.Find(&clusters).Error
	return clusters, err
}

func (s *DatabaseStore) UpdateCluster(cluster *Cluster) error {
	return s.db.Save(cluster).Error
}

func (s *DatabaseStore) DeleteClusterByName(name string) error {
	return s.db.Where("name = ?", name).Delete(&Cluster{}).Error
}

func (s *DatabaseStore) DeleteClusterByID(id string) error {
	return s.db.Where("id = ?", id).Delete(&Cluster{}).Error
}

// === DatabaseStore User Methods ===

func (s *DatabaseStore) CreateUser(user *User) error {
	return s.db.Create(user).Error
}

func (s *DatabaseStore) GetUserByID(id uint) (*User, error) {
	var user User
	err := s.db.First(&user, id).Error
	return &user, err
}

func (s *DatabaseStore) GetUserByUsername(username string) (*User, error) {
	var user User
	err := s.db.Where("username = ?", username).First(&user).Error
	return &user, err
}

func (s *DatabaseStore) GetUserByEmail(email string) (*User, error) {
	var user User
	err := s.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (s *DatabaseStore) UpdateUser(user *User) error {
	return s.db.Save(user).Error
}

func (s *DatabaseStore) DeleteUser(id uint) error {
	return s.db.Delete(&User{}, id).Error
}

func (s *DatabaseStore) ListUsers(offset, limit int) ([]*User, int64, error) {
	var users []*User
	var total int64

	// Get total count
	if err := s.db.Model(&User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := s.db.Offset(offset).Limit(limit).Find(&users).Error
	return users, total, err
}

// === DatabaseStore Role Methods ===

func (s *DatabaseStore) CreateRole(role *Role) error {
	return s.db.Create(role).Error
}

func (s *DatabaseStore) GetRoleByID(id uint) (*Role, error) {
	var role Role
	err := s.db.First(&role, id).Error
	return &role, err
}

func (s *DatabaseStore) GetRoleByName(name string) (*Role, error) {
	var role Role
	err := s.db.Where("name = ?", name).First(&role).Error
	return &role, err
}

func (s *DatabaseStore) UpdateRole(role *Role) error {
	return s.db.Save(role).Error
}

func (s *DatabaseStore) DeleteRole(id uint) error {
	return s.db.Delete(&Role{}, id).Error
}

func (s *DatabaseStore) ListRoles() ([]*Role, error) {
	var roles []*Role
	err := s.db.Find(&roles).Error
	return roles, err
}

// === DatabaseStore UserRole Methods ===

func (s *DatabaseStore) AssignRole(userID, roleID uint) error {
	// Check if assignment already exists
	var existingUserRole UserRole
	result := s.db.Where("user_id = ? AND role_id = ?", userID, roleID).First(&existingUserRole)
	if result.Error == nil {
		return nil // Already assigned
	}

	userRole := &UserRole{
		UserID: userID,
		RoleID: roleID,
	}
	return s.db.Create(userRole).Error
}

func (s *DatabaseStore) RemoveRole(userID, roleID uint) error {
	return s.db.Where("user_id = ? AND role_id = ?", userID, roleID).Delete(&UserRole{}).Error
}

func (s *DatabaseStore) GetUserRoles(userID uint) ([]*Role, error) {
	var roles []*Role
	err := s.db.Table("roles").
		Joins("JOIN user_roles ON roles.id = user_roles.role_id").
		Where("user_roles.user_id = ?", userID).
		Find(&roles).Error
	return roles, err
}

func (s *DatabaseStore) GetRoleUsers(roleID uint) ([]*User, error) {
	var users []*User
	err := s.db.Table("users").
		Joins("JOIN user_roles ON users.id = user_roles.user_id").
		Where("user_roles.role_id = ?", roleID).
		Find(&users).Error
	return users, err
}

func (s *DatabaseStore) HasRole(userID, roleID uint) (bool, error) {
	var count int64
	err := s.db.Model(&UserRole{}).
		Where("user_id = ? AND role_id = ?", userID, roleID).
		Count(&count).Error
	return count > 0, err
}

// === DatabaseStore OAuth Methods ===

func (s *DatabaseStore) CreateOAuthProvider(provider *OAuthProvider) error {
	return s.db.Create(provider).Error
}

func (s *DatabaseStore) GetOAuthProvider(userID uint, provider string) (*OAuthProvider, error) {
	var oauthProvider OAuthProvider
	err := s.db.Where("user_id = ? AND provider = ?", userID, provider).First(&oauthProvider).Error
	return &oauthProvider, err
}

func (s *DatabaseStore) GetOAuthProviderByProviderUserID(provider, providerUserID string) (*OAuthProvider, error) {
	var oauthProvider OAuthProvider
	err := s.db.Where("provider = ? AND provider_user_id = ?", provider, providerUserID).First(&oauthProvider).Error
	return &oauthProvider, err
}

func (s *DatabaseStore) UpdateOAuthProvider(provider *OAuthProvider) error {
	return s.db.Save(provider).Error
}

func (s *DatabaseStore) DeleteOAuthProvider(userID uint, provider string) error {
	return s.db.Where("user_id = ? AND provider = ?", userID, provider).Delete(&OAuthProvider{}).Error
}

func (s *DatabaseStore) ListUserOAuthProviders(userID uint) ([]*OAuthProvider, error) {
	var providers []*OAuthProvider
	err := s.db.Where("user_id = ?", userID).Find(&providers).Error
	return providers, err
}

// === DatabaseStore AuditLog Methods ===

func (s *DatabaseStore) CreateAuditLog(log *AuditLog) error {
	return s.db.Create(log).Error
}

func (s *DatabaseStore) GetAuditLogsByUserID(userID uint, offset, limit int) ([]*AuditLog, int64, error) {
	var logs []*AuditLog
	var total int64

	// Get total count
	if err := s.db.Model(&AuditLog{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := s.db.Where("user_id = ?", userID).
		Offset(offset).Limit(limit).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, total, err
}

func (s *DatabaseStore) GetAuditLogsByAction(action string, offset, limit int) ([]*AuditLog, int64, error) {
	var logs []*AuditLog
	var total int64

	// Get total count
	if err := s.db.Model(&AuditLog{}).Where("action = ?", action).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := s.db.Where("action = ?", action).
		Offset(offset).Limit(limit).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, total, err
}

func (s *DatabaseStore) ListAuditLogs(offset, limit int) ([]*AuditLog, int64, error) {
	var logs []*AuditLog
	var total int64

	// Get total count
	if err := s.db.Model(&AuditLog{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := s.db.Offset(offset).Limit(limit).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, total, err
}

func (s *DatabaseStore) QueryAuditLogs(q AuditLogQuery) ([]*AuditLog, int64, error) {
	var logs []*AuditLog
	var total int64

	db := s.db.Model(&AuditLog{})
	if q.UserID != nil {
		db = db.Where("user_id = ?", *q.UserID)
	}
	if q.Action != "" {
		db = db.Where("action = ?", q.Action)
	}
	if q.StartTime != nil {
		db = db.Where("created_at >= ?", *q.StartTime)
	}
	if q.EndTime != nil {
		db = db.Where("created_at <= ?", *q.EndTime)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	limit := q.Limit
	if limit <= 0 {
		limit = 20
	}
	err := db.Offset(q.Offset).Limit(limit).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, total, err
}

// === DatabaseStore LoginAttempt Methods ===

func (s *DatabaseStore) CreateLoginAttempt(attempt *LoginAttempt) error {
	return s.db.Create(attempt).Error
}

func (s *DatabaseStore) GetLoginAttemptsByUserID(userID uint, since time.Time) ([]*LoginAttempt, error) {
	var attempts []*LoginAttempt
	err := s.db.Where("user_id = ? AND created_at > ?", userID, since).
		Order("created_at DESC").
		Find(&attempts).Error
	return attempts, err
}

func (s *DatabaseStore) GetLoginAttemptsByUsername(username string, since time.Time) ([]*LoginAttempt, error) {
	var attempts []*LoginAttempt
	err := s.db.Where("username = ? AND created_at > ?", username, since).
		Order("created_at DESC").
		Find(&attempts).Error
	return attempts, err
}

func (s *DatabaseStore) GetLoginAttemptsByIP(ipAddress string, since time.Time) ([]*LoginAttempt, error) {
	var attempts []*LoginAttempt
	err := s.db.Where("ip_address = ? AND created_at > ?", ipAddress, since).
		Order("created_at DESC").
		Find(&attempts).Error
	return attempts, err
}

func (s *DatabaseStore) CleanupOldLoginAttempts(before time.Time) error {
	return s.db.Where("created_at < ?", before).Delete(&LoginAttempt{}).Error
}

// === DatabaseStore UserSession Methods ===

func (s *DatabaseStore) CreateUserSession(session *UserSession) error {
	return s.db.Create(session).Error
}

func (s *DatabaseStore) GetUserSession(sessionID string) (*UserSession, error) {
	var session UserSession
	err := s.db.Where("session_id = ?", sessionID).First(&session).Error
	return &session, err
}

func (s *DatabaseStore) UpdateUserSession(session *UserSession) error {
	return s.db.Save(session).Error
}

func (s *DatabaseStore) DeleteUserSession(sessionID string) error {
	return s.db.Where("session_id = ?", sessionID).Delete(&UserSession{}).Error
}

func (s *DatabaseStore) GetUserSessions(userID uint) ([]*UserSession, error) {
	var sessions []*UserSession
	err := s.db.Where("user_id = ? AND is_active = ?", userID, true).
		Order("created_at DESC").
		Find(&sessions).Error
	return sessions, err
}

func (s *DatabaseStore) DeleteUserSessions(userID uint) error {
	return s.db.Where("user_id = ?", userID).Delete(&UserSession{}).Error
}

func (s *DatabaseStore) CleanupExpiredSessions(before time.Time) error {
	return s.db.Where("expires_at < ? OR is_active = ?", before, false).Delete(&UserSession{}).Error
}

func (s *DatabaseStore) CreateEnvironment(env *Environment) error {
	if env.ID == "" {
		env.ID = uuid.New().String()
	}
	return s.db.Create(env).Error
}

func (s *DatabaseStore) GetEnvironmentByID(id string) (*Environment, error) {
	var env Environment
	if err := s.db.Where("id = ?", id).First(&env).Error; err != nil {
		return nil, err
	}
	return &env, nil
}

func (s *DatabaseStore) GetEnvironmentByName(name string) (*Environment, error) {
	var env Environment
	if err := s.db.Where("name = ?", name).First(&env).Error; err != nil {
		return nil, err
	}
	return &env, nil
}

func (s *DatabaseStore) ListEnvironments() ([]Environment, error) {
	var list []Environment
	err := s.db.Order("name ASC").Find(&list).Error
	return list, err
}

func (s *DatabaseStore) UpdateEnvironment(env *Environment) error {
	return s.db.Save(env).Error
}

func (s *DatabaseStore) DeleteEnvironment(id string) error {
	return s.db.Where("id = ?", id).Delete(&Environment{}).Error
}

func (s *DatabaseStore) CreateAccessGrant(g *AccessGrant) error {
	return s.db.Create(g).Error
}

func (s *DatabaseStore) GetAccessGrantByID(id uint) (*AccessGrant, error) {
	var g AccessGrant
	if err := s.db.First(&g, id).Error; err != nil {
		return nil, err
	}
	return &g, nil
}

func (s *DatabaseStore) ListAccessGrants() ([]AccessGrant, error) {
	var list []AccessGrant
	err := s.db.Order("user_id ASC, cluster_id ASC").Find(&list).Error
	return list, err
}

func (s *DatabaseStore) ListAccessGrantsByUser(userID uint) ([]AccessGrant, error) {
	var list []AccessGrant
	err := s.db.Where("user_id = ?", userID).Find(&list).Error
	return list, err
}

func (s *DatabaseStore) DeleteAccessGrant(id uint) error {
	return s.db.Delete(&AccessGrant{}, id).Error
}

func (s *DatabaseStore) ListRoleNavPolicies() ([]RoleNavPolicy, error) {
	var list []RoleNavPolicy
	err := s.db.Order("role_name ASC").Find(&list).Error
	return list, err
}

func (s *DatabaseStore) GetRoleNavPolicies(roleNames []string) ([]RoleNavPolicy, error) {
	if len(roleNames) == 0 {
		return nil, nil
	}
	var list []RoleNavPolicy
	err := s.db.Where("role_name IN ?", roleNames).Find(&list).Error
	return list, err
}

func (s *DatabaseStore) UpsertRoleNavPolicy(p *RoleNavPolicy) error {
	p.UpdatedAt = time.Now()
	return s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "role_name"}},
		DoUpdates: clause.AssignmentColumns([]string{"hidden_groups", "hidden_items", "updated_at"}),
	}).Create(p).Error
}
