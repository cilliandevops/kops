package routes

import (
	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/cilliandevops/kops/server-go/internal/apis/v1/k8s"
	"github.com/gin-gonic/gin"
)

// RegisterK8sRoutes registers the routes for the Kubernetes operations
func RegisterK8sRoutes(r *gin.Engine, deploymentService *services.DeploymentService, podService *services.PodService, serviceService *services.ServiceService) {

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
}
