package main

import (
	"log"

	"github.com/cilliandevops/kops/server-go/config"
	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/cilliandevops/kops/server-go/internal/app"
)

func main() {
	// 加载配置
	config.LoadConfig()

	// 初始化 K8s 客户端
	kubeconfig := config.Cfg.K8s.ConfigPath
	deploymentService, err := services.NewDeploymentService(kubeconfig)
	if err != nil {
		log.Fatalf("Failed to create DeploymentService: %v", err)
	}

	// 初始化应用程序
	app := app.NewApp(deploymentService)

	// 启动服务器
	if err := app.Run(config.Cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
