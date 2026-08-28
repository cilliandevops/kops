package k8s

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/ciliverse/cilikube/pkg/utils"
	"github.com/gin-gonic/gin"
)

// ClusterAccessFunc is an optional second-layer grant check (cluster + namespace).
type ClusterAccessFunc func(c *gin.Context, clusterID, namespace string) bool

var (
	accessMu      sync.RWMutex
	accessChecker ClusterAccessFunc
)

func SetClusterAccessChecker(fn ClusterAccessFunc) {
	accessMu.Lock()
	accessChecker = fn
	accessMu.Unlock()
}

func RequestNamespace(c *gin.Context) string {
	if ns := c.Param("namespace"); ns != "" {
		return ns
	}
	return c.Query("namespace")
}

func allowClusterAccess(c *gin.Context, clusterID, namespace string) bool {
	accessMu.RLock()
	fn := accessChecker
	accessMu.RUnlock()
	if fn == nil {
		return true
	}
	return fn(c, clusterID, namespace)
}

// GetClientFromQuery gets clusterId from URL query parameters and returns the corresponding k8s client.
// This is the "gatekeeper" for all resource operation handler functions.
func GetClientFromQuery(c *gin.Context, cm *ClusterManager) (*Client, bool) {
	clusterID := c.Query("clusterId")
	if clusterID == "" {
		// If no clusterId is provided, try to use the currently active cluster as fallback
		activeID := cm.GetActiveClusterID()
		if activeID == "" {
			utils.ApiError(c, http.StatusBadRequest, "missing 'clusterId' query parameter and no active default cluster", "e.g., /api/v1/nodes?clusterId=cls-xxxxx")
			return nil, false
		}
		clusterID = activeID
	}

	if !allowClusterAccess(c, clusterID, RequestNamespace(c)) {
		utils.ApiError(c, http.StatusForbidden, "access denied for this cluster or namespace", clusterID)
		return nil, false
	}

	client, err := cm.GetClientByID(clusterID)
	if err != nil {
		utils.ApiError(c, http.StatusNotFound, fmt.Sprintf("cluster ID '%s' not found or unavailable", clusterID), err.Error())
		return nil, false
	}

	return client, true
}
