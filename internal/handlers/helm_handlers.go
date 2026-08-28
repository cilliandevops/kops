package handlers

import (
	"net/http"

	"github.com/ciliverse/cilikube/internal/service"
	"github.com/ciliverse/cilikube/pkg/k8s"
	"github.com/ciliverse/cilikube/pkg/utils"
	"github.com/gin-gonic/gin"
)

type HelmHandler struct {
	service        *service.HelmService
	clusterManager *k8s.ClusterManager
}

func NewHelmHandler(svc *service.HelmService, cm *k8s.ClusterManager) *HelmHandler {
	return &HelmHandler{service: svc, clusterManager: cm}
}

func (h *HelmHandler) clusterID(c *gin.Context) string {
	return c.Query("clusterId")
}

func (h *HelmHandler) ListReleases(c *gin.Context) {
	releases, err := h.service.ListReleases(h.clusterID(c), c.Query("namespace"))
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, releases, "ok")
}

func (h *HelmHandler) GetRelease(c *gin.Context) {
	detail, err := h.service.GetRelease(h.clusterID(c), c.Param("namespace"), c.Param("name"))
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, detail, "ok")
}

func (h *HelmHandler) InstallRelease(c *gin.Context) {
	var req service.HelmInstallRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	out, err := h.service.Install(h.clusterID(c), req)
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, gin.H{"output": out}, "installed")
}

func (h *HelmHandler) UpgradeRelease(c *gin.Context) {
	var req service.HelmUpgradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	out, err := h.service.Upgrade(h.clusterID(c), c.Param("namespace"), c.Param("name"), req)
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, gin.H{"output": out}, "upgraded")
}

func (h *HelmHandler) RollbackRelease(c *gin.Context) {
	var body struct {
		Revision string `json:"revision"`
	}
	_ = c.ShouldBindJSON(&body)
	out, err := h.service.Rollback(h.clusterID(c), c.Param("namespace"), c.Param("name"), body.Revision)
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, gin.H{"output": out}, "rolled back")
}

func (h *HelmHandler) UninstallRelease(c *gin.Context) {
	out, err := h.service.Uninstall(h.clusterID(c), c.Param("namespace"), c.Param("name"))
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, gin.H{"output": out}, "uninstalled")
}

func (h *HelmHandler) ListRepos(c *gin.Context) {
	repos, err := h.service.ListRepos()
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, repos, "ok")
}

func (h *HelmHandler) AddRepo(c *gin.Context) {
	var req service.HelmRepoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.service.AddRepo(req.Name, req.URL); err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, gin.H{"name": req.Name}, "repository added")
}

func (h *HelmHandler) RemoveRepo(c *gin.Context) {
	if err := h.service.RemoveRepo(c.Param("name")); err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, gin.H{"name": c.Param("name")}, "repository removed")
}

func (h *HelmHandler) UpdateRepos(c *gin.Context) {
	if err := h.service.UpdateRepos(); err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, gin.H{"updated": true}, "repositories updated")
}

func (h *HelmHandler) ListCharts(c *gin.Context) {
	charts, err := h.service.Catalog(c.Query("refresh") == "1")
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, charts, "ok")
}

func (h *HelmHandler) GetChart(c *gin.Context) {
	ref := c.Query("ref")
	if ref == "" {
		utils.ApiError(c, http.StatusBadRequest, "ref is required")
		return
	}
	detail, err := h.service.ChartDetail(ref, c.Query("version"))
	if err != nil {
		utils.ApiError(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.ApiSuccess(c, detail, "ok")
}
