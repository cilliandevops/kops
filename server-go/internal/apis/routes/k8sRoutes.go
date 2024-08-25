package routes

import (
	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/cilliandevops/kops/server-go/internal/apis/v1/k8s"
	"github.com/gin-gonic/gin"
)

// RegisterK8sRoutes registers the routes for the Kubernetes operations
func RegisterK8sRoutes(
	r *gin.Engine,
	deploymentService *services.DeploymentService,
	podService *services.PodService,
	serviceService *services.ServiceService,
	daemonSetService *services.DaemonSetService,
	statefulSetService *services.StatefulSetService,
	nodeService *services.NodeService,
	clusterService *services.ClusterService,
	ingressService *services.IngressService,
	configMapService *services.ConfigMapService,
	secretService *services.SecretService,
	namespaceService *services.NamespaceService,
	pvService *services.PVService,
	pvcService *services.PVCService,
	storageClassService *services.StorageClassService) {

	v1 := r.Group("/apis/v1/k8s")
	// v1.Use(middlewares.AuthMiddleware)

	deploymentHandler := k8s.NewDeploymentHandler(deploymentService)
	v1.GET("/deployments", deploymentHandler.ListDeployments)
	v1.GET("/deployments/:namespace/:name", deploymentHandler.GetDeployment)
	v1.POST("/deployments", deploymentHandler.CreateDeployment)
	v1.PUT("/deployments/:namespace/:name", deploymentHandler.UpdateDeployment)
	v1.DELETE("/deployments/:namespace/:name", deploymentHandler.DeleteDeployment)
	// Pod routes
	podHandler := k8s.NewPodController(podService)
	v1.GET("/pods/:namespace", podHandler.ListPods)
	v1.GET("/pods/:namespace/:name", podHandler.GetPod)
	v1.POST("/pods/:namespace", podHandler.CreatePod)
	v1.DELETE("/pods/:namespace/:name", podHandler.DeletePod)
	// Service routes
	serviceHandler := k8s.NewServiceHandler(serviceService)
	v1.GET("/services", serviceHandler.ListAllServices) // 新增：列出所有 Services
	v1.GET("/services/:namespace", serviceHandler.ListServices)
	v1.GET("/services/:namespace/:name", serviceHandler.GetService)
	v1.POST("/services/:namespace", serviceHandler.CreateService)
	v1.DELETE("/services/:namespace/:name", serviceHandler.DeleteService)

	// DaemonSet routes
	daemonSetHandler := k8s.NewDaemonSetHandler(daemonSetService)
	v1.GET("/daemonsets", daemonSetHandler.ListDaemonSets)
	v1.GET("/daemonsets/:namespace/:name", daemonSetHandler.GetDaemonSet)
	v1.POST("/daemonsets", daemonSetHandler.CreateDaemonSet)
	v1.PUT("/daemonsets/:namespace/:name", daemonSetHandler.UpdateDaemonSet)
	v1.DELETE("/daemonsets/:namespace/:name", daemonSetHandler.DeleteDaemonSet)

	// StatefulSet 路由
	statefulSetHandler := k8s.NewStatefulSetHandler(statefulSetService)
	v1.GET("/statefulsets/:namespace", statefulSetHandler.ListStatefulSets)
	v1.GET("/statefulsets/:namespace/:name", statefulSetHandler.GetStatefulSet)
	v1.POST("/statefulsets/:namespace", statefulSetHandler.CreateStatefulSet)
	v1.PUT("/statefulsets/:namespace/:name", statefulSetHandler.UpdateStatefulSet)
	v1.DELETE("/statefulsets/:namespace/:name", statefulSetHandler.DeleteStatefulSet)

	// Node 路由
	nodeHandler := k8s.NewNodeHandler(nodeService)
	v1.GET("/nodes", nodeHandler.ListNodes)
	v1.GET("/nodes/:name", nodeHandler.GetNode)
	v1.POST("/nodes", nodeHandler.CreateNode)
	v1.DELETE("/nodes/:name", nodeHandler.DeleteNode)

	// 集群信息相关路由
	clusterHandler := k8s.NewClusterHandler(clusterService)
	v1.GET("/cluster/info", clusterHandler.GetClusterInfo)

	ingressHandler := k8s.NewIngressHandler(ingressService)
	v1.GET("/ingresses/:namespace", ingressHandler.ListIngresses)
	v1.GET("/ingresses/:namespace/:name", ingressHandler.GetIngress)
	v1.POST("/ingresses/:namespace", ingressHandler.CreateIngress)
	v1.DELETE("/ingresses/:namespace/:name", ingressHandler.DeleteIngress)
	// ConfigMap 路由
	configMapController := k8s.NewConfigMapController(configMapService)
	v1.POST("/namespaces/:namespace/configmaps", configMapController.CreateConfigMap)
	v1.GET("/namespaces/:namespace/configmaps/:name", configMapController.GetConfigMap)
	v1.PUT("/namespaces/:namespace/configmaps/:name", configMapController.UpdateConfigMap)
	v1.DELETE("/namespaces/:namespace/configmaps/:name", configMapController.DeleteConfigMap)

	// Secret 路由
	secretController := k8s.NewSecretController(secretService)
	v1.POST("/namespaces/:namespace/secrets", secretController.CreateSecret)
	v1.GET("/namespaces/:namespace/secrets/:name", secretController.GetSecret)
	v1.PUT("/namespaces/:namespace/secrets/:name", secretController.UpdateSecret)
	v1.DELETE("/namespaces/:namespace/secrets/:name", secretController.DeleteSecret)

	// Namespace routes
	namespaceHandler := k8s.NewNamespaceHandler(namespaceService)
	v1.GET("/namespace", namespaceHandler.ListNamespaces)
	v1.GET("/namespace/:namespaces", namespaceHandler.GetNamespace)
	v1.POST("/namespace", namespaceHandler.CreateNamespace)
	v1.DELETE("/namespace/:namespaces", namespaceHandler.DeleteNamespace)

	// Persistent Volume 路由
	pvController := k8s.NewPVController(pvService)
	v1.POST("/persistentvolumes", pvController.CreatePV)
	v1.GET("/persistentvolumes/:name", pvController.GetPV)
	v1.PUT("/persistentvolumes/:name", pvController.UpdatePV)
	v1.DELETE("/persistentvolumes/:name", pvController.DeletePV)

	// Persistent Volume Claim 路由
	pvcController := k8s.NewPVCController(pvcService)
	v1.POST("/namespaces/:namespace/persistentvolumeclaims", pvcController.CreatePVC)
	v1.GET("/namespaces/:namespace/persistentvolumeclaims/:name", pvcController.GetPVC)
	v1.PUT("/namespaces/:namespace/persistentvolumeclaims/:name", pvcController.UpdatePVC)
	v1.DELETE("/namespaces/:namespace/persistentvolumeclaims/:name", pvcController.DeletePVC)

	// StorageClass 路由
	storageClassController := k8s.NewStorageClassController(storageClassService)
	v1.POST("/storageclasses", storageClassController.CreateStorageClass)
	v1.GET("/storageclasses/:name", storageClassController.GetStorageClass)
	v1.PUT("/storageclasses/:name", storageClassController.UpdateStorageClass)
	v1.DELETE("/storageclasses/:name", storageClassController.DeleteStorageClass)
}
