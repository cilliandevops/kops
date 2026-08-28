package service

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/ciliverse/cilikube/pkg/k8s"
	"gopkg.in/yaml.v3"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

// catalogTTL bounds how long a `helm search repo` snapshot is reused. The full
// catalog is one subprocess call (~5s) but only tens of KB, so it is cached
// whole and filtered client-side rather than re-shelled per keystroke.
const catalogTTL = 10 * time.Minute

// maxChartVersions caps the version list returned for one chart; popular charts
// carry hundreds of revisions and the picker only needs recent ones.
const maxChartVersions = 60

var (
	repoNamePattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._-]{0,62}$`)
	chartRefPattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._-]*/[A-Za-z0-9][A-Za-z0-9._-]*$`)
	chartVerPattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9.+_-]*$`)
)

// HelmService wraps the helm CLI for release management.
type HelmService struct {
	clusterManager *k8s.ClusterManager

	catalogMu sync.Mutex
	catalog   []HelmChartSummary
	catalogAt time.Time
}

func NewHelmService(cm *k8s.ClusterManager) *HelmService {
	return &HelmService{clusterManager: cm}
}

type HelmRelease struct {
	Name       string `json:"name"`
	Namespace  string `json:"namespace"`
	Revision   string `json:"revision"`
	Updated    string `json:"updated"`
	Status     string `json:"status"`
	Chart      string `json:"chart"`
	AppVersion string `json:"app_version"`
}

type HelmInstallRequest struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Chart     string `json:"chart"`
	Repo      string `json:"repo,omitempty"`
	Version   string `json:"version,omitempty"`
	Values    string `json:"values,omitempty"`
	CreateNS  bool   `json:"createNamespace,omitempty"`
}

type HelmUpgradeRequest struct {
	Chart   string `json:"chart"`
	Repo    string `json:"repo,omitempty"`
	Version string `json:"version,omitempty"`
	Values  string `json:"values,omitempty"`
}

type HelmRepo struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

type HelmRepoRequest struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

// HelmChartSummary is one catalog card: the newest version of a chart in a repo.
type HelmChartSummary struct {
	Ref         string `json:"ref"`
	Repo        string `json:"repo"`
	Name        string `json:"name"`
	Version     string `json:"version"`
	AppVersion  string `json:"appVersion,omitempty"`
	Description string `json:"description,omitempty"`
}

type HelmChartDetail struct {
	Ref         string   `json:"ref"`
	Repo        string   `json:"repo"`
	Name        string   `json:"name"`
	Version     string   `json:"version"`
	AppVersion  string   `json:"appVersion,omitempty"`
	Description string   `json:"description,omitempty"`
	Icon        string   `json:"icon,omitempty"`
	Home        string   `json:"home,omitempty"`
	Deprecated  bool     `json:"deprecated,omitempty"`
	Keywords    []string `json:"keywords,omitempty"`
	Sources     []string `json:"sources,omitempty"`
	Readme      string   `json:"readme,omitempty"`
	Values      string   `json:"values,omitempty"`
	Versions    []string `json:"versions,omitempty"`
}

func (s *HelmService) withKubeconfig(clusterID string, fn func(kubeconfigPath string) error) error {
	client, err := s.clientFor(clusterID)
	if err != nil {
		return err
	}
	cfg := client.Config
	apiCfg := clientcmdapi.NewConfig()
	clusterName := "cilikube"
	contextName := "cilikube"
	apiCfg.Clusters[clusterName] = &clientcmdapi.Cluster{
		Server:                   cfg.Host,
		CertificateAuthorityData: cfg.CAData,
		InsecureSkipTLSVerify:    cfg.Insecure,
	}
	authName := "cilikube-user"
	apiCfg.AuthInfos[authName] = &clientcmdapi.AuthInfo{
		Token:                 cfg.BearerToken,
		ClientCertificateData: cfg.CertData,
		ClientKeyData:         cfg.KeyData,
		Username:              cfg.Username,
		Password:              cfg.Password,
	}
	apiCfg.Contexts[contextName] = &clientcmdapi.Context{
		Cluster:  clusterName,
		AuthInfo: authName,
	}
	apiCfg.CurrentContext = contextName

	tmp, err := os.CreateTemp("", "cilikube-helm-*.kubeconfig")
	if err != nil {
		return err
	}
	path := tmp.Name()
	_ = tmp.Close()
	defer os.Remove(path)

	if err := clientcmd.WriteToFile(*apiCfg, path); err != nil {
		return err
	}
	return fn(path)
}

func (s *HelmService) clientFor(clusterID string) (*k8s.Client, error) {
	if clusterID != "" {
		return s.clusterManager.GetClientByID(clusterID)
	}
	return s.clusterManager.GetActiveClient()
}

func (s *HelmService) runHelm(kubeconfig string, args ...string) ([]byte, error) {
	if _, err := exec.LookPath("helm"); err != nil {
		return nil, fmt.Errorf("helm CLI not found on API host: %w", err)
	}
	full := append([]string{"--kubeconfig", kubeconfig}, args...)
	cmd := exec.Command("helm", full...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return out, fmt.Errorf("helm %s: %v: %s", strings.Join(args, " "), err, strings.TrimSpace(string(out)))
	}
	return out, nil
}

func (s *HelmService) ListReleases(clusterID, namespace string) ([]HelmRelease, error) {
	if showcaseHelmActive() {
		return showcaseHelmReleases(namespace), nil
	}
	var releases []HelmRelease
	err := s.withKubeconfig(clusterID, func(kc string) error {
		args := []string{"list", "-o", "json"}
		if namespace != "" {
			args = append(args, "-n", namespace)
		} else {
			args = append(args, "-A")
		}
		out, err := s.runHelm(kc, args...)
		if err != nil {
			return err
		}
		if strings.TrimSpace(string(out)) == "" || string(out) == "null" {
			releases = []HelmRelease{}
			return nil
		}
		return json.Unmarshal(out, &releases)
	})
	return releases, err
}

func (s *HelmService) GetRelease(clusterID, namespace, name string) (map[string]any, error) {
	var result map[string]any
	err := s.withKubeconfig(clusterID, func(kc string) error {
		out, err := s.runHelm(kc, "get", "all", name, "-n", namespace, "-o", "json")
		if err != nil {
			// fallback: status
			out, err = s.runHelm(kc, "status", name, "-n", namespace, "-o", "json")
			if err != nil {
				return err
			}
		}
		return json.Unmarshal(out, &result)
	})
	return result, err
}

func (s *HelmService) Install(clusterID string, req HelmInstallRequest) (string, error) {
	if req.Name == "" || req.Chart == "" || req.Namespace == "" {
		return "", fmt.Errorf("name, chart, and namespace are required")
	}
	if showcaseHelmActive() {
		return "", errShowcaseHelmReadOnly
	}
	var output string
	err := s.withKubeconfig(clusterID, func(kc string) error {
		if req.Repo != "" {
			repoName := "cilikube-" + strings.ReplaceAll(req.Name, "/", "-")
			if _, err := s.runHelm(kc, "repo", "add", repoName, req.Repo); err != nil {
				// ignore if already exists
				if !strings.Contains(err.Error(), "already exists") {
					return err
				}
			}
			_, _ = s.runHelm(kc, "repo", "update")
		}
		args := []string{"install", req.Name, req.Chart, "-n", req.Namespace}
		if req.CreateNS {
			args = append(args, "--create-namespace")
		}
		if req.Version != "" {
			args = append(args, "--version", req.Version)
		}
		var valuesFile string
		if req.Values != "" {
			f, err := os.CreateTemp("", "cilikube-values-*.yaml")
			if err != nil {
				return err
			}
			valuesFile = f.Name()
			if _, err := f.WriteString(req.Values); err != nil {
				f.Close()
				os.Remove(valuesFile)
				return err
			}
			f.Close()
			defer os.Remove(valuesFile)
			args = append(args, "-f", valuesFile)
		}
		out, err := s.runHelm(kc, args...)
		output = string(out)
		return err
	})
	return output, err
}

func (s *HelmService) Upgrade(clusterID, namespace, name string, req HelmUpgradeRequest) (string, error) {
	if req.Chart == "" {
		return "", fmt.Errorf("chart is required")
	}
	if showcaseHelmActive() {
		return "", errShowcaseHelmReadOnly
	}
	var output string
	err := s.withKubeconfig(clusterID, func(kc string) error {
		args := []string{"upgrade", name, req.Chart, "-n", namespace}
		if req.Version != "" {
			args = append(args, "--version", req.Version)
		}
		if req.Values != "" {
			f, err := os.CreateTemp("", "cilikube-values-*.yaml")
			if err != nil {
				return err
			}
			path := f.Name()
			if _, err := f.WriteString(req.Values); err != nil {
				f.Close()
				os.Remove(path)
				return err
			}
			f.Close()
			defer os.Remove(path)
			args = append(args, "-f", path)
		}
		out, err := s.runHelm(kc, args...)
		output = string(out)
		return err
	})
	return output, err
}

func (s *HelmService) Rollback(clusterID, namespace, name, revision string) (string, error) {
	if showcaseHelmActive() {
		return "", errShowcaseHelmReadOnly
	}
	var output string
	err := s.withKubeconfig(clusterID, func(kc string) error {
		args := []string{"rollback", name, "-n", namespace}
		if revision != "" {
			args = append(args, revision)
		}
		out, err := s.runHelm(kc, args...)
		output = string(out)
		return err
	})
	return output, err
}

func (s *HelmService) Uninstall(clusterID, namespace, name string) (string, error) {
	if showcaseHelmActive() {
		return "", errShowcaseHelmReadOnly
	}
	var output string
	err := s.withKubeconfig(clusterID, func(kc string) error {
		out, err := s.runHelm(kc, "uninstall", name, "-n", namespace)
		output = string(out)
		return err
	})
	return output, err
}

// runHelmHost runs helm without a kubeconfig. Repository and chart metadata live
// in the API host's helm config, so browsing the catalog needs no cluster and
// works before any cluster is connected.
func (s *HelmService) runHelmHost(args ...string) ([]byte, error) {
	if _, err := exec.LookPath("helm"); err != nil {
		return nil, fmt.Errorf("helm CLI not found on API host: %w", err)
	}
	out, err := exec.Command("helm", args...).CombinedOutput()
	if err != nil {
		return out, fmt.Errorf("helm %s: %v: %s", strings.Join(args, " "), err, strings.TrimSpace(string(out)))
	}
	return out, nil
}

func validateRepoName(name string) error {
	if !repoNamePattern.MatchString(name) {
		return fmt.Errorf("invalid repository name %q", name)
	}
	return nil
}

func validateChartRef(ref string) error {
	if !chartRefPattern.MatchString(ref) {
		return fmt.Errorf("invalid chart reference %q, expected <repo>/<chart>", ref)
	}
	return nil
}

func validateChartVersion(version string) error {
	if version == "" {
		return nil
	}
	if !chartVerPattern.MatchString(version) {
		return fmt.Errorf("invalid chart version %q", version)
	}
	return nil
}

func (s *HelmService) ListRepos() ([]HelmRepo, error) {
	if showcaseHelmActive() {
		return showcaseHelmRepos(), nil
	}
	out, err := s.runHelmHost("repo", "list", "-o", "json")
	if err != nil {
		// helm exits non-zero when no repositories are configured.
		if strings.Contains(string(out), "no repositories") {
			return []HelmRepo{}, nil
		}
		return nil, err
	}
	var repos []HelmRepo
	if strings.TrimSpace(string(out)) == "" || string(out) == "null" {
		return []HelmRepo{}, nil
	}
	if err := json.Unmarshal(out, &repos); err != nil {
		return nil, err
	}
	return repos, nil
}

func (s *HelmService) AddRepo(name, url string) error {
	if err := validateRepoName(name); err != nil {
		return err
	}
	if showcaseHelmActive() {
		return errShowcaseHelmReadOnly
	}
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		return fmt.Errorf("repository URL must start with http:// or https://")
	}
	if _, err := s.runHelmHost("repo", "add", name, url, "--force-update"); err != nil {
		return err
	}
	if _, err := s.runHelmHost("repo", "update", name); err != nil {
		return err
	}
	s.invalidateCatalog()
	return nil
}

func (s *HelmService) RemoveRepo(name string) error {
	if err := validateRepoName(name); err != nil {
		return err
	}
	if showcaseHelmActive() {
		return errShowcaseHelmReadOnly
	}
	if _, err := s.runHelmHost("repo", "remove", name); err != nil {
		return err
	}
	s.invalidateCatalog()
	return nil
}

func (s *HelmService) UpdateRepos() error {
	if showcaseHelmActive() {
		return errShowcaseHelmReadOnly
	}
	if _, err := s.runHelmHost("repo", "update"); err != nil {
		return err
	}
	s.invalidateCatalog()
	return nil
}

func (s *HelmService) invalidateCatalog() {
	s.catalogMu.Lock()
	s.catalog = nil
	s.catalogAt = time.Time{}
	s.catalogMu.Unlock()
}

type helmSearchHit struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	AppVersion  string `json:"app_version"`
	Description string `json:"description"`
}

// Catalog returns every chart across configured repositories, newest version per
// chart. The payload is small enough to cache whole and filter in the browser.
func (s *HelmService) Catalog(refresh bool) ([]HelmChartSummary, error) {
	if showcaseHelmActive() {
		return showcaseHelmCatalog(), nil
	}

	s.catalogMu.Lock()
	defer s.catalogMu.Unlock()

	if !refresh && s.catalog != nil && time.Since(s.catalogAt) < catalogTTL {
		return s.catalog, nil
	}

	out, err := s.runHelmHost("search", "repo", "-o", "json")
	if err != nil {
		// No repositories configured, or none matched: an empty catalog is a
		// valid state for the marketplace, not an error.
		if strings.Contains(string(out), "no repositories") || strings.Contains(string(out), "No results found") {
			s.catalog = []HelmChartSummary{}
			s.catalogAt = time.Now()
			return s.catalog, nil
		}
		return nil, err
	}

	var hits []helmSearchHit
	trimmed := strings.TrimSpace(string(out))
	if trimmed != "" && trimmed != "null" {
		if err := json.Unmarshal(out, &hits); err != nil {
			return nil, err
		}
	}

	charts := make([]HelmChartSummary, 0, len(hits))
	for _, h := range hits {
		repo, name, ok := strings.Cut(h.Name, "/")
		if !ok {
			continue
		}
		charts = append(charts, HelmChartSummary{
			Ref:         h.Name,
			Repo:        repo,
			Name:        name,
			Version:     h.Version,
			AppVersion:  h.AppVersion,
			Description: h.Description,
		})
	}
	sort.Slice(charts, func(i, j int) bool {
		if charts[i].Name != charts[j].Name {
			return charts[i].Name < charts[j].Name
		}
		return charts[i].Repo < charts[j].Repo
	})

	s.catalog = charts
	s.catalogAt = time.Now()
	return charts, nil
}

type chartMetadata struct {
	Name        string   `yaml:"name"`
	Version     string   `yaml:"version"`
	AppVersion  string   `yaml:"appVersion"`
	Description string   `yaml:"description"`
	Icon        string   `yaml:"icon"`
	Home        string   `yaml:"home"`
	Deprecated  bool     `yaml:"deprecated"`
	Keywords    []string `yaml:"keywords"`
	Sources     []string `yaml:"sources"`
}

// ChartDetail resolves one chart's metadata, README, values and version list.
// The three `helm show` calls are independent, so they run concurrently.
func (s *HelmService) ChartDetail(ref, version string) (*HelmChartDetail, error) {
	if err := validateChartRef(ref); err != nil {
		return nil, err
	}
	if err := validateChartVersion(version); err != nil {
		return nil, err
	}
	if showcaseHelmActive() {
		return showcaseHelmChartDetail(ref, version)
	}

	versionArgs := func(base ...string) []string {
		if version != "" {
			return append(base, "--version", version)
		}
		return base
	}

	var (
		wg                             sync.WaitGroup
		chartOut, readmeOut, valuesOut []byte
		chartErr                       error
	)
	wg.Add(3)
	go func() {
		defer wg.Done()
		chartOut, chartErr = s.runHelmHost(versionArgs("show", "chart", ref)...)
	}()
	go func() {
		defer wg.Done()
		// README and values are optional; a chart without them is not an error.
		readmeOut, _ = s.runHelmHost(versionArgs("show", "readme", ref)...)
	}()
	go func() {
		defer wg.Done()
		valuesOut, _ = s.runHelmHost(versionArgs("show", "values", ref)...)
	}()
	wg.Wait()

	if chartErr != nil {
		return nil, chartErr
	}

	var meta chartMetadata
	if err := yaml.Unmarshal(chartOut, &meta); err != nil {
		return nil, fmt.Errorf("parse chart metadata: %w", err)
	}

	repo, name, _ := strings.Cut(ref, "/")
	if meta.Name != "" {
		name = meta.Name
	}

	detail := &HelmChartDetail{
		Ref:         ref,
		Repo:        repo,
		Name:        name,
		Version:     meta.Version,
		AppVersion:  meta.AppVersion,
		Description: meta.Description,
		Icon:        meta.Icon,
		Home:        meta.Home,
		Deprecated:  meta.Deprecated,
		Keywords:    meta.Keywords,
		Sources:     meta.Sources,
		Readme:      string(readmeOut),
		Values:      string(valuesOut),
		Versions:    s.chartVersions(ref),
	}
	return detail, nil
}

func (s *HelmService) chartVersions(ref string) []string {
	out, err := s.runHelmHost("search", "repo", ref, "--versions", "-o", "json")
	if err != nil {
		return nil
	}
	var hits []helmSearchHit
	if err := json.Unmarshal(out, &hits); err != nil {
		return nil
	}
	versions := make([]string, 0, len(hits))
	for _, h := range hits {
		// `helm search repo` matches substrings; keep only the exact chart.
		if h.Name != ref {
			continue
		}
		versions = append(versions, h.Version)
		if len(versions) >= maxChartVersions {
			break
		}
	}
	return versions
}
