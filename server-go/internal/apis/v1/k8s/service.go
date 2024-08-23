package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
	v1 "k8s.io/api/core/v1"
)

// ServiceHandler 处理与 Service 相关的请求
type ServiceHandler struct {
	serviceService *services.ServiceService
}

// NewServiceHandler 创建一个新的 ServiceHandler 实例
func NewServiceHandler(serviceService *services.ServiceService) *ServiceHandler {
	return &ServiceHandler{serviceService: serviceService}
}

// ListServices 处理列出 Services 的请求
func (h *ServiceHandler) ListServices(c *gin.Context) {
	namespace := c.Param("namespace")
	services, err := h.serviceService.ListServices(namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, services)
}

// ListAllServices 处理列出所有 Services 的请求
func (h *ServiceHandler) ListAllServices(c *gin.Context) {
	services, err := h.serviceService.ListAllServices()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, services)
}

// GetService 处理获取指定 Service 的请求
func (h *ServiceHandler) GetService(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	service, err := h.serviceService.GetService(namespace, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, service)
}

// CreateService 处理创建 Service 的请求
func (h *ServiceHandler) CreateService(c *gin.Context) {
	namespace := c.Param("namespace")
	var service v1.Service
	if err := c.ShouldBindJSON(&service); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdService, err := h.serviceService.CreateService(namespace, &service)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, createdService)
}

// DeleteService 处理删除 Service 的请求
func (h *ServiceHandler) DeleteService(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	if err := h.serviceService.DeleteService(namespace, name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Service deleted successfully"})
}
