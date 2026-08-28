package service

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/ciliverse/cilikube/internal/models"
	"github.com/ciliverse/cilikube/internal/store"
	"github.com/gin-gonic/gin"
)

type AccessService struct {
	store store.Store
}

func NewAccessService(st store.Store) *AccessService {
	return &AccessService{store: st}
}

func UserIDFromContext(c *gin.Context) (uint, bool) {
	v, ok := c.Get("user_id")
	if !ok {
		return 0, false
	}
	switch t := v.(type) {
	case uint:
		return t, true
	case int:
		return uint(t), true
	case string:
		n, err := strconv.ParseUint(t, 10, 64)
		return uint(n), err == nil
	default:
		return 0, false
	}
}

func RoleFromContext(c *gin.Context) string {
	if v, ok := c.Get("user_role"); ok {
		if s, ok := v.(string); ok {
			return strings.ToLower(s)
		}
	}
	return ""
}

func (s *AccessService) DecisionFor(userID uint, role string) AccessDecision {
	if strings.EqualFold(role, "admin") {
		return AccessDecision{Unrestricted: true}
	}
	if userID > 0 {
		roles, err := s.store.GetUserRoles(userID)
		if err == nil {
			for _, r := range roles {
				if r != nil && strings.EqualFold(r.Name, "admin") {
					return AccessDecision{Unrestricted: true}
				}
			}
		}
	}
	grants, err := s.store.ListAccessGrantsByUser(userID)
	if err != nil || len(grants) == 0 {
		return AccessDecision{Unrestricted: true}
	}
	return AccessDecision{Grants: grants}
}

func (s *AccessService) DecisionFromContext(c *gin.Context) AccessDecision {
	uid, _ := UserIDFromContext(c)
	return s.DecisionFor(uid, RoleFromContext(c))
}

func (s *AccessService) Snapshot(userID uint, role string) models.AccessSnapshot {
	d := s.DecisionFor(userID, role)
	out := models.AccessSnapshot{Unrestricted: d.Unrestricted, Grants: []models.AccessGrantResponse{}}
	for _, g := range d.Grants {
		out.Grants = append(out.Grants, models.AccessGrantResponse{
			ID: g.ID, UserID: g.UserID, ClusterID: g.ClusterID, Namespace: g.Namespace,
		})
	}
	return out
}

func (s *AccessService) ListAll() ([]models.AccessGrantResponse, error) {
	list, err := s.store.ListAccessGrants()
	if err != nil {
		return nil, err
	}
	out := make([]models.AccessGrantResponse, 0, len(list))
	for _, g := range list {
		out = append(out, models.AccessGrantResponse{
			ID: g.ID, UserID: g.UserID, ClusterID: g.ClusterID, Namespace: g.Namespace,
		})
	}
	return out, nil
}

func (s *AccessService) Create(req models.AccessGrantRequest) (*models.AccessGrantResponse, error) {
	g := &store.AccessGrant{
		UserID:    req.UserID,
		ClusterID: strings.TrimSpace(req.ClusterID),
		Namespace: strings.TrimSpace(req.Namespace),
	}
	if g.ClusterID == "" {
		return nil, fmt.Errorf("cluster_id is required")
	}
	if err := s.store.CreateAccessGrant(g); err != nil {
		return nil, err
	}
	resp := models.AccessGrantResponse{ID: g.ID, UserID: g.UserID, ClusterID: g.ClusterID, Namespace: g.Namespace}
	return &resp, nil
}

func (s *AccessService) Delete(id uint) error {
	return s.store.DeleteAccessGrant(id)
}
