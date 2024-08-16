package main

import (
	"github.com/cilliandevops/kops/server-go/pkg/logger"
	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化配置
	// config.LoadConfig()

	// 初始化日志
	logger.InitLogger()

	// 初始化监控
	// metrics.RecordMetrics()

	// 初始化 Gin 引擎
	r := gin.Default()

	// 设置路由
	// routes.SetupRoutes(r)

	// 启动服务器
	r.Run(":8080")
}
