package service

import (
	"context"

	admissionv1 "k8s.io/api/admissionregistration/v1"
	appsv1 "k8s.io/api/apps/v1"
	coordinationv1 "k8s.io/api/coordination/v1"
	corev1 "k8s.io/api/core/v1"
	discoveryv1 "k8s.io/api/discovery/v1"
	networkingv1 "k8s.io/api/networking/v1"
	nodev1 "k8s.io/api/node/v1"
	schedulingv1 "k8s.io/api/scheduling/v1"
	storagev1 "k8s.io/api/storage/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes"
)

// --- ReplicaSetClient (Namespaced) ---
type ReplicaSetClient struct{}

func (c *ReplicaSetClient) Get(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.GetOptions) (*appsv1.ReplicaSet, error) {
	return clientset.AppsV1().ReplicaSets(namespace).Get(ctx, name, opts)
}
func (c *ReplicaSetClient) List(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.AppsV1().ReplicaSets(namespace).List(ctx, opts)
}
func (c *ReplicaSetClient) Create(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *appsv1.ReplicaSet, opts metav1.CreateOptions) (*appsv1.ReplicaSet, error) {
	return clientset.AppsV1().ReplicaSets(namespace).Create(ctx, obj, opts)
}
func (c *ReplicaSetClient) Update(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *appsv1.ReplicaSet, opts metav1.UpdateOptions) (*appsv1.ReplicaSet, error) {
	return clientset.AppsV1().ReplicaSets(namespace).Update(ctx, obj, opts)
}
func (c *ReplicaSetClient) Delete(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.DeleteOptions) error {
	return clientset.AppsV1().ReplicaSets(namespace).Delete(ctx, name, opts)
}
func (c *ReplicaSetClient) Watch(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.AppsV1().ReplicaSets(namespace).Watch(ctx, opts)
}

// --- ReplicationControllerClient (Namespaced) ---
type ReplicationControllerClient struct{}

func (c *ReplicationControllerClient) Get(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.GetOptions) (*corev1.ReplicationController, error) {
	return clientset.CoreV1().ReplicationControllers(namespace).Get(ctx, name, opts)
}
func (c *ReplicationControllerClient) List(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.CoreV1().ReplicationControllers(namespace).List(ctx, opts)
}
func (c *ReplicationControllerClient) Create(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *corev1.ReplicationController, opts metav1.CreateOptions) (*corev1.ReplicationController, error) {
	return clientset.CoreV1().ReplicationControllers(namespace).Create(ctx, obj, opts)
}
func (c *ReplicationControllerClient) Update(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *corev1.ReplicationController, opts metav1.UpdateOptions) (*corev1.ReplicationController, error) {
	return clientset.CoreV1().ReplicationControllers(namespace).Update(ctx, obj, opts)
}
func (c *ReplicationControllerClient) Delete(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.DeleteOptions) error {
	return clientset.CoreV1().ReplicationControllers(namespace).Delete(ctx, name, opts)
}
func (c *ReplicationControllerClient) Watch(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.CoreV1().ReplicationControllers(namespace).Watch(ctx, opts)
}

// --- EndpointsClient (Namespaced) ---
type EndpointsClient struct{}

func (c *EndpointsClient) Get(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.GetOptions) (*corev1.Endpoints, error) {
	return clientset.CoreV1().Endpoints(namespace).Get(ctx, name, opts)
}
func (c *EndpointsClient) List(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.CoreV1().Endpoints(namespace).List(ctx, opts)
}
func (c *EndpointsClient) Create(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *corev1.Endpoints, opts metav1.CreateOptions) (*corev1.Endpoints, error) {
	return clientset.CoreV1().Endpoints(namespace).Create(ctx, obj, opts)
}
func (c *EndpointsClient) Update(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *corev1.Endpoints, opts metav1.UpdateOptions) (*corev1.Endpoints, error) {
	return clientset.CoreV1().Endpoints(namespace).Update(ctx, obj, opts)
}
func (c *EndpointsClient) Delete(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.DeleteOptions) error {
	return clientset.CoreV1().Endpoints(namespace).Delete(ctx, name, opts)
}
func (c *EndpointsClient) Watch(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.CoreV1().Endpoints(namespace).Watch(ctx, opts)
}

// --- EndpointSliceClient (Namespaced) ---
type EndpointSliceClient struct{}

func (c *EndpointSliceClient) Get(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.GetOptions) (*discoveryv1.EndpointSlice, error) {
	return clientset.DiscoveryV1().EndpointSlices(namespace).Get(ctx, name, opts)
}
func (c *EndpointSliceClient) List(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.DiscoveryV1().EndpointSlices(namespace).List(ctx, opts)
}
func (c *EndpointSliceClient) Create(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *discoveryv1.EndpointSlice, opts metav1.CreateOptions) (*discoveryv1.EndpointSlice, error) {
	return clientset.DiscoveryV1().EndpointSlices(namespace).Create(ctx, obj, opts)
}
func (c *EndpointSliceClient) Update(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *discoveryv1.EndpointSlice, opts metav1.UpdateOptions) (*discoveryv1.EndpointSlice, error) {
	return clientset.DiscoveryV1().EndpointSlices(namespace).Update(ctx, obj, opts)
}
func (c *EndpointSliceClient) Delete(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.DeleteOptions) error {
	return clientset.DiscoveryV1().EndpointSlices(namespace).Delete(ctx, name, opts)
}
func (c *EndpointSliceClient) Watch(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.DiscoveryV1().EndpointSlices(namespace).Watch(ctx, opts)
}

// --- LeaseClient (Namespaced) ---
type LeaseClient struct{}

func (c *LeaseClient) Get(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.GetOptions) (*coordinationv1.Lease, error) {
	return clientset.CoordinationV1().Leases(namespace).Get(ctx, name, opts)
}
func (c *LeaseClient) List(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.CoordinationV1().Leases(namespace).List(ctx, opts)
}
func (c *LeaseClient) Create(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *coordinationv1.Lease, opts metav1.CreateOptions) (*coordinationv1.Lease, error) {
	return clientset.CoordinationV1().Leases(namespace).Create(ctx, obj, opts)
}
func (c *LeaseClient) Update(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *coordinationv1.Lease, opts metav1.UpdateOptions) (*coordinationv1.Lease, error) {
	return clientset.CoordinationV1().Leases(namespace).Update(ctx, obj, opts)
}
func (c *LeaseClient) Delete(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.DeleteOptions) error {
	return clientset.CoordinationV1().Leases(namespace).Delete(ctx, name, opts)
}
func (c *LeaseClient) Watch(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.CoordinationV1().Leases(namespace).Watch(ctx, opts)
}

// --- PodTemplateClient (Namespaced) ---
type PodTemplateClient struct{}

func (c *PodTemplateClient) Get(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.GetOptions) (*corev1.PodTemplate, error) {
	return clientset.CoreV1().PodTemplates(namespace).Get(ctx, name, opts)
}
func (c *PodTemplateClient) List(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.CoreV1().PodTemplates(namespace).List(ctx, opts)
}
func (c *PodTemplateClient) Create(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *corev1.PodTemplate, opts metav1.CreateOptions) (*corev1.PodTemplate, error) {
	return clientset.CoreV1().PodTemplates(namespace).Create(ctx, obj, opts)
}
func (c *PodTemplateClient) Update(ctx context.Context, clientset kubernetes.Interface, namespace string, obj *corev1.PodTemplate, opts metav1.UpdateOptions) (*corev1.PodTemplate, error) {
	return clientset.CoreV1().PodTemplates(namespace).Update(ctx, obj, opts)
}
func (c *PodTemplateClient) Delete(ctx context.Context, clientset kubernetes.Interface, namespace, name string, opts metav1.DeleteOptions) error {
	return clientset.CoreV1().PodTemplates(namespace).Delete(ctx, name, opts)
}
func (c *PodTemplateClient) Watch(ctx context.Context, clientset kubernetes.Interface, namespace string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.CoreV1().PodTemplates(namespace).Watch(ctx, opts)
}

// --- IngressClassClient (Cluster-scoped) ---
type IngressClassClient struct{}

func (c *IngressClassClient) Get(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.GetOptions) (*networkingv1.IngressClass, error) {
	return clientset.NetworkingV1().IngressClasses().Get(ctx, name, opts)
}
func (c *IngressClassClient) List(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.NetworkingV1().IngressClasses().List(ctx, opts)
}
func (c *IngressClassClient) Create(ctx context.Context, clientset kubernetes.Interface, _ string, obj *networkingv1.IngressClass, opts metav1.CreateOptions) (*networkingv1.IngressClass, error) {
	return clientset.NetworkingV1().IngressClasses().Create(ctx, obj, opts)
}
func (c *IngressClassClient) Update(ctx context.Context, clientset kubernetes.Interface, _ string, obj *networkingv1.IngressClass, opts metav1.UpdateOptions) (*networkingv1.IngressClass, error) {
	return clientset.NetworkingV1().IngressClasses().Update(ctx, obj, opts)
}
func (c *IngressClassClient) Delete(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.DeleteOptions) error {
	return clientset.NetworkingV1().IngressClasses().Delete(ctx, name, opts)
}
func (c *IngressClassClient) Watch(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.NetworkingV1().IngressClasses().Watch(ctx, opts)
}

// --- ServiceCIDRClient (Cluster-scoped) ---
type ServiceCIDRClient struct{}

func (c *ServiceCIDRClient) Get(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.GetOptions) (*networkingv1.ServiceCIDR, error) {
	return clientset.NetworkingV1().ServiceCIDRs().Get(ctx, name, opts)
}
func (c *ServiceCIDRClient) List(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.NetworkingV1().ServiceCIDRs().List(ctx, opts)
}
func (c *ServiceCIDRClient) Create(ctx context.Context, clientset kubernetes.Interface, _ string, obj *networkingv1.ServiceCIDR, opts metav1.CreateOptions) (*networkingv1.ServiceCIDR, error) {
	return clientset.NetworkingV1().ServiceCIDRs().Create(ctx, obj, opts)
}
func (c *ServiceCIDRClient) Update(ctx context.Context, clientset kubernetes.Interface, _ string, obj *networkingv1.ServiceCIDR, opts metav1.UpdateOptions) (*networkingv1.ServiceCIDR, error) {
	return clientset.NetworkingV1().ServiceCIDRs().Update(ctx, obj, opts)
}
func (c *ServiceCIDRClient) Delete(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.DeleteOptions) error {
	return clientset.NetworkingV1().ServiceCIDRs().Delete(ctx, name, opts)
}
func (c *ServiceCIDRClient) Watch(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.NetworkingV1().ServiceCIDRs().Watch(ctx, opts)
}

// --- PriorityClassClient (Cluster-scoped) ---
type PriorityClassClient struct{}

func (c *PriorityClassClient) Get(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.GetOptions) (*schedulingv1.PriorityClass, error) {
	return clientset.SchedulingV1().PriorityClasses().Get(ctx, name, opts)
}
func (c *PriorityClassClient) List(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.SchedulingV1().PriorityClasses().List(ctx, opts)
}
func (c *PriorityClassClient) Create(ctx context.Context, clientset kubernetes.Interface, _ string, obj *schedulingv1.PriorityClass, opts metav1.CreateOptions) (*schedulingv1.PriorityClass, error) {
	return clientset.SchedulingV1().PriorityClasses().Create(ctx, obj, opts)
}
func (c *PriorityClassClient) Update(ctx context.Context, clientset kubernetes.Interface, _ string, obj *schedulingv1.PriorityClass, opts metav1.UpdateOptions) (*schedulingv1.PriorityClass, error) {
	return clientset.SchedulingV1().PriorityClasses().Update(ctx, obj, opts)
}
func (c *PriorityClassClient) Delete(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.DeleteOptions) error {
	return clientset.SchedulingV1().PriorityClasses().Delete(ctx, name, opts)
}
func (c *PriorityClassClient) Watch(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.SchedulingV1().PriorityClasses().Watch(ctx, opts)
}

// --- RuntimeClassClient (Cluster-scoped) ---
type RuntimeClassClient struct{}

func (c *RuntimeClassClient) Get(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.GetOptions) (*nodev1.RuntimeClass, error) {
	return clientset.NodeV1().RuntimeClasses().Get(ctx, name, opts)
}
func (c *RuntimeClassClient) List(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.NodeV1().RuntimeClasses().List(ctx, opts)
}
func (c *RuntimeClassClient) Create(ctx context.Context, clientset kubernetes.Interface, _ string, obj *nodev1.RuntimeClass, opts metav1.CreateOptions) (*nodev1.RuntimeClass, error) {
	return clientset.NodeV1().RuntimeClasses().Create(ctx, obj, opts)
}
func (c *RuntimeClassClient) Update(ctx context.Context, clientset kubernetes.Interface, _ string, obj *nodev1.RuntimeClass, opts metav1.UpdateOptions) (*nodev1.RuntimeClass, error) {
	return clientset.NodeV1().RuntimeClasses().Update(ctx, obj, opts)
}
func (c *RuntimeClassClient) Delete(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.DeleteOptions) error {
	return clientset.NodeV1().RuntimeClasses().Delete(ctx, name, opts)
}
func (c *RuntimeClassClient) Watch(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.NodeV1().RuntimeClasses().Watch(ctx, opts)
}

// --- MutatingWebhookConfigurationClient (Cluster-scoped) ---
type MutatingWebhookConfigurationClient struct{}

func (c *MutatingWebhookConfigurationClient) Get(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.GetOptions) (*admissionv1.MutatingWebhookConfiguration, error) {
	return clientset.AdmissionregistrationV1().MutatingWebhookConfigurations().Get(ctx, name, opts)
}
func (c *MutatingWebhookConfigurationClient) List(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.AdmissionregistrationV1().MutatingWebhookConfigurations().List(ctx, opts)
}
func (c *MutatingWebhookConfigurationClient) Create(ctx context.Context, clientset kubernetes.Interface, _ string, obj *admissionv1.MutatingWebhookConfiguration, opts metav1.CreateOptions) (*admissionv1.MutatingWebhookConfiguration, error) {
	return clientset.AdmissionregistrationV1().MutatingWebhookConfigurations().Create(ctx, obj, opts)
}
func (c *MutatingWebhookConfigurationClient) Update(ctx context.Context, clientset kubernetes.Interface, _ string, obj *admissionv1.MutatingWebhookConfiguration, opts metav1.UpdateOptions) (*admissionv1.MutatingWebhookConfiguration, error) {
	return clientset.AdmissionregistrationV1().MutatingWebhookConfigurations().Update(ctx, obj, opts)
}
func (c *MutatingWebhookConfigurationClient) Delete(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.DeleteOptions) error {
	return clientset.AdmissionregistrationV1().MutatingWebhookConfigurations().Delete(ctx, name, opts)
}
func (c *MutatingWebhookConfigurationClient) Watch(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.AdmissionregistrationV1().MutatingWebhookConfigurations().Watch(ctx, opts)
}

// --- ValidatingWebhookConfigurationClient (Cluster-scoped) ---
type ValidatingWebhookConfigurationClient struct{}

func (c *ValidatingWebhookConfigurationClient) Get(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.GetOptions) (*admissionv1.ValidatingWebhookConfiguration, error) {
	return clientset.AdmissionregistrationV1().ValidatingWebhookConfigurations().Get(ctx, name, opts)
}
func (c *ValidatingWebhookConfigurationClient) List(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.AdmissionregistrationV1().ValidatingWebhookConfigurations().List(ctx, opts)
}
func (c *ValidatingWebhookConfigurationClient) Create(ctx context.Context, clientset kubernetes.Interface, _ string, obj *admissionv1.ValidatingWebhookConfiguration, opts metav1.CreateOptions) (*admissionv1.ValidatingWebhookConfiguration, error) {
	return clientset.AdmissionregistrationV1().ValidatingWebhookConfigurations().Create(ctx, obj, opts)
}
func (c *ValidatingWebhookConfigurationClient) Update(ctx context.Context, clientset kubernetes.Interface, _ string, obj *admissionv1.ValidatingWebhookConfiguration, opts metav1.UpdateOptions) (*admissionv1.ValidatingWebhookConfiguration, error) {
	return clientset.AdmissionregistrationV1().ValidatingWebhookConfigurations().Update(ctx, obj, opts)
}
func (c *ValidatingWebhookConfigurationClient) Delete(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.DeleteOptions) error {
	return clientset.AdmissionregistrationV1().ValidatingWebhookConfigurations().Delete(ctx, name, opts)
}
func (c *ValidatingWebhookConfigurationClient) Watch(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.AdmissionregistrationV1().ValidatingWebhookConfigurations().Watch(ctx, opts)
}

// --- VolumeAttachmentClient (Cluster-scoped) ---
type VolumeAttachmentClient struct{}

func (c *VolumeAttachmentClient) Get(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.GetOptions) (*storagev1.VolumeAttachment, error) {
	return clientset.StorageV1().VolumeAttachments().Get(ctx, name, opts)
}
func (c *VolumeAttachmentClient) List(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.StorageV1().VolumeAttachments().List(ctx, opts)
}
func (c *VolumeAttachmentClient) Create(ctx context.Context, clientset kubernetes.Interface, _ string, obj *storagev1.VolumeAttachment, opts metav1.CreateOptions) (*storagev1.VolumeAttachment, error) {
	return clientset.StorageV1().VolumeAttachments().Create(ctx, obj, opts)
}
func (c *VolumeAttachmentClient) Update(ctx context.Context, clientset kubernetes.Interface, _ string, obj *storagev1.VolumeAttachment, opts metav1.UpdateOptions) (*storagev1.VolumeAttachment, error) {
	return clientset.StorageV1().VolumeAttachments().Update(ctx, obj, opts)
}
func (c *VolumeAttachmentClient) Delete(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.DeleteOptions) error {
	return clientset.StorageV1().VolumeAttachments().Delete(ctx, name, opts)
}
func (c *VolumeAttachmentClient) Watch(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.StorageV1().VolumeAttachments().Watch(ctx, opts)
}

// --- CSIDriverClient (Cluster-scoped) ---
type CSIDriverClient struct{}

func (c *CSIDriverClient) Get(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.GetOptions) (*storagev1.CSIDriver, error) {
	return clientset.StorageV1().CSIDrivers().Get(ctx, name, opts)
}
func (c *CSIDriverClient) List(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.StorageV1().CSIDrivers().List(ctx, opts)
}
func (c *CSIDriverClient) Create(ctx context.Context, clientset kubernetes.Interface, _ string, obj *storagev1.CSIDriver, opts metav1.CreateOptions) (*storagev1.CSIDriver, error) {
	return clientset.StorageV1().CSIDrivers().Create(ctx, obj, opts)
}
func (c *CSIDriverClient) Update(ctx context.Context, clientset kubernetes.Interface, _ string, obj *storagev1.CSIDriver, opts metav1.UpdateOptions) (*storagev1.CSIDriver, error) {
	return clientset.StorageV1().CSIDrivers().Update(ctx, obj, opts)
}
func (c *CSIDriverClient) Delete(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.DeleteOptions) error {
	return clientset.StorageV1().CSIDrivers().Delete(ctx, name, opts)
}
func (c *CSIDriverClient) Watch(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.StorageV1().CSIDrivers().Watch(ctx, opts)
}

// --- CSINodeClient (Cluster-scoped) ---
type CSINodeClient struct{}

func (c *CSINodeClient) Get(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.GetOptions) (*storagev1.CSINode, error) {
	return clientset.StorageV1().CSINodes().Get(ctx, name, opts)
}
func (c *CSINodeClient) List(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (runtime.Object, error) {
	return clientset.StorageV1().CSINodes().List(ctx, opts)
}
func (c *CSINodeClient) Create(ctx context.Context, clientset kubernetes.Interface, _ string, obj *storagev1.CSINode, opts metav1.CreateOptions) (*storagev1.CSINode, error) {
	return clientset.StorageV1().CSINodes().Create(ctx, obj, opts)
}
func (c *CSINodeClient) Update(ctx context.Context, clientset kubernetes.Interface, _ string, obj *storagev1.CSINode, opts metav1.UpdateOptions) (*storagev1.CSINode, error) {
	return clientset.StorageV1().CSINodes().Update(ctx, obj, opts)
}
func (c *CSINodeClient) Delete(ctx context.Context, clientset kubernetes.Interface, _ string, name string, opts metav1.DeleteOptions) error {
	return clientset.StorageV1().CSINodes().Delete(ctx, name, opts)
}
func (c *CSINodeClient) Watch(ctx context.Context, clientset kubernetes.Interface, _ string, opts metav1.ListOptions) (watch.Interface, error) {
	return clientset.StorageV1().CSINodes().Watch(ctx, opts)
}
