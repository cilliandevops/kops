package service

import (
	"testing"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

func TestGroupApplications(t *testing.T) {
	want := int32(2)
	deploys := []appsv1.Deployment{{
		ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "default", Labels: map[string]string{"app": "web"}},
		Spec: appsv1.DeploymentSpec{
			Replicas: &want,
			Template: corev1.PodTemplateSpec{
				Spec: corev1.PodSpec{Containers: []corev1.Container{{Name: "n", Image: "web:1.2"}}},
			},
		},
		Status: appsv1.DeploymentStatus{ReadyReplicas: 2},
	}}
	svcs := []corev1.Service{{
		ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "default", Labels: map[string]string{"app": "web"}},
		Spec:       corev1.ServiceSpec{Selector: map[string]string{"app": "web"}},
	}}
	ings := []networkingv1.Ingress{{
		ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "default", Labels: map[string]string{"app": "web"}},
		Spec: networkingv1.IngressSpec{Rules: []networkingv1.IngressRule{{
			IngressRuleValue: networkingv1.IngressRuleValue{HTTP: &networkingv1.HTTPIngressRuleValue{
				Paths: []networkingv1.HTTPIngressPath{{Backend: networkingv1.IngressBackend{
					Service: &networkingv1.IngressServiceBackend{Name: "web", Port: networkingv1.ServiceBackendPort{Number: 80}},
				}, PathType: ptrPathType()}},
			}},
		}}},
	}}
	_ = intstr.FromInt(80)
	apps := GroupApplications(deploys, svcs, ings)
	if len(apps) != 1 {
		t.Fatalf("got %d apps", len(apps))
	}
	a := apps[0]
	if a.Name != "web" || a.Namespace != "default" {
		t.Fatalf("identity %+v", a)
	}
	if len(a.Images) != 1 || a.Images[0] != "web:1.2" {
		t.Fatalf("images %#v", a.Images)
	}
	if len(a.Services) != 1 || len(a.Ingresses) != 1 {
		t.Fatalf("related %+v", a)
	}
}

func ptrPathType() *networkingv1.PathType {
	p := networkingv1.PathTypePrefix
	return &p
}
