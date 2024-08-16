<template>
  <div class="app-container center" style="padding: 1%">
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

    <el-row :gutter="20" style="margin-bottom: 10px">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div>
              <span>节点资源</span>
            </div>
          </template>
          <div style="float: left; padding-top: 10%">
            <!-- <el-progress  :stroke-width="20" :show-text="true" type="circle" :percentage="namespaceActive/namespaceTotal * 100"></el-progress> -->
            <el-progress :stroke-width="20" :show-text="true" type="circle" :percentage="(90 / 100) * 100" />
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">90/100</p>
            <!-- 根据后端返回数据计算 -->
            <!-- <p class="home-node-card-num">{{namespaceActive }}/{{ namespaceTotal }}</p> -->
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <template #header>
            <div>
              <span>命名空间</span>
            </div>
          </template>
          <div style="float: left; padding-top: 10%">
            <el-progress :stroke-width="20" :show-text="true" type="circle" :percentage="80" />
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">1/10</p>
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <template #header>
            <div>
              <span>应用服务</span>
            </div>
          </template>
          <div style="float: left; padding-top: 10%">
            <el-progress :stroke-width="20" :show-text="true" type="circle" :percentage="70" />
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p>
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <template #header>
            <div>
              <span>工作负载</span>
            </div>
          </template>
          <div style="float: left; padding-top: 10%">
            <el-progress :stroke-width="20" :show-text="true" type="circle" :percentage="60" />
          </div>
          <div>
            <p class="home-node-card-title">Ready/总数量</p>
            <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p>
            <!-- {{ card.content }} -->
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-collapse v-model="activeNames">
      <el-collapse-item title="机器资源情况" name="1">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover">
              <template #header>
                <div>
                  <span style="font-weight: bolder">CPU</span>
                </div>
              </template>
              <div style="float: left; padding-top: 10%">
                <el-progress :stroke-width="20" :show-text="true" type="circle" :percentage="80" />
              </div>
              <div>
                <p class="home-node-card-title">可用/G</p>
                <!-- <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p> -->
                <!-- {{ card.content }} -->
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <template #header>
                <div>
                  <span>内存</span>
                </div>
              </template>
              <div style="float: left; padding-top: 10%">
                <el-progress :stroke-width="20" :show-text="true" type="circle" :percentage="80" />
              </div>
              <div>
                <p class="home-node-card-title">可用</p>
                <!-- <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p> -->
                <!-- {{ card.content }} -->
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <template #header>
                <div>
                  <span>磁盘</span>
                </div>
              </template>
              <div style="float: left; padding-top: 10%">
                <el-progress :stroke-width="20" :show-text="true" type="circle" :percentage="80" />
              </div>
              <div>
                <p class="home-node-card-title">可用/总量</p>
                <!-- <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p> -->
                <!-- {{ card.content }} -->
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <template #header>
                <div>
                  <span>流量</span>
                </div>
              </template>
              <div style="float: left; padding-top: 18%">
                <el-progress :percentage="100" status="success" :indeterminate="true" :duration="5" />
                <el-progress :percentage="100" status="success" :indeterminate="true" :duration="3" />
              </div>
              <div>
                <p class="home-node-card-title">上行/下载</p>
                <!-- <p class="home-node-card-num">{{ 0 }}/{{ 1 }}</p> -->
                <!-- {{ card.content }} -->
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-collapse-item>
      <el-collapse-item title="其他板块" name="2">
        <div>比如应用数量、访问量等等</div>
        <div>Kops,key of the cilliandevops world!</div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
const activeNames = ref(["1", "2"])
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
.el-progress--line {
  margin-bottom: 15px;
  width: 260px;
}
</style>
