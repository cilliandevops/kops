// @Time    : 11/22/2023 9:27 PM
// @Author  : Cillian
// @Email   : cilliandevops@gmail.com
// Website  : www.cillian.website
// Have a good day!
package controller

import (
	"net/http"
	"server-go/service"

	"github.com/gin-gonic/gin"
	"github.com/wonderivan/logger"
)

var Pvc pvc

type pvc struct{}

// 获取pvc列表，支持过滤、排序、分页
func (p *pvc) GetPvcs(ctx *gin.Context) {
	params := new(struct {
		FilterName string `form:"filter_name"`
		Namespace  string `form:"namespace"`
		Page       int    `form:"page"`
		Limit      int    `form:"limit"`
	})
	if err := ctx.Bind(params); err != nil {
		logger.Error("Bind请求参数失败, " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"msg":  err.Error(),
			"data": nil,
		})
		return
	}

	data, err := service.Pvc.GetPvcs(params.FilterName, params.Namespace, params.Limit, params.Page)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"msg":  err.Error(),
			"data": nil,
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"msg":  "获取Pvc列表成功",
		"data": data,
	})
}

// 获取pvc详情
func (p *pvc) GetPvcDetail(ctx *gin.Context) {
	params := new(struct {
		PvcName   string `form:"pvc_name"`
		Namespace string `form:"namespace"`
	})
	if err := ctx.Bind(params); err != nil {
		logger.Error("Bind请求参数失败, " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"msg":  err.Error(),
			"data": nil,
		})
		return
	}

	data, err := service.Pvc.GetPvcDetail(params.PvcName, params.Namespace)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"msg":  err.Error(),
			"data": nil,
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"msg":  "获取Pvc详情成功",
		"data": data,
	})
}

// 删除pvc
func (p *pvc) DeletePvc(ctx *gin.Context) {
	params := new(struct {
		PvcName   string `json:"pvc_name"`
		Namespace string `json:"namespace"`
	})
	//DELETE请求，绑定参数方法改为ctx.ShouldBindJSON
	if err := ctx.ShouldBindJSON(params); err != nil {
		logger.Error("Bind请求参数失败, " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"msg":  err.Error(),
			"data": nil,
		})
		return
	}

	err := service.Pvc.DeletePvc(params.PvcName, params.Namespace)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"msg":  err.Error(),
			"data": nil,
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"msg":  "删除Pvc成功",
		"data": nil,
	})
}

// 更新pvc
func (p *pvc) UpdatePvc(ctx *gin.Context) {
	params := new(struct {
		Namespace string `json:"namespace"`
		Content   string `json:"content"`
	})
	//PUT请求，绑定参数方法改为ctx.ShouldBindJSON
	if err := ctx.ShouldBindJSON(params); err != nil {
		logger.Error("Bind请求参数失败, " + err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"msg":  err.Error(),
			"data": nil,
		})
		return
	}

	err := service.Pvc.UpdatePvc(params.Namespace, params.Content)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"msg":  err.Error(),
			"data": nil,
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"msg":  "更新Pvc成功",
		"data": nil,
	})
}
