package routes

import (
	"github.com/ciliverse/cilikube/internal/handlers"
	"github.com/ciliverse/cilikube/pkg/auth"
	"github.com/gin-gonic/gin"
)

func RegisterEnvironmentRoutes(router *gin.RouterGroup, h *handlers.EnvironmentHandler) {
	g := router.Group("/environments")
	{
		g.GET("", h.List)
		g.POST("", h.Create)
		g.GET("/:id", h.Get)
		g.PUT("/:id", h.Update)
		g.DELETE("/:id", h.Delete)
	}
}

func RegisterApplicationRoutes(router *gin.RouterGroup, h *handlers.ApplicationHandler) {
	g := router.Group("/applications")
	{
		g.GET("", h.List)
		g.GET("/:namespace/:name", h.Get)
	}
}

func RegisterAccessRoutes(router *gin.RouterGroup, admin *gin.RouterGroup, h *handlers.AccessHandler) {
	router.GET("/me/access", h.Me)
	g := admin.Group("/access-grants")
	g.Use(auth.AdminRequiredMiddleware())
	{
		g.GET("", h.List)
		g.POST("", h.Create)
		g.DELETE("/:id", h.Delete)
	}
}
