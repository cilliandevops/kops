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
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'ComponentName',

  setup() {
    // 用 ref 定义响应式数据
    const namespaceActive = ref(0); // 活跃的命名空间数量
    const namespaceTotal = ref(0); // 总命名空间数量
    
    // 假设有一个函数来获取这些数据，例如：
    const fetchNamespaceData = async () => {
      // 调用API或其他数据源来设置这些值
      // 例如:
      // const response = await fetch('/api/namespaces');
      // const data = await response.json();
      // namespaceActive.value = data.active;
      // namespaceTotal.value = data.total;
    };

    // 在组件创建时获取数据
    fetchNamespaceData();

    // 返回组件所需的响应式数据
    return {
      namespaceActive,
      namespaceTotal,
    };
  },
});
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
