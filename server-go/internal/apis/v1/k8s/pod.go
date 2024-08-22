package k8s

import (
	"net/http"

	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/gin-gonic/gin"
	corev1 "k8s.io/api/core/v1"
)

type PodController struct {
	PodService *services.PodService
}

func NewPodController(podService *services.PodService) *PodController {
	return &PodController{PodService: podService}
}

func (pc *PodController) ListPods(c *gin.Context) {
	namespace := c.Param("namespace")
	pods, err := pc.PodService.ListPods(namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pods)
}

func (pc *PodController) GetPod(c *gin.Context) {
	namespace := c.Param("namespace")
	podName := c.Param("name")
	pod, err := pc.PodService.GetPod(namespace, podName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pod)
}

func (pc *PodController) CreatePod(c *gin.Context) {
	namespace := c.Param("namespace")
	var pod corev1.Pod
	if err := c.ShouldBindJSON(&pod); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	createdPod, err := pc.PodService.CreatePod(namespace, &pod)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, createdPod)
}

func (pc *PodController) DeletePod(c *gin.Context) {
	namespace := c.Param("namespace")
	podName := c.Param("name")
	if err := pc.PodService.DeletePod(namespace, podName); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
