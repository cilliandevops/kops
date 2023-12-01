// @Time    : 11/22/2023 9:27 PM
// @Author  : Cillian
// @Email   : cilliandevops@gmail.com
// Website  : www.cillian.website
// Have a good day!
package controller

import (
	"github.com/gin-gonic/gin"
)

var Router router

type router struct{}

func (r *router) InitApiRouter(router *gin.Engine) {
	router.

		//pod操作
		GET("/api/k8s/pods", Pod.GetPods).
		GET("/api/k8s/pod/detail", Pod.GetPodDetail).
		DELETE("/api/k8s/pod/del", Pod.DeletePod).
		PUT("/api/k8s/pod/update", Pod.UpdatePod).
		GET("/api/k8s/pod/container", Pod.GetPodContainer).
		GET("/api/k8s/pod/log", Pod.GetPodLog).
		GET("/api/k8s/pod/numnp", Pod.GetPodNumPerNp).

		//pvc操作
		GET("/api/k8s/pvcs", Pvc.GetPvcs).
		GET("/api/k8s/pvc/detail", Pvc.GetPvcDetail).
		DELETE("/api/k8s/pvc/del", Pvc.DeletePvc).
		PUT("/api/k8s/pvc/update", Pvc.UpdatePvc).
		//node操作
		GET("/api/k8s/nodes", Node.GetNodes).
		GET("/api/k8s/node/detail", Node.GetNodeDetail).
		//namespace操作
		GET("/api/k8s/namespaces", Namespace.GetNamespaces).
		GET("/api/k8s/namespace/detail", Namespace.GetNamespaceDetail).
		GET("/api/k8s/namespace/del", Namespace.DeleteNamespace).
		//pv操作
		GET("/api/k8s/pvs", Pv.GetPvs).
		GET("/api/k8s/pv/detail", Pv.GetPvDetail)
}
