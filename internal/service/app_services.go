package service

import (
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

// AppServices serves as a collection of all application services, defined here uniformly
type AppServices struct {
	// Cluster and installer services
	ClusterService      *ClusterService
	EnvironmentService  *EnvironmentService
	AccessService       *AccessService
	ApplicationService  *ApplicationService
	InstallerService    InstallerService

	// [Added] Node metrics service
	NodeMetricsService *NodeMetricsService
	PodMetricsService  *PodMetricsService

	// Node lifecycle operations (cordon/drain/taints)
	NodeOpsService *NodeOpsService

	// [Added] Summary service
	SummaryService *SummaryService

	// [Added] Event service
	EventService *EventService

	// [Added] CRD service
	CRDService CRDService

	// Authentication and authorization services
	AuthService       *AuthService
	OAuthService      *OAuthService
	RoleService       *RoleService
	NavPolicyService  *NavPolicyService
	PermissionService *PermissionService
	AuditService      *AuditService
	MonitoringService *MonitoringService
	PrometheusService *PrometheusService
	TopologyService   *TopologyService
	TimelineService   *TimelineService

	// Kubernetes resource services
	NodeService               ResourceService[*corev1.Node]
	NamespaceService          ResourceService[*corev1.Namespace]
	PVService                 ResourceService[*corev1.PersistentVolume]
	PodService                ResourceService[*corev1.Pod]
	DeploymentService         ResourceService[*appsv1.Deployment]
	ServiceService            ResourceService[*corev1.Service]
	DaemonSetService          ResourceService[*appsv1.DaemonSet]
	IngressService            ResourceService[*networkingv1.Ingress]
	ConfigMapService          ResourceService[*corev1.ConfigMap]
	SecretService             ResourceService[*corev1.Secret]
	PVCService                ResourceService[*corev1.PersistentVolumeClaim]
	StatefulSetService        ResourceService[*appsv1.StatefulSet]
	JobService                ResourceService[*batchv1.Job]
	CronJobService            ResourceService[*batchv1.CronJob]
	NetworkPolicyService      ResourceService[*networkingv1.NetworkPolicy]
	GatewayClassService       ResourceService[*gatewayv1.GatewayClass]
	GatewayService            ResourceService[*gatewayv1.Gateway]
	HTTPRouteService          ResourceService[*gatewayv1.HTTPRoute]
	StorageClassService       ResourceService[*storagev1.StorageClass]
	ServiceAccountService     ResourceService[*corev1.ServiceAccount]
	RoleResourceService       ResourceService[*rbacv1.Role]
	RoleBindingService        ResourceService[*rbacv1.RoleBinding]
	ClusterRoleService        ResourceService[*rbacv1.ClusterRole]
	ClusterRoleBindingService ResourceService[*rbacv1.ClusterRoleBinding]
	HPAService                ResourceService[*autoscalingv2.HorizontalPodAutoscaler]
	PDBService                ResourceService[*policyv1.PodDisruptionBudget]
	ResourceQuotaService      ResourceService[*corev1.ResourceQuota]
	LimitRangeService         ResourceService[*corev1.LimitRange]

	ReplicaSetService                     ResourceService[*appsv1.ReplicaSet]
	ReplicationControllerService          ResourceService[*corev1.ReplicationController]
	EndpointsService                      ResourceService[*corev1.Endpoints]
	EndpointSliceService                  ResourceService[*discoveryv1.EndpointSlice]
	LeaseService                          ResourceService[*coordinationv1.Lease]
	PodTemplateService                    ResourceService[*corev1.PodTemplate]
	IngressClassService                   ResourceService[*networkingv1.IngressClass]
	ServiceCIDRService                    ResourceService[*networkingv1.ServiceCIDR]
	PriorityClassService                  ResourceService[*schedulingv1.PriorityClass]
	RuntimeClassService                   ResourceService[*nodev1.RuntimeClass]
	MutatingWebhookConfigurationService   ResourceService[*admissionv1.MutatingWebhookConfiguration]
	ValidatingWebhookConfigurationService ResourceService[*admissionv1.ValidatingWebhookConfiguration]
	VolumeAttachmentService               ResourceService[*storagev1.VolumeAttachment]
	CSIDriverService                      ResourceService[*storagev1.CSIDriver]
	CSINodeService                        ResourceService[*storagev1.CSINode]

	// Pod logs and terminal services
	PodLogsService        *PodLogsService
	PodExecService        *PodExecService
	PodPortForwardService *PodPortForwardService
	HelmService           *HelmService
}
