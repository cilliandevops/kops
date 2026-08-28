package service

import (
	"reflect"
	"testing"

	"github.com/ciliverse/cilikube/internal/store"
)

func policyRow(role string, groups, items string) store.RoleNavPolicy {
	return store.RoleNavPolicy{RoleName: role, HiddenGroups: groups, HiddenItems: items}
}

func TestMergeNavPoliciesLeastRestrictive(t *testing.T) {
	tests := []struct {
		name       string
		rows       []store.RoleNavPolicy
		roleCount  int
		wantGroups []string
		wantItems  []string
	}{
		{
			name:       "no roles hides nothing",
			roleCount:  0,
			wantGroups: []string{},
			wantItems:  []string{},
		},
		{
			name:       "single role applies its own blocklist",
			rows:       []store.RoleNavPolicy{policyRow("viewer", `["nav.admin"]`, `["/proxy","/audit"]`)},
			roleCount:  1,
			wantGroups: []string{"nav.admin"},
			wantItems:  []string{"/proxy", "/audit"},
		},
		{
			name: "a role without a stored policy clears the blocklist",
			rows: []store.RoleNavPolicy{
				policyRow("viewer", `["nav.admin"]`, `["/proxy"]`),
			},
			roleCount:  2,
			wantGroups: []string{},
			wantItems:  []string{},
		},
		{
			name: "two policies keep only entries both hide",
			rows: []store.RoleNavPolicy{
				policyRow("viewer", `["nav.admin","nav.storage"]`, `["/proxy","/audit"]`),
				policyRow("editor", `["nav.admin"]`, `["/audit","/timeline"]`),
			},
			roleCount:  2,
			wantGroups: []string{"nav.admin"},
			wantItems:  []string{"/audit"},
		},
		{
			name: "disjoint policies hide nothing",
			rows: []store.RoleNavPolicy{
				policyRow("viewer", `["nav.storage"]`, `["/proxy"]`),
				policyRow("editor", `["nav.admin"]`, `["/audit"]`),
			},
			roleCount:  2,
			wantGroups: []string{},
			wantItems:  []string{},
		},
		{
			name:       "malformed json degrades to hiding nothing",
			rows:       []store.RoleNavPolicy{policyRow("viewer", `not json`, ``)},
			roleCount:  1,
			wantGroups: []string{},
			wantItems:  []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := mergeNavPolicies(tt.rows, tt.roleCount)
			if !reflect.DeepEqual(got.HiddenGroups, tt.wantGroups) {
				t.Errorf("HiddenGroups = %#v, want %#v", got.HiddenGroups, tt.wantGroups)
			}
			if !reflect.DeepEqual(got.HiddenItems, tt.wantItems) {
				t.Errorf("HiddenItems = %#v, want %#v", got.HiddenItems, tt.wantItems)
			}
		})
	}
}

func TestNormalizeNavIDs(t *testing.T) {
	got, err := normalizeNavIDs([]string{" /pods ", "/pods", "", "/nodes"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []string{"/nodes", "/pods"}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("normalizeNavIDs = %#v, want %#v", got, want)
	}

	long := make([]byte, maxNavPolicyIDLen+1)
	for i := range long {
		long[i] = 'a'
	}
	if _, err := normalizeNavIDs([]string{string(long)}); err == nil {
		t.Error("expected error for over-long nav id")
	}

	many := make([]string, maxNavPolicyEntries+1)
	for i := range many {
		many[i] = "/item" + string(rune('a'+i%26)) + string(rune('a'+i/26))
	}
	if _, err := normalizeNavIDs(many); err == nil {
		t.Error("expected error for too many nav ids")
	}
}

func TestSetPolicyRejectsAdminLockout(t *testing.T) {
	s := &NavPolicyService{}

	if _, err := s.SetPolicy("admin", []string{adminNavGroup}, nil); err == nil {
		t.Error("expected error when hiding the admin group from the admin role")
	}
	if _, err := s.SetPolicy("admin", nil, []string{adminRolesNavID}); err == nil {
		t.Error("expected error when hiding the roles page from the admin role")
	}
}
