package services

import (
	"context"

	networkingv1 "k8s.io/api/networking/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type IngressService struct {
	clientset *kubernetes.Clientset
}

// NewIngressService creates a new instance of IngressService
func NewIngressService(clientset *kubernetes.Clientset) *IngressService {
	return &IngressService{clientset: clientset}
}

// ListIngresses lists all ingresses in a given namespace
func (s *IngressService) ListIngresses(namespace string) ([]networkingv1.Ingress, error) {
	ingresses, err := s.clientset.NetworkingV1().Ingresses(namespace).List(context.TODO(), v1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return ingresses.Items, nil
}

// GetIngress retrieves a specific ingress by name in a given namespace
func (s *IngressService) GetIngress(namespace, name string) (*networkingv1.Ingress, error) {
	return s.clientset.NetworkingV1().Ingresses(namespace).Get(context.TODO(), name, v1.GetOptions{})
}

// CreateIngress creates a new ingress in a given namespace
func (s *IngressService) CreateIngress(namespace string, ingress *networkingv1.Ingress) (*networkingv1.Ingress, error) {
	return s.clientset.NetworkingV1().Ingresses(namespace).Create(context.TODO(), ingress, v1.CreateOptions{})
}

// DeleteIngress deletes an ingress by name in a given namespace
func (s *IngressService) DeleteIngress(namespace, name string) error {
	return s.clientset.NetworkingV1().Ingresses(namespace).Delete(context.TODO(), name, v1.DeleteOptions{})
}
