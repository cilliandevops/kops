package k8s

import (
	appsv1 "k8s.io/api/apps/v1"
)

type StatefulSetModel struct {
	Name      string                   `json:"name"`
	Namespace string                   `json:"namespace"`
	Labels    map[string]string        `json:"labels,omitempty"`
	Spec      appsv1.StatefulSetSpec   `json:"spec"`
	Status    appsv1.StatefulSetStatus `json:"status,omitempty"`
}

func NewStatefulSetModel(statefulSet *appsv1.StatefulSet) *StatefulSetModel {
	return &StatefulSetModel{
		Name:      statefulSet.Name,
		Namespace: statefulSet.Namespace,
		Labels:    statefulSet.Labels,
		Spec:      statefulSet.Spec,
		Status:    statefulSet.Status,
	}
}
