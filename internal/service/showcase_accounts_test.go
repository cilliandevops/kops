package service

import (
	"testing"

	"github.com/ciliverse/cilikube/internal/store"
)

// Showcase seeding once wiped a real operator's admin password because it upserted
// straight onto the existing `admin` row. Pin the guard that stops that.
func TestAdoptableForShowcase(t *testing.T) {
	const demoEmail = "demo-admin@cilikube.local"

	cases := []struct {
		name string
		user store.User
		want bool
	}{
		{
			name: "existing demo account is refreshed every boot",
			user: store.User{Email: demoEmail, MustChangePassword: false},
			want: true,
		},
		{
			name: "freshly seeded account is still adoptable",
			user: store.User{Email: "admin@cilikube.com", MustChangePassword: true},
			want: true,
		},
		{
			name: "operator who set their own password is left alone",
			user: store.User{Email: "admin@cilikube.com", MustChangePassword: false},
			want: false,
		},
		{
			name: "operator with a custom email is left alone",
			user: store.User{Email: "me@example.com", MustChangePassword: false},
			want: false,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := adoptableForShowcase(&tc.user, demoEmail); got != tc.want {
				t.Fatalf("adoptableForShowcase(%+v) = %v, want %v", tc.user, got, tc.want)
			}
		})
	}
}
