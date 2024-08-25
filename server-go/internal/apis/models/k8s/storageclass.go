package k8s

import (
	storagev1 "k8s.io/api/storage/v1"
)

type StorageClass struct {
	storagev1.StorageClass `json:",inline"`
}
