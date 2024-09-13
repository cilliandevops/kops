<template>
  <div>
    <el-table :data="currentPageData" border stripe style="width: 100%">
      <el-table-column prop="metadata.name" label="Secret名称" width="180" />
      <el-table-column prop="metadata.namespace" label="命名空间" width="180" />
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
      :total="secretData.length"
      layout="total, prev, pager, next, jumper"
      @current-change="handlePageChange"
    />

    <!-- 新增/编辑Secret对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible">
      <el-form :model="currentSecret" label-width="120px">
        <el-form-item label="Secret名称">
          <el-input v-model="currentSecret.metadata.name" />
        </el-form-item>
        <el-form-item label="命名空间">
          <el-input v-model="currentSecret.metadata.namespace" />
        </el-form-item>
        <el-form-item label="数据">
          <el-input
            v-model="currentSecret.data[key]"
            v-for="(value, key) in currentSecret.data"
            :key="key"
            :label="key"
            :placeholder="key"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增Secret按钮 -->
    <el-button type="success" @click="handleAdd">新增Secret</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { request } from "@/utils/service"

interface Secret {
  metadata: {
    name: string
    namespace: string
  }
  data: { [key: string]: string }
}

export default defineComponent({
  name: "Secret",
  setup() {
    const secretData = ref<Secret[]>([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const dialogVisible = ref(false)
    const dialogTitle = ref("新增Secret")
    const currentSecret = ref<Secret>({
      metadata: {
        name: "",
        namespace: "default"
      },
      data: {}
    })

    const currentPageData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return secretData.value.slice(start, end)
    })

    const fetchSecretData = async () => {
      try {
        const response = await request<Secret[]>({
          url: "/apis/v1/k8s/secrets",
          method: "get",
          baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
        })
        console.log("API response:", response)
        secretData.value = response
      } catch (error) {
        console.error("获取Secret数据失败:", error)
      }
    }

    const handlePageChange = (page: number) => {
      currentPage.value = page
    }

    const handleAdd = () => {
      dialogTitle.value = "新增Secret"
      currentSecret.value = {
        metadata: {
          name: "",
          namespace: "default"
        },
        data: {}
      }
      dialogVisible.value = true
    }

    const handleEdit = (secret: Secret) => {
      dialogTitle.value = "编辑Secret"
      currentSecret.value = JSON.parse(JSON.stringify(secret))
      dialogVisible.value = true
    }

    const handleSave = async () => {
      try {
        if (dialogTitle.value === "新增Secret") {
          await request<Secret>({
            url: "/apis/v1/k8s/secrets",
            method: "post",
            data: currentSecret.value,
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("Secret新增成功")
        } else {
          await request<Secret>({
            url: `/apis/v1/k8s/secrets/${currentSecret.value.metadata.name}`,
            method: "put",
            data: currentSecret.value,
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("Secret编辑成功")
        }
        dialogVisible.value = false
        fetchSecretData()
      } catch (error) {
        console.error("保存Secret失败:", error)
        ElMessage.error("保存Secret失败")
      }
    }

    const handleDelete = (secret: Secret) => {
      ElMessageBox.confirm(`确定删除Secret ${secret.metadata.name} 吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(async () => {
        try {
          await request<Secret>({
            url: `/apis/v1/k8s/secrets/${secret.metadata.name}`,
            method: "delete",
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("Secret删除成功")
          fetchSecretData()
        } catch (error) {
          console.error("删除Secret失败:", error)
          ElMessage.error("删除Secret失败")
        }
      })
    }

    onMounted(() => {
      fetchSecretData()
    })

    return {
      secretData,
      currentPage,
      pageSize,
      currentPageData,
      handlePageChange,
      dialogVisible,
      dialogTitle,
      currentSecret,
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
