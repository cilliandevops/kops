package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
	appsv1 "k8s.io/api/apps/v1"
)

type StatefulSetHandler struct {
	service *services.StatefulSetService
}

func NewStatefulSetHandler(service *services.StatefulSetService) *StatefulSetHandler {
	return &StatefulSetHandler{
		service: service,
	}
}

func (h *StatefulSetHandler) ListStatefulSets(c *gin.Context) {
	namespace := c.Param("namespace")
	statefulSets, err := h.service.ListStatefulSets(namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, statefulSets)
}

func (h *StatefulSetHandler) GetStatefulSet(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	statefulSet, err := h.service.GetStatefulSet(namespace, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, statefulSet)
}

func (h *StatefulSetHandler) CreateStatefulSet(c *gin.Context) {
	namespace := c.Param("namespace")
	var statefulSet appsv1.StatefulSet
	if err := c.ShouldBindJSON(&statefulSet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	createdStatefulSet, err := h.service.CreateStatefulSet(namespace, &statefulSet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, createdStatefulSet)
}

func (h *StatefulSetHandler) UpdateStatefulSet(c *gin.Context) {
	namespace := c.Param("namespace")
	var statefulSet appsv1.StatefulSet
	if err := c.ShouldBindJSON(&statefulSet); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updatedStatefulSet, err := h.service.UpdateStatefulSet(namespace, &statefulSet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updatedStatefulSet)
}

func (h *StatefulSetHandler) DeleteStatefulSet(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")
	if err := h.service.DeleteStatefulSet(namespace, name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
