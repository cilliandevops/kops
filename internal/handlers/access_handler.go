package handlers

import (
	"net/http"
	"strconv"

	"github.com/ciliverse/cilikube/internal/models"
	"github.com/ciliverse/cilikube/internal/service"
	"github.com/ciliverse/cilikube/pkg/utils"
	"github.com/gin-gonic/gin"
)

type AccessHandler struct {
	svc *service.AccessService
}

func NewAccessHandler(svc *service.AccessService) *AccessHandler {
	return &AccessHandler{svc: svc}
}

func (h *AccessHandler) Me(c *gin.Context) {
	uid, _ := service.UserIDFromContext(c)
	utils.ApiSuccess(c, h.svc.Snapshot(uid, service.RoleFromContext(c)), "ok")
}

func (h *AccessHandler) List(c *gin.Context) {
	list, err := h.svc.ListAll()
	if err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "failed to list grants", err.Error())
		return
	}
	if raw := c.Query("userId"); raw != "" {
		uid, err := strconv.ParseUint(raw, 10, 64)
		if err == nil {
			filtered := list[:0]
			for _, g := range list {
				if g.UserID == uint(uid) {
					filtered = append(filtered, g)
				}
			}
			list = filtered
		}
	}
	utils.ApiSuccess(c, list, "ok")
}

func (h *AccessHandler) Create(c *gin.Context) {
	var req models.AccessGrantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}
	item, err := h.svc.Create(req)
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, "failed to create grant", err.Error())
		return
	}
	utils.ApiSuccess(c, item, "created")
}

func (h *AccessHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, "invalid id", err.Error())
		return
	}
	if err := h.svc.Delete(uint(id)); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "failed to delete grant", err.Error())
		return
	}
	utils.ApiSuccess(c, nil, "deleted")
}
