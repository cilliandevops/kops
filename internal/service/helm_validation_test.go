package service

import "testing"

// Chart refs, versions and repo names reach the helm CLI as argv entries, so
// anything flag-like or malformed must be rejected before it gets there.
func TestHelmArgumentValidation(t *testing.T) {
	t.Run("chart refs", func(t *testing.T) {
		valid := []string{"grafana/grafana", "prometheus-community/kube-prometheus-stack", "repo.io/chart_1"}
		for _, ref := range valid {
			if err := validateChartRef(ref); err != nil {
				t.Errorf("validateChartRef(%q) = %v, want nil", ref, err)
			}
		}
		invalid := []string{"", "grafana", "bad ref", "-flag/chart", "repo/-flag", "repo//chart", "repo/chart;rm -rf /", "../../etc/passwd"}
		for _, ref := range invalid {
			if err := validateChartRef(ref); err == nil {
				t.Errorf("validateChartRef(%q) = nil, want error", ref)
			}
		}
	})

	t.Run("versions", func(t *testing.T) {
		for _, v := range []string{"", "1.2.3", "10.5.15", "2.0.0-rc.1", "1.0.0+build5"} {
			if err := validateChartVersion(v); err != nil {
				t.Errorf("validateChartVersion(%q) = %v, want nil", v, err)
			}
		}
		for _, v := range []string{"--bogus-flag", "-v", "1.0 && whoami", "a/b"} {
			if err := validateChartVersion(v); err == nil {
				t.Errorf("validateChartVersion(%q) = nil, want error", v)
			}
		}
	})

	t.Run("repo names", func(t *testing.T) {
		for _, n := range []string{"bitnami", "prometheus-community", "repo_1", "a.b"} {
			if err := validateRepoName(n); err != nil {
				t.Errorf("validateRepoName(%q) = %v, want nil", n, err)
			}
		}
		for _, n := range []string{"", "-oops", "has space", "repo/slash", "a;b"} {
			if err := validateRepoName(n); err == nil {
				t.Errorf("validateRepoName(%q) = nil, want error", n)
			}
		}
	})
}

func TestAddRepoRejectsNonHTTPURL(t *testing.T) {
	s := NewHelmService(nil)
	for _, url := range []string{"file:///etc/passwd", "ftp://example.com", "example.com", ""} {
		if err := s.AddRepo("probe", url); err == nil {
			t.Errorf("AddRepo(%q) = nil, want error", url)
		}
	}
}
