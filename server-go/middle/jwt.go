// @Time    : 11/22/2023 9:27 PM
// @Author  : Cillian
// @Email   : cilliandevops@gmail.com
// Website  : www.cillian.website
// Have a good day!
package middle

import (
	"net/http"
	"server-go/utils"

	"github.com/gin-gonic/gin"
)

// JWTAuth 中间件，检查token
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		//if len(c.Request.URL.String()) >= 6 && (c.Request.URL.String()[0:6] == "/login" || c.Request.URL.String()[0:17] == "/api/hook/gitHook" || c.Request.URL.String()[0:21] == "/api/deploy/droneConf" || c.Request.URL.String()[0:28] == "/api/buildrecord/updateStatus") {
		if len(c.Request.URL.String()) >= 10 && c.Request.URL.String()[0:10] == "/api/login" {
			c.Next()
		} else {
			token := c.Request.Header.Get("Authorization")
			if token == "" {
				c.JSON(http.StatusBadRequest, gin.H{
					"msg":  "请求未携带token，无权限访问",
					"data": nil,
				})
				c.Abort()
				return
			}

			// parseToken 解析token包含的信息
			claims, err := utils.JWTToken.ParseToken(token)
			if err != nil {
				if err.Error() == "TokenExpired" {
					c.JSON(http.StatusBadRequest, gin.H{
						"msg":  "授权已过期",
						"data": nil,
					})
					c.Abort()
					return
				}
				c.JSON(http.StatusBadRequest, gin.H{
					"msg":  err.Error(),
					"data": nil,
				})
				c.Abort()
				return
			}
			// 继续交由下一个路由处理,并将解析出的信息传递下去
			c.Set("claims", claims)

			c.Next()
		}
	}
}
