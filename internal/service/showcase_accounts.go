package service

import (
	"fmt"
	"log/slog"

	"github.com/ciliverse/cilikube/internal/store"
	"github.com/ciliverse/cilikube/pkg/k8s"
)

// EnsureShowcaseAccounts resets public demo users/passwords when CILIKUBE_SHOWCASE=1.
// Local/dev without the flag is untouched. Fail-closed: no-op outside showcase.
// Even under the flag it never overwrites an account an operator has personalised —
// see adoptableForShowcase.
func EnsureShowcaseAccounts(mainStore store.Store) error {
	if !k8s.IsShowcase() {
		return nil
	}
	if mainStore == nil {
		return fmt.Errorf("store required for showcase accounts")
	}

	if err := upsertShowcaseUser(mainStore, k8s.ShowcaseAdminUser, "demo-admin@cilikube.local", k8s.ShowcaseAdminPass, "admin"); err != nil {
		return err
	}
	if err := upsertShowcaseUser(mainStore, k8s.ShowcaseGuestUser, "demo-guest@cilikube.local", k8s.ShowcaseGuestPass, "viewer"); err != nil {
		return err
	}
	slog.Info("showcase demo accounts ensured",
		"admin", k8s.ShowcaseAdminUser,
		"guest", k8s.ShowcaseGuestUser,
	)
	return nil
}

// adoptableForShowcase reports whether an existing account may be overwritten with
// demo credentials. A pristine seeded account (still forced to change its password)
// or an account already carrying the demo email is fair game; anything else belongs
// to a real operator who has personalised it, and clobbering it would lock them out.
func adoptableForShowcase(user *store.User, demoEmail string) bool {
	return user.Email == demoEmail || user.MustChangePassword
}

func upsertShowcaseUser(mainStore store.Store, username, email, password, roleName string) error {
	user, err := mainStore.GetUserByUsername(username)
	if err == nil && user != nil && !adoptableForShowcase(user, email) {
		slog.Warn("showcase: refusing to overwrite a personalised account",
			"username", username,
			"email", user.Email,
			"hint", "delete the account or set CILIKUBE_SHOWCASE only on the public exhibit host",
		)
		return nil
	}
	if err != nil || user == nil {
		user = &store.User{
			Username: username,
			Email:    email,
			IsActive: true,
		}
		if err := user.HashPassword(password); err != nil {
			return fmt.Errorf("hash password for %s: %w", username, err)
		}
		if err := mainStore.CreateUser(user); err != nil {
			return fmt.Errorf("create user %s: %w", username, err)
		}
		// reload for ID
		user, err = mainStore.GetUserByUsername(username)
		if err != nil {
			return fmt.Errorf("reload user %s: %w", username, err)
		}
	} else {
		if err := user.HashPassword(password); err != nil {
			return fmt.Errorf("hash password for %s: %w", username, err)
		}
		user.IsActive = true
		user.Email = email
		if err := mainStore.UpdateUser(user); err != nil {
			return fmt.Errorf("update user %s: %w", username, err)
		}
	}

	role, err := mainStore.GetRoleByName(roleName)
	if err != nil || role == nil {
		return fmt.Errorf("role %s not found: %w", roleName, err)
	}
	roles, _ := mainStore.GetUserRoles(user.ID)
	has := false
	for _, r := range roles {
		if r.Name == roleName {
			has = true
			continue
		}
		// Pin exact role set for showcase system accounts (store bypasses ValidateRoleChange).
		if err := mainStore.RemoveRole(user.ID, r.ID); err != nil {
			return fmt.Errorf("remove extra role %s from %s: %w", r.Name, username, err)
		}
	}
	if !has {
		if err := mainStore.AssignRole(user.ID, role.ID); err != nil {
			return fmt.Errorf("assign role %s to %s: %w", roleName, username, err)
		}
	}
	return nil
}

// SyncShowcaseAccountPermissions refreshes Casbin groupings for demo users.
// Call after PermissionService.InitializeDefaultPolicies — AssignRole alone does not update Casbin.
func SyncShowcaseAccountPermissions(mainStore store.Store, permissionService *PermissionService) error {
	if !k8s.IsShowcase() || mainStore == nil || permissionService == nil {
		return nil
	}
	for _, username := range []string{k8s.ShowcaseAdminUser, k8s.ShowcaseGuestUser} {
		user, err := mainStore.GetUserByUsername(username)
		if err != nil || user == nil {
			continue
		}
		if err := permissionService.SyncUserRoles(user.ID); err != nil {
			return fmt.Errorf("sync casbin roles for %s: %w", username, err)
		}
	}
	return nil
}
