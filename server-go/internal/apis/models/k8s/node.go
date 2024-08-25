package k8s

import v1 "k8s.io/api/core/v1"

// NodeModel represents a simplified model of a Kubernetes Node
type NodeModel struct {
	Name        string            `json:"name"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
	Status      string            `json:"status"`
}

// NewNodeModel creates a new NodeModel from a Kubernetes Node object
func NewNodeModel(node *v1.Node) *NodeModel {
	return &NodeModel{
		Name:        node.Name,
		Labels:      node.Labels,
		Annotations: node.Annotations,
		Status:      string(node.Status.Phase),
	}
}
