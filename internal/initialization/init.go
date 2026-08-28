package initialization

import (
	"log"

	"github.com/casbin/casbin/v2"
	"github.com/ciliverse/cilikube/configs"
	"github.com/ciliverse/cilikube/internal/handlers"
	"github.com/ciliverse/cilikube/internal/routes"
	"github.com/ciliverse/cilikube/internal/service"
	"github.com/ciliverse/cilikube/internal/store"
	"github.com/ciliverse/cilikube/pkg/auth"
	"github.com/ciliverse/cilikube/pkg/k8s"
	"github.com/ciliverse/cilikube/pkg/metrics"
	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/runtime"
)

func InitializeServices(k8sManager *k8s.ClusterManager, store store.Store, cfg *configs.Config) *service.AppServices {
	log.Println("initializing service layer...")
	resourceFactory := service.NewResourceServiceFactory()
	resourceFactory.InitializeDefaultServices()
	authService := service.NewAuthService(store, cfg)
	auditService := service.NewAuditService(store, cfg)
	appServices := &service.AppServices{
		ClusterService:     service.NewClusterService(k8sManager, cfg.Kubernetes.Kubeconfig),
		EnvironmentService: service.NewEnvironmentService(store),
		AccessService:      service.NewAccessService(store),
		ApplicationService: service.NewApplicationService(),
		InstallerService:   service.NewInstallerService(cfg),
		NodeMetricsService: service.NewNodeMetricsService(),
		PodMetricsService:  service.NewPodMetricsService(),
		NodeOpsService:     service.NewNodeOpsService(),
		PodLogsService:     service.NewPodLogsService(),
		SummaryService:     service.NewSummaryService(),
		EventService:       service.NewEventService(k8sManager),
		CRDService:         service.NewCRDService(),
		AuthService:        authService,
		OAuthService:       service.NewOAuthService(store, cfg, authService.GetSecurityService()),
		RoleService:        service.NewRoleService(store),
		AuditService:       auditService,
		MonitoringService:  service.NewMonitoringService(store, cfg, auditService),
		PrometheusService:  service.NewPrometheusService(cfg),
	}
	appServices.NavPolicyService = service.NewNavPolicyService(store, appServices.RoleService)
	appServices.TopologyService = service.NewTopologyService(appServices.PrometheusService)
	appServices.TimelineService = service.NewTimelineService(k8sManager, appServices.EventService)
	appServices.TimelineService.Start()
	// PodExecService uses per-request rest.Config (multi-cluster safe)
	appServices.PodExecService = service.NewPodExecService()
	appServices.PodPortForwardService = service.NewPodPortForwardService()
	appServices.HelmService = service.NewHelmService(k8sManager)
	initializeResourceService(resourceFactory, "nodes", &appServices.NodeService)
	initializeResourceService(resourceFactory, "pods", &appServices.PodService)
	initializeResourceService(resourceFactory, "deployments", &appServices.DeploymentService)
	initializeResourceService(resourceFactory, "services", &appServices.ServiceService)
	initializeResourceService(resourceFactory, "daemonsets", &appServices.DaemonSetService)
	initializeResourceService(resourceFactory, "ingresses", &appServices.IngressService)
	initializeResourceService(resourceFactory, "configmaps", &appServices.ConfigMapService)
	initializeResourceService(resourceFactory, "secrets", &appServices.SecretService)
	initializeResourceService(resourceFactory, "persistentvolumeclaims", &appServices.PVCService)
	initializeResourceService(resourceFactory, "persistentvolumes", &appServices.PVService)
	initializeResourceService(resourceFactory, "statefulsets", &appServices.StatefulSetService)
	initializeResourceService(resourceFactory, "jobs", &appServices.JobService)
	initializeResourceService(resourceFactory, "cronjobs", &appServices.CronJobService)
	initializeResourceService(resourceFactory, "networkpolicies", &appServices.NetworkPolicyService)
	initializeResourceService(resourceFactory, "gatewayclasses", &appServices.GatewayClassService)
	initializeResourceService(resourceFactory, "gateways", &appServices.GatewayService)
	initializeResourceService(resourceFactory, "httproutes", &appServices.HTTPRouteService)
	initializeResourceService(resourceFactory, "namespaces", &appServices.NamespaceService)
	initializeResourceService(resourceFactory, "storageclasses", &appServices.StorageClassService)
	initializeResourceService(resourceFactory, "serviceaccounts", &appServices.ServiceAccountService)
	initializeResourceService(resourceFactory, "roles", &appServices.RoleResourceService)
	initializeResourceService(resourceFactory, "rolebindings", &appServices.RoleBindingService)
	initializeResourceService(resourceFactory, "clusterroles", &appServices.ClusterRoleService)
	initializeResourceService(resourceFactory, "clusterrolebindings", &appServices.ClusterRoleBindingService)
	initializeResourceService(resourceFactory, "horizontalpodautoscalers", &appServices.HPAService)
	initializeResourceService(resourceFactory, "poddisruptionbudgets", &appServices.PDBService)
	initializeResourceService(resourceFactory, "resourcequotas", &appServices.ResourceQuotaService)
	initializeResourceService(resourceFactory, "limitranges", &appServices.LimitRangeService)
	initializeResourceService(resourceFactory, "replicasets", &appServices.ReplicaSetService)
	initializeResourceService(resourceFactory, "replicationcontrollers", &appServices.ReplicationControllerService)
	initializeResourceService(resourceFactory, "endpoints", &appServices.EndpointsService)
	initializeResourceService(resourceFactory, "endpointslices", &appServices.EndpointSliceService)
	initializeResourceService(resourceFactory, "leases", &appServices.LeaseService)
	initializeResourceService(resourceFactory, "podtemplates", &appServices.PodTemplateService)
	initializeResourceService(resourceFactory, "ingressclasses", &appServices.IngressClassService)
	initializeResourceService(resourceFactory, "servicecidrs", &appServices.ServiceCIDRService)
	initializeResourceService(resourceFactory, "priorityclasses", &appServices.PriorityClassService)
	initializeResourceService(resourceFactory, "runtimeclasses", &appServices.RuntimeClassService)
	initializeResourceService(resourceFactory, "mutatingwebhookconfigurations", &appServices.MutatingWebhookConfigurationService)
	initializeResourceService(resourceFactory, "validatingwebhookconfigurations", &appServices.ValidatingWebhookConfigurationService)
	initializeResourceService(resourceFactory, "volumeattachments", &appServices.VolumeAttachmentService)
	initializeResourceService(resourceFactory, "csidrivers", &appServices.CSIDriverService)
	initializeResourceService(resourceFactory, "csinodes", &appServices.CSINodeService)
	if appServices.AccessService != nil {
		k8s.SetClusterAccessChecker(func(c *gin.Context, clusterID, namespace string) bool {
			return appServices.AccessService.DecisionFromContext(c).AllowsNamespace(clusterID, namespace)
		})
	}
	return appServices
}

func initializeResourceService[T runtime.Object](factory *service.ResourceServiceFactory, resourceName string, serviceField *service.ResourceService[T]) {
	if svc, ok := factory.GetService(resourceName).(service.ResourceService[T]); ok {
		*serviceField = svc
	} else {
		log.Fatalf("failed to initialize %s service: type assertion failed or service not found", resourceName)
	}
}

// Initialize Handlers function
func InitializeHandlers(router *gin.RouterGroup, services *service.AppServices, k8sManager *k8s.ClusterManager, cfg *configs.Config) {
	// --- 1. Register special routes for non-resource types ---
	routes.RegisterAuthRoutes(router.Group("/auth"), services.AuthService, services.OAuthService)
	routes.RegisterProfileRoutes(router, services.AuthService, services.RoleService)

	// --- 2. Register admin routes ---
	adminGroup := router.Group("/admin")
	routes.RegisterUserManagementRoutes(adminGroup, services.AuthService, services.RoleService)
	routes.RegisterRoleManagementRoutes(adminGroup, services.RoleService)
	if services.NavPolicyService != nil {
		routes.RegisterNavPolicyRoutes(router, adminGroup, services.NavPolicyService, services.RoleService)
	}
	routes.RegisterSystemSettingsRoutes(router, cfg)
	routes.RegisterAIRoutes(router, cfg, k8sManager)
	routes.RegisterClusterRoutes(router, handlers.NewClusterHandler(services.ClusterService, services.AccessService))
	if services.EnvironmentService != nil && services.AccessService != nil {
		routes.RegisterEnvironmentRoutes(router, handlers.NewEnvironmentHandler(services.EnvironmentService, services.AccessService))
	}
	if services.ApplicationService != nil {
		routes.RegisterApplicationRoutes(router, handlers.NewApplicationHandler(services.ApplicationService, k8sManager))
	}
	if services.AccessService != nil {
		routes.RegisterAccessRoutes(router, adminGroup, handlers.NewAccessHandler(services.AccessService))
	}
	routes.RegisterInstallerRoutes(router, handlers.NewInstallerHandler(services.InstallerService))
	routes.KubernetesProxyRoutes(router, handlers.NewProxyHandler(k8sManager))

	// --- Register summary routes ---
	routes.RegisterSummaryRoutes(router, handlers.NewSummaryHandler(services.SummaryService, k8sManager))

	// --- Register event routes ---
	routes.RegisterEventRoutes(router, handlers.NewEventHandler(services.EventService))

	// --- Register CRD routes ---
	routes.SetupCRDRoutes(router, handlers.NewCRDHandler(services.CRDService, k8sManager))

	// --- Register monitoring / prometheus / informer routes ---
	routes.RegisterMonitoringRoutes(router, services.MonitoringService, services.PrometheusService, k8sManager)

	// --- Topology (Radar-style resource + traffic graph) ---
	if services.TopologyService != nil {
		routes.RegisterTopologyRoutes(router, handlers.NewTopologyHandler(services.TopologyService, k8sManager))
	}

	// --- Timeline (status samples + events) ---
	if services.TimelineService != nil {
		routes.RegisterTimelineRoutes(router, handlers.NewTimelineHandler(services.TimelineService, k8sManager))
	}

	// --- Audit log APIs (admin) ---
	if services.AuditService != nil {
		auditHandler := handlers.NewAuditHandler(services.AuditService)
		auditGroup := router.Group("/audit")
		auditGroup.Use(auth.AdminRequiredMiddleware())
		{
			auditGroup.GET("/logs", auditHandler.GetAuditLogs)
			auditGroup.GET("/report", auditHandler.GetAuditReport)
			auditGroup.GET("/metrics", auditHandler.GetSecurityMetrics)
			auditGroup.GET("/geo", auditHandler.GetGeoStats)
		}
	}

	// --- 2. Create Handler instances for all resources ---
	nodesHandler := handlers.NewResourceHandler(services.NodeService, k8sManager, "nodes")
	pvHandler := handlers.NewResourceHandler(services.PVService, k8sManager, "persistentvolumes")
	namespacesHandler := handlers.NewResourceHandler(services.NamespaceService, k8sManager, "namespaces")
	podsHandler := handlers.NewResourceHandler(services.PodService, k8sManager, "pods")
	deploymentsHandler := handlers.NewResourceHandler(services.DeploymentService, k8sManager, "deployments")
	servicesHandler := handlers.NewResourceHandler(services.ServiceService, k8sManager, "services")
	daemonsetsHandler := handlers.NewResourceHandler(services.DaemonSetService, k8sManager, "daemonsets")
	ingressesHandler := handlers.NewResourceHandler(services.IngressService, k8sManager, "ingresses")
	configmapsHandler := handlers.NewResourceHandler(services.ConfigMapService, k8sManager, "configmaps")
	secretsHandler := handlers.NewResourceHandler(services.SecretService, k8sManager, "secrets")
	pvcHandler := handlers.NewResourceHandler(services.PVCService, k8sManager, "persistentvolumeclaims")
	statefulsetsHandler := handlers.NewResourceHandler(services.StatefulSetService, k8sManager, "statefulsets")
	jobsHandler := handlers.NewResourceHandler(services.JobService, k8sManager, "jobs")
	cronJobsHandler := handlers.NewResourceHandler(services.CronJobService, k8sManager, "cronjobs")
	networkPoliciesHandler := handlers.NewResourceHandler(services.NetworkPolicyService, k8sManager, "networkpolicies")
	gatewayClassesHandler := handlers.NewResourceHandler(services.GatewayClassService, k8sManager, "gatewayclasses")
	gatewaysHandler := handlers.NewResourceHandler(services.GatewayService, k8sManager, "gateways")
	httpRoutesHandler := handlers.NewResourceHandler(services.HTTPRouteService, k8sManager, "httproutes")
	storageClassHandler := handlers.NewResourceHandler(services.StorageClassService, k8sManager, "storageclasses")
	serviceAccountHandler := handlers.NewResourceHandler(services.ServiceAccountService, k8sManager, "serviceaccounts")
	k8sRoleHandler := handlers.NewResourceHandler(services.RoleResourceService, k8sManager, "roles")
	roleBindingHandler := handlers.NewResourceHandler(services.RoleBindingService, k8sManager, "rolebindings")
	clusterRoleHandler := handlers.NewResourceHandler(services.ClusterRoleService, k8sManager, "clusterroles")
	clusterRoleBindingHandler := handlers.NewResourceHandler(services.ClusterRoleBindingService, k8sManager, "clusterrolebindings")
	nodeMetricsHandler := handlers.NewNodeMetricsHandler(services.NodeMetricsService, k8sManager)
	nodeOpsHandler := handlers.NewNodeOpsHandler(services.NodeOpsService, k8sManager)
	podMetricsHandler := handlers.NewPodMetricsHandler(services.PodMetricsService, k8sManager)

	// Pod logs and terminal Handler
	podLogsHandler := handlers.NewPodLogsHandler(services.PodLogsService, k8sManager)
	podExecHandler := handlers.NewPodExecHandler(services.PodExecService, k8sManager)
	podPortForwardHandler := handlers.NewPodPortForwardHandler(services.PodPortForwardService, k8sManager)
	hpaHandler := handlers.NewResourceHandler(services.HPAService, k8sManager, "horizontalpodautoscalers")
	pdbHandler := handlers.NewResourceHandler(services.PDBService, k8sManager, "poddisruptionbudgets")
	resourceQuotaHandler := handlers.NewResourceHandler(services.ResourceQuotaService, k8sManager, "resourcequotas")
	limitRangeHandler := handlers.NewResourceHandler(services.LimitRangeService, k8sManager, "limitranges")
	replicaSetHandler := handlers.NewResourceHandler(services.ReplicaSetService, k8sManager, "replicasets")
	replicationControllerHandler := handlers.NewResourceHandler(services.ReplicationControllerService, k8sManager, "replicationcontrollers")
	endpointsHandler := handlers.NewResourceHandler(services.EndpointsService, k8sManager, "endpoints")
	endpointSliceHandler := handlers.NewResourceHandler(services.EndpointSliceService, k8sManager, "endpointslices")
	leaseHandler := handlers.NewResourceHandler(services.LeaseService, k8sManager, "leases")
	podTemplateHandler := handlers.NewResourceHandler(services.PodTemplateService, k8sManager, "podtemplates")
	ingressClassHandler := handlers.NewResourceHandler(services.IngressClassService, k8sManager, "ingressclasses")
	serviceCIDRHandler := handlers.NewResourceHandler(services.ServiceCIDRService, k8sManager, "servicecidrs")
	priorityClassHandler := handlers.NewResourceHandler(services.PriorityClassService, k8sManager, "priorityclasses")
	runtimeClassHandler := handlers.NewResourceHandler(services.RuntimeClassService, k8sManager, "runtimeclasses")
	mutatingWebhookHandler := handlers.NewResourceHandler(services.MutatingWebhookConfigurationService, k8sManager, "mutatingwebhookconfigurations")
	validatingWebhookHandler := handlers.NewResourceHandler(services.ValidatingWebhookConfigurationService, k8sManager, "validatingwebhookconfigurations")
	volumeAttachmentHandler := handlers.NewResourceHandler(services.VolumeAttachmentService, k8sManager, "volumeattachments")
	csiDriverHandler := handlers.NewResourceHandler(services.CSIDriverService, k8sManager, "csidrivers")
	csiNodeHandler := handlers.NewResourceHandler(services.CSINodeService, k8sManager, "csinodes")
	helmHandler := handlers.NewHelmHandler(services.HelmService, k8sManager)

	// a. Cluster-scoped resources
	nodesRoutes := router.Group("/nodes")
	{
		nodesRoutes.GET("", nodesHandler.List)
		nodesRoutes.POST("", nodesHandler.Create)
		// Add metrics route for all nodes
		nodesRoutes.GET("/metrics", nodeMetricsHandler.GetAllNodesMetrics)
		// Operations for individual nodes
		nodeMemberRoutes := nodesRoutes.Group("/:name")
		{
			nodeMemberRoutes.GET("", nodesHandler.Get)
			nodeMemberRoutes.PUT("", nodesHandler.Update)
			nodeMemberRoutes.DELETE("", nodesHandler.Delete)
			nodeMemberRoutes.GET("/watch", nodesHandler.Watch)
			// Register metrics sub-routes for individual node
			nodeMemberRoutes.GET("/metrics", nodeMetricsHandler.GetNodeMetrics)
			// Node lifecycle operations
			nodeMemberRoutes.POST("/cordon", nodeOpsHandler.Cordon)
			nodeMemberRoutes.POST("/uncordon", nodeOpsHandler.Uncordon)
			nodeMemberRoutes.POST("/drain", nodeOpsHandler.Drain)
			nodeMemberRoutes.PUT("/taints", nodeOpsHandler.UpdateTaints)
			nodeMemberRoutes.PUT("/meta", nodeOpsHandler.UpdateMeta)
		}
	}

	pvRoutes := router.Group("/persistentvolumes")
	{
		pvRoutes.GET("", pvHandler.List)
		pvRoutes.POST("", pvHandler.Create)
		pvRoutes.GET("/:name", pvHandler.Get)
		pvRoutes.PUT("/:name", pvHandler.Update)
		pvRoutes.DELETE("/:name", pvHandler.Delete)
		pvRoutes.GET("/:name/watch", pvHandler.Watch)
	}

	registerClusterScopedResource(router, "storageclasses", storageClassHandler)
	registerClusterScopedResource(router, "gatewayclasses", gatewayClassesHandler)
	registerClusterScopedResource(router, "clusterroles", clusterRoleHandler)
	registerClusterScopedResource(router, "clusterrolebindings", clusterRoleBindingHandler)
	registerClusterScopedResource(router, "ingressclasses", ingressClassHandler)
	registerClusterScopedResource(router, "servicecidrs", serviceCIDRHandler)
	registerClusterScopedResource(router, "priorityclasses", priorityClassHandler)
	registerClusterScopedResource(router, "runtimeclasses", runtimeClassHandler)
	registerClusterScopedResource(router, "mutatingwebhookconfigurations", mutatingWebhookHandler)
	registerClusterScopedResource(router, "validatingwebhookconfigurations", validatingWebhookHandler)
	registerClusterScopedResource(router, "volumeattachments", volumeAttachmentHandler)
	registerClusterScopedResource(router, "csidrivers", csiDriverHandler)
	registerClusterScopedResource(router, "csinodes", csiNodeHandler)

	// Cluster-wide list (all namespaces) — empty namespace in client-go lists all.
	// Used by UI "All namespaces" selector. Create/Get/Update remain under /namespaces/:ns/...
	// Pod metrics must be registered before /pods/:name style routes
	router.GET("/pods/metrics", podMetricsHandler.ListPodMetrics)
	registerNamespacedResourceClusterList(router, "pods", podsHandler)
	registerNamespacedResourceClusterList(router, "deployments", deploymentsHandler)
	registerNamespacedResourceClusterList(router, "services", servicesHandler)
	registerNamespacedResourceClusterList(router, "daemonsets", daemonsetsHandler)
	registerNamespacedResourceClusterList(router, "ingresses", ingressesHandler)
	registerNamespacedResourceClusterList(router, "configmaps", configmapsHandler)
	registerNamespacedResourceClusterList(router, "secrets", secretsHandler)
	registerNamespacedResourceClusterList(router, "persistentvolumeclaims", pvcHandler)
	registerNamespacedResourceClusterList(router, "statefulsets", statefulsetsHandler)
	registerNamespacedResourceClusterList(router, "jobs", jobsHandler)
	registerNamespacedResourceClusterList(router, "cronjobs", cronJobsHandler)
	registerNamespacedResourceClusterList(router, "networkpolicies", networkPoliciesHandler)
	registerNamespacedResourceClusterList(router, "gateways", gatewaysHandler)
	registerNamespacedResourceClusterList(router, "httproutes", httpRoutesHandler)
	registerNamespacedResourceClusterList(router, "serviceaccounts", serviceAccountHandler)
	registerNamespacedResourceClusterList(router, "roles", k8sRoleHandler)
	registerNamespacedResourceClusterList(router, "rolebindings", roleBindingHandler)
	registerNamespacedResourceClusterList(router, "horizontalpodautoscalers", hpaHandler)
	registerNamespacedResourceClusterList(router, "poddisruptionbudgets", pdbHandler)
	registerNamespacedResourceClusterList(router, "resourcequotas", resourceQuotaHandler)
	registerNamespacedResourceClusterList(router, "limitranges", limitRangeHandler)
	registerNamespacedResourceClusterList(router, "replicasets", replicaSetHandler)
	registerNamespacedResourceClusterList(router, "replicationcontrollers", replicationControllerHandler)
	registerNamespacedResourceClusterList(router, "endpoints", endpointsHandler)
	registerNamespacedResourceClusterList(router, "endpointslices", endpointSliceHandler)
	registerNamespacedResourceClusterList(router, "leases", leaseHandler)
	registerNamespacedResourceClusterList(router, "podtemplates", podTemplateHandler)

	// Helm releases (requires helm CLI on API host)
	helmRoutes := router.Group("/helm")
	{
		helmRoutes.GET("/releases", helmHandler.ListReleases)
		helmRoutes.GET("/releases/:namespace/:name", helmHandler.GetRelease)
		helmRoutes.POST("/releases", helmHandler.InstallRelease)
		helmRoutes.PUT("/releases/:namespace/:name", helmHandler.UpgradeRelease)
		helmRoutes.POST("/releases/:namespace/:name/rollback", helmHandler.RollbackRelease)
		helmRoutes.DELETE("/releases/:namespace/:name", helmHandler.UninstallRelease)

		// Catalog: repository and chart metadata is host-level, so these need no
		// cluster and serve the marketplace before any cluster is connected.
		helmRoutes.GET("/repos", helmHandler.ListRepos)
		helmRoutes.POST("/repos", helmHandler.AddRepo)
		helmRoutes.POST("/repos/update", helmHandler.UpdateRepos)
		helmRoutes.DELETE("/repos/:name", helmHandler.RemoveRepo)
		helmRoutes.GET("/charts", helmHandler.ListCharts)
		helmRoutes.GET("/chart", helmHandler.GetChart)
	}

	// b. Namespace resources themselves, and all resources nested under them
	namespacesRoutes := router.Group("/namespaces")
	{
		namespacesRoutes.GET("", namespacesHandler.List)
		namespacesRoutes.POST("", namespacesHandler.Create)

		// Operations for individual Namespace
		nsMemberRoutes := namespacesRoutes.Group(":namespace")
		{
			nsMemberRoutes.GET("", namespacesHandler.Get)
			nsMemberRoutes.PUT("", namespacesHandler.Update)
			nsMemberRoutes.DELETE("", namespacesHandler.Delete)

			// Nested resources
			registerResourceInNamespace(nsMemberRoutes, "pods", podsHandler)
			registerResourceInNamespace(nsMemberRoutes, "deployments", deploymentsHandler)
			registerResourceInNamespace(nsMemberRoutes, "services", servicesHandler)
			registerResourceInNamespace(nsMemberRoutes, "daemonsets", daemonsetsHandler)
			registerResourceInNamespace(nsMemberRoutes, "ingresses", ingressesHandler)
			registerResourceInNamespace(nsMemberRoutes, "configmaps", configmapsHandler)
			registerResourceInNamespace(nsMemberRoutes, "secrets", secretsHandler)
			registerResourceInNamespace(nsMemberRoutes, "persistentvolumeclaims", pvcHandler)
			registerResourceInNamespace(nsMemberRoutes, "statefulsets", statefulsetsHandler)
			registerResourceInNamespace(nsMemberRoutes, "jobs", jobsHandler)
			registerResourceInNamespace(nsMemberRoutes, "cronjobs", cronJobsHandler)
			registerResourceInNamespace(nsMemberRoutes, "networkpolicies", networkPoliciesHandler)
			registerResourceInNamespace(nsMemberRoutes, "gateways", gatewaysHandler)
			registerResourceInNamespace(nsMemberRoutes, "httproutes", httpRoutesHandler)
			registerResourceInNamespace(nsMemberRoutes, "serviceaccounts", serviceAccountHandler)
			registerResourceInNamespace(nsMemberRoutes, "roles", k8sRoleHandler)
			registerResourceInNamespace(nsMemberRoutes, "rolebindings", roleBindingHandler)
			registerResourceInNamespace(nsMemberRoutes, "horizontalpodautoscalers", hpaHandler)
			registerResourceInNamespace(nsMemberRoutes, "poddisruptionbudgets", pdbHandler)
			registerResourceInNamespace(nsMemberRoutes, "resourcequotas", resourceQuotaHandler)
			registerResourceInNamespace(nsMemberRoutes, "limitranges", limitRangeHandler)
			registerResourceInNamespace(nsMemberRoutes, "replicasets", replicaSetHandler)
			registerResourceInNamespace(nsMemberRoutes, "replicationcontrollers", replicationControllerHandler)
			registerResourceInNamespace(nsMemberRoutes, "endpoints", endpointsHandler)
			registerResourceInNamespace(nsMemberRoutes, "endpointslices", endpointSliceHandler)
			registerResourceInNamespace(nsMemberRoutes, "leases", leaseHandler)
			registerResourceInNamespace(nsMemberRoutes, "podtemplates", podTemplateHandler)

			// Pod logs, terminal, attach, port-forward
			podsMemberRoutes := nsMemberRoutes.Group("/pods/:name")
			{
				podsMemberRoutes.GET("/logs", podLogsHandler.GetPodLogs)
				podsMemberRoutes.GET("/exec", podExecHandler.ExecPod)
				podsMemberRoutes.GET("/attach", podExecHandler.AttachPod)
				podsMemberRoutes.GET("/portforward", podPortForwardHandler.PortForward)
			}
		}
	}
}

func registerClusterScopedResource[T runtime.Object](router *gin.RouterGroup, resourceName string, handler *handlers.ResourceHandler[T]) {
	if handler == nil {
		return
	}
	routes := router.Group("/" + resourceName)
	{
		routes.GET("", handler.List)
		routes.POST("", handler.Create)
		routes.GET("/:name", handler.Get)
		routes.PUT("/:name", handler.Update)
		routes.DELETE("/:name", handler.Delete)
		routes.GET("/:name/watch", handler.Watch)
	}
}

// registerNamespacedResourceClusterList exposes GET /api/v1/<resource> for all-namespaces listing.
func registerNamespacedResourceClusterList[T runtime.Object](router *gin.RouterGroup, resourceName string, handler *handlers.ResourceHandler[T]) {
	if handler == nil {
		return
	}
	router.Group("/" + resourceName).GET("", handler.List)
}

func registerResourceInNamespace[T runtime.Object](nsRouter *gin.RouterGroup, resourceName string, handler *handlers.ResourceHandler[T]) {
	if handler == nil {
		return
	}

	resourceRoutes := nsRouter.Group("/" + resourceName)
	{
		resourceRoutes.GET("", handler.List)
		resourceRoutes.POST("", handler.Create)

		memberRoutes := resourceRoutes.Group("/:name")
		{
			memberRoutes.GET("", handler.Get)
			memberRoutes.PUT("", handler.Update)
			memberRoutes.PATCH("", handler.Patch)
			memberRoutes.DELETE("", handler.Delete)
			memberRoutes.GET("/watch", handler.Watch)
		}
	}
}

// SetupRouter sets up and returns Gin engine
func SetupRouter(cfg *configs.Config, services *service.AppServices, k8sManager *k8s.ClusterManager, e *casbin.Enforcer) *gin.Engine {
	router := gin.New()
	// Trust local reverse proxies so c.ClientIP() uses X-Forwarded-For / X-Real-IP
	_ = router.SetTrustedProxies([]string{"127.0.0.1", "::1"})
	router.Use(gin.Recovery(), gin.Logger())
	router.Use(metrics.PromMiddleware())

	// Enable session validation for JWT middleware so logout can revoke access
	if services.AuthService != nil && services.AuthService.GetSecurityService() != nil {
		auth.SetSessionValidator(services.AuthService.GetSecurityService())
	}

	// Configure custom CORS middleware, allow all required headers
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// API audit logging (after CORS, before handlers; JWT runs later on protected routes)
	if services.AuditService != nil {
		router.Use(auth.AuditMiddleware(services.AuditService))
	}

	// Public operational endpoints
	router.GET("/health", handlers.HealthCheck)
	router.GET("/ready", handlers.ReadinessCheck)
	router.GET("/live", handlers.LivenessCheck)
	router.GET("/metrics", metrics.PromHandler())
	router.GET("/version", handlers.GetVersion)
	// Public: credentials only when CILIKUBE_SHOWCASE=1 (empty otherwise).
	router.GET("/api/v1/showcase/info", handlers.GetShowcaseInfo)

	// Serve static files for uploaded avatars
	router.Static("/uploads", "./uploads")

	apiV1 := router.Group("/api/v1")
	// Require JWT for all API routes except public auth endpoints
	apiV1.Use(auth.JWTAuthUnless(
		"/api/v1/auth/login",
		"/api/v1/auth/register",
		"/api/v1/auth/oauth/",
		"/api/v1/system/healthz",
		"/api/v1/showcase/info",
	))
	// Default-password users may only change password / read profile / logout until fixed.
	apiV1.Use(auth.RequirePasswordChangedUnless(
		"/api/v1/auth/change-password",
		"/api/v1/auth/logout",
		"/api/v1/auth/profile",
		"/api/v1/auth/profile/detailed",
		"/api/v1/profile/password",
	))
	// Enforce Casbin policies when available
	if e != nil {
		apiV1.Use(auth.NewCasbinBuilder().
			IgnorePath("/api/v1/auth/login").
			IgnorePath("/api/v1/auth/register").
			IgnorePath("/api/v1/auth/oauth/*").
			IgnorePath("/api/v1/system/healthz").
			IgnorePath("/api/v1/showcase/info").
			CasbinMiddleware(e))
	}
	{
		InitializeHandlers(apiV1, services, k8sManager, cfg)
	}

	// Desktop (and optional self-hosted) SPA: serve after API routes.
	RegisterDesktopStatic(router, cfg.Server.WebRoot)

	return router
}
