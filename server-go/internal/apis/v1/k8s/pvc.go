package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
	v1 "k8s.io/api/core/v1"
)

type PVCController struct {
	Service *services.PVCService
}

func NewPVCController(service *services.PVCService) *PVCController {
	return &PVCController{
		Service: service,
	}
}

func (ctrl *PVCController) CreatePVC(c *gin.Context) {
	namespace := c.Param("namespace")
	var pvc v1.PersistentVolumeClaim
	if err := c.ShouldBindJSON(&pvc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdPVC, err := ctrl.Service.CreatePVC(namespace, &pvc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, createdPVC)
}

func (ctrl *PVCController) GetPVC(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	pvc, err := ctrl.Service.GetPVC(namespace, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pvc)
}

func (ctrl *PVCController) UpdatePVC(c *gin.Context) {
	namespace := c.Param("namespace")
	var pvc v1.PersistentVolumeClaim
	if err := c.ShouldBindJSON(&pvc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedPVC, err := ctrl.Service.UpdatePVC(namespace, &pvc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedPVC)
}

func (ctrl *PVCController) DeletePVC(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	if err := ctrl.Service.DeletePVC(namespace, name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "PersistentVolumeClaim deleted successfully"})
}
