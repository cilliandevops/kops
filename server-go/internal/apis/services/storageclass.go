package services

import (
	"context"

	"github.com/cilliandevops/kops/server-go/internal/client"
	storagev1 "k8s.io/api/storage/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type StorageClassService struct {
	K8sClient *client.Client
}

func NewStorageClassService(k8sClient *client.Client) *StorageClassService {
	return &StorageClassService{
		K8sClient: k8sClient,
	}
}

func (s *StorageClassService) CreateStorageClass(sc *storagev1.StorageClass) (*storagev1.StorageClass, error) {
	return s.K8sClient.Clientset.StorageV1().StorageClasses().Create(context.TODO(), sc, metav1.CreateOptions{})
}

func (s *StorageClassService) GetStorageClass(name string) (*storagev1.StorageClass, error) {
	return s.K8sClient.Clientset.StorageV1().StorageClasses().Get(context.TODO(), name, metav1.GetOptions{})
}

func (s *StorageClassService) UpdateStorageClass(sc *storagev1.StorageClass) (*storagev1.StorageClass, error) {
	return s.K8sClient.Clientset.StorageV1().StorageClasses().Update(context.TODO(), sc, metav1.UpdateOptions{})
}

func (s *StorageClassService) DeleteStorageClass(name string) error {
	return s.K8sClient.Clientset.StorageV1().StorageClasses().Delete(context.TODO(), name, metav1.DeleteOptions{})
}
