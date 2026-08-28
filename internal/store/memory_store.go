package store

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sort"
	"sync"
	"time"
)

// MemoryStore is an in-memory implementation of the complete Store interface
// This allows the application to work without a database
type MemoryStore struct {
	// Cluster storage
	clusters map[string]*Cluster

	// User and auth storage
	users          map[uint]*User
	usersByName    map[string]*User
	usersByEmail   map[string]*User
	roles          map[uint]*Role
	rolesByName    map[string]*Role
	userRoles      map[uint][]uint           // userID -> roleIDs
	oauthProviders map[string]*OAuthProvider // key: userID_provider
	auditLogs      []*AuditLog
	environments   map[string]*Environment
	accessGrants   map[uint]*AccessGrant
	navPolicies    map[string]*RoleNavPolicy // key: role name

	// ID generators
	nextUserID     uint
	nextRoleID     uint
	nextAuditLogID uint
	nextGrantID    uint

	mutex sync.RWMutex
}

// NewMemoryStore creates a new in-memory store with all interfaces
func NewMemoryStore() Store {
	store := &MemoryStore{
		clusters:       make(map[string]*Cluster),
		users:          make(map[uint]*User),
		usersByName:    make(map[string]*User),
		usersByEmail:   make(map[string]*User),
		roles:          make(map[uint]*Role),
		rolesByName:    make(map[string]*Role),
		userRoles:      make(map[uint][]uint),
		oauthProviders: make(map[string]*OAuthProvider),
		auditLogs:      make([]*AuditLog, 0),
		environments:   make(map[string]*Environment),
		accessGrants:   make(map[uint]*AccessGrant),
		navPolicies:    make(map[string]*RoleNavPolicy),
		nextUserID:     1,
		nextRoleID:     1,
		nextAuditLogID: 1,
		nextGrantID:    1,
	}
	return store
}

// Simple UUID generator for clusters
func generateUUID() string {
	// Generate a random UUID v4
	bytes := make([]byte, 16)
	_, err := rand.Read(bytes)
	if err != nil {
		// Fallback to timestamp-based generation if random generation fails
		timestamp := time.Now().UnixNano()
		return fmt.Sprintf("%x", timestamp)
	}

	// Set version (4) and variant bits
	bytes[6] = (bytes[6] & 0x0f) | 0x40 // Version 4
	bytes[8] = (bytes[8] & 0x3f) | 0x80 // Variant 10

	uuid := hex.EncodeToString(bytes)
	// Format as standard UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
	return fmt.Sprintf("%s-%s-%s-%s-%s",
		uuid[0:8], uuid[8:12], uuid[12:16], uuid[16:20], uuid[20:32])
}

// === MemoryStore Cluster Methods ===

// CreateCluster implements ClusterStore interface for MemoryStore
func (s *MemoryStore) CreateCluster(cluster *Cluster) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Check if cluster with the same name already exists
	for _, existingCluster := range s.clusters {
		if existingCluster.Name == cluster.Name {
			return fmt.Errorf("cluster with name '%s' already exists", cluster.Name)
		}
	}

	// Generate UUID
	id := generateUUID()
	if id == "" {
		return fmt.Errorf("failed to generate cluster ID")
	}

	// Create a copy of the cluster with generated ID
	newCluster := *cluster
	newCluster.ID = id
	newCluster.CreatedAt = time.Now()
	newCluster.UpdatedAt = time.Now()

	s.clusters[id] = &newCluster
	cluster.ID = id
	return nil
}

// GetClusterByID implements ClusterStore interface for MemoryStore
func (s *MemoryStore) GetClusterByID(id string) (*Cluster, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	cluster, exists := s.clusters[id]
	if !exists {
		return nil, fmt.Errorf("cluster with ID '%s' not found", id)
	}

	clusterCopy := *cluster
	return &clusterCopy, nil
}

// GetClusterByName implements ClusterStore interface for MemoryStore
func (s *MemoryStore) GetClusterByName(name string) (*Cluster, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	for _, cluster := range s.clusters {
		if cluster.Name == name {
			clusterCopy := *cluster
			return &clusterCopy, nil
		}
	}

	return nil, fmt.Errorf("cluster with name '%s' not found", name)
}

// GetAllClusters implements ClusterStore interface for MemoryStore
func (s *MemoryStore) GetAllClusters() ([]Cluster, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	clusters := make([]Cluster, 0, len(s.clusters))
	for _, cluster := range s.clusters {
		clusterCopy := *cluster
		clusters = append(clusters, clusterCopy)
	}

	return clusters, nil
}

// UpdateCluster implements ClusterStore interface for MemoryStore
func (s *MemoryStore) UpdateCluster(cluster *Cluster) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	_, exists := s.clusters[cluster.ID]
	if !exists {
		return fmt.Errorf("cluster with ID '%s' not found", cluster.ID)
	}

	// Check if another cluster with the same name already exists
	for id, existing := range s.clusters {
		if id != cluster.ID && existing.Name == cluster.Name {
			return fmt.Errorf("cluster with name '%s' already exists", cluster.Name)
		}
	}

	updatedCluster := *cluster
	updatedCluster.UpdatedAt = time.Now()
	s.clusters[cluster.ID] = &updatedCluster

	return nil
}

// DeleteClusterByName implements ClusterStore interface for MemoryStore
func (s *MemoryStore) DeleteClusterByName(name string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	var clusterID string
	var found bool

	for id, cluster := range s.clusters {
		if cluster.Name == name {
			clusterID = id
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("cluster with name '%s' not found", name)
	}

	delete(s.clusters, clusterID)
	return nil
}

// DeleteClusterByID implements ClusterStore interface for MemoryStore
func (s *MemoryStore) DeleteClusterByID(id string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if _, exists := s.clusters[id]; !exists {
		return fmt.Errorf("cluster with ID '%s' not found", id)
	}

	delete(s.clusters, id)
	return nil
}

// === MemoryStore User Methods ===

// CreateUser implements UserStore interface
func (s *MemoryStore) CreateUser(user *User) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Check if username already exists
	if _, exists := s.usersByName[user.Username]; exists {
		return fmt.Errorf("username '%s' already exists", user.Username)
	}

	// Check if email already exists
	if _, exists := s.usersByEmail[user.Email]; exists {
		return fmt.Errorf("email '%s' already exists", user.Email)
	}

	// Create new user with generated ID
	newUser := *user
	newUser.ID = s.nextUserID
	s.nextUserID++
	newUser.CreatedAt = time.Now()
	newUser.UpdatedAt = time.Now()

	// Hash password if it's not already hashed
	if len(newUser.PasswordHash) > 0 && newUser.PasswordHash[0] != '$' {
		if err := newUser.HashPassword(newUser.PasswordHash); err != nil {
			return fmt.Errorf("failed to hash password: %w", err)
		}
	}

	// Store user
	s.users[newUser.ID] = &newUser
	s.usersByName[newUser.Username] = &newUser
	s.usersByEmail[newUser.Email] = &newUser

	// Update original user with generated ID
	user.ID = newUser.ID
	user.CreatedAt = newUser.CreatedAt
	user.UpdatedAt = newUser.UpdatedAt

	return nil
}

// GetUserByID implements UserStore interface
func (s *MemoryStore) GetUserByID(id uint) (*User, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	user, exists := s.users[id]
	if !exists {
		return nil, fmt.Errorf("user with ID %d not found", id)
	}

	userCopy := *user
	return &userCopy, nil
}

// GetUserByUsername implements UserStore interface
func (s *MemoryStore) GetUserByUsername(username string) (*User, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	user, exists := s.usersByName[username]
	if !exists {
		return nil, fmt.Errorf("user with username '%s' not found", username)
	}

	userCopy := *user
	return &userCopy, nil
}

// GetUserByEmail implements UserStore interface
func (s *MemoryStore) GetUserByEmail(email string) (*User, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	user, exists := s.usersByEmail[email]
	if !exists {
		return nil, fmt.Errorf("user with email '%s' not found", email)
	}

	userCopy := *user
	return &userCopy, nil
}

// UpdateUser implements UserStore interface
func (s *MemoryStore) UpdateUser(user *User) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	existingUser, exists := s.users[user.ID]
	if !exists {
		return fmt.Errorf("user with ID %d not found", user.ID)
	}

	// Check if username is being changed and if it conflicts
	if user.Username != existingUser.Username {
		if _, exists := s.usersByName[user.Username]; exists {
			return fmt.Errorf("username '%s' already exists", user.Username)
		}
		delete(s.usersByName, existingUser.Username)
		s.usersByName[user.Username] = user
	}

	// Check if email is being changed and if it conflicts
	if user.Email != existingUser.Email {
		if _, exists := s.usersByEmail[user.Email]; exists {
			return fmt.Errorf("email '%s' already exists", user.Email)
		}
		delete(s.usersByEmail, existingUser.Email)
		s.usersByEmail[user.Email] = user
	}

	// Update user
	updatedUser := *user
	updatedUser.UpdatedAt = time.Now()
	s.users[user.ID] = &updatedUser

	return nil
}

// DeleteUser implements UserStore interface
func (s *MemoryStore) DeleteUser(id uint) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	user, exists := s.users[id]
	if !exists {
		return fmt.Errorf("user with ID %d not found", id)
	}

	// Remove from all indexes
	delete(s.users, id)
	delete(s.usersByName, user.Username)
	delete(s.usersByEmail, user.Email)

	// Remove user roles
	delete(s.userRoles, id)

	// Remove OAuth providers
	for key := range s.oauthProviders {
		if fmt.Sprintf("%d_", id) == key[:len(fmt.Sprintf("%d_", id))] {
			delete(s.oauthProviders, key)
		}
	}

	return nil
}

// ListUsers implements UserStore interface
func (s *MemoryStore) ListUsers(offset, limit int) ([]*User, int64, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	total := int64(len(s.users))
	users := make([]*User, 0)

	// Convert map to slice for pagination
	allUsers := make([]*User, 0, len(s.users))
	for _, user := range s.users {
		userCopy := *user
		allUsers = append(allUsers, &userCopy)
	}

	// Apply pagination
	start := offset
	end := offset + limit
	if start > len(allUsers) {
		return users, total, nil
	}
	if end > len(allUsers) {
		end = len(allUsers)
	}

	users = allUsers[start:end]
	return users, total, nil
}

// === MemoryStore Role Methods ===

// CreateRole implements RoleStore interface
func (s *MemoryStore) CreateRole(role *Role) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Check if role name already exists
	if _, exists := s.rolesByName[role.Name]; exists {
		return fmt.Errorf("role with name '%s' already exists", role.Name)
	}

	// Create new role with generated ID
	newRole := *role
	newRole.ID = s.nextRoleID
	s.nextRoleID++
	newRole.CreatedAt = time.Now()
	newRole.UpdatedAt = time.Now()

	// Store role
	s.roles[newRole.ID] = &newRole
	s.rolesByName[newRole.Name] = &newRole

	// Update original role with generated ID
	role.ID = newRole.ID
	role.CreatedAt = newRole.CreatedAt
	role.UpdatedAt = newRole.UpdatedAt

	return nil
}

// GetRoleByID implements RoleStore interface
func (s *MemoryStore) GetRoleByID(id uint) (*Role, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	role, exists := s.roles[id]
	if !exists {
		return nil, fmt.Errorf("role with ID %d not found", id)
	}

	roleCopy := *role
	return &roleCopy, nil
}

// GetRoleByName implements RoleStore interface
func (s *MemoryStore) GetRoleByName(name string) (*Role, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	role, exists := s.rolesByName[name]
	if !exists {
		return nil, fmt.Errorf("role with name '%s' not found", name)
	}

	roleCopy := *role
	return &roleCopy, nil
}

// UpdateRole implements RoleStore interface
func (s *MemoryStore) UpdateRole(role *Role) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	existingRole, exists := s.roles[role.ID]
	if !exists {
		return fmt.Errorf("role with ID %d not found", role.ID)
	}

	// Check if name is being changed and if it conflicts
	if role.Name != existingRole.Name {
		if _, exists := s.rolesByName[role.Name]; exists {
			return fmt.Errorf("role with name '%s' already exists", role.Name)
		}
		delete(s.rolesByName, existingRole.Name)
		s.rolesByName[role.Name] = role
	}

	// Update role
	updatedRole := *role
	updatedRole.UpdatedAt = time.Now()
	s.roles[role.ID] = &updatedRole

	return nil
}

// DeleteRole implements RoleStore interface
func (s *MemoryStore) DeleteRole(id uint) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	role, exists := s.roles[id]
	if !exists {
		return fmt.Errorf("role with ID %d not found", id)
	}

	// Remove from indexes
	delete(s.roles, id)
	delete(s.rolesByName, role.Name)

	// Remove role from all users
	for userID, roleIDs := range s.userRoles {
		newRoleIDs := make([]uint, 0)
		for _, roleID := range roleIDs {
			if roleID != id {
				newRoleIDs = append(newRoleIDs, roleID)
			}
		}
		s.userRoles[userID] = newRoleIDs
	}

	return nil
}

// ListRoles implements RoleStore interface
func (s *MemoryStore) ListRoles() ([]*Role, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	roles := make([]*Role, 0, len(s.roles))
	for _, role := range s.roles {
		roleCopy := *role
		roles = append(roles, &roleCopy)
	}

	return roles, nil
}

// === MemoryStore UserRole Methods ===

// AssignRole implements UserRoleStore interface
func (s *MemoryStore) AssignRole(userID, roleID uint) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Check if user exists
	if _, exists := s.users[userID]; !exists {
		return fmt.Errorf("user with ID %d not found", userID)
	}

	// Check if role exists
	if _, exists := s.roles[roleID]; !exists {
		return fmt.Errorf("role with ID %d not found", roleID)
	}

	// Check if user already has this role
	userRoles := s.userRoles[userID]
	for _, existingRoleID := range userRoles {
		if existingRoleID == roleID {
			return nil // Already assigned, no error
		}
	}

	// Add role to user
	s.userRoles[userID] = append(userRoles, roleID)
	return nil
}

// RemoveRole implements UserRoleStore interface
func (s *MemoryStore) RemoveRole(userID, roleID uint) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	userRoles, exists := s.userRoles[userID]
	if !exists {
		return fmt.Errorf("user with ID %d not found", userID)
	}

	// Remove role from user
	newRoles := make([]uint, 0)
	found := false
	for _, existingRoleID := range userRoles {
		if existingRoleID != roleID {
			newRoles = append(newRoles, existingRoleID)
		} else {
			found = true
		}
	}

	if !found {
		return fmt.Errorf("user %d does not have role %d", userID, roleID)
	}

	s.userRoles[userID] = newRoles
	return nil
}

// GetUserRoles implements UserRoleStore interface
func (s *MemoryStore) GetUserRoles(userID uint) ([]*Role, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	roleIDs, exists := s.userRoles[userID]
	if !exists {
		return []*Role{}, nil // Return empty slice if user has no roles
	}

	roles := make([]*Role, 0, len(roleIDs))
	for _, roleID := range roleIDs {
		if role, exists := s.roles[roleID]; exists {
			roleCopy := *role
			roles = append(roles, &roleCopy)
		}
	}

	return roles, nil
}

// GetRoleUsers implements UserRoleStore interface
func (s *MemoryStore) GetRoleUsers(roleID uint) ([]*User, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// Check if role exists
	if _, exists := s.roles[roleID]; !exists {
		return nil, fmt.Errorf("role with ID %d not found", roleID)
	}

	users := make([]*User, 0)
	for userID, roleIDs := range s.userRoles {
		for _, userRoleID := range roleIDs {
			if userRoleID == roleID {
				if user, exists := s.users[userID]; exists {
					userCopy := *user
					users = append(users, &userCopy)
				}
				break
			}
		}
	}

	return users, nil
}

// HasRole implements UserRoleStore interface
func (s *MemoryStore) HasRole(userID, roleID uint) (bool, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	roleIDs, exists := s.userRoles[userID]
	if !exists {
		return false, nil
	}

	for _, existingRoleID := range roleIDs {
		if existingRoleID == roleID {
			return true, nil
		}
	}

	return false, nil
}

// === MemoryStore OAuth Methods ===

// CreateOAuthProvider implements OAuthStore interface
func (s *MemoryStore) CreateOAuthProvider(provider *OAuthProvider) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Check if user exists
	if _, exists := s.users[provider.UserID]; !exists {
		return fmt.Errorf("user with ID %d not found", provider.UserID)
	}

	key := fmt.Sprintf("%d_%s", provider.UserID, provider.Provider)

	// Check if provider already exists for this user
	if _, exists := s.oauthProviders[key]; exists {
		return fmt.Errorf("OAuth provider '%s' already exists for user %d", provider.Provider, provider.UserID)
	}

	// Create new OAuth provider
	newProvider := *provider
	newProvider.CreatedAt = time.Now()
	newProvider.UpdatedAt = time.Now()

	s.oauthProviders[key] = &newProvider
	return nil
}

// GetOAuthProvider implements OAuthStore interface
func (s *MemoryStore) GetOAuthProvider(userID uint, provider string) (*OAuthProvider, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	key := fmt.Sprintf("%d_%s", userID, provider)
	oauthProvider, exists := s.oauthProviders[key]
	if !exists {
		return nil, fmt.Errorf("OAuth provider '%s' not found for user %d", provider, userID)
	}

	providerCopy := *oauthProvider
	return &providerCopy, nil
}

// GetOAuthProviderByProviderUserID implements OAuthStore interface
func (s *MemoryStore) GetOAuthProviderByProviderUserID(provider, providerUserID string) (*OAuthProvider, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	for _, oauthProvider := range s.oauthProviders {
		if oauthProvider.Provider == provider && oauthProvider.ProviderUserID == providerUserID {
			providerCopy := *oauthProvider
			return &providerCopy, nil
		}
	}

	return nil, fmt.Errorf("OAuth provider '%s' with provider user ID '%s' not found", provider, providerUserID)
}

// UpdateOAuthProvider implements OAuthStore interface
func (s *MemoryStore) UpdateOAuthProvider(provider *OAuthProvider) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	key := fmt.Sprintf("%d_%s", provider.UserID, provider.Provider)
	_, exists := s.oauthProviders[key]
	if !exists {
		return fmt.Errorf("OAuth provider '%s' not found for user %d", provider.Provider, provider.UserID)
	}

	// Update OAuth provider
	updatedProvider := *provider
	updatedProvider.UpdatedAt = time.Now()
	s.oauthProviders[key] = &updatedProvider

	return nil
}

// DeleteOAuthProvider implements OAuthStore interface
func (s *MemoryStore) DeleteOAuthProvider(userID uint, provider string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	key := fmt.Sprintf("%d_%s", userID, provider)
	if _, exists := s.oauthProviders[key]; !exists {
		return fmt.Errorf("OAuth provider '%s' not found for user %d", provider, userID)
	}

	delete(s.oauthProviders, key)
	return nil
}

// ListUserOAuthProviders implements OAuthStore interface
func (s *MemoryStore) ListUserOAuthProviders(userID uint) ([]*OAuthProvider, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	providers := make([]*OAuthProvider, 0)
	prefix := fmt.Sprintf("%d_", userID)

	for key, provider := range s.oauthProviders {
		if len(key) > len(prefix) && key[:len(prefix)] == prefix {
			providerCopy := *provider
			providers = append(providers, &providerCopy)
		}
	}

	return providers, nil
}

// === MemoryStore AuditLog Methods ===

// CreateAuditLog implements AuditLogStore interface
func (s *MemoryStore) CreateAuditLog(log *AuditLog) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Create new audit log
	newLog := *log
	newLog.CreatedAt = time.Now()

	s.auditLogs = append(s.auditLogs, &newLog)
	return nil
}

// GetAuditLogsByUserID implements AuditLogStore interface
func (s *MemoryStore) GetAuditLogsByUserID(userID uint, offset, limit int) ([]*AuditLog, int64, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// Filter logs by user ID
	userLogs := make([]*AuditLog, 0)
	for _, log := range s.auditLogs {
		if log.UserID != nil && *log.UserID == userID {
			logCopy := *log
			userLogs = append(userLogs, &logCopy)
		}
	}

	total := int64(len(userLogs))

	// Apply pagination
	start := offset
	end := offset + limit
	if start > len(userLogs) {
		return []*AuditLog{}, total, nil
	}
	if end > len(userLogs) {
		end = len(userLogs)
	}

	return userLogs[start:end], total, nil
}

// GetAuditLogsByAction implements AuditLogStore interface
func (s *MemoryStore) GetAuditLogsByAction(action string, offset, limit int) ([]*AuditLog, int64, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	// Filter logs by action
	actionLogs := make([]*AuditLog, 0)
	for _, log := range s.auditLogs {
		if log.Action == action {
			logCopy := *log
			actionLogs = append(actionLogs, &logCopy)
		}
	}

	total := int64(len(actionLogs))

	// Apply pagination
	start := offset
	end := offset + limit
	if start > len(actionLogs) {
		return []*AuditLog{}, total, nil
	}
	if end > len(actionLogs) {
		end = len(actionLogs)
	}

	return actionLogs[start:end], total, nil
}

// ListAuditLogs implements AuditLogStore interface
func (s *MemoryStore) ListAuditLogs(offset, limit int) ([]*AuditLog, int64, error) {
	return s.QueryAuditLogs(AuditLogQuery{Offset: offset, Limit: limit})
}

// QueryAuditLogs implements AuditLogStore interface
func (s *MemoryStore) QueryAuditLogs(q AuditLogQuery) ([]*AuditLog, int64, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	filtered := make([]*AuditLog, 0, len(s.auditLogs))
	for _, log := range s.auditLogs {
		if q.UserID != nil && (log.UserID == nil || *log.UserID != *q.UserID) {
			continue
		}
		if q.Action != "" && log.Action != q.Action {
			continue
		}
		if q.StartTime != nil && log.CreatedAt.Before(*q.StartTime) {
			continue
		}
		if q.EndTime != nil && log.CreatedAt.After(*q.EndTime) {
			continue
		}
		logCopy := *log
		filtered = append(filtered, &logCopy)
	}

	// Newest first
	for i, j := 0, len(filtered)-1; i < j; i, j = i+1, j-1 {
		filtered[i], filtered[j] = filtered[j], filtered[i]
	}

	total := int64(len(filtered))
	start := q.Offset
	end := q.Offset + q.Limit
	if q.Limit <= 0 {
		end = start + 20
	}
	if start > len(filtered) {
		return []*AuditLog{}, total, nil
	}
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[start:end], total, nil
}

// === MemoryStore Management Methods ===

// Initialize implements Store interface
func (s *MemoryStore) Initialize() error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Create default roles
	adminRole := &Role{
		Name:        "admin",
		DisplayName: "Administrator",
		Description: "System administrator with all permissions",
		IsSystem:    true,
	}

	editorRole := &Role{
		Name:        "editor",
		DisplayName: "Editor",
		Description: "Can edit most resources, but cannot manage users and clusters",
		IsSystem:    true,
	}

	viewerRole := &Role{
		Name:        "viewer",
		DisplayName: "Viewer",
		Description: "Can only view resources, cannot perform modification operations",
		IsSystem:    true,
	}

	// Create roles
	if err := s.createRoleInternal(adminRole); err != nil {
		return fmt.Errorf("failed to create admin role: %w", err)
	}
	if err := s.createRoleInternal(editorRole); err != nil {
		return fmt.Errorf("failed to create editor role: %w", err)
	}
	if err := s.createRoleInternal(viewerRole); err != nil {
		return fmt.Errorf("failed to create viewer role: %w", err)
	}

	// Create default admin user
	adminUser := &User{
		Username:      "admin",
		Email:         "admin@cilikube.com",
		PasswordHash:  "12345678", // Will be hashed
		DisplayName:   "System Administrator",
		IsActive:      true,
		EmailVerified: true,
	}

	if err := s.createUserInternal(adminUser); err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	// Assign admin role to admin user
	if err := s.assignRoleInternal(adminUser.ID, adminRole.ID); err != nil {
		return fmt.Errorf("failed to assign admin role: %w", err)
	}

	return nil
}

// Close implements Store interface
func (s *MemoryStore) Close() error {
	// Nothing to close for memory store
	return nil
}

// Internal helper methods

func (s *MemoryStore) createRoleInternal(role *Role) error {
	// Check if role name already exists
	if _, exists := s.rolesByName[role.Name]; exists {
		return nil // Role already exists, skip
	}

	// Create new role with generated ID
	newRole := *role
	newRole.ID = s.nextRoleID
	s.nextRoleID++
	newRole.CreatedAt = time.Now()
	newRole.UpdatedAt = time.Now()

	// Store role
	s.roles[newRole.ID] = &newRole
	s.rolesByName[newRole.Name] = &newRole

	// Update original role with generated ID
	role.ID = newRole.ID
	role.CreatedAt = newRole.CreatedAt
	role.UpdatedAt = newRole.UpdatedAt

	return nil
}

func (s *MemoryStore) createUserInternal(user *User) error {
	// Check if username already exists
	if _, exists := s.usersByName[user.Username]; exists {
		return nil // User already exists, skip
	}

	// Check if email already exists
	if _, exists := s.usersByEmail[user.Email]; exists {
		return nil // User already exists, skip
	}

	// Create new user with generated ID
	newUser := *user
	newUser.ID = s.nextUserID
	s.nextUserID++
	newUser.CreatedAt = time.Now()
	newUser.UpdatedAt = time.Now()

	// Hash password if it's not already hashed
	if len(newUser.PasswordHash) > 0 && newUser.PasswordHash[0] != '$' {
		if err := newUser.HashPassword(newUser.PasswordHash); err != nil {
			return fmt.Errorf("failed to hash password: %w", err)
		}
	}

	// Store user
	s.users[newUser.ID] = &newUser
	s.usersByName[newUser.Username] = &newUser
	s.usersByEmail[newUser.Email] = &newUser

	// Update original user with generated ID
	user.ID = newUser.ID
	user.CreatedAt = newUser.CreatedAt
	user.UpdatedAt = newUser.UpdatedAt

	return nil
}

func (s *MemoryStore) assignRoleInternal(userID, roleID uint) error {
	// Check if user already has this role
	userRoles := s.userRoles[userID]
	for _, existingRoleID := range userRoles {
		if existingRoleID == roleID {
			return nil // Already assigned, no error
		}
	}

	// Add role to user
	s.userRoles[userID] = append(userRoles, roleID)
	return nil
}

// === MemoryStore LoginAttempt Methods ===

// CreateLoginAttempt implements LoginAttemptStore interface
func (s *MemoryStore) CreateLoginAttempt(attempt *LoginAttempt) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// For memory store, we'll just add to audit logs for simplicity
	// In a real implementation, you might want a separate storage
	action := "login_failed"
	if attempt.Success {
		action = "login"
	}

	auditLog := &AuditLog{
		UserID:     attempt.UserID,
		Action:     action,
		Resource:   "user",
		ResourceID: attempt.Username,
		IPAddress:  attempt.IPAddress,
		UserAgent:  attempt.UserAgent,
		Details:    attempt.FailReason,
		CreatedAt:  attempt.CreatedAt,
	}

	s.auditLogs = append(s.auditLogs, auditLog)
	return nil
}

// GetLoginAttemptsByUserID implements LoginAttemptStore interface
func (s *MemoryStore) GetLoginAttemptsByUserID(userID uint, since time.Time) ([]*LoginAttempt, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	attempts := make([]*LoginAttempt, 0)
	for _, log := range s.auditLogs {
		if log.UserID != nil && *log.UserID == userID && log.CreatedAt.After(since) {
			if log.Action == "login" || log.Action == "login_failed" {
				attempt := &LoginAttempt{
					UserID:     log.UserID,
					Username:   log.ResourceID,
					IPAddress:  log.IPAddress,
					UserAgent:  log.UserAgent,
					Success:    log.Action == "login",
					FailReason: log.Details,
					CreatedAt:  log.CreatedAt,
				}
				attempts = append(attempts, attempt)
			}
		}
	}
	return attempts, nil
}

// GetLoginAttemptsByUsername implements LoginAttemptStore interface
func (s *MemoryStore) GetLoginAttemptsByUsername(username string, since time.Time) ([]*LoginAttempt, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	attempts := make([]*LoginAttempt, 0)
	for _, log := range s.auditLogs {
		if log.ResourceID == username && log.CreatedAt.After(since) {
			if log.Action == "login" || log.Action == "login_failed" {
				attempt := &LoginAttempt{
					UserID:     log.UserID,
					Username:   log.ResourceID,
					IPAddress:  log.IPAddress,
					UserAgent:  log.UserAgent,
					Success:    log.Action == "login",
					FailReason: log.Details,
					CreatedAt:  log.CreatedAt,
				}
				attempts = append(attempts, attempt)
			}
		}
	}
	return attempts, nil
}

// GetLoginAttemptsByIP implements LoginAttemptStore interface
func (s *MemoryStore) GetLoginAttemptsByIP(ipAddress string, since time.Time) ([]*LoginAttempt, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	attempts := make([]*LoginAttempt, 0)
	for _, log := range s.auditLogs {
		if log.IPAddress == ipAddress && log.CreatedAt.After(since) {
			if log.Action == "login" || log.Action == "login_failed" {
				attempt := &LoginAttempt{
					UserID:     log.UserID,
					Username:   log.ResourceID,
					IPAddress:  log.IPAddress,
					UserAgent:  log.UserAgent,
					Success:    log.Action == "login",
					FailReason: log.Details,
					CreatedAt:  log.CreatedAt,
				}
				attempts = append(attempts, attempt)
			}
		}
	}
	return attempts, nil
}

// CleanupOldLoginAttempts implements LoginAttemptStore interface
func (s *MemoryStore) CleanupOldLoginAttempts(before time.Time) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// For memory store, we clean up from audit logs
	newLogs := make([]*AuditLog, 0)
	for _, log := range s.auditLogs {
		if log.CreatedAt.After(before) || (log.Action != "login" && log.Action != "login_failed") {
			newLogs = append(newLogs, log)
		}
	}
	s.auditLogs = newLogs
	return nil
}

// === MemoryStore UserSession Methods ===

// In-memory session storage
var memoryUserSessions = make(map[string]*UserSession)
var memoryUserSessionsByUser = make(map[uint][]string)

// CreateUserSession implements UserSessionStore interface
func (s *MemoryStore) CreateUserSession(session *UserSession) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Store session
	sessionCopy := *session
	sessionCopy.CreatedAt = time.Now()
	sessionCopy.LastSeen = time.Now()
	sessionCopy.IsActive = true

	memoryUserSessions[session.SessionID] = &sessionCopy

	// Add to user sessions index
	userSessions := memoryUserSessionsByUser[session.UserID]
	memoryUserSessionsByUser[session.UserID] = append(userSessions, session.SessionID)

	return nil
}

// GetUserSession implements UserSessionStore interface
func (s *MemoryStore) GetUserSession(sessionID string) (*UserSession, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	session, exists := memoryUserSessions[sessionID]
	if !exists {
		return nil, fmt.Errorf("session not found")
	}

	sessionCopy := *session
	return &sessionCopy, nil
}

// UpdateUserSession implements UserSessionStore interface
func (s *MemoryStore) UpdateUserSession(session *UserSession) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	if _, exists := memoryUserSessions[session.SessionID]; !exists {
		return fmt.Errorf("session not found")
	}

	sessionCopy := *session
	memoryUserSessions[session.SessionID] = &sessionCopy
	return nil
}

// DeleteUserSession implements UserSessionStore interface
func (s *MemoryStore) DeleteUserSession(sessionID string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	session, exists := memoryUserSessions[sessionID]
	if !exists {
		return nil // Already deleted
	}

	// Remove from main storage
	delete(memoryUserSessions, sessionID)

	// Remove from user index
	userSessions := memoryUserSessionsByUser[session.UserID]
	newUserSessions := make([]string, 0)
	for _, id := range userSessions {
		if id != sessionID {
			newUserSessions = append(newUserSessions, id)
		}
	}
	memoryUserSessionsByUser[session.UserID] = newUserSessions

	return nil
}

// GetUserSessions implements UserSessionStore interface
func (s *MemoryStore) GetUserSessions(userID uint) ([]*UserSession, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	sessionIDs := memoryUserSessionsByUser[userID]
	sessions := make([]*UserSession, 0, len(sessionIDs))

	for _, sessionID := range sessionIDs {
		if session, exists := memoryUserSessions[sessionID]; exists && session.IsActive {
			sessionCopy := *session
			sessions = append(sessions, &sessionCopy)
		}
	}

	return sessions, nil
}

// DeleteUserSessions implements UserSessionStore interface
func (s *MemoryStore) DeleteUserSessions(userID uint) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	sessionIDs := memoryUserSessionsByUser[userID]
	for _, sessionID := range sessionIDs {
		delete(memoryUserSessions, sessionID)
	}
	delete(memoryUserSessionsByUser, userID)

	return nil
}

// CleanupExpiredSessions implements UserSessionStore interface
func (s *MemoryStore) CleanupExpiredSessions(before time.Time) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Find expired sessions
	expiredSessions := make([]string, 0)
	for sessionID, session := range memoryUserSessions {
		if session.ExpiresAt.Before(before) || !session.IsActive {
			expiredSessions = append(expiredSessions, sessionID)
		}
	}

	// Remove expired sessions
	for _, sessionID := range expiredSessions {
		session := memoryUserSessions[sessionID]
		delete(memoryUserSessions, sessionID)

		// Remove from user index
		userSessions := memoryUserSessionsByUser[session.UserID]
		newUserSessions := make([]string, 0)
		for _, id := range userSessions {
			if id != sessionID {
				newUserSessions = append(newUserSessions, id)
			}
		}
		memoryUserSessionsByUser[session.UserID] = newUserSessions
	}

	return nil
}

func (s *MemoryStore) CreateEnvironment(env *Environment) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	if env.ID == "" {
		env.ID = generateUUID()
	}
	if _, ok := s.environments[env.ID]; ok {
		return fmt.Errorf("environment already exists")
	}
	for _, e := range s.environments {
		if e.Name == env.Name {
			return fmt.Errorf("environment name already exists")
		}
	}
	cp := *env
	s.environments[env.ID] = &cp
	return nil
}

func (s *MemoryStore) GetEnvironmentByID(id string) (*Environment, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	e, ok := s.environments[id]
	if !ok {
		return nil, fmt.Errorf("environment not found")
	}
	cp := *e
	return &cp, nil
}

func (s *MemoryStore) GetEnvironmentByName(name string) (*Environment, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	for _, e := range s.environments {
		if e.Name == name {
			cp := *e
			return &cp, nil
		}
	}
	return nil, fmt.Errorf("environment not found")
}

func (s *MemoryStore) ListEnvironments() ([]Environment, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	out := make([]Environment, 0, len(s.environments))
	for _, e := range s.environments {
		out = append(out, *e)
	}
	return out, nil
}

func (s *MemoryStore) UpdateEnvironment(env *Environment) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	if _, ok := s.environments[env.ID]; !ok {
		return fmt.Errorf("environment not found")
	}
	cp := *env
	s.environments[env.ID] = &cp
	return nil
}

func (s *MemoryStore) DeleteEnvironment(id string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	delete(s.environments, id)
	return nil
}

func (s *MemoryStore) CreateAccessGrant(g *AccessGrant) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	for _, existing := range s.accessGrants {
		if existing.UserID == g.UserID && existing.ClusterID == g.ClusterID && existing.Namespace == g.Namespace {
			return fmt.Errorf("grant already exists")
		}
	}
	g.ID = s.nextGrantID
	s.nextGrantID++
	cp := *g
	s.accessGrants[g.ID] = &cp
	return nil
}

func (s *MemoryStore) GetAccessGrantByID(id uint) (*AccessGrant, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	g, ok := s.accessGrants[id]
	if !ok {
		return nil, fmt.Errorf("grant not found")
	}
	cp := *g
	return &cp, nil
}

func (s *MemoryStore) ListAccessGrants() ([]AccessGrant, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	out := make([]AccessGrant, 0, len(s.accessGrants))
	for _, g := range s.accessGrants {
		out = append(out, *g)
	}
	return out, nil
}

func (s *MemoryStore) ListAccessGrantsByUser(userID uint) ([]AccessGrant, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	out := make([]AccessGrant, 0)
	for _, g := range s.accessGrants {
		if g.UserID == userID {
			out = append(out, *g)
		}
	}
	return out, nil
}

func (s *MemoryStore) DeleteAccessGrant(id uint) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	delete(s.accessGrants, id)
	return nil
}

func (s *MemoryStore) ListRoleNavPolicies() ([]RoleNavPolicy, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	out := make([]RoleNavPolicy, 0, len(s.navPolicies))
	for _, p := range s.navPolicies {
		out = append(out, *p)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].RoleName < out[j].RoleName })
	return out, nil
}

func (s *MemoryStore) GetRoleNavPolicies(roleNames []string) ([]RoleNavPolicy, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	out := make([]RoleNavPolicy, 0, len(roleNames))
	for _, name := range roleNames {
		if p, ok := s.navPolicies[name]; ok {
			out = append(out, *p)
		}
	}
	return out, nil
}

func (s *MemoryStore) UpsertRoleNavPolicy(p *RoleNavPolicy) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	cp := *p
	cp.UpdatedAt = time.Now()
	s.navPolicies[cp.RoleName] = &cp
	return nil
}
