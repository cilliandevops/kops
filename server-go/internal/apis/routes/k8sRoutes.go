package routes

import (
	"github.com/cilliandevops/kops/server-go/internal/apis/v1/k8s"
	"github.com/gin-gonic/gin"
	"log"
)

func RegisterRoutes(r *gin.Engine) {
	v1:= r.Group("/apis/v1")
	{
		// k8s.Use(middlewares.AuthMiddleware())
		// k8s.GET("/resources", controllers.GetK8sResources)
		// 其他 Kubernetes 相关路由
		log.Println("Registering /apis/v1/k8s routes")
		k8s.RegisterK8sRoutes(v1)
	}
}
