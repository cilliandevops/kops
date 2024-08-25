package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
)

type ClusterHandler struct {
	clusterService *services.ClusterService
}

func NewClusterHandler(clusterService *services.ClusterService) *ClusterHandler {
	return &ClusterHandler{
		clusterService: clusterService,
	}
}

func (h *ClusterHandler) GetClusterInfo(c *gin.Context) {
	info, err := h.clusterService.GetClusterInfo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, info)
}

func (h *ClusterHandler) ListNodes(c *gin.Context) {
	nodes, err := h.clusterService.ListNodes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"nodes": nodes})
}

func (h *ClusterHandler) GetNode(c *gin.Context) {
	nodeName := c.Param("name")
	node, err := h.clusterService.GetNode(nodeName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, node)
}

func (h *ClusterHandler) DeleteNode(c *gin.Context) {
	nodeName := c.Param("name")
	err := h.clusterService.DeleteNode(nodeName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Node deleted"})
}
