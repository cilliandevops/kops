<template>
  <div>
    <el-table :data="currentPageData" border stripe style="width: 100%">
      <el-table-column prop="name" label="Pod名称" width="180" />
      <el-table-column prop="namespace" label="命名空间" width="180" />
      <el-table-column prop="status.phase" label="状态" width="180" />
      <el-table-column prop="status.containerStatuses[0].image" label="镜像" width="300" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
      v-model:currentPage="currentPage"
      :page-size="pageSize"
      :total="podData.length"
      layout="total, prev, pager, next, jumper"
      @current-change="handlePageChange"
    />

    <!-- 新增/编辑Pod对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible">
      <el-form :model="currentPod" label-width="120px">
        <el-form-item label="Pod名称">
          <el-input v-model="currentPod.name" />
        </el-form-item>
        <el-form-item label="命名空间">
          <el-input v-model="currentPod.namespace" />
        </el-form-item>
        <el-form-item label="镜像">
          <el-input v-model="currentPod.status.containerStatuses[0].image" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增Pod按钮 -->
    <el-button type="success" @click="handleAdd">新增Pod</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { request } from "@/utils/service"

interface Pod {
  name: string
  namespace: string
  labels: { [key: string]: string }
  annotations: { [key: string]: string } | null
  status: {
    phase: string
    conditions: {
      type: string
      status: string
      lastProbeTime: string | null
      lastTransitionTime: string
    }[]
    hostIP: string
    hostIPs: { ip: string }[]
    podIP: string
    podIPs: { ip: string }[]
    startTime: string
    containerStatuses: {
      name: string
      state: {
        running: {
          startedAt: string
        }
      }
      lastState: {
        terminated: {
          exitCode: number
          reason: string
          startedAt: string
          finishedAt: string
          containerID: string
        }
      }
      ready: boolean
      restartCount: number
      image: string
      imageID: string
      containerID: string
      started: boolean
    }[]
    qosClass: string
  }
  creationTime: string
}

export default defineComponent({
  name: "Pod",
  setup() {
    const podData = ref<Pod[]>([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const dialogVisible = ref(false)
    const dialogTitle = ref("新增Pod")
    const currentPod = ref<Pod>({
      name: "",
      namespace: "default",
      labels: {},
      annotations: null,
      status: {
        phase: "Pending",
        conditions: [],
        hostIP: "",
        hostIPs: [],
        podIP: "",
        podIPs: [],
        startTime: "",
        containerStatuses: [
          {
            name: "container-name",
            state: {
              running: {
                startedAt: ""
              }
            },
            lastState: {
              terminated: {
                exitCode: 0,
                reason: "",
                startedAt: "",
                finishedAt: "",
                containerID: ""
              }
            },
            ready: false,
            restartCount: 0,
            image: "nginx:latest",
            imageID: "",
            containerID: "",
            started: false
          }
        ],
        qosClass: ""
      },
      creationTime: ""
    })

    const currentPageData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return podData.value.slice(start, end)
    })

    const fetchPodData = async () => {
      try {
        const response = await request<Pod[]>({
          url: "/apis/v1/k8s/pods/kube-system",
          method: "get",
          baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
        })
        console.log("API response:", response)
        podData.value = response
      } catch (error) {
        console.error("获取Pod数据失败:", error)
      }
    }

    const handlePageChange = (page: number) => {
      currentPage.value = page
    }

    const handleAdd = () => {
      dialogTitle.value = "新增Pod"
      currentPod.value = {
        name: "",
        namespace: "default",
        labels: {},
        annotations: null,
        status: {
          phase: "Pending",
          conditions: [],
          hostIP: "",
          hostIPs: [],
          podIP: "",
          podIPs: [],
          startTime: "",
          containerStatuses: [
            {
              name: "container-name",
              state: {
                running: {
                  startedAt: ""
                }
              },
              lastState: {
                terminated: {
                  exitCode: 0,
                  reason: "",
                  startedAt: "",
                  finishedAt: "",
                  containerID: ""
                }
              },
              ready: false,
              restartCount: 0,
              image: "nginx:latest",
              imageID: "",
              containerID: "",
              started: false
            }
          ],
          qosClass: ""
        },
        creationTime: ""
      }
      dialogVisible.value = true
    }

    const handleEdit = (pod: Pod) => {
      dialogTitle.value = "编辑Pod"
      currentPod.value = JSON.parse(JSON.stringify(pod))
      dialogVisible.value = true
    }

    const handleSave = async () => {
      try {
        if (dialogTitle.value === "新增Pod") {
          await request<Pod>({
            url: "/apis/v1/k8s/pods",
            method: "post",
            data: currentPod.value,
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("Pod新增成功")
        } else {
          await request<Pod>({
            url: `/apis/v1/k8s/pods/${currentPod.value.name}`,
            method: "put",
            data: currentPod.value,
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("Pod编辑成功")
        }
        dialogVisible.value = false
        fetchPodData()
      } catch (error) {
        console.error("保存Pod失败:", error)
        ElMessage.error("保存Pod失败")
      }
    }

    const handleDelete = (pod: Pod) => {
      ElMessageBox.confirm(`确定删除Pod ${pod.name} 吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(async () => {
        try {
          await request<Pod>({
            url: `/apis/v1/k8s/pods/${pod.name}`,
            method: "delete",
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("Pod删除成功")
          fetchPodData()
        } catch (error) {
          console.error("删除Pod失败:", error)
          ElMessage.error("删除Pod失败")
        }
      })
    }

    onMounted(() => {
      fetchPodData()
    })

    return {
      podData,
      currentPage,
      pageSize,
      currentPageData,
      handlePageChange,
      dialogVisible,
      dialogTitle,
      currentPod,
      handleAdd,
      handleEdit,
      handleSave,
      handleDelete
    }
  }
})
</script>

<style scoped>
.el-tag {
  font-size: 12px;
}

.el-table-column .cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
