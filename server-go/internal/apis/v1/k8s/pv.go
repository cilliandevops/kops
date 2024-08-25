package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
	v1 "k8s.io/api/core/v1"
)

type PVController struct {
	Service *services.PVService
}

func NewPVController(service *services.PVService) *PVController {
	return &PVController{
		Service: service,
	}
}

func (ctrl *PVController) CreatePV(c *gin.Context) {
	var pv v1.PersistentVolume
	if err := c.ShouldBindJSON(&pv); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdPV, err := ctrl.Service.CreatePV(&pv)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, createdPV)
}

func (ctrl *PVController) GetPV(c *gin.Context) {
	name := c.Param("name")

	pv, err := ctrl.Service.GetPV(name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pv)
}

func (ctrl *PVController) UpdatePV(c *gin.Context) {
	var pv v1.PersistentVolume
	if err := c.ShouldBindJSON(&pv); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedPV, err := ctrl.Service.UpdatePV(&pv)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedPV)
}

func (ctrl *PVController) DeletePV(c *gin.Context) {
	name := c.Param("name")

	if err := ctrl.Service.DeletePV(name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "PersistentVolume deleted successfully"})
}
