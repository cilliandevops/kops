package service

import (
	"fmt"
	"log"

	"github.com/casbin/casbin/v2"
	"github.com/ciliverse/cilikube/internal/store"
)

// PermissionService provides permission management functionality
type PermissionService struct {
	store    store.Store
	enforcer *casbin.Enforcer
}

// NewPermissionService creates a new PermissionService instance
func NewPermissionService(store store.Store, enforcer *casbin.Enforcer) *PermissionService {
	return &PermissionService{
		store:    store,
		enforcer: enforcer,
	}
}

type rolePolicy struct {
	role   string
	object string
	action string
}

// namespacedResourcePolicies builds cluster-list + namespaced CRUD path policies.
// Uses :param segments (keyMatch2) so /namespaces/:ns does not grant nested pod exec/secrets.
func namespacedResourcePolicies(role, resource, action string) []rolePolicy {
	base := "/api/v1/" + resource
	ns := "/api/v1/namespaces/:ns/" + resource
	return []rolePolicy{
		{role, base, action},
		{role, base + "/:name", action},
		{role, ns, action},
		{role, ns + "/:name", action},
		{role, ns + "/:name/watch", "GET"},
	}
}

// systemViewerPolicies is the authoritative read-only role for public guest accounts.
// Intentionally omits: secrets, proxy, exec, attach, portforward, admin, cluster writes.
func systemViewerPolicies() []rolePolicy {
	p := []rolePolicy{
		{"viewer", "/api/v1/namespaces", "GET"},
		{"viewer", "/api/v1/namespaces/:ns", "GET"},

		{"viewer", "/api/v1/pods/metrics", "GET"},
		{"viewer", "/api/v1/namespaces/:ns/pods/:name/logs", "GET"},

		{"viewer", "/api/v1/nodes", "GET"},
		{"viewer", "/api/v1/nodes/:name", "GET"},
		{"viewer", "/api/v1/nodes/metrics", "GET"},

		{"viewer", "/api/v1/events", "GET"},
		{"viewer", "/api/v1/events/:name", "GET"},
		{"viewer", "/api/v1/events/object/:kind/:name", "GET"},

		{"viewer", "/api/v1/summary/:name", "GET"},
		{"viewer", "/api/v1/summary/resources", "GET"},

		{"viewer", "/api/v1/persistentvolumes", "GET"},
		{"viewer", "/api/v1/persistentvolumes/:name", "GET"},
		{"viewer", "/api/v1/storageclasses", "GET"},
		{"viewer", "/api/v1/storageclasses/:name", "GET"},
		{"viewer", "/api/v1/gatewayclasses", "GET"},
		{"viewer", "/api/v1/gatewayclasses/:name", "GET"},
		{"viewer", "/api/v1/clusterroles", "GET"},
		{"viewer", "/api/v1/clusterroles/:name", "GET"},
		{"viewer", "/api/v1/clusterrolebindings", "GET"},
		{"viewer", "/api/v1/clusterrolebindings/:name", "GET"},
		{"viewer", "/api/v1/crds", "GET"},
		{"viewer", "/api/v1/crds/:name", "GET"},

		{"viewer", "/api/v1/helm/releases", "GET"},
		{"viewer", "/api/v1/helm/releases/:namespace/:name", "GET"},
		{"viewer", "/api/v1/helm/repos", "GET"},
		{"viewer", "/api/v1/helm/charts", "GET"},
		{"viewer", "/api/v1/helm/chart", "GET"},

		{"viewer", "/api/v1/informers/:name", "GET"},
		{"viewer", "/api/v1/monitoring/:name", "GET"},
		{"viewer", "/api/v1/monitoring/dashboard", "GET"},
		{"viewer", "/api/v1/prometheus/:name", "GET"},
		{"viewer", "/api/v1/prometheus/status", "GET"},
		{"viewer", "/api/v1/prometheus/query", "GET"},
		{"viewer", "/api/v1/prometheus/query_range", "GET"},

		{"viewer", "/api/v1/clusters", "GET"},
		{"viewer", "/api/v1/clusters/:id", "GET"},
		{"viewer", "/api/v1/clusters/fleet-summary", "GET"},
		{"viewer", "/api/v1/clusters/active", "GET"},
		{"viewer", "/api/v1/clusters/active", "POST"},

		{"viewer", "/api/v1/environments", "GET"},
		{"viewer", "/api/v1/environments/:id", "GET"},
		{"viewer", "/api/v1/applications", "GET"},
		{"viewer", "/api/v1/applications/:namespace/:name", "GET"},
		{"viewer", "/api/v1/me/access", "GET"},

		{"viewer", "/api/v1/topology", "GET"},
		{"viewer", "/api/v1/topology/traffic", "GET"},
		{"viewer", "/api/v1/timeline", "GET"},
		{"viewer", "/api/v1/timeline/meta", "GET"},

		{"viewer", "/api/v1/auth/profile", "GET"},
		{"viewer", "/api/v1/auth/profile", "PUT"},
		{"viewer", "/api/v1/auth/password", "PUT"},
		{"viewer", "/api/v1/auth/change-password", "POST"},
		{"viewer", "/api/v1/auth/refresh", "POST"},
		{"viewer", "/api/v1/auth/logout", "POST"},
		{"viewer", "/api/v1/profile", "GET"},
		{"viewer", "/api/v1/profile", "PUT"},
		{"viewer", "/api/v1/profile/:name", "GET"},

		// Every user reads their own sidebar policy; only admins edit them.
		{"viewer", "/api/v1/nav/policy", "GET"},

		{"viewer", "/api/v1/ai/status", "GET"},
		{"viewer", "/api/v1/ai/chat", "POST"},
	}

	readResources := []string{
		"pods", "deployments", "statefulsets", "daemonsets", "jobs", "cronjobs",
		"services", "configmaps", "serviceaccounts", "persistentvolumeclaims",
		"ingresses", "networkpolicies", "gateways", "httproutes", "horizontalpodautoscalers",
		"poddisruptionbudgets", "resourcequotas", "limitranges",
		"roles", "rolebindings",
	}
	for _, res := range readResources {
		p = append(p, namespacedResourcePolicies("viewer", res, "GET")...)
	}
	return p
}

func systemEditorPolicies() []rolePolicy {
	p := []rolePolicy{
		{"editor", "/api/v1/namespaces", "*"},
		{"editor", "/api/v1/namespaces/:ns", "*"},

		{"editor", "/api/v1/pods/metrics", "GET"},
		{"editor", "/api/v1/namespaces/:ns/pods/:name/logs", "GET"},
		{"editor", "/api/v1/namespaces/:ns/pods/:name/exec", "*"},
		{"editor", "/api/v1/namespaces/:ns/pods/:name/attach", "*"},
		{"editor", "/api/v1/namespaces/:ns/pods/:name/portforward", "*"},

		{"editor", "/api/v1/nodes", "GET"},
		{"editor", "/api/v1/nodes/:name", "GET"},
		{"editor", "/api/v1/nodes/metrics", "GET"},

		{"editor", "/api/v1/events", "GET"},
		{"editor", "/api/v1/events/:name", "GET"},
		{"editor", "/api/v1/events/object/:kind/:name", "GET"},

		{"editor", "/api/v1/summary/:name", "GET"},
		{"editor", "/api/v1/summary/resources", "GET"},

		{"editor", "/api/v1/persistentvolumes", "*"},
		{"editor", "/api/v1/persistentvolumes/:name", "*"},
		{"editor", "/api/v1/storageclasses", "*"},
		{"editor", "/api/v1/storageclasses/:name", "*"},
		{"editor", "/api/v1/gatewayclasses", "*"},
		{"editor", "/api/v1/gatewayclasses/:name", "*"},
		{"editor", "/api/v1/clusterroles", "GET"},
		{"editor", "/api/v1/clusterroles/:name", "GET"},
		{"editor", "/api/v1/clusterrolebindings", "GET"},
		{"editor", "/api/v1/clusterrolebindings/:name", "GET"},
		{"editor", "/api/v1/crds", "*"},
		{"editor", "/api/v1/crds/:name", "*"},

		{"editor", "/api/v1/helm/*", "*"},

		{"editor", "/api/v1/proxy/*", "*"},
		{"editor", "/api/v1/informers/:name", "GET"},
		{"editor", "/api/v1/monitoring/:name", "GET"},
		{"editor", "/api/v1/monitoring/dashboard", "GET"},
		{"editor", "/api/v1/prometheus/:name", "GET"},
		{"editor", "/api/v1/prometheus/status", "GET"},
		{"editor", "/api/v1/prometheus/query", "GET"},
		{"editor", "/api/v1/prometheus/query_range", "GET"},

		{"editor", "/api/v1/clusters", "GET"},
		{"editor", "/api/v1/clusters/:id", "GET"},
		{"editor", "/api/v1/clusters/fleet-summary", "GET"},
		{"editor", "/api/v1/clusters/active", "GET"},
		{"editor", "/api/v1/clusters/active", "POST"},

		{"editor", "/api/v1/environments", "*"},
		{"editor", "/api/v1/environments/:id", "*"},
		{"editor", "/api/v1/applications", "GET"},
		{"editor", "/api/v1/applications/:namespace/:name", "GET"},
		{"editor", "/api/v1/me/access", "GET"},

		{"editor", "/api/v1/topology", "GET"},
		{"editor", "/api/v1/topology/traffic", "GET"},
		{"editor", "/api/v1/timeline", "GET"},
		{"editor", "/api/v1/timeline/meta", "GET"},

		{"editor", "/api/v1/ai/status", "GET"},
		{"editor", "/api/v1/ai/chat", "POST"},

		{"editor", "/api/v1/auth/profile", "GET"},
		{"editor", "/api/v1/auth/profile", "PUT"},
		{"editor", "/api/v1/auth/profile/*", "*"},
		{"editor", "/api/v1/auth/password", "PUT"},
		{"editor", "/api/v1/auth/change-password", "POST"},
		{"editor", "/api/v1/auth/refresh", "POST"},
		{"editor", "/api/v1/auth/logout", "POST"},
		{"editor", "/api/v1/profile", "*"},
		{"editor", "/api/v1/profile/:name", "*"},

		{"editor", "/api/v1/nav/policy", "GET"},
	}

	writeResources := []string{
		"pods", "deployments", "statefulsets", "daemonsets", "jobs", "cronjobs",
		"services", "configmaps", "serviceaccounts", "persistentvolumeclaims",
		"ingresses", "networkpolicies", "gateways", "httproutes", "horizontalpodautoscalers",
		"poddisruptionbudgets", "resourcequotas", "limitranges",
	}
	for _, res := range writeResources {
		p = append(p, namespacedResourcePolicies("editor", res, "*")...)
	}
	// Secrets: read-only for editor (no write via broad namespace grant)
	p = append(p, namespacedResourcePolicies("editor", "secrets", "GET")...)
	// RBAC objects: read-only
	p = append(p, namespacedResourcePolicies("editor", "roles", "GET")...)
	p = append(p, namespacedResourcePolicies("editor", "rolebindings", "GET")...)
	return p
}

// InitializeDefaultPolicies initializes default RBAC policies for the system.
// Viewer/editor policies are fully replaced on each startup so security fixes apply
// to existing databases (add-if-missing alone cannot revoke over-broad rules).
func (s *PermissionService) InitializeDefaultPolicies() error {
	if s.enforcer == nil {
		log.Println("Casbin enforcer not available, skipping policy initialization")
		return nil
	}

	for _, role := range []string{"viewer", "editor"} {
		if _, err := s.enforcer.RemoveFilteredPolicy(0, role); err != nil {
			return fmt.Errorf("failed to clear %s policies: %w", role, err)
		}
		log.Printf("Cleared existing Casbin policies for system role: %s", role)
	}

	defaultPolicies := []rolePolicy{
		{"admin", "/api/v1/*", "*"},
		{"admin", "/api/v1/auth/*", "*"},
		{"admin", "/api/v1/roles/*", "*"},
		{"admin", "/api/v1/users/*", "*"},
		{"admin", "/api/v1/clusters/*", "*"},
	}
	defaultPolicies = append(defaultPolicies, systemEditorPolicies()...)
	defaultPolicies = append(defaultPolicies, systemViewerPolicies()...)

	for _, policy := range defaultPolicies {
		if policy.role == "admin" {
			if err := s.addPolicyIfNotExists(policy.role, policy.object, policy.action); err != nil {
				return fmt.Errorf("failed to add policy (%s, %s, %s): %w", policy.role, policy.object, policy.action, err)
			}
			continue
		}
		if _, err := s.enforcer.AddPolicy(policy.role, policy.object, policy.action); err != nil {
			return fmt.Errorf("failed to add policy (%s, %s, %s): %w", policy.role, policy.object, policy.action, err)
		}
	}

	if err := s.initializeRoleInheritance(); err != nil {
		return fmt.Errorf("failed to initialize role inheritance: %w", err)
	}

	log.Println("Default RBAC policies initialized successfully (viewer/editor resynced)")
	return nil
}

// addPolicyIfNotExists adds a policy if it doesn't already exist
func (s *PermissionService) addPolicyIfNotExists(sub, obj, act string) error {
	has, err := s.enforcer.HasPolicy(sub, obj, act)
	if err != nil {
		return fmt.Errorf("error checking if policy exists: %w", err)
	}

	if !has {
		added, err := s.enforcer.AddPolicy(sub, obj, act)
		if err != nil {
			return fmt.Errorf("failed to add policy: %w", err)
		}
		if added {
			log.Printf("Successfully added policy: %s, %s, %s", sub, obj, act)
		}
	} else {
		log.Printf("Policy already exists, skipping: %s, %s, %s", sub, obj, act)
	}

	return nil
}

// initializeRoleInheritance sets up role inheritance relationships
func (s *PermissionService) initializeRoleInheritance() error {
	// Get all users and their roles from the store
	users, _, err := s.store.ListUsers(0, 1000) // Get first 1000 users
	if err != nil {
		return fmt.Errorf("failed to list users: %w", err)
	}

	for _, user := range users {
		// Get user roles
		roles, err := s.store.GetUserRoles(user.ID)
		if err != nil {
			log.Printf("Failed to get roles for user %d: %v", user.ID, err)
			continue
		}

		// Add grouping policies for each role
		for _, role := range roles {
			userSubject := fmt.Sprintf("user:%d", user.ID)
			if err := s.addGroupingPolicyIfNotExists(userSubject, role.Name); err != nil {
				log.Printf("Failed to add grouping policy for user %d, role %s: %v", user.ID, role.Name, err)
			}
		}
	}

	return nil
}

// addGroupingPolicyIfNotExists adds a grouping policy if it doesn't already exist
func (s *PermissionService) addGroupingPolicyIfNotExists(user, role string) error {
	has, err := s.enforcer.HasGroupingPolicy(user, role)
	if err != nil {
		return fmt.Errorf("error checking if grouping policy exists: %w", err)
	}

	if !has {
		added, err := s.enforcer.AddGroupingPolicy(user, role)
		if err != nil {
			return fmt.Errorf("failed to add grouping policy: %w", err)
		}
		if added {
			log.Printf("Successfully added grouping policy: %s -> %s", user, role)
		}
	}

	return nil
}

// SyncUserRoles synchronizes user roles with Casbin grouping policies
func (s *PermissionService) SyncUserRoles(userID uint) error {
	if s.enforcer == nil {
		return nil // Skip if Casbin is not available
	}

	userSubject := fmt.Sprintf("user:%d", userID)

	// Remove all existing grouping policies for this user
	_, err := s.enforcer.RemoveFilteredGroupingPolicy(0, userSubject)
	if err != nil {
		return fmt.Errorf("failed to remove existing grouping policies: %w", err)
	}

	// Get current user roles from store
	roles, err := s.store.GetUserRoles(userID)
	if err != nil {
		return fmt.Errorf("failed to get user roles: %w", err)
	}

	// Add grouping policies for current roles
	for _, role := range roles {
		if err := s.addGroupingPolicyIfNotExists(userSubject, role.Name); err != nil {
			return fmt.Errorf("failed to add grouping policy for role %s: %w", role.Name, err)
		}
	}

	return nil
}

// CheckPermission checks if a user has permission to perform an action on a resource
func (s *PermissionService) CheckPermission(userID uint, object, action string) (bool, error) {
	if s.enforcer == nil {
		// If Casbin is not available, allow all operations (fallback mode)
		log.Printf("Casbin enforcer not available, allowing operation: user %d, %s %s", userID, action, object)
		return true, nil
	}

	userSubject := fmt.Sprintf("user:%d", userID)
	allowed, err := s.enforcer.Enforce(userSubject, object, action)
	if err != nil {
		return false, fmt.Errorf("failed to check permission: %w", err)
	}

	log.Printf("Permission check: user %d, %s %s -> %v", userID, action, object, allowed)
	return allowed, nil
}

// AddRolePolicy adds a new policy for a role
func (s *PermissionService) AddRolePolicy(role, object, action string) error {
	if s.enforcer == nil {
		return fmt.Errorf("Casbin enforcer not available")
	}

	return s.addPolicyIfNotExists(role, object, action)
}

// RemoveRolePolicy removes a policy for a role
func (s *PermissionService) RemoveRolePolicy(role, object, action string) error {
	if s.enforcer == nil {
		return fmt.Errorf("Casbin enforcer not available")
	}

	removed, err := s.enforcer.RemovePolicy(role, object, action)
	if err != nil {
		return fmt.Errorf("failed to remove policy: %w", err)
	}

	if removed {
		log.Printf("Successfully removed policy: %s, %s, %s", role, object, action)
	} else {
		log.Printf("Policy not found, nothing to remove: %s, %s, %s", role, object, action)
	}

	return nil
}

// GetRolePolicies gets all policies for a role
func (s *PermissionService) GetRolePolicies(role string) ([][]string, error) {
	if s.enforcer == nil {
		return nil, fmt.Errorf("Casbin enforcer not available")
	}

	policies, err := s.enforcer.GetFilteredPolicy(0, role)
	if err != nil {
		return nil, fmt.Errorf("failed to get filtered policy: %w", err)
	}

	return policies, nil
}

// GetUserPermissions gets all effective permissions for a user
func (s *PermissionService) GetUserPermissions(userID uint) ([][]string, error) {
	if s.enforcer == nil {
		return nil, fmt.Errorf("Casbin enforcer not available")
	}

	// Get user roles
	roles, err := s.store.GetUserRoles(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user roles: %w", err)
	}

	var allPermissions [][]string

	// Get permissions for each role
	for _, role := range roles {
		rolePolicies, err := s.GetRolePolicies(role.Name)
		if err != nil {
			return nil, fmt.Errorf("failed to get policies for role %s: %w", role.Name, err)
		}
		allPermissions = append(allPermissions, rolePolicies...)
	}

	log.Printf("User %d has %d effective permissions", userID, len(allPermissions))
	return allPermissions, nil
}

// ClearRolePolicies removes all Casbin policies for a role
func (s *PermissionService) ClearRolePolicies(role string) error {
	if s.enforcer == nil {
		return fmt.Errorf("Casbin enforcer not available")
	}

	_, err := s.enforcer.RemoveFilteredPolicy(0, role)
	if err != nil {
		return fmt.Errorf("failed to clear policies for role %s: %w", role, err)
	}
	return nil
}

// GetLogicalPermissionsForRole returns UI-facing logical permission names for a role
func (s *PermissionService) GetLogicalPermissionsForRole(role string) ([]string, error) {
	if s.enforcer == nil {
		return []string{}, nil
	}

	policies, err := s.GetRolePolicies(role)
	if err != nil {
		return nil, err
	}
	return logicalPermissionsFromPolicies(policies), nil
}

// SetLogicalPermissionsForRole replaces a role's Casbin policies from logical permission names
func (s *PermissionService) SetLogicalPermissionsForRole(role string, permissions []string) error {
	if s.enforcer == nil {
		return fmt.Errorf("Casbin enforcer not available")
	}

	if err := s.ClearRolePolicies(role); err != nil {
		return err
	}

	seen := make(map[string]bool)
	for _, name := range permissions {
		if seen[name] {
			continue
		}
		seen[name] = true

		policies, ok := policiesForLogicalPermission(name)
		if !ok {
			return fmt.Errorf("unknown permission: %s", name)
		}
		for _, policy := range policies {
			if err := s.addPolicyIfNotExists(role, policy.Object, policy.Action); err != nil {
				return err
			}
		}
	}

	return nil
}
