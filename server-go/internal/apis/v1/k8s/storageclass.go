package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
	storagev1 "k8s.io/api/storage/v1"
)

type StorageClassController struct {
	Service *services.StorageClassService
}

func NewStorageClassController(service *services.StorageClassService) *StorageClassController {
	return &StorageClassController{
		Service: service,
	}
}

func (ctrl *StorageClassController) CreateStorageClass(c *gin.Context) {
	var sc storagev1.StorageClass
	if err := c.ShouldBindJSON(&sc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdSC, err := ctrl.Service.CreateStorageClass(&sc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, createdSC)
}

func (ctrl *StorageClassController) GetStorageClass(c *gin.Context) {
	name := c.Param("name")

	sc, err := ctrl.Service.GetStorageClass(name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, sc)
}

func (ctrl *StorageClassController) UpdateStorageClass(c *gin.Context) {
	var sc storagev1.StorageClass
	if err := c.ShouldBindJSON(&sc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedSC, err := ctrl.Service.UpdateStorageClass(&sc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedSC)
}

func (ctrl *StorageClassController) DeleteStorageClass(c *gin.Context) {
	name := c.Param("name")

	if err := ctrl.Service.DeleteStorageClass(name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "StorageClass deleted successfully"})
}
