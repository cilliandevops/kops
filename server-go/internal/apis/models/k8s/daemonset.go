package k8s

import (
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// DaemonSetModel 是 DaemonSet 资源的模型
type DaemonSetModel struct {
	Name      string                 `json:"name"`
	Namespace string                 `json:"namespace"`
	Labels    map[string]string      `json:"labels"`
	Selector  *metav1.LabelSelector  `json:"selector"`
	Template  corev1.PodTemplateSpec `json:"template"`
}
