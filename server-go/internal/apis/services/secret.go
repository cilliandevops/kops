package services

import (
	"context"

	"github.com/cilliandevops/kops/server-go/internal/client"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type SecretService struct {
	K8sClient *client.Client
}

func NewSecretService(k8sClient *client.Client) *SecretService {
	return &SecretService{
		K8sClient: k8sClient,
	}
}

func (s *SecretService) CreateSecret(namespace string, secret *v1.Secret) (*v1.Secret, error) {
	return s.K8sClient.Clientset.CoreV1().Secrets(namespace).Create(context.TODO(), secret, metav1.CreateOptions{})
}

func (s *SecretService) GetSecret(namespace, name string) (*v1.Secret, error) {
	return s.K8sClient.Clientset.CoreV1().Secrets(namespace).Get(context.TODO(), name, metav1.GetOptions{})
}

func (s *SecretService) UpdateSecret(namespace string, secret *v1.Secret) (*v1.Secret, error) {
	return s.K8sClient.Clientset.CoreV1().Secrets(namespace).Update(context.TODO(), secret, metav1.UpdateOptions{})
}

func (s *SecretService) DeleteSecret(namespace, name string) error {
	return s.K8sClient.Clientset.CoreV1().Secrets(namespace).Delete(context.TODO(), name, metav1.DeleteOptions{})
}
