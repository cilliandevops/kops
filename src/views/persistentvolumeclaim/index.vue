<template>
  <div>
    <el-table :data="currentPageData" border stripe style="width: 100%">
      <el-table-column prop="metadata.name" label="PVC名称" width="180" />
      <el-table-column prop="metadata.namespace" label="命名空间" width="180" />
      <el-table-column prop="spec.resources.requests.storage" label="请求容量" width="180" />
      <el-table-column prop="spec.accessModes" label="访问模式" width="300">
        <template #default="{ row }">
          <div v-for="mode in row.spec.accessModes" :key="mode" class="access-mode-tag">
            <el-tag>{{ mode }}</el-tag>
          </div>
        </template>
      </el-table-column>
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
      :total="pvcData.length"
      layout="total, prev, pager, next, jumper"
      @current-change="handlePageChange"
    />

    <!-- 新增/编辑PVC对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible">
      <el-form :model="currentPVC" label-width="120px">
        <el-form-item label="PVC名称">
          <el-input v-model="currentPVC.metadata.name" />
        </el-form-item>
        <el-form-item label="命名空间">
          <el-input v-model="currentPVC.metadata.namespace" />
        </el-form-item>
        <el-form-item label="请求容量">
          <el-input v-model="currentPVC.spec.resources.requests.storage" />
        </el-form-item>
        <el-form-item label="访问模式">
          <el-select v-model="currentPVC.spec.accessModes" multiple>
            <el-option label="ReadWriteOnce" value="ReadWriteOnce" />
            <el-option label="ReadOnlyMany" value="ReadOnlyMany" />
            <el-option label="ReadWriteMany" value="ReadWriteMany" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增PVC按钮 -->
    <el-button type="success" @click="handleAdd">新增PVC</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { request } from "@/utils/service"

interface PersistentVolumeClaim {
  metadata: {
    name: string
    namespace: string
  }
  spec: {
    resources: {
      requests: {
        storage: string
      }
    }
    accessModes: string[]
    // 其他字段可根据需要添加
  }
}

export default defineComponent({
  name: "PersistentVolumeClaim",
  setup() {
    const pvcData = ref<PersistentVolumeClaim[]>([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const dialogVisible = ref(false)
    const dialogTitle = ref("新增PVC")
    const currentPVC = ref<PersistentVolumeClaim>({
      metadata: {
        name: "",
        namespace: "default"
      },
      spec: {
        resources: {
          requests: {
            storage: "1Gi"
          }
        },
        accessModes: ["ReadWriteOnce"]
      }
    })

    const currentPageData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return pvcData.value.slice(start, end)
    })

    const fetchPVCData = async () => {
      try {
        const response = await request<PersistentVolumeClaim[]>({
          url: "/apis/v1/k8s/persistentvolumeclaims/default",
          method: "get",
          baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
        })
        console.log("API response:", response)
        pvcData.value = response
      } catch (error) {
        console.error("获取PVC数据失败:", error)
      }
    }

    const handlePageChange = (page: number) => {
      currentPage.value = page
    }

    const handleAdd = () => {
      dialogTitle.value = "新增PVC"
      currentPVC.value = {
        metadata: {
          name: "",
          namespace: "default"
        },
        spec: {
          resources: {
            requests: {
              storage: "1Gi"
            }
          },
          accessModes: ["ReadWriteOnce"]
        }
      }
      dialogVisible.value = true
    }

    const handleEdit = (pvc: PersistentVolumeClaim) => {
      dialogTitle.value = "编辑PVC"
      currentPVC.value = JSON.parse(JSON.stringify(pvc))
      dialogVisible.value = true
    }

    const handleSave = async () => {
      try {
        if (dialogTitle.value === "新增PVC") {
          await request<PersistentVolumeClaim>({
            url: "/apis/v1/k8s/persistentvolumeclaims",
            method: "post",
            data: currentPVC.value,
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("PVC新增成功")
        } else {
          await request<PersistentVolumeClaim>({
            url: `/apis/v1/k8s/persistentvolumeclaims/${currentPVC.value.metadata.name}`,
            method: "put",
            data: currentPVC.value,
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("PVC编辑成功")
        }
        dialogVisible.value = false
        fetchPVCData()
      } catch (error) {
        console.error("保存PVC失败:", error)
        ElMessage.error("保存PVC失败")
      }
    }

    const handleDelete = (pvc: PersistentVolumeClaim) => {
      ElMessageBox.confirm(`确定删除PVC ${pvc.metadata.name} 吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(async () => {
        try {
          await request<PersistentVolumeClaim>({
            url: `/apis/v1/k8s/persistentvolumeclaims/${pvc.metadata.name}`,
            method: "delete",
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("PVC删除成功")
          fetchPVCData()
        } catch (error) {
          console.error("删除PVC失败:", error)
          ElMessage.error("删除PVC失败")
        }
      })
    }

    onMounted(() => {
      fetchPVCData()
    })

    return {
      pvcData,
      currentPage,
      pageSize,
      currentPageData,
      handlePageChange,
      dialogVisible,
      dialogTitle,
      currentPVC,
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

.access-mode-tag {
  margin-bottom: 4px;
}

.access-mode-tag .el-tag {
  margin: 2px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-table-column .cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
