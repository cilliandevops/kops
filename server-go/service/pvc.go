// @Time    : 11/22/2023 9:27 PM
// @Author  : Cillian
// @Email   : cilliandevops@gmail.com
// Website  : www.cillian.website
// Have a good day!
package service

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/wonderivan/logger"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var Pvc pvc

type pvc struct{}

type PvcsResp struct {
	Items []corev1.PersistentVolumeClaim `json:"items"`
	Total int                            `json:"total"`
}

// 获取pvc列表，支持过滤、排序、分页
func (p *pvc) GetPvcs(filterName, namespace string, limit, page int) (pvcsResp *PvcsResp, err error) {
	//获取pvcList类型的pvc列表
	pvcList, err := K8s.ClientSet.CoreV1().PersistentVolumeClaims(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		logger.Error(errors.New("获取Pvc列表失败, " + err.Error()))
		return nil, errors.New("获取Pvc列表失败, " + err.Error())
	}
	//将pvcList中的pvc列表(Items)，放进dataselector对象中，进行排序
	selectableData := &dataSelector{
		GenericDataList: p.toCells(pvcList.Items),
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

	//将[]DataCell类型的pvc列表转为v1.pvc列表
	pvcs := p.fromCells(data.GenericDataList)

	return &PvcsResp{
		Items: pvcs,
		Total: total,
	}, nil
}

// 获取pvc详情
func (p *pvc) GetPvcDetail(pvcName, namespace string) (pvc *corev1.PersistentVolumeClaim, err error) {
	pvc, err = K8s.ClientSet.CoreV1().PersistentVolumeClaims(namespace).Get(context.TODO(), pvcName, metav1.GetOptions{})
	if err != nil {
		logger.Error(errors.New("获取Pvc详情失败, " + err.Error()))
		return nil, errors.New("获取Pvc详情失败, " + err.Error())
	}

	return pvc, nil
}

// 删除pvc
func (p *pvc) DeletePvc(pvcName, namespace string) (err error) {
	err = K8s.ClientSet.CoreV1().PersistentVolumeClaims(namespace).Delete(context.TODO(), pvcName, metav1.DeleteOptions{})
	if err != nil {
		logger.Error(errors.New("删除Pvc失败, " + err.Error()))
		return errors.New("删除Pvc失败, " + err.Error())
	}

	return nil
}

// 更新pvc
func (p *pvc) UpdatePvc(namespace, content string) (err error) {
	var pvc = &corev1.PersistentVolumeClaim{}

	err = json.Unmarshal([]byte(content), pvc)
	if err != nil {
		logger.Error(errors.New("反序列化失败, " + err.Error()))
		return errors.New("反序列化失败, " + err.Error())
	}

	_, err = K8s.ClientSet.CoreV1().PersistentVolumeClaims(namespace).Update(context.TODO(), pvc, metav1.UpdateOptions{})
	if err != nil {
		logger.Error(errors.New("更新Pvc失败, " + err.Error()))
		return errors.New("更新Pvc失败, " + err.Error())
	}
	return nil
}

func (p *pvc) toCells(std []corev1.PersistentVolumeClaim) []DataCell {
	cells := make([]DataCell, len(std))
	for i := range std {
		cells[i] = pvcCell(std[i])
	}
	return cells
}

func (p *pvc) fromCells(cells []DataCell) []corev1.PersistentVolumeClaim {
	pvcs := make([]corev1.PersistentVolumeClaim, len(cells))
	for i := range cells {
		pvcs[i] = corev1.PersistentVolumeClaim(cells[i].(pvcCell))
	}

	return pvcs
}
