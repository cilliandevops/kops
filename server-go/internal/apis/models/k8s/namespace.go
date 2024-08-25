package k8s

import (
	v1 "k8s.io/api/core/v1"
)

// Namespace represents the Kubernetes Namespace model
type Namespace struct {
	Name   string            `json:"name"`
	Labels map[string]string `json:"labels"`
	Status v1.NamespacePhase `json:"status"`
}

// ToNamespaceModel converts a Kubernetes Namespace to our Namespace model
func ToNamespaceModel(ns *v1.Namespace) *Namespace {
	return &Namespace{
		Name:   ns.Name,
		Labels: ns.Labels,
		Status: ns.Status.Phase,
	}
}
