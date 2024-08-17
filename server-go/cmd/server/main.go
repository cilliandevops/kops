// cmd/server/main.go
package main

import (
	"log"

	"github.com/cilliandevops/kops/server-go/config"
	"github.com/cilliandevops/kops/server-go/internal/app"
	"github.com/cilliandevops/kops/server-go/internal/client"
)

func main() {
	// 加载配置
	config.LoadConfig()

	// 初始化K8s客户端
	client.InitK8sClient(config.Cfg.K8s.ConfigPath)

	// 初始化应用程序
	app := app.NewApp(client.Clientset)

	// 启动服务器
	if err := app.Run(config.Cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
