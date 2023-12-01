<script lang="ts" setup>
import { h } from "vue"
import { useTheme } from "@/hooks/useTheme"
import { ElNotification } from "element-plus"
// 将 Element Plus 的语言设置为中文
import zhCn from "element-plus/es/locale/lang/zh-cn"

const { initTheme } = useTheme()

/** 初始化主题 */
initTheme()

/** 作者小心思 */
ElNotification({
  title: "希里安，你好！！",
  type: "success",
  offset: 300,
  message: h(
    "a",
    { style: "color: darkblue", target: "_blank", href: "https://www.cillian.website" },
    "Hello world！点击直达我的博客！记得关注公众号-希里安，一同进步！"
  ),
  duration: 0,
  position: "top-right"
})


</script>


<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
