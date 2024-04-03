// @Time    : 11/22/2023 9:27 PM
// @Author  : Cillian
// @Email   : cilliandevops@gmail.com
// Website  : www.cillian.website
// Have a good day!

package main

import (
	"server-go/config"
	"server-go/controller"
	"server-go/middleware"
	"server-go/service"

	"github.com/gin-gonic/gin"
)

func main() {

	service.K8s.Init()

	//初始化路由配置
	r := gin.Default()
	//跨域配置
	r.Use(middleware.Cors())
	//jwt token验证
	//r.Use(middleware.JWTAuth())
	//初始化路由
	controller.Router.InitApiRouter(r)

	//http server启动
	r.Run(config.ListenAddr)
}
