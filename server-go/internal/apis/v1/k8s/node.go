package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
	v1 "k8s.io/api/core/v1"
)

type NodeHandler struct {
	service *services.NodeService
}

// NewNodeHandler creates a new NodeHandler
func NewNodeHandler(service *services.NodeService) *NodeHandler {
	return &NodeHandler{
		service: service,
	}
}

// ListNodes handles the request to list all Nodes
func (h *NodeHandler) ListNodes(c *gin.Context) {
	nodes, err := h.service.ListNodes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nodes)
}

// GetNode handles the request to get a specific Node by name
func (h *NodeHandler) GetNode(c *gin.Context) {
	name := c.Param("name")
	node, err := h.service.GetNode(name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, node)
}

// CreateNode handles the request to create a new Node
// Note: This is for demonstration purposes. Normally, Nodes are not created via API.
func (h *NodeHandler) CreateNode(c *gin.Context) {
	var node v1.Node
	if err := c.ShouldBindJSON(&node); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdNode, err := h.service.CreateNode(&node)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, createdNode)
}

// DeleteNode handles the request to delete a Node by name
func (h *NodeHandler) DeleteNode(c *gin.Context) {
	name := c.Param("name")
	if err := h.service.DeleteNode(name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
