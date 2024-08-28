package k8s

import (
	v1 "k8s.io/api/core/v1"
)

// NodeModel represents a Kubernetes node with additional details
type NodeModel struct {
	Name             string            `json:"name"`
	Version          string            `json:"version"`
	OS               string            `json:"os"`
	Arch             string            `json:"arch"`
	KernelVersion    string            `json:"kernelVersion"`
	ContainerRuntime string            `json:"containerRuntime"`
	CreationTime     string            `json:"creationTime"`
	Labels           map[string]string `json:"labels"`
	Annotations      map[string]string `json:"annotations"`
	Status           string            `json:"status"`
	CPUUsage         string            `json:"cpuUsage"`
	MemoryUsage      string            `json:"memoryUsage"`
	PodCount         int               `json:"podCount"`
	IPAddresses      []string          `json:"ipAddresses"`
}

// NewNodeModel creates a new NodeModel from a Kubernetes Node
func NewNodeModel(node *v1.Node) *NodeModel {
	// Convert creationTimestamp to string
	creationTime := node.CreationTimestamp.Format("2006-01-02 15:04:05")

	// Extract node version (Kubernetes version)
	version := node.Status.NodeInfo.KubeletVersion

	// Extract operating system and architecture
	os := node.Status.NodeInfo.OSImage
	arch := node.Status.NodeInfo.Architecture

	// Extract kernel version
	kernelVersion := node.Status.NodeInfo.KernelVersion

	// Extract container runtime
	containerRuntime := node.Status.NodeInfo.ContainerRuntimeVersion

	// Extract status from node conditions
	status := "Unknown"
	for _, condition := range node.Status.Conditions {
		if condition.Type == v1.NodeReady {
			status = string(condition.Status)
			break
		}
	}

	// Extract CPU and memory usage (mock values, should be replaced with actual metrics if available)
	cpuUsage := "N/A"
	memoryUsage := "N/A"

	// Extract pod count
	podCount := 0
	// To get the actual pod count, you would need to query the Pods API:
	// podList, err := s.client.Clientset.CoreV1().Pods(v1.NamespaceAll).List(context.Background(), metav1.ListOptions{
	// 	LabelSelector: "nodeName=" + node.Name,
	// })
	// if err == nil {
	// 	podCount = len(podList.Items)
	// }

	// Extract IP addresses
	ipAddresses := []string{}
	for _, address := range node.Status.Addresses {
		ipAddresses = append(ipAddresses, address.Address)
	}

	// Create and return NodeModel
	return &NodeModel{
		Name:             node.Name,
		Version:          version,
		OS:               os,
		Arch:             arch,
		KernelVersion:    kernelVersion,
		ContainerRuntime: containerRuntime,
		CreationTime:     creationTime,
		Labels:           node.Labels,
		Annotations:      node.Annotations,
		Status:           status,
		CPUUsage:         cpuUsage,
		MemoryUsage:      memoryUsage,
		PodCount:         podCount,
		IPAddresses:      ipAddresses,
	}
}
