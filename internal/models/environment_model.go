package models

import "time"

type EnvironmentRequest struct {
	Name        string `json:"name" binding:"required"`
	ClusterID   string `json:"cluster_id" binding:"required"`
	Namespace   string `json:"namespace" binding:"required"`
	Purpose     string `json:"purpose" binding:"required"`
	Description string `json:"description"`
}

type EnvironmentResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	ClusterID   string    `json:"cluster_id"`
	Namespace   string    `json:"namespace"`
	Purpose     string    `json:"purpose"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type AccessGrantRequest struct {
	UserID    uint   `json:"user_id" binding:"required"`
	ClusterID string `json:"cluster_id" binding:"required"`
	Namespace string `json:"namespace"`
}

type AccessSnapshot struct {
	Unrestricted bool                   `json:"unrestricted"`
	Grants       []AccessGrantResponse  `json:"grants"`
}

type AccessGrantResponse struct {
	ID        uint   `json:"id"`
	UserID    uint   `json:"user_id"`
	ClusterID string `json:"cluster_id"`
	Namespace string `json:"namespace"`
}
