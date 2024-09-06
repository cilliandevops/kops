<template>
  <div>
    <el-table :data="currentPageData" border stripe style="width: 100%">
      <el-table-column prop="metadata.name" label="PV名称" width="180" />
      <el-table-column prop="spec.capacity.storage" label="容量" width="180" />
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
      :total="pvData.length"
      layout="total, prev, pager, next, jumper"
      @current-change="handlePageChange"
    />

    <!-- 新增/编辑PV对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible">
      <el-form :model="currentPV" label-width="120px">
        <el-form-item label="PV名称">
          <el-input v-model="currentPV.metadata.name" />
        </el-form-item>
        <el-form-item label="容量">
          <el-input v-model="currentPV.spec.capacity.storage" />
        </el-form-item>
        <el-form-item label="访问模式">
          <el-select v-model="currentPV.spec.accessModes" multiple>
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

    <!-- 新增PV按钮 -->
    <el-button type="success" @click="handleAdd">新增PV</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { request } from "@/utils/service"

interface PersistentVolume {
  metadata: {
    name: string
  }
  spec: {
    capacity: {
      storage: string
    }
    accessModes: string[]
    // 其他字段可根据需要添加
  }
}

export default defineComponent({
  name: "PersistentVolume",
  setup() {
    const pvData = ref<PersistentVolume[]>([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const dialogVisible = ref(false)
    const dialogTitle = ref("新增PV")
    const currentPV = ref<PersistentVolume>({
      metadata: {
        name: ""
      },
      spec: {
        capacity: {
          storage: "1Gi"
        },
        accessModes: ["ReadWriteOnce"]
      }
    })

    const currentPageData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return pvData.value.slice(start, end)
    })

    const fetchPVData = async () => {
      try {
        const response = await request<PersistentVolume[]>({
          url: "/apis/v1/k8s/persistentvolumes/default",
          method: "get",
          baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
        })
        console.log("API response:", response)
        pvData.value = response
      } catch (error) {
        console.error("获取PV数据失败:", error)
      }
    }

    const handlePageChange = (page: number) => {
      currentPage.value = page
    }

    const handleAdd = () => {
      dialogTitle.value = "新增PV"
      currentPV.value = {
        metadata: {
          name: ""
        },
        spec: {
          capacity: {
            storage: "1Gi"
          },
          accessModes: ["ReadWriteOnce"]
        }
      }
      dialogVisible.value = true
    }

    const handleEdit = (pv: PersistentVolume) => {
      dialogTitle.value = "编辑PV"
      currentPV.value = JSON.parse(JSON.stringify(pv))
      dialogVisible.value = true
    }

    const handleSave = async () => {
      try {
        if (dialogTitle.value === "新增PV") {
          await request<PersistentVolume>({
            url: "/apis/v1/k8s/persistentvolumes",
            method: "post",
            data: currentPV.value,
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("PV新增成功")
        } else {
          await request<PersistentVolume>({
            url: `/apis/v1/k8s/persistentvolumes/${currentPV.value.metadata.name}`,
            method: "put",
            data: currentPV.value,
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("PV编辑成功")
        }
        dialogVisible.value = false
        fetchPVData()
      } catch (error) {
        console.error("保存PV失败:", error)
        ElMessage.error("保存PV失败")
      }
    }

    const handleDelete = (pv: PersistentVolume) => {
      ElMessageBox.confirm(`确定删除PV ${pv.metadata.name} 吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(async () => {
        try {
          await request<PersistentVolume>({
            url: `/apis/v1/k8s/persistentvolumes/${pv.metadata.name}`,
            method: "delete",
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("PV删除成功")
          fetchPVData()
        } catch (error) {
          console.error("删除PV失败:", error)
          ElMessage.error("删除PV失败")
        }
      })
    }

    onMounted(() => {
      fetchPVData()
    })

    return {
      pvData,
      currentPage,
      pageSize,
      currentPageData,
      handlePageChange,
      dialogVisible,
      dialogTitle,
      currentPV,
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
