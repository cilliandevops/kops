package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
	v1 "k8s.io/api/core/v1"
)

type SecretController struct {
	Service *services.SecretService
}

func NewSecretController(service *services.SecretService) *SecretController {
	return &SecretController{
		Service: service,
	}
}

func (ctrl *SecretController) CreateSecret(c *gin.Context) {
	var secret v1.Secret
	if err := c.ShouldBindJSON(&secret); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	namespace := c.Param("namespace")
	createdSecret, err := ctrl.Service.CreateSecret(namespace, &secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, createdSecret)
}

func (ctrl *SecretController) GetSecret(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	secret, err := ctrl.Service.GetSecret(namespace, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, secret)
}

func (ctrl *SecretController) UpdateSecret(c *gin.Context) {
	var secret v1.Secret
	if err := c.ShouldBindJSON(&secret); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	namespace := c.Param("namespace")
	updatedSecret, err := ctrl.Service.UpdateSecret(namespace, &secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedSecret)
}

func (ctrl *SecretController) DeleteSecret(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	if err := ctrl.Service.DeleteSecret(namespace, name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Secret deleted successfully"})
}
