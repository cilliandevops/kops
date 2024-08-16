package routes

import (
	"github.com/cilliandevops/kops/api/server-go/controllers"
	"github.com/cilliandevops/kops/server-go/api/middlewares"
	"github.com/gin-gonic/gin"
)

func SetupK8sRoutes(r *gin.Engine) {
	k8s := r.Group("/api/k8s")
	{
		k8s.Use(middlewares.AuthMiddleware())
		k8s.GET("/resources", controllers.GetK8sResources)
		// 其他 Kubernetes 相关路由
	}
}
