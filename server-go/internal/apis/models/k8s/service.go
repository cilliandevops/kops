package k8s

import (
	v1 "k8s.io/api/core/v1"
)

// ServiceModel 用于表示 Kubernetes Service 的模型
type ServiceModel struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Labels    map[string]string `json:"labels"`
	Type      v1.ServiceType    `json:"type"`
	Ports     []v1.ServicePort  `json:"ports"`
}
