<template>
  <div>
    <el-table :data="currentPageData" border stripe style="width: 100%">
      <el-table-column prop="name" label="节点名称" width="180" />
      <el-table-column prop="version" label="节点版本" width="180" />
      <el-table-column prop="os" label="操作系统" width="180" />
      <el-table-column prop="arch" label="架构" width="180" />
      <el-table-column prop="kernelVersion" label="内核版本" width="180" />
      <el-table-column prop="containerRuntime" label="容器运行时" width="180" />
      <el-table-column prop="creationTime" label="创建时间" width="180" />
      <el-table-column prop="cpuUsage" label="CPU 使用情况" width="180" />
      <el-table-column prop="memoryUsage" label="内存使用情况" width="180" />
      <el-table-column prop="podCount" label="Pod 数量" width="100" />
      <el-table-column label="IP 地址" width="200">
        <template #default="{ row }">
          <div v-for="ip in row.ipAddresses" :key="ip" class="ip-address">
            <el-tag>{{ ip }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="标签" width="300">
        <template #default="{ row }">
          <div v-for="(value, key) in row.labels" :key="key" class="label-tag">
            <el-tag>{{ key }}: {{ value }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="注解" width="300" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-for="(value, key) in row.annotations" :key="key" class="annotation-tag">
            <el-tag>{{ key }}: {{ value }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" />
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
      v-model:currentPage="currentPage"
      :page-size="pageSize"
      :total="nodeData.length"
      layout="total, prev, pager, next, jumper"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue"
import { request } from "@/utils/service"

interface Node {
  name: string
  version: string
  os: string
  arch: string
  kernelVersion: string
  containerRuntime: string
  creationTime: string
  cpuUsage: string
  memoryUsage: string
  podCount: number
  ipAddresses: string[]
  labels: Record<string, string>
  annotations: Record<string, string>
  status: string
}

export default defineComponent({
  name: "Node",
  setup() {
    const nodeData = ref<Node[]>([])
    const currentPage = ref(1)
    const pageSize = ref(10)

    const currentPageData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return nodeData.value.slice(start, end)
    })

    const fetchNodeData = async () => {
      try {
        const response = await request<Node[]>({
          url: "/apis/v1/k8s/nodes",
          method: "get",
          baseURL: "http://localhost:8080" // 可根据需要调整 baseURL
        })
        console.log("API response:", response)
        nodeData.value = response
      } catch (error) {
        console.error("获取节点数据失败:", error)
      }
    }

    const handlePageChange = (page: number) => {
      currentPage.value = page
    }

    onMounted(() => {
      fetchNodeData()
    })

    return {
      nodeData,
      currentPage,
      pageSize,
      currentPageData,
      handlePageChange
    }
  }
})
</script>

<style scoped>
.el-tag {
  font-size: 12px;
}

.ip-address,
.label-tag,
.annotation-tag {
  margin-bottom: 4px;
}

.ip-address .el-tag,
.label-tag .el-tag,
.annotation-tag .el-tag {
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
