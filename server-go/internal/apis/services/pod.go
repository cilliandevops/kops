package services

import (
	"context"

	"github.com/cilliandevops/kops/server-go/internal/apis/models/k8s"
	"github.com/cilliandevops/kops/server-go/internal/client"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type PodService struct {
	client *client.Client
}

func NewPodService(c *client.Client) *PodService {
	return &PodService{client: c}
}

func (ps *PodService) ListPods(namespace string) ([]k8s.Pod, error) {
	podList, err := ps.client.Clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	var pods []k8s.Pod
	for _, pod := range podList.Items {
		pods = append(pods, k8s.Pod{
			Name:         pod.Name,
			Namespace:    pod.Namespace,
			Labels:       pod.Labels,
			Annotations:  pod.Annotations,
			Status:       pod.Status,
			CreationTime: pod.CreationTimestamp,
		})
	}

	return pods, nil
}

func (ps *PodService) GetPod(namespace, podName string) (*k8s.Pod, error) {
	pod, err := ps.client.Clientset.CoreV1().Pods(namespace).Get(context.TODO(), podName, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return &k8s.Pod{
		Name:         pod.Name,
		Namespace:    pod.Namespace,
		Labels:       pod.Labels,
		Annotations:  pod.Annotations,
		Status:       pod.Status,
		CreationTime: pod.CreationTimestamp,
	}, nil
}

func (ps *PodService) CreatePod(namespace string, pod *corev1.Pod) (*k8s.Pod, error) {
	createdPod, err := ps.client.Clientset.CoreV1().Pods(namespace).Create(context.TODO(), pod, metav1.CreateOptions{})
	if err != nil {
		return nil, err
	}

	return &k8s.Pod{
		Name:         createdPod.Name,
		Namespace:    createdPod.Namespace,
		Labels:       createdPod.Labels,
		Annotations:  createdPod.Annotations,
		Status:       createdPod.Status,
		CreationTime: createdPod.CreationTimestamp,
	}, nil
}

func (ps *PodService) DeletePod(namespace, podName string) error {
	return ps.client.Clientset.CoreV1().Pods(namespace).Delete(context.TODO(), podName, metav1.DeleteOptions{})
}
