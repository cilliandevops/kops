package services

import (
	"context"

	"github.com/cilliandevops/kops/server-go/internal/client"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ConfigMapService struct {
	K8sClient *client.Client
}

func NewConfigMapService(k8sClient *client.Client) *ConfigMapService {
	return &ConfigMapService{
		K8sClient: k8sClient,
	}
}

func (s *ConfigMapService) CreateConfigMap(namespace string, configMap *v1.ConfigMap) (*v1.ConfigMap, error) {
	return s.K8sClient.Clientset.CoreV1().ConfigMaps(namespace).Create(context.TODO(), configMap, metav1.CreateOptions{})
}

func (s *ConfigMapService) GetConfigMap(namespace, name string) (*v1.ConfigMap, error) {
	return s.K8sClient.Clientset.CoreV1().ConfigMaps(namespace).Get(context.TODO(), name, metav1.GetOptions{})
}

func (s *ConfigMapService) UpdateConfigMap(namespace string, configMap *v1.ConfigMap) (*v1.ConfigMap, error) {
	return s.K8sClient.Clientset.CoreV1().ConfigMaps(namespace).Update(context.TODO(), configMap, metav1.UpdateOptions{})
}

func (s *ConfigMapService) DeleteConfigMap(namespace, name string) error {
	return s.K8sClient.Clientset.CoreV1().ConfigMaps(namespace).Delete(context.TODO(), name, metav1.DeleteOptions{})
}
