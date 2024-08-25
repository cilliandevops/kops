package k8s

import (
	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// IngressSpec defines the desired state of Ingress
type IngressSpec struct {
	Name      string                   `json:"name"`
	Namespace string                   `json:"namespace"`
	Spec      networkingv1.IngressSpec `json:"spec"`
}

// Ingress defines the Ingress API object
type Ingress struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`
	Spec              IngressSpec `json:"spec,omitempty"`
}
