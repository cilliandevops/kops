package app

import (
	"github.com/gin-gonic/gin"
	"k8s.io/client-go/kubernetes"
)

type App struct {
	Engine    *gin.Engine
	K8sClient *kubernetes.Clientset
}

// NewApp creates a new instance of the App with the provided Kubernetes clientset.
func NewApp(k8sClient *kubernetes.Clientset) *App {
	router := gin.Default()
	// 在这里使用 k8sClient 设置API路由或初始化其他组件
	return &App{Engine: router, K8sClient: k8sClient}
}

func (a *App) Run(port string) error {
	return a.Engine.Run(port)
}
