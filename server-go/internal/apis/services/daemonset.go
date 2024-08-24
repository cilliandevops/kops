package services

import (
	"context"

	"github.com/cilliandevops/kops/server-go/internal/apis/models/k8s"
	"github.com/cilliandevops/kops/server-go/internal/client"
	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// DaemonSetService 提供对 Kubernetes DaemonSet 资源的操作
type DaemonSetService struct {
	client *client.Client
}

// NewDaemonSetService 创建一个新的 DaemonSetService 实例
func NewDaemonSetService(client *client.Client) *DaemonSetService {
	return &DaemonSetService{client: client}
}

// ListDaemonSets 列出指定命名空间中的所有 DaemonSets
func (s *DaemonSetService) ListDaemonSets(namespace string) ([]k8s.DaemonSetModel, error) {
	daemonsets, err := s.client.Clientset.AppsV1().DaemonSets(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var daemonSetModels []k8s.DaemonSetModel
	for _, ds := range daemonsets.Items {
		daemonSetModels = append(daemonSetModels, k8s.DaemonSetModel{
			Name:      ds.Name,
			Namespace: ds.Namespace,
			Labels:    ds.Labels,
			Selector:  ds.Spec.Selector,
			Template:  ds.Spec.Template,
		})
	}
	return daemonSetModels, nil
}

// GetDaemonSet 获取指定命名空间中指定 DaemonSet 的详细信息
func (s *DaemonSetService) GetDaemonSet(namespace, name string) (*k8s.DaemonSetModel, error) {
	ds, err := s.client.Clientset.AppsV1().DaemonSets(namespace).Get(context.TODO(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return &k8s.DaemonSetModel{
		Name:      ds.Name,
		Namespace: ds.Namespace,
		Labels:    ds.Labels,
		Selector:  ds.Spec.Selector,
		Template:  ds.Spec.Template,
	}, nil
}

// CreateDaemonSet 创建一个新的 DaemonSet
func (s *DaemonSetService) CreateDaemonSet(namespace string, daemonSet *appsv1.DaemonSet) (*k8s.DaemonSetModel, error) {
	ds, err := s.client.Clientset.AppsV1().DaemonSets(namespace).Create(context.TODO(), daemonSet, metav1.CreateOptions{})
	if err != nil {
		return nil, err
	}

	return &k8s.DaemonSetModel{
		Name:      ds.Name,
		Namespace: ds.Namespace,
		Labels:    ds.Labels,
		Selector:  ds.Spec.Selector,
		Template:  ds.Spec.Template,
	}, nil
}

// UpdateDaemonSet 更新指定的 DaemonSet
func (s *DaemonSetService) UpdateDaemonSet(namespace string, daemonSet *appsv1.DaemonSet) (*k8s.DaemonSetModel, error) {
	ds, err := s.client.Clientset.AppsV1().DaemonSets(namespace).Update(context.TODO(), daemonSet, metav1.UpdateOptions{})
	if err != nil {
		return nil, err
	}

	return &k8s.DaemonSetModel{
		Name:      ds.Name,
		Namespace: ds.Namespace,
		Labels:    ds.Labels,
		Selector:  ds.Spec.Selector,
		Template:  ds.Spec.Template,
	}, nil
}

// DeleteDaemonSet 删除指定命名空间中的指定 DaemonSet
func (s *DaemonSetService) DeleteDaemonSet(namespace, name string) error {
	return s.client.Clientset.AppsV1().DaemonSets(namespace).Delete(context.TODO(), name, metav1.DeleteOptions{})
}
