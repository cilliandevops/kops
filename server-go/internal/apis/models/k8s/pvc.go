package k8s

import (
	v1 "k8s.io/api/core/v1"
)

type PersistentVolumeClaim struct {
	v1.PersistentVolumeClaim `json:",inline"`
}
