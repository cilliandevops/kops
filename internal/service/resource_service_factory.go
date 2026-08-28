package service

import (
	"sync"

	admissionv1 "k8s.io/api/admissionregistration/v1"
	appsv1 "k8s.io/api/apps/v1"
	autoscalingv2 "k8s.io/api/autoscaling/v2"
	batchv1 "k8s.io/api/batch/v1"
	coordinationv1 "k8s.io/api/coordination/v1"
	corev1 "k8s.io/api/core/v1"
	discoveryv1 "k8s.io/api/discovery/v1"
	networkingv1 "k8s.io/api/networking/v1"
	nodev1 "k8s.io/api/node/v1"
	policyv1 "k8s.io/api/policy/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	schedulingv1 "k8s.io/api/scheduling/v1"
	storagev1 "k8s.io/api/storage/v1"
	gatewayv1 "sigs.k8s.io/gateway-api/apis/v1"
)

// ResourceServiceFactory resource service factory
type ResourceServiceFactory struct {
	services map[string]interface{}
	mu       sync.RWMutex
}

// NewResourceServiceFactory creates resource service factory
func NewResourceServiceFactory() *ResourceServiceFactory {
	return &ResourceServiceFactory{
		services: make(map[string]interface{}),
	}
}

// RegisterService registers resource service
func (f *ResourceServiceFactory) RegisterService(name string, service interface{}) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.services[name] = service
}

// GetService gets resource service
func (f *ResourceServiceFactory) GetService(name string) interface{} {
	f.mu.RLock()
	defer f.mu.RUnlock()
	return f.services[name]
}

// InitializeDefaultServices initializes all default services
func (f *ResourceServiceFactory) InitializeDefaultServices() {
	f.RegisterService("nodes", NewBaseResourceService[*corev1.Node](new(NodeClient)))
	f.RegisterService("pods", NewBaseResourceService[*corev1.Pod](new(PodClient)))
	f.RegisterService("deployments", NewBaseResourceService[*appsv1.Deployment](new(DeploymentClient)))
	f.RegisterService("services", NewBaseResourceService[*corev1.Service](new(ServiceClient)))
	f.RegisterService("daemonsets", NewBaseResourceService[*appsv1.DaemonSet](new(DaemonSetClient)))
	f.RegisterService("ingresses", NewBaseResourceService[*networkingv1.Ingress](new(IngressClient)))
	f.RegisterService("configmaps", NewBaseResourceService[*corev1.ConfigMap](new(ConfigMapClient)))
	f.RegisterService("secrets", NewBaseResourceService[*corev1.Secret](new(SecretClient)))
	f.RegisterService("persistentvolumeclaims", NewBaseResourceService[*corev1.PersistentVolumeClaim](new(PVCClient)))
	f.RegisterService("persistentvolumes", NewBaseResourceService[*corev1.PersistentVolume](new(PVClient)))
	f.RegisterService("statefulsets", NewBaseResourceService[*appsv1.StatefulSet](new(StatefulSetClient)))
	f.RegisterService("jobs", NewBaseResourceService[*batchv1.Job](new(JobClient)))
	f.RegisterService("cronjobs", NewBaseResourceService[*batchv1.CronJob](new(CronJobClient)))
	f.RegisterService("networkpolicies", NewBaseResourceService[*networkingv1.NetworkPolicy](new(NetworkPolicyClient)))
	f.RegisterService("gatewayclasses", NewBaseResourceService[*gatewayv1.GatewayClass](new(GatewayClassClient)))
	f.RegisterService("gateways", NewBaseResourceService[*gatewayv1.Gateway](new(GatewayClient)))
	f.RegisterService("httproutes", NewBaseResourceService[*gatewayv1.HTTPRoute](new(HTTPRouteClient)))
	f.RegisterService("namespaces", NewBaseResourceService[*corev1.Namespace](new(NamespaceClient)))
	f.RegisterService("storageclasses", NewBaseResourceService[*storagev1.StorageClass](new(StorageClassClient)))
	f.RegisterService("serviceaccounts", NewBaseResourceService[*corev1.ServiceAccount](new(ServiceAccountClient)))
	f.RegisterService("roles", NewBaseResourceService[*rbacv1.Role](new(RoleClient)))
	f.RegisterService("rolebindings", NewBaseResourceService[*rbacv1.RoleBinding](new(RoleBindingClient)))
	f.RegisterService("clusterroles", NewBaseResourceService[*rbacv1.ClusterRole](new(ClusterRoleClient)))
	f.RegisterService("clusterrolebindings", NewBaseResourceService[*rbacv1.ClusterRoleBinding](new(ClusterRoleBindingClient)))
	f.RegisterService("horizontalpodautoscalers", NewBaseResourceService[*autoscalingv2.HorizontalPodAutoscaler](new(HPAClient)))
	f.RegisterService("poddisruptionbudgets", NewBaseResourceService[*policyv1.PodDisruptionBudget](new(PDBClient)))
	f.RegisterService("resourcequotas", NewBaseResourceService[*corev1.ResourceQuota](new(ResourceQuotaClient)))
	f.RegisterService("limitranges", NewBaseResourceService[*corev1.LimitRange](new(LimitRangeClient)))
	f.RegisterService("replicasets", NewBaseResourceService[*appsv1.ReplicaSet](new(ReplicaSetClient)))
	f.RegisterService("replicationcontrollers", NewBaseResourceService[*corev1.ReplicationController](new(ReplicationControllerClient)))
	f.RegisterService("endpoints", NewBaseResourceService[*corev1.Endpoints](new(EndpointsClient)))
	f.RegisterService("endpointslices", NewBaseResourceService[*discoveryv1.EndpointSlice](new(EndpointSliceClient)))
	f.RegisterService("leases", NewBaseResourceService[*coordinationv1.Lease](new(LeaseClient)))
	f.RegisterService("podtemplates", NewBaseResourceService[*corev1.PodTemplate](new(PodTemplateClient)))
	f.RegisterService("ingressclasses", NewBaseResourceService[*networkingv1.IngressClass](new(IngressClassClient)))
	f.RegisterService("servicecidrs", NewBaseResourceService[*networkingv1.ServiceCIDR](new(ServiceCIDRClient)))
	f.RegisterService("priorityclasses", NewBaseResourceService[*schedulingv1.PriorityClass](new(PriorityClassClient)))
	f.RegisterService("runtimeclasses", NewBaseResourceService[*nodev1.RuntimeClass](new(RuntimeClassClient)))
	f.RegisterService("mutatingwebhookconfigurations", NewBaseResourceService[*admissionv1.MutatingWebhookConfiguration](new(MutatingWebhookConfigurationClient)))
	f.RegisterService("validatingwebhookconfigurations", NewBaseResourceService[*admissionv1.ValidatingWebhookConfiguration](new(ValidatingWebhookConfigurationClient)))
	f.RegisterService("volumeattachments", NewBaseResourceService[*storagev1.VolumeAttachment](new(VolumeAttachmentClient)))
	f.RegisterService("csidrivers", NewBaseResourceService[*storagev1.CSIDriver](new(CSIDriverClient)))
	f.RegisterService("csinodes", NewBaseResourceService[*storagev1.CSINode](new(CSINodeClient)))
}
