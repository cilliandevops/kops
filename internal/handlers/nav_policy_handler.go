package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ciliverse/cilikube/internal/service"
	"github.com/ciliverse/cilikube/pkg/utils"
)

// NavPolicyHandler exposes per-role sidebar visibility policies.
type NavPolicyHandler struct {
	navPolicyService *service.NavPolicyService
	roleService      *service.RoleService
}

func NewNavPolicyHandler(navPolicyService *service.NavPolicyService, roleService *service.RoleService) *NavPolicyHandler {
	return &NavPolicyHandler{navPolicyService: navPolicyService, roleService: roleService}
}

type setNavPolicyRequest struct {
	HiddenGroups []string `json:"hidden_groups"`
	HiddenItems  []string `json:"hidden_items"`
}

// GetMyNavPolicy returns the merged policy for the calling user's roles.
func (h *NavPolicyHandler) GetMyNavPolicy(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ApiError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}
	uid, ok := userID.(uint)
	if !ok {
		utils.ApiError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	roles, err := h.roleService.GetUserRoles(uid)
	if err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "Failed to get user roles", err.Error())
		return
	}
	roleNames := make([]string, 0, len(roles))
	for _, role := range roles {
		roleNames = append(roleNames, role.Name)
	}

	policy, err := h.navPolicyService.EffectiveForRoles(roleNames)
	if err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "Failed to resolve nav policy", err.Error())
		return
	}
	utils.ApiSuccess(c, policy, "Nav policy retrieved successfully")
}

// ListNavPolicies returns every stored per-role policy (admin only).
func (h *NavPolicyHandler) ListNavPolicies(c *gin.Context) {
	policies, err := h.navPolicyService.ListPolicies()
	if err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "Failed to list nav policies", err.Error())
		return
	}
	utils.ApiSuccess(c, policies, "Nav policies retrieved successfully")
}

// SetNavPolicy replaces one role's policy (admin only).
func (h *NavPolicyHandler) SetNavPolicy(c *gin.Context) {
	roleName := c.Param("role")
	var req setNavPolicyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "Invalid request body", err.Error())
		return
	}

	policy, err := h.navPolicyService.SetPolicy(roleName, req.HiddenGroups, req.HiddenItems)
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, "Failed to save nav policy", err.Error())
		return
	}
	utils.ApiSuccess(c, policy, "Nav policy saved successfully")
}
