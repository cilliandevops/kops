package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/models/k8s"
	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
)

// DeploymentHandler handles Kubernetes Deployment related requests
type DeploymentHandler struct {
	DeploymentService *services.DeploymentService
}

// NewDeploymentHandler creates a new DeploymentHandler instance
func NewDeploymentHandler(deploymentService *services.DeploymentService) *DeploymentHandler {
	return &DeploymentHandler{
		DeploymentService: deploymentService,
	}
}

// ListDeployments handles the GET /apis/v1/k8s/deployments request
func (h *DeploymentHandler) ListDeployments(c *gin.Context) {
	namespace := c.Query("namespace")
	deployments, err := h.DeploymentService.ListDeployments(c.Request.Context(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, deployments)
}

// GetDeployment handles the GET /apis/v1/k8s/deployments/:namespace/:name request
func (h *DeploymentHandler) GetDeployment(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	deployment, err := h.DeploymentService.GetDeployment(c.Request.Context(), namespace, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, deployment)
}

// CreateDeployment handles the POST /apis/v1/k8s/deployments request
func (h *DeploymentHandler) CreateDeployment(c *gin.Context) {
	var deployment *k8s.Deployment
	if err := c.BindJSON(&deployment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.DeploymentService.CreateDeployment(c.Request.Context(), deployment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, deployment)
}

// UpdateDeployment handles the PUT /apis/v1/k8s/deployments/:namespace/:name request
func (h *DeploymentHandler) UpdateDeployment(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	var deployment *k8s.Deployment
	if err := c.BindJSON(&deployment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	deployment.Name = name
	deployment.Namespace = namespace
	if err := h.DeploymentService.UpdateDeployment(c.Request.Context(), deployment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, deployment)
}

// DeleteDeployment handles the DELETE /apis/v1/k8s/deployments/:namespace/:name request
func (h *DeploymentHandler) DeleteDeployment(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	if err := h.DeploymentService.DeleteDeployment(c.Request.Context(), namespace, name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deployment deleted"})
}
