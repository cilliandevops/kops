<template>
  <div>
    <el-table :data="currentPageData" border stripe style="width: 100%">
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column prop="namespace" label="命名空间" width="180" />
      <el-table-column prop="spec.rules" label="规则" width="300">
        <template #default="{ row }">
          <div v-for="(rule, index) in row.spec.rules" :key="index" class="rule-tag">
            <el-tag>{{ rule.host }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="动作" width="200">
        <template #default="{ row }">
          <el-button type="primary" @click="editIngress(row)">编辑</el-button>
          <el-button type="danger" @click="deleteIngress(row.name)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:currentPage="currentPage"
      :page-size="pageSize"
      :total="ingressData.length"
      layout="total, prev, pager, next, jumper"
      @current-change="handlePageChange"
    />

    <el-dialog v-model:visible="dialogVisible" title="Ingress">
      <el-form :model="currentIngress">
        <el-form-item label="名称">
          <el-input v-model="currentIngress.name" />
        </el-form-item>
        <el-form-item label="命名空间">
          <el-input v-model="currentIngress.namespace" />
        </el-form-item>
        <el-form-item label="规则">
          <el-input v-model="currentIngress.spec" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveIngress">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue"
import { request } from "@/utils/service"

interface Rule {
  host: string
  http: object
}

interface IngressSpec {
  name: string
  namespace: string
  spec: {
    rules: Rule[]
  }
}

export default defineComponent({
  name: "Ingress",
  setup() {
    const ingressData = ref<IngressSpec[]>([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const dialogVisible = ref(false)
    const currentIngress = ref<IngressSpec>({ name: "", namespace: "", spec: { rules: [] } })

    const currentPageData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return ingressData.value.slice(start, end)
    })

    const fetchIngressData = async () => {
      try {
        const response = await request<IngressSpec[]>({
          url: "/apis/v1/k8s/ingresses/default",
          method: "get",
          baseURL: "http://localhost:8080"
        })
        ingressData.value = response || []
      } catch (error) {
        console.error("获取 Ingress 数据失败:", error)
      }
    }

    const saveIngress = async () => {
      try {
        const method = currentIngress.value.name ? "put" : "post"
        const url = currentIngress.value.name
          ? `/apis/v1/k8s/ingresses/${currentIngress.value.name}`
          : "/apis/v1/k8s/ingresses"

        await request({
          url,
          method,
          data: currentIngress.value,
          baseURL: "http://localhost:8080"
        })
        fetchIngressData()
        dialogVisible.value = false
      } catch (error) {
        console.error("保存 Ingress 失败:", error)
      }
    }

    const deleteIngress = async (name: string) => {
      try {
        await request({
          url: `/apis/v1/k8s/ingresses/${name}`,
          method: "delete",
          baseURL: "http://localhost:8080"
        })
        fetchIngressData()
      } catch (error) {
        console.error("删除 Ingress 失败:", error)
      }
    }

    const handlePageChange = (page: number) => {
      currentPage.value = page
    }

    const editIngress = (ingress: IngressSpec) => {
      currentIngress.value = { ...ingress }
      dialogVisible.value = true
    }

    const openDialog = () => {
      currentIngress.value = { name: "", namespace: "", spec: { rules: [] } }
      dialogVisible.value = true
    }

    onMounted(() => {
      fetchIngressData()
    })

    return {
      ingressData,
      currentPage,
      pageSize,
      currentPageData,
      dialogVisible,
      currentIngress,
      handlePageChange,
      saveIngress,
      deleteIngress,
      editIngress,
      openDialog
    }
  }
})
</script>

<style scoped>
.el-tag {
  font-size: 12px;
}

.rule-tag {
  margin-bottom: 4px;
}

.rule-tag .el-tag {
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
