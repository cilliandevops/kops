package service

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/ciliverse/cilikube/internal/store"
)

const (
	maxNavPolicyEntries = 300
	maxNavPolicyIDLen   = 128
)

// Nav ids that must stay visible to admins, otherwise an admin who hides the
// admin group loses the only UI that can undo the change.
const (
	adminNavGroup   = "nav.admin"
	adminRolesNavID = "/admin/roles"
	adminRoleName   = "admin"
)

// NavPolicy is the per-role sidebar blocklist. Empty lists mean "hide nothing".
type NavPolicy struct {
	RoleName     string   `json:"role_name"`
	HiddenGroups []string `json:"hidden_groups"`
	HiddenItems  []string `json:"hidden_items"`
}

// NavPolicyService reads and writes per-role sidebar visibility.
//
// This only shapes the sidebar. It is not an authorization boundary: a user
// whose menu is hidden can still reach the route by URL and the API by hand.
// Real enforcement lives in PermissionService / Casbin.
type NavPolicyService struct {
	store       store.Store
	roleService *RoleService
}

func NewNavPolicyService(s store.Store, roleService *RoleService) *NavPolicyService {
	return &NavPolicyService{store: s, roleService: roleService}
}

func decodeNavIDs(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return []string{}
	}
	var out []string
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return []string{}
	}
	return out
}

func encodeNavIDs(ids []string) (string, error) {
	if ids == nil {
		ids = []string{}
	}
	b, err := json.Marshal(ids)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// normalizeNavIDs trims, de-duplicates and bounds a caller-supplied id list.
func normalizeNavIDs(ids []string) ([]string, error) {
	seen := make(map[string]struct{}, len(ids))
	out := make([]string, 0, len(ids))
	for _, id := range ids {
		id = strings.TrimSpace(id)
		if id == "" {
			continue
		}
		if len(id) > maxNavPolicyIDLen {
			return nil, fmt.Errorf("nav id too long: %q", id[:maxNavPolicyIDLen])
		}
		if _, dup := seen[id]; dup {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	if len(out) > maxNavPolicyEntries {
		return nil, fmt.Errorf("too many nav ids: %d (max %d)", len(out), maxNavPolicyEntries)
	}
	sort.Strings(out)
	return out, nil
}

// ListPolicies returns every stored policy, keyed by role name.
func (s *NavPolicyService) ListPolicies() ([]NavPolicy, error) {
	rows, err := s.store.ListRoleNavPolicies()
	if err != nil {
		return nil, err
	}
	out := make([]NavPolicy, 0, len(rows))
	for _, row := range rows {
		out = append(out, NavPolicy{
			RoleName:     row.RoleName,
			HiddenGroups: decodeNavIDs(row.HiddenGroups),
			HiddenItems:  decodeNavIDs(row.HiddenItems),
		})
	}
	return out, nil
}

// SetPolicy replaces the policy for one role.
func (s *NavPolicyService) SetPolicy(roleName string, hiddenGroups, hiddenItems []string) (*NavPolicy, error) {
	roleName = strings.TrimSpace(roleName)
	if roleName == "" {
		return nil, fmt.Errorf("role name is required")
	}
	if s.roleService != nil {
		if _, err := s.roleService.GetRoleByName(roleName); err != nil {
			return nil, fmt.Errorf("unknown role %q", roleName)
		}
	}

	groups, err := normalizeNavIDs(hiddenGroups)
	if err != nil {
		return nil, err
	}
	items, err := normalizeNavIDs(hiddenItems)
	if err != nil {
		return nil, err
	}

	if roleName == adminRoleName {
		for _, g := range groups {
			if g == adminNavGroup {
				return nil, fmt.Errorf("cannot hide the admin group from the admin role")
			}
		}
		for _, it := range items {
			if it == adminRolesNavID {
				return nil, fmt.Errorf("cannot hide %s from the admin role", adminRolesNavID)
			}
		}
	}

	groupsJSON, err := encodeNavIDs(groups)
	if err != nil {
		return nil, err
	}
	itemsJSON, err := encodeNavIDs(items)
	if err != nil {
		return nil, err
	}

	row := &store.RoleNavPolicy{
		RoleName:     roleName,
		HiddenGroups: groupsJSON,
		HiddenItems:  itemsJSON,
	}
	if err := s.store.UpsertRoleNavPolicy(row); err != nil {
		return nil, err
	}
	return &NavPolicy{RoleName: roleName, HiddenGroups: groups, HiddenItems: items}, nil
}

// EffectiveForRoles merges the policies of every role a user holds.
//
// Merging is least-restrictive: an entry stays hidden only when *all* of the
// user's roles hide it, so gaining an extra role never takes menus away. A role
// with no stored policy hides nothing, which therefore clears the whole
// blocklist.
func (s *NavPolicyService) EffectiveForRoles(roleNames []string) (*NavPolicy, error) {
	empty := &NavPolicy{HiddenGroups: []string{}, HiddenItems: []string{}}
	if len(roleNames) == 0 {
		return empty, nil
	}

	rows, err := s.store.GetRoleNavPolicies(roleNames)
	if err != nil {
		return nil, err
	}
	return mergeNavPolicies(rows, len(roleNames)), nil
}

// mergeNavPolicies intersects the blocklists of every role a user holds.
// roleCount is the number of roles requested: if any of them had no stored
// policy it restricts nothing, which clears the blocklist entirely.
func mergeNavPolicies(rows []store.RoleNavPolicy, roleCount int) *NavPolicy {
	empty := &NavPolicy{HiddenGroups: []string{}, HiddenItems: []string{}}
	if roleCount == 0 || len(rows) < roleCount {
		return empty
	}

	var groups, items []string
	for i, row := range rows {
		rowGroups := decodeNavIDs(row.HiddenGroups)
		rowItems := decodeNavIDs(row.HiddenItems)
		if i == 0 {
			groups, items = rowGroups, rowItems
			continue
		}
		groups = intersect(groups, rowGroups)
		items = intersect(items, rowItems)
	}
	if groups == nil {
		groups = []string{}
	}
	if items == nil {
		items = []string{}
	}
	return &NavPolicy{HiddenGroups: groups, HiddenItems: items}
}

func intersect(a, b []string) []string {
	if len(a) == 0 || len(b) == 0 {
		return []string{}
	}
	inB := make(map[string]struct{}, len(b))
	for _, v := range b {
		inB[v] = struct{}{}
	}
	out := make([]string, 0, len(a))
	for _, v := range a {
		if _, ok := inB[v]; ok {
			out = append(out, v)
		}
	}
	return out
}
