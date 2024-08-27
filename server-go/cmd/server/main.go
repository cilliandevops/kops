package main

import (
	"log"

	"github.com/cilliandevops/kops/server-go/config"
	"github.com/cilliandevops/kops/server-go/internal/apis/services"
	"github.com/cilliandevops/kops/server-go/internal/app"
	"github.com/cilliandevops/kops/server-go/internal/client"
)

func main() {
	// 加载配置
	config.LoadConfig()

	// 初始化 K8s 客户端
	kubeconfig := config.Cfg.K8s.ConfigPath
	k8sClient, err := client.NewClient(kubeconfig)
	if err != nil {
		log.Fatalf("Failed to create Kubernetes client: %v", err)
	}

	// 初始化服务
	deploymentService := services.NewDeploymentService(k8sClient)
	podService := services.NewPodService(k8sClient)
	serviceService := services.NewServiceService(k8sClient)
	daemonSetService := services.NewDaemonSetService(k8sClient) // 新增 DaemonSet 服务
	statefulSetService := services.NewStatefulSetService(k8sClient)
	nodeService := services.NewNodeService(k8sClient)
	clusterService := services.NewClusterService(k8sClient.Clientset)
	ingressService := services.NewIngressService(k8sClient.Clientset)
	configMapService := services.NewConfigMapService(k8sClient)
	secretService := services.NewSecretService(k8sClient)
	namespaceService := services.NewNamespaceService(k8sClient)
	pvService := services.NewPVService(k8sClient)
	pvcService := services.NewPVCService(k8sClient)
	scService := services.NewStorageClassService(k8sClient)

	// 初始化应用程序
	myApp := app.NewApp(deploymentService,
		podService,
		serviceService,
		daemonSetService,
		statefulSetService,
		nodeService,
		clusterService,
		ingressService,
		configMapService,
		secretService,
		namespaceService,
		pvService,
		pvcService,
		scService)
	// 启动服务器
	if err := myApp.Run(config.Cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
