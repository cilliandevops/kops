package service

import (
	"errors"
	"fmt"
	"os/exec"
	"sort"
	"strings"
	"time"

	"github.com/ciliverse/cilikube/pkg/k8s"
)

// The public exhibit runs against a simulated cluster and has no helm binary,
// so the marketplace would otherwise greet every visitor with "helm CLI not
// found". These canned answers give it something to browse.
//
// A real helm on PATH still wins: installing the binary on the exhibit host
// turns the marketplace live without touching this file.
func showcaseHelmActive() bool {
	if !k8s.IsShowcase() {
		return false
	}
	_, err := exec.LookPath("helm")
	return err != nil
}

// errShowcaseHelmReadOnly answers every write. The simulated cluster has no
// apiserver to install into, and saying so beats a confusing exec failure.
var errShowcaseHelmReadOnly = errors.New(
	"this is the public demo: Helm releases and repositories are read-only on the simulated cluster",
)

func showcaseHelmRepos() []HelmRepo {
	return []HelmRepo{
		{Name: "bitnami", URL: "https://charts.bitnami.com/bitnami"},
		{Name: "prometheus-community", URL: "https://prometheus-community.github.io/helm-charts"},
		{Name: "ingress-nginx", URL: "https://kubernetes.github.io/ingress-nginx"},
	}
}

func showcaseHelmCatalog() []HelmChartSummary {
	charts := []HelmChartSummary{
		{Repo: "bitnami", Name: "postgresql", Version: "15.5.20", AppVersion: "16.4.0",
			Description: "PostgreSQL is an object-relational database system with over 30 years of active development."},
		{Repo: "bitnami", Name: "redis", Version: "20.1.7", AppVersion: "7.4.1",
			Description: "Redis is an open source, advanced key-value store."},
		{Repo: "bitnami", Name: "nginx", Version: "18.2.4", AppVersion: "1.27.2",
			Description: "NGINX Open Source is a web server that can be also used as a reverse proxy."},
		{Repo: "bitnami", Name: "kafka", Version: "30.1.8", AppVersion: "3.8.0",
			Description: "Apache Kafka is a distributed streaming platform."},
		{Repo: "bitnami", Name: "mysql", Version: "11.1.17", AppVersion: "8.4.2",
			Description: "MySQL is a fast, reliable, scalable, and easy to use open source relational database."},
		{Repo: "prometheus-community", Name: "kube-prometheus-stack", Version: "65.1.1", AppVersion: "v0.77.1",
			Description: "kube-prometheus-stack collects Kubernetes manifests, Grafana dashboards, and Prometheus rules."},
		{Repo: "prometheus-community", Name: "prometheus", Version: "25.27.0", AppVersion: "v2.54.1",
			Description: "Prometheus is a monitoring system and time series database."},
		{Repo: "prometheus-community", Name: "prometheus-node-exporter", Version: "4.42.0", AppVersion: "1.8.2",
			Description: "A Prometheus exporter for hardware and OS metrics exposed by *NIX kernels."},
		{Repo: "prometheus-community", Name: "alertmanager", Version: "1.13.0", AppVersion: "v0.27.0",
			Description: "The Alertmanager handles alerts sent by client applications such as Prometheus."},
		{Repo: "ingress-nginx", Name: "ingress-nginx", Version: "4.11.3", AppVersion: "1.11.3",
			Description: "Ingress controller for Kubernetes using NGINX as a reverse proxy and load balancer."},
	}
	for i := range charts {
		charts[i].Ref = charts[i].Repo + "/" + charts[i].Name
	}
	sort.Slice(charts, func(i, j int) bool {
		if charts[i].Name != charts[j].Name {
			return charts[i].Name < charts[j].Name
		}
		return charts[i].Repo < charts[j].Repo
	})
	return charts
}

func showcaseHelmChartDetail(ref, version string) (*HelmChartDetail, error) {
	var found *HelmChartSummary
	for _, c := range showcaseHelmCatalog() {
		if c.Ref == ref {
			hit := c
			found = &hit
			break
		}
	}
	if found == nil {
		return nil, fmt.Errorf("chart %q not found in the demo catalog", ref)
	}

	shown := found.Version
	if version != "" {
		shown = version
	}
	return &HelmChartDetail{
		Ref:         found.Ref,
		Repo:        found.Repo,
		Name:        found.Name,
		Version:     shown,
		AppVersion:  found.AppVersion,
		Description: found.Description,
		Home:        "https://artifacthub.io/packages/helm/" + found.Repo + "/" + found.Name,
		Keywords:    []string{found.Repo, found.Name},
		Sources:     []string{"https://github.com/" + found.Repo},
		Readme:      showcaseChartReadme(found),
		Values:      showcaseChartValues(found),
		Versions:    showcaseChartVersions(found.Version),
	}, nil
}

func showcaseChartReadme(c *HelmChartSummary) string {
	var b strings.Builder
	fmt.Fprintf(&b, "# %s\n\n%s\n\n", c.Name, c.Description)
	b.WriteString("> Public demo. This catalog is served from CiliKube's built-in sample data,\n")
	b.WriteString("> not from a live Helm repository, and the cluster behind it is simulated.\n")
	b.WriteString("> Installing is disabled here — run CiliKube against a real cluster to use it.\n\n")
	fmt.Fprintf(&b, "## Installing the chart\n\n```bash\nhelm repo add %s %s\nhelm install my-%s %s --version %s\n```\n\n",
		c.Repo, showcaseRepoURL(c.Repo), c.Name, c.Ref, c.Version)
	b.WriteString("## Uninstalling the chart\n\n```bash\nhelm uninstall my-" + c.Name + "\n```\n\n")
	b.WriteString("## Parameters\n\nSee the Values tab for the chart defaults.\n")
	return b.String()
}

func showcaseRepoURL(repo string) string {
	for _, r := range showcaseHelmRepos() {
		if r.Name == repo {
			return r.URL
		}
	}
	return ""
}

func showcaseChartValues(c *HelmChartSummary) string {
	return fmt.Sprintf(`## @section Common parameters
##
nameOverride: ""
fullnameOverride: ""

image:
  repository: %s/%s
  tag: %s
  pullPolicy: IfNotPresent

replicaCount: 1

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

serviceAccount:
  create: true
  name: ""

persistence:
  enabled: false
  size: 8Gi

## Demo values. The real chart ships a much longer file.
`, c.Repo, c.Name, c.AppVersion)
}

// showcaseChartVersions fakes a short release history ending at the current
// patch, which is enough for the version picker to have something to show.
func showcaseChartVersions(current string) []string {
	versions := []string{current}
	parts := strings.Split(current, ".")
	if len(parts) != 3 {
		return versions
	}
	var major, minor, patch int
	if _, err := fmt.Sscanf(current, "%d.%d.%d", &major, &minor, &patch); err != nil {
		return versions
	}
	for i := 1; i <= 3 && patch-i >= 0; i++ {
		versions = append(versions, fmt.Sprintf("%d.%d.%d", major, minor, patch-i))
	}
	return versions
}

// showcaseHelmReleases mirrors the workloads in the simulated cluster, so the
// Installed tab lines up with what Pods and Deployments already show.
func showcaseHelmReleases(namespace string) []HelmRelease {
	now := time.Now()
	stamp := func(d time.Duration) string {
		return now.Add(-d).Format("2006-01-02 15:04:05.000000000 -0700 MST")
	}
	all := []HelmRelease{
		// default is the namespace the Installed tab opens on, so it needs an
		// entry or the demo's first impression is an empty table.
		{
			Name: "web-frontend", Namespace: "default", Revision: "7",
			Updated: stamp(5 * time.Hour), Status: "deployed",
			Chart: "nginx-18.2.4", AppVersion: "1.27.2",
		},
		{
			Name: "kube-prometheus-stack", Namespace: "monitoring", Revision: "3",
			Updated: stamp(72 * time.Hour), Status: "deployed",
			Chart: "kube-prometheus-stack-65.1.1", AppVersion: "v0.77.1",
		},
		{
			Name: "postgresql", Namespace: "production", Revision: "1",
			Updated: stamp(21 * 24 * time.Hour), Status: "deployed",
			Chart: "postgresql-15.5.20", AppVersion: "16.4.0",
		},
		{
			Name: "ingress-nginx", Namespace: "kube-system", Revision: "2",
			Updated: stamp(9 * 24 * time.Hour), Status: "deployed",
			Chart: "ingress-nginx-4.11.3", AppVersion: "1.11.3",
		},
	}
	if namespace == "" {
		return all
	}
	scoped := make([]HelmRelease, 0, len(all))
	for _, r := range all {
		if r.Namespace == namespace {
			scoped = append(scoped, r)
		}
	}
	return scoped
}
