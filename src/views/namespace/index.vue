<template>
  <div>
    <!-- 搜索框 -->
    <el-input
      v-model="searchQuery"
      placeholder="搜索命名空间"
      @input="handleSearch"
      style="width: 300px; margin-bottom: 20px"
    />
    <el-button type="primary" @click="handleAdd">新增命名空间</el-button>

    <!-- 表格 -->
    <el-table :data="paginatedData" border stripe style="width: 100%; margin-top: 20px">
      <el-table-column prop="name" label="命名空间名称" width="180" />
      <el-table-column label="标签" width="300">
        <template #default="{ row }">
          <div v-for="(value, key) in row.labels" :key="key" class="label-tag">
            <el-tag>{{ key }}: {{ value }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="180" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete(row.name)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
      v-model:currentPage="currentPage"
      :page-size="pageSize"
      :total="filteredData.length"
      layout="total, prev, pager, next, jumper"
      @current-change="handlePageChange"
    />

    <!-- 新增/编辑表单对话框 -->
    <el-dialog :title="formTitle" v-model="isDialogVisible">
      <el-form :model="form">
        <el-form-item label="命名空间名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.labels['kubernetes.io/metadata.name']" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="Active" value="Active" />
            <el-option label="Inactive" value="Inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template v-slot:footer>
        <div class="dialog-footer">
          <el-button @click="isDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNamespace">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue"
import { request } from "@/utils/service"
import { ElMessage } from "element-plus"

interface Namespace {
  name: string
  labels: Record<string, string>
  status: string
}

export default defineComponent({
  name: "Namespace",
  setup() {
    const namespaceData = ref<Namespace[]>([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const searchQuery = ref("")
    const isDialogVisible = ref(false)
    const form = ref<Namespace>({ name: "", labels: { "kubernetes.io/metadata.name": "" }, status: "Active" })
    const formTitle = ref("")

    const fetchNamespaceData = async () => {
      try {
        const response = await request<Namespace[]>({
          url: "/apis/v1/k8s/namespace",
          method: "get",
          baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
        })
        namespaceData.value = response
      } catch (error) {
        console.error("获取命名空间数据失败:", error)
      }
    }

    const handlePageChange = (page: number) => {
      currentPage.value = page
    }

    const handleSearch = () => {
      currentPage.value = 1
    }

    const filteredData = computed(() => {
      return namespaceData.value.filter((ns) => ns.name.includes(searchQuery.value))
    })

    const paginatedData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredData.value.slice(start, end)
    })

    const handleAdd = () => {
      form.value = { name: "", labels: { "kubernetes.io/metadata.name": "" }, status: "Active" }
      formTitle.value = "新增命名空间"
      isDialogVisible.value = true
    }

    const handleEdit = (row: Namespace) => {
      form.value = { ...row }
      formTitle.value = "编辑命名空间"
      isDialogVisible.value = true
    }

    const saveNamespace = async () => {
      if (formTitle.value === "新增命名空间") {
        namespaceData.value.push({ ...form.value })
      } else {
        const index = namespaceData.value.findIndex((ns) => ns.name === form.value.name)
        if (index !== -1) {
          namespaceData.value[index] = { ...form.value }
        }
      }
      isDialogVisible.value = false
      ElMessage.success("操作成功")
    }

    const handleDelete = (name: string) => {
      namespaceData.value = namespaceData.value.filter((ns) => ns.name !== name)
      ElMessage.success("删除成功")
    }

    onMounted(() => {
      fetchNamespaceData()
    })

    return {
      namespaceData,
      currentPage,
      pageSize,
      searchQuery,
      handleSearch,
      filteredData,
      paginatedData,
      handlePageChange,
      isDialogVisible,
      form,
      formTitle,
      handleAdd,
      handleEdit,
      saveNamespace,
      handleDelete
    }
  }
})
</script>

<style scoped>
.el-tag {
  font-size: 12px;
}

.label-tag {
  margin-bottom: 4px;
}

.label-tag .el-tag {
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

.dialog-footer {
  text-align: right;
}
</style>
