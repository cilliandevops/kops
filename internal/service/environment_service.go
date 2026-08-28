package service

import (
	"fmt"
	"strings"
	"time"

	"github.com/ciliverse/cilikube/internal/models"
	"github.com/ciliverse/cilikube/internal/store"
	"github.com/ciliverse/cilikube/pkg/k8s"
)

var validPurposes = map[string]bool{
	"test": true, "staging": true, "prod": true, "other": true,
}

func NormalizePurpose(p string) (string, error) {
	v := strings.ToLower(strings.TrimSpace(p))
	if v == "production" {
		v = "prod"
	}
	if !validPurposes[v] {
		return "", fmt.Errorf("purpose must be test, staging, prod, or other")
	}
	return v, nil
}

type EnvironmentService struct {
	store store.Store
}

func NewEnvironmentService(st store.Store) *EnvironmentService {
	return &EnvironmentService{store: st}
}

func (s *EnvironmentService) List(decision AccessDecision) ([]models.EnvironmentResponse, error) {
	var list []store.Environment
	if k8s.IsShowcase() {
		list = showcaseEnvironments()
	} else {
		var err error
		list, err = s.store.ListEnvironments()
		if err != nil {
			return nil, err
		}
	}
	out := make([]models.EnvironmentResponse, 0, len(list))
	for _, e := range list {
		if !decision.AllowsNamespace(e.ClusterID, e.Namespace) {
			continue
		}
		out = append(out, toEnvResponse(e))
	}
	return out, nil
}

func (s *EnvironmentService) Get(id string, decision AccessDecision) (*models.EnvironmentResponse, error) {
	if k8s.IsShowcase() {
		for _, se := range showcaseEnvironments() {
			if se.ID == id {
				if !decision.AllowsNamespace(se.ClusterID, se.Namespace) {
					return nil, fmt.Errorf("forbidden")
				}
				cp := toEnvResponse(se)
				return &cp, nil
			}
		}
		return nil, fmt.Errorf("environment not found")
	}
	e, err := s.store.GetEnvironmentByID(id)
	if err != nil {
		return nil, err
	}
	if !decision.AllowsNamespace(e.ClusterID, e.Namespace) {
		return nil, fmt.Errorf("forbidden")
	}
	resp := toEnvResponse(*e)
	return &resp, nil
}

func (s *EnvironmentService) Create(req models.EnvironmentRequest) (*models.EnvironmentResponse, error) {
	if k8s.IsShowcase() {
		return nil, fmt.Errorf("showcase mode: environments are read-only")
	}
	purpose, err := NormalizePurpose(req.Purpose)
	if err != nil {
		return nil, err
	}
	env := &store.Environment{
		Name:        strings.TrimSpace(req.Name),
		ClusterID:   strings.TrimSpace(req.ClusterID),
		Namespace:   strings.TrimSpace(req.Namespace),
		Purpose:     purpose,
		Description: req.Description,
	}
	if err := s.store.CreateEnvironment(env); err != nil {
		return nil, err
	}
	resp := toEnvResponse(*env)
	return &resp, nil
}

func (s *EnvironmentService) Update(id string, req models.EnvironmentRequest) (*models.EnvironmentResponse, error) {
	if k8s.IsShowcase() {
		return nil, fmt.Errorf("showcase mode: environments are read-only")
	}
	env, err := s.store.GetEnvironmentByID(id)
	if err != nil {
		return nil, err
	}
	purpose, err := NormalizePurpose(req.Purpose)
	if err != nil {
		return nil, err
	}
	env.Name = strings.TrimSpace(req.Name)
	env.ClusterID = strings.TrimSpace(req.ClusterID)
	env.Namespace = strings.TrimSpace(req.Namespace)
	env.Purpose = purpose
	env.Description = req.Description
	if err := s.store.UpdateEnvironment(env); err != nil {
		return nil, err
	}
	resp := toEnvResponse(*env)
	return &resp, nil
}

func (s *EnvironmentService) Delete(id string) error {
	if k8s.IsShowcase() {
		return fmt.Errorf("showcase mode: environments are read-only")
	}
	return s.store.DeleteEnvironment(id)
}

func toEnvResponse(e store.Environment) models.EnvironmentResponse {
	return models.EnvironmentResponse{
		ID: e.ID, Name: e.Name, ClusterID: e.ClusterID, Namespace: e.Namespace,
		Purpose: e.Purpose, Description: e.Description, CreatedAt: e.CreatedAt, UpdatedAt: e.UpdatedAt,
	}
}

func showcaseEnvironments() []store.Environment {
	now := time.Now()
	return []store.Environment{
		{ID: "env-demo-web", Name: "demo-web", ClusterID: "showcase-demo", Namespace: "default", Purpose: "test", Description: "Showcase web stack", CreatedAt: now, UpdatedAt: now},
		{ID: "env-prod-core", Name: "prod-core", ClusterID: "showcase-prod", Namespace: "default", Purpose: "prod", Description: "Showcase production", CreatedAt: now, UpdatedAt: now},
		{ID: "env-staging", Name: "staging-lab", ClusterID: "showcase-staging", Namespace: "default", Purpose: "staging", Description: "Showcase staging", CreatedAt: now, UpdatedAt: now},
	}
}
