package k8s

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ClusterInfo represents basic information about the Kubernetes cluster
type ClusterInfo struct {
	Version string `json:"version"`
}

// NodeInfo represents basic information about a Kubernetes node
type NodeInfo struct {
	Name        string            `json:"name"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
	CreatedAt   metav1.Time       `json:"createdAt"`
}
