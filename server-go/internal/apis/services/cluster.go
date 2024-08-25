package services

import (
	"context"

	"github.com/cilliandevops/kops/server-go/internal/apis/models/k8s"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type ClusterService struct {
	clientset *kubernetes.Clientset
}

func NewClusterService(clientset *kubernetes.Clientset) *ClusterService {
	return &ClusterService{
		clientset: clientset,
	}
}

// GetClusterInfo retrieves general information about the Kubernetes cluster
func (s *ClusterService) GetClusterInfo() (*k8s.ClusterInfo, error) {
	version, err := s.clientset.Discovery().ServerVersion()
	if err != nil {
		return nil, err
	}

	return &k8s.ClusterInfo{
		Version: version.String(),
	}, nil
}

// ListNodes lists all nodes in the cluster
func (s *ClusterService) ListNodes() ([]k8s.NodeInfo, error) {
	nodes, err := s.clientset.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var nodeInfos []k8s.NodeInfo
	for _, node := range nodes.Items {
		nodeInfos = append(nodeInfos, k8s.NodeInfo{
			Name:        node.Name,
			Labels:      node.Labels,
			Annotations: node.Annotations,
			CreatedAt:   node.CreationTimestamp,
		})
	}

	return nodeInfos, nil
}

// GetNode retrieves detailed information of a specific node
func (s *ClusterService) GetNode(nodeName string) (*k8s.NodeInfo, error) {
	node, err := s.clientset.CoreV1().Nodes().Get(context.TODO(), nodeName, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return &k8s.NodeInfo{
		Name:        node.Name,
		Labels:      node.Labels,
		Annotations: node.Annotations,
		CreatedAt:   node.CreationTimestamp,
	}, nil
}

// DeleteNode deletes a node from the cluster
func (s *ClusterService) DeleteNode(nodeName string) error {
	return s.clientset.CoreV1().Nodes().Delete(context.TODO(), nodeName, metav1.DeleteOptions{})
}
