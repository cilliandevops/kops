package services

import (
	"context"

	"github.com/cilliandevops/kops/server-go/internal/apis/models/k8s"
	"github.com/cilliandevops/kops/server-go/internal/client"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// ServiceService 提供对 Kubernetes Service 资源的操作
type ServiceService struct {
	client *client.Client
}

// NewServiceService 创建一个新的 ServiceService 实例
func NewServiceService(client *client.Client) *ServiceService {
	return &ServiceService{client: client}
}

// ListServices 列出指定命名空间中的所有 Services
func (s *ServiceService) ListServices(namespace string) ([]k8s.ServiceModel, error) {
	services, err := s.client.Clientset.CoreV1().Services(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var serviceModels []k8s.ServiceModel
	for _, svc := range services.Items {
		serviceModels = append(serviceModels, k8s.ServiceModel{
			Name:      svc.Name,
			Namespace: svc.Namespace,
			Labels:    svc.Labels,
			Type:      svc.Spec.Type,
			Ports:     svc.Spec.Ports,
		})
	}
	return serviceModels, nil
}

// ListAllServices 列出所有命名空间中的所有 Services
func (s *ServiceService) ListAllServices() ([]k8s.ServiceModel, error) {
	var allServices []k8s.ServiceModel

	namespaces, err := s.client.Clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	for _, ns := range namespaces.Items {
		services, err := s.ListServices(ns.Name)
		if err != nil {
			return nil, err
		}
		allServices = append(allServices, services...)
	}

	return allServices, nil
}

// GetService 获取指定命名空间中指定 Service 的详细信息
func (s *ServiceService) GetService(namespace, name string) (*k8s.ServiceModel, error) {
	svc, err := s.client.Clientset.CoreV1().Services(namespace).Get(context.TODO(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return &k8s.ServiceModel{
		Name:      svc.Name,
		Namespace: svc.Namespace,
		Labels:    svc.Labels,
		Type:      svc.Spec.Type,
		Ports:     svc.Spec.Ports,
	}, nil
}

// CreateService 创建一个新的 Service
func (s *ServiceService) CreateService(namespace string, service *v1.Service) (*k8s.ServiceModel, error) {
	svc, err := s.client.Clientset.CoreV1().Services(namespace).Create(context.TODO(), service, metav1.CreateOptions{})
	if err != nil {
		return nil, err
	}

	return &k8s.ServiceModel{
		Name:      svc.Name,
		Namespace: svc.Namespace,
		Labels:    svc.Labels,
		Type:      svc.Spec.Type,
		Ports:     svc.Spec.Ports,
	}, nil
}

// DeleteService 删除指定命名空间中的指定 Service
func (s *ServiceService) DeleteService(namespace, name string) error {
	return s.client.Clientset.CoreV1().Services(namespace).Delete(context.TODO(), name, metav1.DeleteOptions{})
}
