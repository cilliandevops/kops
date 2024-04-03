package k8sclient

import (
	"fmt"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// K8sClient 封装了kubernetes.Clientset以提供Kubernetes集群操作
type K8sClient struct {
	Clientset *kubernetes.Clientset
}

// NewK8sClient 创建并返回一个新的K8sClient实例。
// 这个函数首先尝试使用集群内配置初始化客户端（适用于在集群内部运行的应用）。
// 如果失败，则尝试使用默认的kubeconfig路径（适用于从集群外部访问）。
func NewK8sClient() (*K8sClient, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		// 在集群外部运行时，使用kubeconfig文件
		config, err = clientcmd.BuildConfigFromFlags("", clientcmd.RecommendedHomeFile)
		if err != nil {
			return nil, fmt.Errorf("无法加载kubeconfig: %v", err)
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("创建k8s客户端失败: %v", err)
	}

	return &K8sClient{Clientset: clientset}, nil
}
