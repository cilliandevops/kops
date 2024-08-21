package app

import (
	"github.com/cilliandevops/kops/server-go/internal/apis/routes"
	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
)

type App struct {
	Engine            *gin.Engine
	DeploymentService *services.DeploymentService
}

// NewApp creates a new instance of the App with the provided DeploymentService.
func NewApp(deploymentService *services.DeploymentService) *App {
	// 初始化 Gin 引擎
	router := gin.Default()

	// 注册 API 路由，并将 DeploymentService 传递给路由
	routes.RegisterK8sRoutes(router, deploymentService)

	return &App{
		Engine:            router,
		DeploymentService: deploymentService,
	}
}

func (a *App) Run(port string) error {
	return a.Engine.Run(port)
}
