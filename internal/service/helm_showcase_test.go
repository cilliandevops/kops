package service

import (
	"errors"
	"os/exec"
	"strings"
	"testing"
)

// helmOnPath reports whether this machine has helm, which decides what
// showcaseHelmActive can be asserted to return.
func helmOnPath() bool {
	_, err := exec.LookPath("helm")
	return err == nil
}

func TestShowcaseHelmActiveRequiresShowcase(t *testing.T) {
	t.Setenv("CILIKUBE_SHOWCASE", "")
	t.Setenv("CILIKUBE_MODE", "")
	if showcaseHelmActive() {
		t.Fatal("local/dev must never serve the canned catalog")
	}
}

// A real helm wins over the canned data, so installing the binary on the
// exhibit host is all it takes to make the marketplace live.
func TestShowcaseHelmActiveYieldsToRealHelm(t *testing.T) {
	t.Setenv("CILIKUBE_SHOWCASE", "1")
	if got, want := showcaseHelmActive(), !helmOnPath(); got != want {
		t.Fatalf("showcaseHelmActive()=%v, want %v (helm on PATH: %v)", got, want, helmOnPath())
	}
}

func TestShowcaseCatalogIsSelfConsistent(t *testing.T) {
	charts := showcaseHelmCatalog()
	if len(charts) == 0 {
		t.Fatal("empty catalog would leave the demo marketplace blank")
	}

	repos := map[string]bool{}
	for _, r := range showcaseHelmRepos() {
		repos[r.Name] = true
	}
	seen := map[string]bool{}
	for _, c := range charts {
		if c.Ref != c.Repo+"/"+c.Name {
			t.Errorf("%s: ref does not match repo/name", c.Ref)
		}
		if !repos[c.Repo] {
			t.Errorf("%s: repo %q is not in the demo repo list", c.Ref, c.Repo)
		}
		if seen[c.Ref] {
			t.Errorf("%s: duplicate entry", c.Ref)
		}
		seen[c.Ref] = true
		if c.Version == "" || c.Description == "" {
			t.Errorf("%s: needs a version and description to render a card", c.Ref)
		}
	}
}

func TestShowcaseChartDetail(t *testing.T) {
	first := showcaseHelmCatalog()[0]

	detail, err := showcaseHelmChartDetail(first.Ref, "")
	if err != nil {
		t.Fatalf("detail for %s: %v", first.Ref, err)
	}
	if detail.Version != first.Version {
		t.Errorf("version=%q, want the catalog version %q", detail.Version, first.Version)
	}
	if detail.Readme == "" || detail.Values == "" {
		t.Error("README and values tabs would render empty")
	}
	// Visitors should not mistake the sample data for a live repository.
	if !strings.Contains(detail.Readme, "Public demo") {
		t.Error("README must say the catalog is demo data")
	}
	if len(detail.Versions) == 0 || detail.Versions[0] != first.Version {
		t.Errorf("versions=%v, want it to lead with %q", detail.Versions, first.Version)
	}

	if _, err := showcaseHelmChartDetail("bitnami/not-a-chart", ""); err == nil {
		t.Error("unknown chart should error, not return an empty detail")
	}

	// An explicit version is echoed back so the picker stays in sync.
	pinned, err := showcaseHelmChartDetail(first.Ref, "1.2.3")
	if err != nil {
		t.Fatalf("pinned detail: %v", err)
	}
	if pinned.Version != "1.2.3" {
		t.Errorf("pinned version=%q, want 1.2.3", pinned.Version)
	}
}

func TestShowcaseReleasesFilterByNamespace(t *testing.T) {
	all := showcaseHelmReleases("")
	if len(all) == 0 {
		t.Fatal("Installed tab would be empty")
	}

	scoped := showcaseHelmReleases("monitoring")
	if len(scoped) == 0 || len(scoped) >= len(all) {
		t.Fatalf("namespace filter returned %d of %d releases", len(scoped), len(all))
	}
	for _, r := range scoped {
		if r.Namespace != "monitoring" {
			t.Errorf("%s leaked from namespace %q", r.Name, r.Namespace)
		}
	}

	if got := showcaseHelmReleases("no-such-namespace"); len(got) != 0 {
		t.Errorf("unknown namespace returned %d releases", len(got))
	}
}

func TestShowcaseWritesAreRejected(t *testing.T) {
	t.Setenv("CILIKUBE_SHOWCASE", "1")
	// Hide any helm the dev machine has, so this covers the exhibit's situation
	// rather than skipping wherever helm happens to be installed.
	t.Setenv("PATH", "")
	svc := NewHelmService(nil)

	if _, err := svc.Install("demo", HelmInstallRequest{
		Name: "x", Chart: "bitnami/nginx", Namespace: "default",
	}); !errors.Is(err, errShowcaseHelmReadOnly) {
		t.Errorf("Install error = %v, want read-only", err)
	}
	if _, err := svc.Uninstall("demo", "default", "x"); !errors.Is(err, errShowcaseHelmReadOnly) {
		t.Errorf("Uninstall error = %v, want read-only", err)
	}
	if _, err := svc.Rollback("demo", "default", "x", "1"); !errors.Is(err, errShowcaseHelmReadOnly) {
		t.Errorf("Rollback error = %v, want read-only", err)
	}
	if err := svc.AddRepo("bitnami", "https://example.com"); !errors.Is(err, errShowcaseHelmReadOnly) {
		t.Errorf("AddRepo error = %v, want read-only", err)
	}
	if err := svc.UpdateRepos(); !errors.Is(err, errShowcaseHelmReadOnly) {
		t.Errorf("UpdateRepos error = %v, want read-only", err)
	}
}
