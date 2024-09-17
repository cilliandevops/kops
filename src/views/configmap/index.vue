<template>
  <div>
    <el-table :data="currentPageData" border stripe style="width: 100%">
      <el-table-column prop="metadata.name" label="ConfigMap名称" width="180" />
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
      :total="configMapData.length"
      layout="total, prev, pager, next, jumper"
      @current-change="handlePageChange"
    />

    <!-- 新增/编辑ConfigMap对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible">
      <el-form :model="currentConfigMap" label-width="120px">
        <el-form-item label="ConfigMap名称">
          <el-input v-model="currentConfigMap.metadata.name" />
        </el-form-item>
        <el-form-item label="命名空间">
          <el-input v-model="currentConfigMap.metadata.namespace" />
        </el-form-item>
        <el-form-item label="数据">
          <div v-for="(value, key) in currentConfigMap.data" :key="key">
            <el-input v-model="currentConfigMap.data[key]" :placeholder="key" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增ConfigMap按钮 -->
    <el-button type="success" @click="handleAdd">新增ConfigMap</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { request } from "@/utils/service"

interface ConfigMap {
  metadata: {
    name: string
    namespace: string
  }
  data: { [key: string]: string }
}

export default defineComponent({
  name: "ConfigMap",
  setup() {
    const configMapData = ref<ConfigMap[]>([])
    const currentPage = ref<number>(1)
    const pageSize = ref<number>(10)
    const dialogVisible = ref<boolean>(false)
    const dialogTitle = ref<string>("新增ConfigMap")
    const currentConfigMap = ref<ConfigMap>({
      metadata: {
        name: "",
        namespace: "default"
      },
      data: {}
    })

    const currentPageData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return configMapData.value.slice(start, end)
    })

    const fetchConfigMapData = async () => {
      try {
        const response = await request<ConfigMap[]>({
          url: "/apis/v1/k8s/configmaps/default",
          method: "get",
          baseURL: "http://localhost:8080"
        })
        configMapData.value = response || []
      } catch (error) {
        console.error("获取ConfigMap数据失败:", error)
        ElMessage.error("获取ConfigMap数据失败")
      }
    }

    const handlePageChange = (page: number) => {
      currentPage.value = page
    }

    const handleAdd = () => {
      dialogTitle.value = "新增ConfigMap"
      currentConfigMap.value = {
        metadata: {
          name: "",
          namespace: "default"
        },
        data: {}
      }
      dialogVisible.value = true
    }

    const handleEdit = (configMap: ConfigMap) => {
      dialogTitle.value = "编辑ConfigMap"
      currentConfigMap.value = JSON.parse(JSON.stringify(configMap))
      dialogVisible.value = true
    }

    const handleSave = async () => {
      try {
        if (dialogTitle.value === "新增ConfigMap") {
          await request<ConfigMap>({
            url: "/apis/v1/k8s/configmaps",
            method: "post",
            data: currentConfigMap.value,
            baseURL: "http://localhost:8080"
          })
          ElMessage.success("ConfigMap新增成功")
        } else {
          await request<ConfigMap>({
            url: `/apis/v1/k8s/configmaps/${currentConfigMap.value.metadata.name}`,
            method: "put",
            data: currentConfigMap.value,
            baseURL: "http://localhost:8080"
          })
          ElMessage.success("ConfigMap编辑成功")
        }
        dialogVisible.value = false
        fetchConfigMapData()
      } catch (error) {
        console.error("保存ConfigMap失败:", error)
        ElMessage.error("保存ConfigMap失败")
      }
    }

    const handleDelete = (configMap: ConfigMap) => {
      ElMessageBox.confirm(`确定删除ConfigMap ${configMap.metadata.name} 吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(async () => {
        try {
          await request<ConfigMap>({
            url: `/apis/v1/k8s/configmaps/${configMap.metadata.name}`,
            method: "delete",
            baseURL: "http://localhost:8080"
          })
          ElMessage.success("ConfigMap删除成功")
          fetchConfigMapData()
        } catch (error) {
          console.error("删除ConfigMap失败:", error)
          ElMessage.error("删除ConfigMap失败")
        }
      })
    }

    onMounted(() => {
      fetchConfigMapData()
    })

    return {
      configMapData,
      currentPage,
      pageSize,
      currentPageData,
      handlePageChange,
      dialogVisible,
      dialogTitle,
      currentConfigMap,
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
