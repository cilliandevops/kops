package app

import (
	"github.com/cilliandevops/kops/server-go/internal/apis/routes"
	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
)

type App struct {
	Engine             *gin.Engine
	DeploymentService  *services.DeploymentService
	PodService         *services.PodService
	ServiceService     *services.ServiceService
	DaemonSetService   *services.DaemonSetService
	StatefulSetService *services.StatefulSetService
	NodeService        *services.NodeService
	ClusterService     *services.ClusterService
	IngressService     *services.IngressService
	ConfigMapService   *services.ConfigMapService
	SecretService      *services.SecretService
	NamespaceService   *services.NamespaceService
	PVService          *services.PVService
	PVCService         *services.PVCService
	SCService          *services.StorageClassService
}

// NewApp creates a new instance of the App with the provided DeploymentService.
func NewApp(
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
	scService *services.StorageClassService,
) *App {
	gin.SetMode(gin.DebugMode)
	// 初始化 Gin 引擎
	router := gin.Default()

	// 注册 API 路由，并将 DeploymentService 传递给路由
	routes.RegisterK8sRoutes(
		router,
		deploymentService,
		podService,
		serviceService,
		daemonSetService,
		statefulSetService,
		nodeService,
		clusterService,
		ingressService,
		configMapService,
		secretService,
		namespaceService,
		pvService,
		pvcService,
		scService)

	return &App{
		Engine:             router,
		DeploymentService:  deploymentService,
		PodService:         podService,
		ServiceService:     serviceService,
		DaemonSetService:   daemonSetService,
		StatefulSetService: statefulSetService,
		NodeService:        nodeService,
		ClusterService:     clusterService,
		IngressService:     ingressService,
		ConfigMapService:   configMapService,
		SecretService:      secretService,
		NamespaceService:   namespaceService,
		PVService:          pvService,
		PVCService:         pvcService,
		SCService:          scService,
	}
}

func (a *App) Run(port string) error {
	return a.Engine.Run(port)
}
