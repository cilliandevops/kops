package k8s

import (
	v1 "k8s.io/api/apps/v1"
)

// Deployment represents a Kubernetes Deployment
type Deployment struct {
	// Name is the name of the Deployment
	Name string `json:"name"`
	// Namespace is the namespace of the Deployment
	Namespace string `json:"namespace"`
	// Replicas is the number of desired replicas for the Deployment
	Replicas int32 `json:"replicas"`
	// DeploymentSpec contains the specification of the desired behavior of the Deployment
	DeploymentSpec v1.DeploymentSpec `json:"deploymentSpec"`
	// DeploymentStatus contains the most recently observed status of the Deployment
	DeploymentStatus v1.DeploymentStatus `json:"deploymentStatus"`
}
