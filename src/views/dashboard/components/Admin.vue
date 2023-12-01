<template>
<div class="app-container center" style=" padding: 1%;">
    <!-- <el-empty description="Admin 权限可见" /> -->
    
    <!-- 官方示例 -->
    <!-- <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>Card name</span>
          <el-button class="button" text>Operation button</el-button>
        </div>
      </template>
      <div v-for="o in 4" :key="o" class="text item">{{ 'List item ' + o }}</div>
    </el-card> -->

    <el-row :gutter="20" style="margin-bottom: 10px;" >
      <el-col :span="6" >
        <el-card shadow="hover">
          <template #header>
          <div slot="header">
            <span  style="font-weight: bolder">节点资源</span>
          </div>
          </template>
          <div style="float:left;padding-top:10%">
            <el-progress  :stroke-width="20" :show-text="true" type="circle" :percentage="namespaceActive/namespaceTotal * 100"></el-progress>
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">{{namespaceActive }}/{{ namespaceTotal }}</p>
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" >
        <el-card>
          <template #header>
          <div slot="header">
            <span>命名空间</span>
          </div>
          </template>
          <div style="float:left;padding-top:10%">
            <el-progress  :stroke-width="20" :show-text="true" type="circle" :percentage=" 80"></el-progress>
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">{{ namespaceActive }}/{{ namespaceTotal }}</p>
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" >
        <el-card>
          <template #header>
          <div slot="header">
            <span>节点资源</span>
          </div>
          </template>
          <div style="float:left;padding-top:10%">
            <el-progress  :stroke-width="20" :show-text="true" type="circle" :percentage=" 80"></el-progress>
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p>
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" >
        <el-card>
          <template #header>
          <div slot="header">
            <span>节点资源</span>
          </div>
          </template>
          <div style="float:left;padding-top:10%">
            <el-progress  :stroke-width="20" :show-text="true" type="circle" :percentage=" 80"></el-progress>
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p>
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
    </el-row>   
  <el-collapse v-model="activeNames" >
    <el-collapse-item  title="机器资源情况"  name="1">
      <el-row :gutter="20">
      <el-col :span="6" >
        <el-card shadow="hover">
          <template #header>
          <div slot="header">
            <span  style="font-weight: bolder">节点资源</span>
          </div>
          </template>
          <div style="float:left;padding-top:1%">
            <el-progress  :stroke-width="20" :show-text="true" type="circle" :percentage=" 80"></el-progress>
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p>
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" >
        <el-card>
          <template #header>
          <div slot="header">
            <span>节点资源</span>
          </div>
          </template>
          <div style="float:left;padding-top:10%">
            <el-progress  :stroke-width="20" :show-text="true" type="circle" :percentage=" 80"></el-progress>
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p>
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" >
        <el-card>
          <template #header>
          <div slot="header">
            <span>节点资源</span>
          </div>
          </template>
          <div style="float:left;padding-top:10%">
            <el-progress  :stroke-width="20" :show-text="true" type="circle" :percentage=" 80"></el-progress>
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p>
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
      <el-col :span="6" >
        <el-card>
          <template #header>
          <div slot="header">
            <span>节点资源</span>
          </div>
          </template>
          <div style="float:left;padding-top:10%">
            <el-progress  :stroke-width="20" :show-text="true" type="circle" :percentage=" 80"></el-progress>
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p>
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
    </el-row> 
  </el-collapse-item>
</el-collapse>    
</div>
</template>
<script lang="ts">
import * as echarts from 'echarts'
import common from "../../common/Config";
import httpClient from '@/utils/request.js';
export default {
    data() {
        return {
            activeNames: ["1", "2", "3"],
            namespaceTotal: 0,
            namespaceListUrl: common.k8sNamespaceList,
            nodeTotal: 0,
            getNodesData: {
                url: common.k8sNodeList,
                params: {
                    filter_name: '',
                    namespace: '',
                    page: '',
                    limit: '',
                }
            },
            nodeCpuAllocatable: 0,
            nodeCpuCapacity: 0,
            nodeMemAllocatable: 0,
            nodeMemCapacity: 0,
            nodePodAllocatable: 10,
            nodePodCapacity: 0,
            namespaceActive: 0,
            namespaceValue: 'kubesphere-controls-system',
            deploymentTotal: 0,
            getDeploymentsData: {
                url: common.k8sDeploymentList,
                params: {
                    filter_name: '',
                    namespace: '',
                    page: '',
                    limit: '',
                }
            },
            podTotal: 0,
            getPodsData: {
                url: common.k8sPodList,
                params: {
                    filter_name: '',
                    namespace: '',
                    page: '',
                    limit: '',
                }
            },
            podNumNp: [],
            podNumNpUrl: common.k8sPodNumNp,
            deploymentNumNp: [],
            deploymentNumNpUrl: common.k8sDeploymentNumNp
        }
    },
    methods: {
        getNamespaces() {
            httpClient.get(this.namespaceListUrl)
            .then(res => {
                this.namespaceTotal = res.data.total
                let namespaceList = res.data.items
                this.nodeCpuCapacity = res.data.staus.capacity.cpu;
                console.log(this.nodeCpuCapacity);
                let index
                for (index in namespaceList) {
                    if (namespaceList[index].status.phase === "Active" ) {
                        this.namespaceActive = this.namespaceActive + 1
                    }
                }
            })
            .catch(res => {
                this.$message.error({
                message: res.msg
                })
            })
        },
        specTrans(num) {
            let a = num / 1024 / 1024
            return a.toFixed(0)
        },
        getNodes() {
            this.getNodesData.params.filter_name = this.searchInput
            this.getNodesData.params.namespace = this.namespaceValue
            httpClient.get(this.getNodesData.url, {params: this.getNodesData.params})
            .then(res => {
              console.log(res);
                this.nodeTotal = res.data.total
                let nodeList = res.data.items
                let index
                for (index in nodeList) {

                    let isnum = nodeList[index].status.allocatable.cpu.replace("m", "");
                  console.log(isnum);
                    if (!isnum) {
                        continue
                    }

                    this.nodeCpuAllocatable = (isnum / 1000) + parseInt(this.nodeCpuAllocatable)
                    this.nodeCpuCapacity = parseInt(nodeList[index].status.capacity.cpu) + parseInt(this.nodeCpuCapacity)
                    this.nodeMemAllocatable = parseInt(nodeList[index].status.allocatable.memory) + parseInt(this.nodeCpuAllocatable)
                    this.nodeMemCapacity = parseInt(nodeList[index].status.capacity.memory) + parseInt(this.nodeMemCapacity)
                    this.nodePodAllocatable = parseInt(nodeList[index].status.allocatable.pods) + parseInt(this.nodePodAllocatable)
                    this.nodePodCapacity = parseInt(nodeList[index].status.capacity.pods) + parseInt(this.nodePodCapacity)
                }

            })
            .catch(res => {
                this.$message.error({
                message: res.msg
                })
            })
        },
        getDeployments() {
            this.getDeploymentsData.params.namespace = this.namespaceValue
            httpClient.get(this.getDeploymentsData.url, {params: this.getDeploymentsData.params})
            .then(res => {
                this.deploymentTotal = res.data.total
            })
            .catch(res => {
                this.$message.error({
                message: res.msg
                })
            })
        },
        getPods() {
            this.getPodsData.params.namespace = this.namespaceValue
            httpClient.get(this.getPodsData.url, {params: this.getPodsData.params})
            .then(res => {
                this.podTotal = res.data.total
            })
            .catch(res => {
                this.$message.error({
                message: res.msg
                })
            })
        },
        getDeploymentNumNp() {
            httpClient.get(this.deploymentNumNpUrl)
            .then(res => {
                this.deploymentNumNp = res.data
                this.getDeployNumDash()
            })
            .catch(res => {
                this.$message.error({
                message: res.msg
                })
            })
        },
        getPodNumNp() {
            httpClient.get(this.podNumNpUrl)
            .then(res => {
                this.podNumNp = res.data
                this.getPodNumDash()
            })
            .catch(res => {
                this.$message.error({
                message: res.msg
                })
            })
        },
        getPodNumDash(){
            if (this.podNumDash != null && this.podNumDash != "" && this.podNumDash != undefined) {
                this.podNumDash.dispose()
            }
            this.podNumDash = echarts.init(document.getElementById('podNumDash'));

            this.podNumDash.setOption({
                title: { text: '命名空间pod统计', textStyle: {color:'rgb(3,3,3)'}},
                color: ['#67E0E3', '#9FE6B8', '#FFDB5C','#ff9f7f', '#fb7293', '#E062AE', '#E690D1', '#e7bcf3', '#9d96f5', '#8378EA', '#96BFFF'],
                tooltip: { trigger: "axis", axisPointer: { type: "cross", label: { backgroundColor: "#76baf1" } } },
                legend: {
                    data: ['Pods']
                },
                dataset: {
                    // 提供一份数据。
                    dimensions: ['namespace','pod_num'],
                    source: this.podNumNp
                },
                xAxis: {
                    type: 'category',
                    axisLabel:{
                        interval: 0,
                        formatter: function (value) {
                            return value.length>5?value.substring(0,5)+'...':value
                        }
                    },
                },
                yAxis: [
                    {type: 'value'}
                ],
                // 声明多个 bar 系列，默认情况下，每个系列会自动对应到 dataset 的每一列。
                series: [{
                    name: 'Pods',
                    type: 'bar',
                    label: {
                        show: true,
                        position: 'top'
                        }
                    }
                ]
            });
        },
        getDeployNumDash(){
            if (this.deployNumDash != null && this.deployNumDash != "" && this.deployNumDash != undefined) {
                this.deployNumDash.dispose()
            }
            this.deployNumDash = echarts.init(document.getElementById('deployNumDash'));

            this.deployNumDash.setOption({
                title: { text: 'Deployments per Namespace', textStyle: {color:'rgb(134, 135, 136)'}},
                color: ['#9FE6B8', '#FFDB5C','#ff9f7f', '#fb7293', '#E062AE', '#E690D1', '#e7bcf3', '#9d96f5', '#8378EA', '#96BFFF'],
                tooltip: { trigger: "axis", axisPointer: { type: "cross", label: { backgroundColor: "#76baf1" } } },
                legend: {
                    data: ['Deployments']
                },
                dataset: {
                    // 提供一份数据。
                    dimensions: ['namespace','deployment_num'],
                    source: this.deploymentNumNp
                },
                xAxis: {
                    type: 'category',
                    axisLabel:{
                        interval: 0,
                        formatter: function (value) {
                            return value.length>5?value.substring(0,5)+'...':value
                        }
                    },
                },
                yAxis: [
                    {type: 'value'}
                ],
                // 声明多个 bar 系列，默认情况下，每个系列会自动对应到 dataset 的每一列。
                series: [{
                    name: 'Deployments',
                    type: 'bar',
                    label: {
                        show: true,
                        position: 'top'
                        }
                    }
                ]
            });
        },
    },
    beforeMount() {
        // this.getNamespaces()
        this.getNodes()
        // this.getDeployments()
        // this.getPods()
        // this.getDeploymentNumNp()
        // this.getPodNumNp()
    }
}
</script>




<style lang="scss" scoped>
// .center {
//   height: 100%;
//   display: flex;
//   justify-content: center;
//   align-items: center;
// }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  font-size: 14px;
}
.item {
  margin-bottom: 18px;
}

.box-card {
  width: 480px;
}


.home-node-card-title {
        font-size: 13px;
        font-weight: bold;
    }
.home-node-card-num {
    font-size: 25px;
    font-weight: bold;
    color: rgb(0, 0, 0);
}
</style>
