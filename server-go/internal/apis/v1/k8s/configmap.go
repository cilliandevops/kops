package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
	v1 "k8s.io/api/core/v1"
)

type ConfigMapController struct {
	Service *services.ConfigMapService
}

func NewConfigMapController(service *services.ConfigMapService) *ConfigMapController {
	return &ConfigMapController{
		Service: service,
	}
}

func (ctrl *ConfigMapController) CreateConfigMap(c *gin.Context) {
	var configMap v1.ConfigMap
	if err := c.ShouldBindJSON(&configMap); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	namespace := c.Param("namespace")
	createdConfigMap, err := ctrl.Service.CreateConfigMap(namespace, &configMap)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, createdConfigMap)
}

func (ctrl *ConfigMapController) GetConfigMap(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	configMap, err := ctrl.Service.GetConfigMap(namespace, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, configMap)
}

func (ctrl *ConfigMapController) UpdateConfigMap(c *gin.Context) {
	var configMap v1.ConfigMap
	if err := c.ShouldBindJSON(&configMap); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	namespace := c.Param("namespace")
	updatedConfigMap, err := ctrl.Service.UpdateConfigMap(namespace, &configMap)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedConfigMap)
}

func (ctrl *ConfigMapController) DeleteConfigMap(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	if err := ctrl.Service.DeleteConfigMap(namespace, name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
