package middlewares

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Cors 处理跨域请求,支持预检请求
func Cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 设置跨域相关响应头
		c.Header("Access-Control-Allow-Origin", "*")                                          // 允许来自所有域的请求
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, UPDATE")   // 允许的HTTP方法
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-CSRF-Token") // 允许的请求头
		c.Header("Access-Control-Allow-Credentials", "false")                                 // 是否允许发送Cookie
		c.Header("Access-Control-Max-Age", "86400")
		c.Header("Content-Type", "application/json") // 预检请求的缓存时间（秒）

		// 添加日志输出
		log.Printf("CORS headers set for %s %s: %v", c.Request.Method, c.Request.URL.Path, c.Writer.Header())

		// 如果是OPTIONS请求，直接返回204状态码
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		// 继续处理请求
		c.Next()
	}
}
