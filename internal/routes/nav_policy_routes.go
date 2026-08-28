package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/ciliverse/cilikube/internal/handlers"
	"github.com/ciliverse/cilikube/internal/service"
	"github.com/ciliverse/cilikube/pkg/auth"
)

// RegisterNavPolicyRoutes wires sidebar visibility policy routes.
//
// Reading the caller's own effective policy is open to any signed-in user —
// the sidebar needs it to render. Editing is admin-only.
func RegisterNavPolicyRoutes(router, adminGroup *gin.RouterGroup, navPolicyService *service.NavPolicyService, roleService *service.RoleService) {
	navHandler := handlers.NewNavPolicyHandler(navPolicyService, roleService)

	selfRoutes := router.Group("/nav")
	selfRoutes.Use(auth.JWTAuthMiddleware())
	{
		selfRoutes.GET("/policy", navHandler.GetMyNavPolicy)
	}

	adminRoutes := adminGroup.Group("/nav/policies")
	adminRoutes.Use(auth.JWTAuthMiddleware(), auth.AdminRequiredMiddleware())
	{
		adminRoutes.GET("", navHandler.ListNavPolicies)
		adminRoutes.PUT("/:role", navHandler.SetNavPolicy)
	}
}
