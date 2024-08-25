package services

import (
	"context"

	"github.com/cilliandevops/kops/server-go/internal/client"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type PVCService struct {
	K8sClient *client.Client
}

func NewPVCService(k8sClient *client.Client) *PVCService {
	return &PVCService{
		K8sClient: k8sClient,
	}
}

func (s *PVCService) CreatePVC(namespace string, pvc *v1.PersistentVolumeClaim) (*v1.PersistentVolumeClaim, error) {
	return s.K8sClient.Clientset.CoreV1().PersistentVolumeClaims(namespace).Create(context.TODO(), pvc, metav1.CreateOptions{})
}

func (s *PVCService) GetPVC(namespace, name string) (*v1.PersistentVolumeClaim, error) {
	return s.K8sClient.Clientset.CoreV1().PersistentVolumeClaims(namespace).Get(context.TODO(), name, metav1.GetOptions{})
}

func (s *PVCService) UpdatePVC(namespace string, pvc *v1.PersistentVolumeClaim) (*v1.PersistentVolumeClaim, error) {
	return s.K8sClient.Clientset.CoreV1().PersistentVolumeClaims(namespace).Update(context.TODO(), pvc, metav1.UpdateOptions{})
}

func (s *PVCService) DeletePVC(namespace, name string) error {
	return s.K8sClient.Clientset.CoreV1().PersistentVolumeClaims(namespace).Delete(context.TODO(), name, metav1.DeleteOptions{})
}
