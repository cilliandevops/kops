package services

import (
	"context"

	"github.com/cilliandevops/kops/server-go/internal/apis/models/k8s"
	"github.com/cilliandevops/kops/server-go/internal/client"
	v1 "k8s.io/api/apps/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// DeploymentService provides methods for interacting with Kubernetes Deployments
type DeploymentService struct {
	client *client.Client
}

// NewDeploymentService creates a new DeploymentService instance
func NewDeploymentService(kubeconfig string) (*DeploymentService, error) {
	c, err := client.NewClient(kubeconfig)
	if err != nil {
		return nil, err
	}

	return &DeploymentService{client: c}, nil
}

// ListDeployments retrieves a list of Deployments in the specified namespace
func (s *DeploymentService) ListDeployments(ctx context.Context, namespace string) ([]k8s.Deployment, error) {
	deploymentList, err := s.client.Clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var deployments []k8s.Deployment
	for _, deployment := range deploymentList.Items {
		deployments = append(deployments, k8s.Deployment{
			Name:             deployment.Name,
			Namespace:        deployment.Namespace,
			Replicas:         *deployment.Spec.Replicas,
			DeploymentSpec:   deployment.Spec,
			DeploymentStatus: deployment.Status,
		})
	}
	return deployments, nil
}

// GetDeployment retrieves a single Deployment by name and namespace
func (s *DeploymentService) GetDeployment(ctx context.Context, namespace, name string) (*k8s.Deployment, error) {
	deployment, err := s.client.Clientset.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	return &k8s.Deployment{
		Name:             deployment.Name,
		Namespace:        deployment.Namespace,
		Replicas:         *deployment.Spec.Replicas,
		DeploymentSpec:   deployment.Spec,
		DeploymentStatus: deployment.Status,
	}, nil
}

// CreateDeployment creates a new Deployment
func (s *DeploymentService) CreateDeployment(ctx context.Context, deployment *k8s.Deployment) error {
	_, err := s.client.Clientset.AppsV1().Deployments(deployment.Namespace).Create(ctx, &v1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      deployment.Name,
			Namespace: deployment.Namespace,
		},
		Spec: deployment.DeploymentSpec,
	}, metav1.CreateOptions{})
	return err
}

// UpdateDeployment updates an existing Deployment
func (s *DeploymentService) UpdateDeployment(ctx context.Context, deployment *k8s.Deployment) error {
	_, err := s.client.Clientset.AppsV1().Deployments(deployment.Namespace).Update(ctx, &v1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      deployment.Name,
			Namespace: deployment.Namespace,
		},
		Spec: deployment.DeploymentSpec,
	}, metav1.UpdateOptions{})
	return err
}

// DeleteDeployment deletes a Deployment by name and namespace
func (s *DeploymentService) DeleteDeployment(ctx context.Context, namespace, name string) error {
	err := s.client.Clientset.AppsV1().Deployments(namespace).Delete(ctx, name, metav1.DeleteOptions{})
	if errors.IsNotFound(err) {
		return nil
	}
	return err
}
