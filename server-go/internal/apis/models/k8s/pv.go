package k8s

import (
	v1 "k8s.io/api/core/v1"
)

type PersistentVolume struct {
	v1.PersistentVolume `json:",inline"`
}
