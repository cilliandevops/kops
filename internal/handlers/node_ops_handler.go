package handlers

import (
	"net/http"

	"github.com/ciliverse/cilikube/internal/service"
	"github.com/ciliverse/cilikube/pkg/k8s"
	"github.com/ciliverse/cilikube/pkg/utils"
	"github.com/gin-gonic/gin"
	corev1 "k8s.io/api/core/v1"
)

// NodeOpsHandler exposes node lifecycle operations: cordon/uncordon, drain, taints, labels.
type NodeOpsHandler struct {
	service        *service.NodeOpsService
	clusterManager *k8s.ClusterManager
}

func NewNodeOpsHandler(svc *service.NodeOpsService, k8sManager *k8s.ClusterManager) *NodeOpsHandler {
	return &NodeOpsHandler{service: svc, clusterManager: k8sManager}
}

func (h *NodeOpsHandler) resolve(c *gin.Context) (*k8s.Client, string, bool) {
	k8sClient, ok := k8s.GetClientFromQuery(c, h.clusterManager)
	if !ok {
		return nil, "", false
	}
	name := c.Param("name")
	if name == "" {
		utils.ApiError(c, http.StatusBadRequest, "node name cannot be empty", "")
		return nil, "", false
	}
	return k8sClient, name, true
}

// Cordon marks the node unschedulable.
func (h *NodeOpsHandler) Cordon(c *gin.Context) {
	h.setSchedulable(c, true)
}

// Uncordon marks the node schedulable again.
func (h *NodeOpsHandler) Uncordon(c *gin.Context) {
	h.setSchedulable(c, false)
}

func (h *NodeOpsHandler) setSchedulable(c *gin.Context, unschedulable bool) {
	k8sClient, name, ok := h.resolve(c)
	if !ok {
		return
	}
	node, err := h.service.SetUnschedulable(c.Request.Context(), k8sClient.Clientset, name, unschedulable)
	if err != nil {
		utils.ApiError(c, http.StatusInternalServerError, "failed to update node scheduling", err.Error())
		return
	}
	msg := "node uncordoned"
	if unschedulable {
		msg = "node cordoned"
	}
	utils.ApiSuccess(c, node, msg)
}

type drainRequest struct {
	GracePeriodSeconds int64 `json:"gracePeriodSeconds"`
	DeleteEmptyDirData bool  `json:"deleteEmptyDirData"`
	IgnoreDaemonSets   bool  `json:"ignoreDaemonSets"`
	Force              bool  `json:"force"`
	TimeoutSeconds     int64 `json:"timeoutSeconds"`
	DryRun             bool  `json:"dryRun"`
}

// Drain cordons the node and evicts its pods.
func (h *NodeOpsHandler) Drain(c *gin.Context) {
	k8sClient, name, ok := h.resolve(c)
	if !ok {
		return
	}
	var req drainRequest
	// An empty body is a valid "use the defaults" drain.
	if c.Request.ContentLength > 0 {
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.ApiError(c, http.StatusBadRequest, "invalid request body", err.Error())
			return
		}
	} else {
		req.IgnoreDaemonSets = true
		req.GracePeriodSeconds = 30
	}
	result, err := h.service.Drain(c.Request.Context(), k8sClient.Clientset, name, service.DrainOptions{
		GracePeriodSeconds: req.GracePeriodSeconds,
		DeleteEmptyDirData: req.DeleteEmptyDirData,
		IgnoreDaemonSets:   req.IgnoreDaemonSets,
		Force:              req.Force,
		TimeoutSeconds:     req.TimeoutSeconds,
		DryRun:             req.DryRun,
	})
	if err != nil {
		// Blocking pods are a user-fixable precondition, not a server fault.
		utils.ApiError(c, http.StatusBadRequest, "drain aborted", err.Error())
		return
	}
	utils.ApiSuccess(c, result, "drain completed")
}

type taintsRequest struct {
	Taints []corev1.Taint `json:"taints"`
}

// UpdateTaints replaces the node's taints.
func (h *NodeOpsHandler) UpdateTaints(c *gin.Context) {
	k8sClient, name, ok := h.resolve(c)
	if !ok {
		return
	}
	var req taintsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "invalid request body", err.Error())
		return
	}
	node, err := h.service.UpdateTaints(c.Request.Context(), k8sClient.Clientset, name, req.Taints)
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, "failed to update taints", err.Error())
		return
	}
	utils.ApiSuccess(c, node, "taints updated")
}

type metaRequest struct {
	Labels            map[string]string `json:"labels"`
	RemoveLabels      []string          `json:"removeLabels"`
	Annotations       map[string]string `json:"annotations"`
	RemoveAnnotations []string          `json:"removeAnnotations"`
}

// UpdateMeta merges node labels and annotations.
func (h *NodeOpsHandler) UpdateMeta(c *gin.Context) {
	k8sClient, name, ok := h.resolve(c)
	if !ok {
		return
	}
	var req metaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, "invalid request body", err.Error())
		return
	}
	node, err := h.service.UpdateMeta(
		c.Request.Context(), k8sClient.Clientset, name,
		req.Labels, req.RemoveLabels, req.Annotations, req.RemoveAnnotations,
	)
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, "failed to update node metadata", err.Error())
		return
	}
	utils.ApiSuccess(c, node, "node metadata updated")
}
