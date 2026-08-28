package handlers

import (
	"net/http"

	"github.com/ciliverse/cilikube/internal/models"
	"github.com/ciliverse/cilikube/internal/service"
	"github.com/ciliverse/cilikube/pkg/utils"
	"github.com/gin-gonic/gin"
)

type EnvironmentHandler struct {
	svc    *service.EnvironmentService
	access *service.AccessService
}

func NewEnvironmentHandler(svc *service.EnvironmentService, access *service.AccessService) *EnvironmentHandler {
	return &EnvironmentHandler{svc: svc, access: access}
}

func (h *EnvironmentHandler) List(c *gin.Context) {
	list, err := h.svc.List(h.access.DecisionFromContext(c))
	if err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "failed to list environments", err.Error())
		return
	}
	utils.ApiSuccess(c, list, "ok")
}

func (h *EnvironmentHandler) Get(c *gin.Context) {
	item, err := h.svc.Get(c.Param("id"), h.access.DecisionFromContext(c))
	if err != nil {
		utils.ApiError(c, http.StatusNotFound, "environment not found", err.Error())
		return
	}
	utils.ApiSuccess(c, item, "ok")
}

func (h *EnvironmentHandler) Create(c *gin.Context) {
	var req models.EnvironmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}
	item, err := h.svc.Create(req)
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, "failed to create environment", err.Error())
		return
	}
	utils.ApiSuccess(c, item, "created")
}

func (h *EnvironmentHandler) Update(c *gin.Context) {
	var req models.EnvironmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "invalid request", err.Error())
		return
	}
	item, err := h.svc.Update(c.Param("id"), req)
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, "failed to update environment", err.Error())
		return
	}
	utils.ApiSuccess(c, item, "updated")
}

func (h *EnvironmentHandler) Delete(c *gin.Context) {
	if err := h.svc.Delete(c.Param("id")); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "failed to delete environment", err.Error())
		return
	}
	utils.ApiSuccess(c, nil, "deleted")
}
