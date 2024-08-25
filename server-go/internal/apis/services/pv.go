package services

import (
	"context"

	"github.com/cilliandevops/kops/server-go/internal/client"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type PVService struct {
	K8sClient *client.Client
}

func NewPVService(k8sClient *client.Client) *PVService {
	return &PVService{
		K8sClient: k8sClient,
	}
}

func (s *PVService) CreatePV(pv *v1.PersistentVolume) (*v1.PersistentVolume, error) {
	return s.K8sClient.Clientset.CoreV1().PersistentVolumes().Create(context.TODO(), pv, metav1.CreateOptions{})
}

func (s *PVService) GetPV(name string) (*v1.PersistentVolume, error) {
	return s.K8sClient.Clientset.CoreV1().PersistentVolumes().Get(context.TODO(), name, metav1.GetOptions{})
}

func (s *PVService) UpdatePV(pv *v1.PersistentVolume) (*v1.PersistentVolume, error) {
	return s.K8sClient.Clientset.CoreV1().PersistentVolumes().Update(context.TODO(), pv, metav1.UpdateOptions{})
}

func (s *PVService) DeletePV(name string) error {
	return s.K8sClient.Clientset.CoreV1().PersistentVolumes().Delete(context.TODO(), name, metav1.DeleteOptions{})
}
