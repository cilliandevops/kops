// @Time    : 11/22/2023 9:27 PM
// @Author  : Cillian
// @Email   : cilliandevops@gmail.com
// Website  : www.cillian.website
// Have a good day!

package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"server-go/config"

	"github.com/wonderivan/logger"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var Pod pod

type pod struct{}

type PodsResp struct {
	Items []corev1.Pod `json:"items"`
	Total int          `json:"total"`
}

type PodsNp struct {
	Namespace string `json:"namespace"`
	PodNum    int    `json:"pod_num"`
}

// 获取pod列表，支持过滤、排序、分页
func (p *pod) GetPods(filterName, namespace string, limit, page int) (podsResp *PodsResp, err error) {
	//获取podList类型的pod列表
	podList, err := K8s.ClientSet.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		logger.Error(errors.New("获取Pod列表失败, " + err.Error()))
		return nil, errors.New("获取Pod列表失败, " + err.Error())
	}
	//将podList中的pod列表(Items)，放进dataselector对象中，进行排序
	selectableData := &dataSelector{
		GenericDataList: p.toCells(podList.Items),
		dataSelectQuery: &DataSelectQuery{
			FilterQuery: &FilterQuery{Name: filterName},
			PaginateQuery: &PaginateQuery{
				Limit: limit,
				Page:  page,
			},
		},
	}

	filtered := selectableData.Filter()
	total := len(filtered.GenericDataList)
	data := filtered.Sort().Paginate()

	//将[]DataCell类型的pod列表转为v1.pod列表
	pods := p.fromCells(data.GenericDataList)

	return &PodsResp{
		Items: pods,
		Total: total,
	}, nil
}

// 获取pod详情
func (p *pod) GetPodDetail(podName, namespace string) (pod *corev1.Pod, err error) {
	pod, err = K8s.ClientSet.CoreV1().Pods(namespace).Get(context.TODO(), podName, metav1.GetOptions{})
	if err != nil {
		logger.Error(errors.New("获取Pod详情失败, " + err.Error()))
		return nil, errors.New("获取Pod详情失败, " + err.Error())
	}

	return pod, nil
}

// 删除pod
func (p *pod) DeletePod(podName, namespace string) (err error) {
	err = K8s.ClientSet.CoreV1().Pods(namespace).Delete(context.TODO(), podName, metav1.DeleteOptions{})
	if err != nil {
		logger.Error(errors.New("删除pod失败, " + err.Error()))
		return errors.New("删除pod失败, " + err.Error())
	}

	return nil
}

// 更新pod
func (p *pod) UpdatePod(podName, namespace, content string) (err error) {
	var pod = &corev1.Pod{}

	err = json.Unmarshal([]byte(content), pod)
	if err != nil {
		logger.Error(errors.New("反序列化失败, " + err.Error()))
		return errors.New("反序列化失败, " + err.Error())
	}

	_, err = K8s.ClientSet.CoreV1().Pods(namespace).Update(context.TODO(), pod, metav1.UpdateOptions{})
	if err != nil {
		logger.Error(errors.New("更新Pod失败, " + err.Error()))
		return errors.New("更新Pod失败, " + err.Error())
	}
	return nil
}

// 获取pod容器
func (p *pod) GetPodContainer(podName, namespace string) (containers []string, err error) {
	pod, err := p.GetPodDetail(podName, namespace)
	if err != nil {
		return nil, err
	}
	for _, container := range pod.Spec.Containers {
		containers = append(containers, container.Name)
	}

	return containers, nil
}

// 获取pod内容器日志
func (p *pod) GetPodLog(containerName, podName, namespace string) (log string, err error) {
	//设置日志的配置，容器名、tail的行数
	lineLimit := int64(config.PodLogTailLine)
	option := &corev1.PodLogOptions{
		Container: containerName,
		TailLines: &lineLimit,
	}
	req := K8s.ClientSet.CoreV1().Pods(namespace).GetLogs(podName, option)
	podLogs, err := req.Stream(context.TODO())
	if err != nil {
		logger.Error(errors.New("获取PodLog失败, " + err.Error()))
		return "", errors.New("获取PodLog失败, " + err.Error())
	}
	defer podLogs.Close()
	//将response body转为字符串返回
	buf := new(bytes.Buffer)
	_, err = io.Copy(buf, podLogs)
	if err != nil {
		logger.Error(errors.New("复制PodLog失败, " + err.Error()))
		return "", errors.New("复制PodLog失败, " + err.Error())
	}

	return buf.String(), nil
}

// 获取每个namespace的pod数量
func (p *pod) GetPodNumPerNp() (podsNps []*PodsNp, err error) {
	namespaceList, err := K8s.ClientSet.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	for _, namespace := range namespaceList.Items {
		podList, err := K8s.ClientSet.CoreV1().Pods(namespace.Name).List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			return nil, err
		}

		podsNp := &PodsNp{
			Namespace: namespace.Name,
			PodNum:    len(podList.Items),
		}

		podsNps = append(podsNps, podsNp)
	}
	return podsNps, nil
}

func (p *pod) toCells(std []corev1.Pod) []DataCell {
	cells := make([]DataCell, len(std))
	for i := range std {
		cells[i] = podCell(std[i])
	}
	return cells
}

func (p *pod) fromCells(cells []DataCell) []corev1.Pod {
	pods := make([]corev1.Pod, len(cells))
	for i := range cells {
		pods[i] = corev1.Pod(cells[i].(podCell))
	}

	return pods
}
