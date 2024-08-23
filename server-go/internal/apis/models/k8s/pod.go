package k8s

import (
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type Pod struct {
	Name         string            `json:"name"`
	Namespace    string            `json:"namespace"`
	Labels       map[string]string `json:"labels"`
	Annotations  map[string]string `json:"annotations"`
	Status       corev1.PodStatus  `json:"status"`
	CreationTime metav1.Time       `json:"creationTime"`
}

// Container represents the structure of a Kubernetes container inside a Pod.
// type Container struct {
// 	Name  string `json:"name"`
// 	Image string `json:"image"`
// }

// ToModel converts Kubernetes Pod object to our Pod model.
// func ToModel(pod *v1.Pod) Pod {
// 	containers := make([]Container, len(pod.Spec.Containers))
// 	for i, c := range pod.Spec.Containers {
// 		containers[i] = Container{
// 			Name:  c.Name,
// 			Image: c.Image,
// 		}
// 	}
// 	return Pod{
// 		Name:       pod.Name,
// 		Namespace:  pod.Namespace,
// 		Labels:     pod.Labels,
// 		Status:     string(pod.Status.Phase),
// 		Containers: containers,
// 	}
// }
