package routes

import (
	"github.com/cilliandevops/kops/server-go/api/controllers"
	"github.com/cilliandevops/kops/server-go/api/middlewares"
	"github.com/gin-gonic/gin"
)

func SetupUserRoutes(r *gin.Engine) {
	user := r.Group("/api/user")
	{
		user.Use(middlewares.AuthMiddleware())
		user.GET("/profile", controllers.GetUserProfile)
		// 其他用户相关路由
	}
}
