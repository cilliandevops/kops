package handlers

import (
	"net/http"

	"github.com/ciliverse/cilikube/internal/service"
	"github.com/ciliverse/cilikube/pkg/k8s"
	"github.com/ciliverse/cilikube/pkg/utils"
	"github.com/gin-gonic/gin"
)

type ApplicationHandler struct {
	svc        *service.ApplicationService
	k8sManager *k8s.ClusterManager
}

func NewApplicationHandler(svc *service.ApplicationService, km *k8s.ClusterManager) *ApplicationHandler {
	return &ApplicationHandler{svc: svc, k8sManager: km}
}

func (h *ApplicationHandler) List(c *gin.Context) {
	client, ok := k8s.GetClientFromQuery(c, h.k8sManager)
	if !ok {
		return
	}
	ns := c.Query("namespace")
	list, err := h.svc.List(client.Clientset, ns)
	if err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "failed to list applications", err.Error())
		return
	}
	utils.ApiSuccess(c, list, "ok")
}

func (h *ApplicationHandler) Get(c *gin.Context) {
	client, ok := k8s.GetClientFromQuery(c, h.k8sManager)
	if !ok {
		return
	}
	item, err := h.svc.Get(client.Clientset, c.Param("namespace"), c.Param("name"))
	if err != nil {
		utils.ApiError(c, http.StatusNotFound, "application not found", err.Error())
		return
	}
	utils.ApiSuccess(c, item, "ok")
}
