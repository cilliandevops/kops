package routes

import (
	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/cilliandevops/kops/server-go/internal/apis/v1/k8s"
	"github.com/gin-gonic/gin"
)

// RegisterK8sRoutes registers the routes for the Kubernetes operations
func RegisterK8sRoutes(r *gin.Engine, deploymentService *services.DeploymentService) {
	v1 := r.Group("/apis/v1/k8s")
	// v1.Use(middlewares.AuthMiddleware)

	deploymentHandler := k8s.NewDeploymentHandler(deploymentService)
	v1.GET("/deployments", deploymentHandler.ListDeployments)
	v1.GET("/deployments/:namespace/:name", deploymentHandler.GetDeployment)
	v1.POST("/deployments", deploymentHandler.CreateDeployment)
	v1.PUT("/deployments/:namespace/:name", deploymentHandler.UpdateDeployment)
	v1.DELETE("/deployments/:namespace/:name", deploymentHandler.DeleteDeployment)
}
