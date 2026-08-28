package service

import (
	"sort"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
)

// ApplicationRef is a related Kubernetes object shown on the application page.
type ApplicationRef struct {
	Kind string `json:"kind"`
	Name string `json:"name"`
}

// Application is a view object (not persisted): workloads grouped by app label.
type Application struct {
	Name          string           `json:"name"`
	Namespace     string           `json:"namespace"`
	Status        string           `json:"status"`
	Reason        string           `json:"reason,omitempty"`
	Images        []string         `json:"images"`
	Replicas      int32            `json:"replicas"`
	ReadyReplicas int32            `json:"readyReplicas"`
	Deployments   []ApplicationRef `json:"deployments"`
	Services      []ApplicationRef `json:"services"`
	Ingresses     []ApplicationRef `json:"ingresses"`
}

// GroupApplications joins Deployments with Services (selector/labels) and Ingress backends.
func GroupApplications(deploys []appsv1.Deployment, svcs []corev1.Service, ings []networkingv1.Ingress) []Application {
	apps := map[key]*Application{}

	ensure := func(ns, name string) *Application {
		k := key{ns, name}
		if a, ok := apps[k]; ok {
			return a
		}
		a := &Application{Name: name, Namespace: ns, Status: TLUnknown}
		apps[k] = a
		return a
	}

	for i := range deploys {
		d := deploys[i]
		name := TimelineAppGroup(d.Labels)
		if name == "_ungrouped" {
			name = d.Name
		}
		a := ensure(d.Namespace, name)
		a.Deployments = append(a.Deployments, ApplicationRef{Kind: "Deployment", Name: d.Name})
		st, reason := ClassifyDeploymentStatus(&d)
		a.Status = st
		a.Reason = reason
		if d.Spec.Replicas != nil {
			a.Replicas += *d.Spec.Replicas
		}
		a.ReadyReplicas += d.Status.ReadyReplicas
		seen := map[string]bool{}
		for _, img := range a.Images {
			seen[img] = true
		}
		for _, c := range d.Spec.Template.Spec.Containers {
			if c.Image != "" && !seen[c.Image] {
				a.Images = append(a.Images, c.Image)
				seen[c.Image] = true
			}
		}
	}

	for i := range svcs {
		s := svcs[i]
		name := TimelineAppGroup(s.Labels)
		if name == "_ungrouped" {
			name = matchServiceToApp(apps, s)
		}
		if name == "" {
			continue
		}
		a := ensure(s.Namespace, name)
		a.Services = append(a.Services, ApplicationRef{Kind: "Service", Name: s.Name})
	}

	svcToApp := map[key]string{}
	for k, a := range apps {
		for _, ref := range a.Services {
			svcToApp[key{k.ns, ref.Name}] = a.Name
		}
	}

	for i := range ings {
		ing := ings[i]
		name := TimelineAppGroup(ing.Labels)
		if name == "_ungrouped" {
			name = matchIngressToApp(svcToApp, ing)
		}
		if name == "" {
			continue
		}
		a := ensure(ing.Namespace, name)
		a.Ingresses = append(a.Ingresses, ApplicationRef{Kind: "Ingress", Name: ing.Name})
	}

	out := make([]Application, 0, len(apps))
	for _, a := range apps {
		out = append(out, *a)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Namespace != out[j].Namespace {
			return out[i].Namespace < out[j].Namespace
		}
		return out[i].Name < out[j].Name
	})
	return out
}

func matchServiceToApp(apps map[key]*Application, s corev1.Service) string {
	if len(s.Spec.Selector) == 0 {
		return ""
	}
	if v := s.Spec.Selector["app"]; v != "" {
		k := key{s.Namespace, v}
		if _, ok := apps[k]; ok {
			return v
		}
	}
	if v := s.Spec.Selector["app.kubernetes.io/name"]; v != "" {
		k := key{s.Namespace, v}
		if _, ok := apps[k]; ok {
			return v
		}
	}
	return ""
}

func matchIngressToApp(svcToApp map[key]string, ing networkingv1.Ingress) string {
	for _, rule := range ing.Spec.Rules {
		if rule.HTTP == nil {
			continue
		}
		for _, p := range rule.HTTP.Paths {
			if p.Backend.Service == nil {
				continue
			}
			if name := svcToApp[key{ing.Namespace, p.Backend.Service.Name}]; name != "" {
				return name
			}
		}
	}
	return ""
}

type key struct{ ns, name string }
