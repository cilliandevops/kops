package services

import (
	"context"

	"github.com/cilliandevops/kops/server-go/internal/apis/models/k8s"
	"github.com/cilliandevops/kops/server-go/internal/client"
	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type StatefulSetService struct {
	client *client.Client
}

func NewStatefulSetService(client *client.Client) *StatefulSetService {
	return &StatefulSetService{
		client: client,
	}
}

func (s *StatefulSetService) ListStatefulSets(namespace string) ([]k8s.StatefulSetModel, error) {
	statefulSets, err := s.client.Clientset.AppsV1().StatefulSets(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var statefulSetModels []k8s.StatefulSetModel
	for _, statefulSet := range statefulSets.Items {
		statefulSetModels = append(statefulSetModels, *k8s.NewStatefulSetModel(&statefulSet))
	}
	return statefulSetModels, nil
}

func (s *StatefulSetService) GetStatefulSet(namespace, name string) (*k8s.StatefulSetModel, error) {
	statefulSet, err := s.client.Clientset.AppsV1().StatefulSets(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	return k8s.NewStatefulSetModel(statefulSet), nil
}

func (s *StatefulSetService) CreateStatefulSet(namespace string, statefulSet *appsv1.StatefulSet) (*k8s.StatefulSetModel, error) {
	createdStatefulSet, err := s.client.Clientset.AppsV1().StatefulSets(namespace).Create(context.Background(), statefulSet, metav1.CreateOptions{})
	if err != nil {
		return nil, err
	}
	return k8s.NewStatefulSetModel(createdStatefulSet), nil
}

func (s *StatefulSetService) UpdateStatefulSet(namespace string, statefulSet *appsv1.StatefulSet) (*k8s.StatefulSetModel, error) {
	updatedStatefulSet, err := s.client.Clientset.AppsV1().StatefulSets(namespace).Update(context.Background(), statefulSet, metav1.UpdateOptions{})
	if err != nil {
		return nil, err
	}
	return k8s.NewStatefulSetModel(updatedStatefulSet), nil
}

func (s *StatefulSetService) DeleteStatefulSet(namespace, name string) error {
	return s.client.Clientset.AppsV1().StatefulSets(namespace).Delete(context.Background(), name, metav1.DeleteOptions{})
}
