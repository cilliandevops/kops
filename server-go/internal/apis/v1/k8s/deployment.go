package k8s

import (
	"github.com/gin-gonic/gin"
	"github.com/cilliandevops/kops/server-go/internal/client"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"net/http"
)

func RegisterK8sRoutes(rg *gin.RouterGroup) {
	k8sGroup := rg.Group("/k8s")
	{
		k8sGroup.GET("/deployments", ListDeployments)
	}
}

func ListDeployments(c *gin.Context) {
	// 获取部署列表
	deployments, err := client.Clientset.AppsV1().Deployments("").List(c, metav1.ListOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, deployments)
}
