<template>
  <div>
    <el-table :data="currentPageData" border stripe style="width: 100%">
      <el-table-column prop="name" label="服务名称" width="180" />
      <el-table-column prop="namespace" label="命名空间" width="180" />
      <el-table-column prop="type" label="服务类型" width="180" />
      <el-table-column prop="ports" label="端口" width="300">
        <template #default="{ row }">
          <div v-for="port in row.ports" :key="port.port" class="port-tag">
            <el-tag>{{ port.port }}:{{ port.targetPort }}</el-tag>
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
      :total="serviceData.length"
      layout="total, prev, pager, next, jumper"
      @current-change="handlePageChange"
    />

    <!-- 新增/编辑服务对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible">
      <el-form :model="currentService" label-width="120px">
        <el-form-item label="服务名称">
          <el-input v-model="currentService.name" />
        </el-form-item>
        <el-form-item label="命名空间">
          <el-input v-model="currentService.namespace" />
        </el-form-item>
        <el-form-item label="服务类型">
          <el-select v-model="currentService.type">
            <el-option label="ClusterIP" value="ClusterIP" />
            <el-option label="NodePort" value="NodePort" />
            <el-option label="LoadBalancer" value="LoadBalancer" />
            <el-option label="ExternalName" value="ExternalName" />
          </el-select>
        </el-form-item>
        <el-form-item label="端口">
          <el-input v-model="currentService.ports[0].port" />
        </el-form-item>
        <el-form-item label="目标端口">
          <el-input v-model="currentService.ports[0].targetPort" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新增服务按钮 -->
    <el-button type="success" @click="handleAdd">新增服务</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { request } from "@/utils/service"

interface Service {
  name: string
  namespace: string
  labels: Record<string, string>
  type: string
  ports: {
    name?: string
    protocol: string
    appProtocol?: string
    port: number
    targetPort: number | string
    nodePort?: number
  }[]
}

export default defineComponent({
  name: "Service",
  setup() {
    const serviceData = ref<Service[]>([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const dialogVisible = ref(false)
    const dialogTitle = ref("新增服务")
    const currentService = ref<Service>({
      name: "",
      namespace: "default",
      labels: {},
      type: "ClusterIP",
      ports: [{ protocol: "TCP", port: 80, targetPort: 80 }]
    })

    const currentPageData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return serviceData.value.slice(start, end)
    })

    const fetchServiceData = async () => {
      try {
        const response = await request<Service[]>({
          url: "/apis/v1/k8s/services",
          method: "get",
          baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
        })
        console.log("API response:", response)
        serviceData.value = response
      } catch (error) {
        console.error("获取服务数据失败:", error)
      }
    }

    const handlePageChange = (page: number) => {
      currentPage.value = page
    }

    const handleAdd = () => {
      dialogTitle.value = "新增服务"
      currentService.value = {
        name: "",
        namespace: "default",
        labels: {},
        type: "ClusterIP",
        ports: [{ protocol: "TCP", port: 80, targetPort: 80 }]
      }
      dialogVisible.value = true
    }

    const handleEdit = (service: Service) => {
      dialogTitle.value = "编辑服务"
      currentService.value = JSON.parse(JSON.stringify(service))
      dialogVisible.value = true
    }

    const handleSave = async () => {
      try {
        if (dialogTitle.value === "新增服务") {
          await request<Service>({
            url: "/apis/v1/k8s/services",
            method: "post",
            data: currentService.value,
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("服务新增成功")
        } else {
          await request<Service>({
            url: `/apis/v1/k8s/services/${currentService.value.name}`,
            method: "put",
            data: currentService.value,
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("服务编辑成功")
        }
        dialogVisible.value = false
        fetchServiceData()
      } catch (error) {
        console.error("保存服务失败:", error)
        ElMessage.error("保存服务失败")
      }
    }

    const handleDelete = (service: Service) => {
      ElMessageBox.confirm(`确定删除服务 ${service.name} 吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(async () => {
        try {
          await request<Service>({
            url: `/apis/v1/k8s/services/${service.name}`,
            method: "delete",
            baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
          })
          ElMessage.success("服务删除成功")
          fetchServiceData()
        } catch (error) {
          console.error("删除服务失败:", error)
          ElMessage.error("删除服务失败")
        }
      })
    }

    onMounted(() => {
      fetchServiceData()
    })

    return {
      serviceData,
      currentPage,
      pageSize,
      currentPageData,
      handlePageChange,
      dialogVisible,
      dialogTitle,
      currentService,
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

.port-tag {
  margin-bottom: 4px;
}

.port-tag .el-tag {
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
