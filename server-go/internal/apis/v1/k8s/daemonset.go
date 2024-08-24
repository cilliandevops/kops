package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
	appsv1 "k8s.io/api/apps/v1"
)

// DaemonSetHandler 处理与 DaemonSet 相关的请求
type DaemonSetHandler struct {
	daemonSetService *services.DaemonSetService
}

// NewDaemonSetHandler 创建一个新的 DaemonSetHandler 实例
func NewDaemonSetHandler(daemonSetService *services.DaemonSetService) *DaemonSetHandler {
	return &DaemonSetHandler{daemonSetService: daemonSetService}
}

// ListDaemonSets 处理列出指定命名空间中的 DaemonSets 的请求
func (h *DaemonSetHandler) ListDaemonSets(c *gin.Context) {
	namespace := c.Param("namespace")
	daemonsets, err := h.daemonSetService.ListDaemonSets(namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, daemonsets)
}

// GetDaemonSet 处理获取指定 DaemonSet 的请求
func (h *DaemonSetHandler) GetDaemonSet(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	daemonset, err := h.daemonSetService.GetDaemonSet(namespace, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, daemonset)
}

// CreateDaemonSet 处理创建 DaemonSet 的请求
func (h *DaemonSetHandler) CreateDaemonSet(c *gin.Context) {
	namespace := c.Param("namespace")
	var daemonSet appsv1.DaemonSet
	if err := c.ShouldBindJSON(&daemonSet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdDaemonSet, err := h.daemonSetService.CreateDaemonSet(namespace, &daemonSet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, createdDaemonSet)
}

// UpdateDaemonSet 处理更新 DaemonSet 的请求
func (h *DaemonSetHandler) UpdateDaemonSet(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	var daemonSet appsv1.DaemonSet
	if err := c.ShouldBindJSON(&daemonSet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	daemonSet.Name = name
	updatedDaemonSet, err := h.daemonSetService.UpdateDaemonSet(namespace, &daemonSet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updatedDaemonSet)
}

// DeleteDaemonSet 处理删除 DaemonSet 的请求
func (h *DaemonSetHandler) DeleteDaemonSet(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	if err := h.daemonSetService.DeleteDaemonSet(namespace, name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "DaemonSet deleted successfully"})
}
