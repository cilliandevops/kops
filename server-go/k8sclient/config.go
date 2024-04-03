// @Time    : 2024/3/15 9:56:00
// @Author  : Cillian
// @Email   : cilliandevops@gmail.com
// Website  : www.cillian.website
// Have a good day!

package k8sclient

import (
	"fmt"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"os"
)

// KubeConfigLoader 负责加载Kubernetes配置
type KubeConfigLoader struct {
	// KubeConfigPath 可以指定kubeconfig的文件路径，如果为空，将使用默认路径。
	KubeConfigPath string
}

// NewKubeConfigLoader 创建并返回一个预设了kubeconfig路径的KubeConfigLoader实例
func NewKubeConfigLoader(path string) *KubeConfigLoader {
	return &KubeConfigLoader{
		KubeConfigPath: path,
	}
}

// LoadConfig 加载Kubernetes配置，优先使用指定的kubeconfig文件，
// 如果没有指定或者文件无法加载，则尝试集群内配置。
func (loader *KubeConfigLoader) LoadConfig() (*rest.Config, error) {
	var config *rest.Config
	var err error

	if loader.KubeConfigPath != "" && fileExists(loader.KubeConfigPath) {
		// 使用指定的kubeconfig文件
		config, err = clientcmd.BuildConfigFromFlags("", loader.KubeConfigPath)
		if err != nil {
			return nil, fmt.Errorf("无法从指定的文件加载kubeconfig: %v", err)
		}
	} else {
		// 尝试集群内配置
		config, err = rest.InClusterConfig()
		if err != nil {
			// 尝试默认的kubeconfig路径
			config, err = clientcmd.BuildConfigFromFlags("", clientcmd.RecommendedHomeFile)
			if err != nil {
				return nil, fmt.Errorf("无法加载kubeconfig: %v", err)
			}
		}
	}
	return config, nil
}

// NewClientsetFromConfig 使用加载的配置创建一个kubernetes.Clientset
func (loader *KubeConfigLoader) NewClientsetFromConfig() (*kubernetes.Clientset, error) {
	config, err := loader.LoadConfig()
	if err != nil {
		return nil, err
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("创建k8s客户端失败: %v", err)
	}

	return clientset, nil
}

// fileExists 检查文件是否存在并且不是目录
func fileExists(filename string) bool {
	info, err := os.Stat(filename)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}
