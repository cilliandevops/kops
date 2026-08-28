package service

import "github.com/ciliverse/cilikube/internal/store"

// AccessDecision is the second-layer cluster/namespace gate (on top of Casbin roles).
// Unrestricted = admin, or a user with no grants (backward compatible).
type AccessDecision struct {
	Unrestricted bool
	Grants       []store.AccessGrant
}

func (d AccessDecision) AllowsCluster(clusterID string) bool {
	if d.Unrestricted || clusterID == "" {
		return true
	}
	for _, g := range d.Grants {
		if g.ClusterID == clusterID {
			return true
		}
	}
	return false
}

func (d AccessDecision) AllowsNamespace(clusterID, namespace string) bool {
	if d.Unrestricted {
		return true
	}
	if !d.AllowsCluster(clusterID) {
		return false
	}
	if namespace == "" {
		return true
	}
	for _, g := range d.Grants {
		if g.ClusterID != clusterID {
			continue
		}
		if g.Namespace == "" || g.Namespace == namespace {
			return true
		}
	}
	return false
}

func (d AccessDecision) FilterNamespaces(clusterID string, namespaces []string) []string {
	if d.Unrestricted {
		return namespaces
	}
	out := make([]string, 0, len(namespaces))
	for _, ns := range namespaces {
		if d.AllowsNamespace(clusterID, ns) {
			out = append(out, ns)
		}
	}
	return out
}

func (d AccessDecision) FilterClusterIDs(ids []string) []string {
	if d.Unrestricted {
		return ids
	}
	out := make([]string, 0, len(ids))
	for _, id := range ids {
		if d.AllowsCluster(id) {
			out = append(out, id)
		}
	}
	return out
}
