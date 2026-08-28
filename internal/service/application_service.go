package service

import (
	"context"
	"fmt"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type ApplicationService struct{}

func NewApplicationService() *ApplicationService {
	return &ApplicationService{}
}

func (s *ApplicationService) List(clientset kubernetes.Interface, namespace string) ([]Application, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	dList, err := clientset.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list deployments: %w", err)
	}
	sList, err := clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list services: %w", err)
	}
	iList, err := clientset.NetworkingV1().Ingresses(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list ingresses: %w", err)
	}
	return GroupApplications(dList.Items, sList.Items, iList.Items), nil
}

func (s *ApplicationService) Get(clientset kubernetes.Interface, namespace, name string) (*Application, error) {
	apps, err := s.List(clientset, namespace)
	if err != nil {
		return nil, err
	}
	for i := range apps {
		if apps[i].Name == name && (namespace == "" || apps[i].Namespace == namespace) {
			return &apps[i], nil
		}
	}
	return nil, fmt.Errorf("application %s/%s not found", namespace, name)
}
