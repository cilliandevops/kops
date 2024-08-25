package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
)

type NamespaceHandler struct {
	service *services.NamespaceService
}

// NewNamespaceHandler creates a new NamespaceHandler
func NewNamespaceHandler(service *services.NamespaceService) *NamespaceHandler {
	return &NamespaceHandler{
		service: service,
	}
}

// ListNamespaces handles GET requests for listing namespaces
func (h *NamespaceHandler) ListNamespaces(c *gin.Context) {
	namespaces, err := h.service.ListNamespaces()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, namespaces)
}

// GetNamespace handles GET requests for retrieving a single namespace
func (h *NamespaceHandler) GetNamespace(c *gin.Context) {
	name := c.Param("name")
	namespace, err := h.service.GetNamespace(name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, namespace)
}

// CreateNamespace handles POST requests for creating a namespace
func (h *NamespaceHandler) CreateNamespace(c *gin.Context) {
	var req struct {
		Name   string            `json:"name" binding:"required"`
		Labels map[string]string `json:"labels"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	namespace, err := h.service.CreateNamespace(req.Name, req.Labels)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, namespace)
}

// DeleteNamespace handles DELETE requests for deleting a namespace
func (h *NamespaceHandler) DeleteNamespace(c *gin.Context) {
	name := c.Param("name")
	if err := h.service.DeleteNamespace(name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
