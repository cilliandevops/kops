package k8s

type Pod struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	// 添加其他需要的字段
}
