package models

import "time"

type CreateClusterRequest struct {
	Name           string `json:"name" binding:"required"`
	KubeconfigData string `json:"kubeconfigData"`
	Server         string `json:"server"`
	Token          string `json:"token"`
	CAData         string `json:"caData"`
	Insecure       bool   `json:"insecure"`
	Provider       string `json:"provider"`
	Description    string `json:"description"`
	Environment    string `json:"environment"`
	Region         string `json:"region"`
}

type UpdateClusterRequest struct {
	Name           string            `json:"name"`
	Provider       string            `json:"provider"`
	Description    string            `json:"description"`
	// Environment is a pointer so clients can clear it with "" without touching omitted updates.
	Environment    *string           `json:"environment"`
	Region         string            `json:"region"`
	Status         string            `json:"status"`
	Labels         map[string]string `json:"labels"`
	KubeconfigData string            `json:"kubeconfigData,omitempty"`
}

type ClusterResponse struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Provider    string            `json:"provider"`
	Description string            `json:"description"`
	Environment string            `json:"environment"`
	Region      string            `json:"region"`
	Version     string            `json:"version"`
	Status      string            `json:"status"`
	Source      string            `json:"source"`
	Labels      map[string]string `json:"labels"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

type ClusterListResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Server      string `json:"server"`
	Version     string `json:"version"`
	Status      string `json:"status"`
	Source      string `json:"source"`
	Environment string `json:"environment"`
}

// FleetClusterCard is a lightweight per-cluster health rollup for the fleet page.
type FleetClusterCard struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Server         string `json:"server"`
	Version        string `json:"version"`
	Status         string `json:"status"`
	Source         string `json:"source"`
	Environment    string `json:"environment"`
	Reachable      bool   `json:"reachable"`
	Nodes          *int   `json:"nodes,omitempty"`
	NotReadyNodes  *int   `json:"not_ready_nodes,omitempty"`
	Namespaces     *int   `json:"namespaces,omitempty"`
	Pods           *int   `json:"pods,omitempty"`
	UnhealthyPods  *int   `json:"unhealthy_pods,omitempty"`
	WarningEvents  *int   `json:"warning_events,omitempty"`
	Error          string `json:"error,omitempty"`
}

// FleetSummaryResponse is returned by GET /api/v1/clusters/fleet-summary.
type FleetSummaryResponse struct {
	ActiveClusterID string             `json:"active_cluster_id"`
	Clusters        []FleetClusterCard `json:"clusters"`
}

// LocalKubeContext is a context discovered from the API host kubeconfig.
type LocalKubeContext struct {
	Name           string `json:"name"`
	Cluster        string `json:"cluster"`
	Server         string `json:"server"`
	User           string `json:"user"`
	ConflictName   bool   `json:"conflict_name"`
	ConflictServer bool   `json:"conflict_server"`
	ExistingName   string `json:"existing_name,omitempty"`
}

type LocalKubeContextsResponse struct {
	Path     string             `json:"path"`
	Contexts []LocalKubeContext `json:"contexts"`
}

type ImportLocalClustersRequest struct {
	// Contexts are kubeconfig context names to import into the DB.
	Contexts []string `json:"contexts" binding:"required,min=1"`
	// SkipConflicts skips contexts that collide on name or server (default true).
	SkipConflicts *bool `json:"skip_conflicts"`
}

type ImportLocalClustersResult struct {
	Imported []string          `json:"imported"`
	Skipped  map[string]string `json:"skipped"`
	Failed   map[string]string `json:"failed"`
}
