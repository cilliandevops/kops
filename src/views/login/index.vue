<template>
  <div class="login-container">
    <!-- 主题切换组件 -->
    <ThemeSwitch class="theme-switch" />

    <Owl :closed-eyes="isFocus" />
    <div class="login-card">
      <div class="title">
        <!-- 登录页面的标题图片 -->
        <img src="@/assets/layouts/logo-text-2.png" />
      </div>
      <div class="content">
        <!-- 登录表单 -->
        <el-form ref="loginFormRef" :model="loginFormData" :rules="loginFormRules" @keyup.enter="handleLogin">
          <el-form-item prop="username">
            <el-input
              v-model.trim="loginFormData.username"
              placeholder="用户名"
              type="text"
              tabindex="1"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model.trim="loginFormData.password"
              placeholder="密码"
              type="password"
              tabindex="2"
              :prefix-icon="Lock"
              size="large"
              show-password
              @blur="listenBlur()"
              @focus="listenFocus()"
            />
          </el-form-item>
          <el-form-item prop="code">
            <el-input
              v-model.trim="loginFormData.code"
              placeholder="验证码"
              type="text"
              tabindex="3"
              :prefix-icon="Key"
              maxlength="7"
              size="large"
            >
              <template #append>
                <el-image :src="codeUrl" @click="createCode" draggable="false">
                  <template #placeholder>
                    <!-- 加载占位图标 -->
                    <el-icon>
                      <Picture />
                    </el-icon>
                  </template>
                  <template #error>
                    <!-- 加载错误图标 -->
                    <el-icon>
                      <Loading />
                    </el-icon>
                  </template>
                </el-image>
              </template>
            </el-input>
          </el-form-item>
          <el-button :loading="loading" type="primary" size="large" @click.prevent="handleLogin">
            登 录
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/store/modules/user"
import { type FormInstance, type FormRules } from "element-plus"
import { User, Lock, Key, Picture, Loading } from "@element-plus/icons-vue"
import { getLoginCodeApi } from "@/api/login"
import { type LoginRequestData } from "@/api/login/types/login"
import ThemeSwitch from "@/components/ThemeSwitch/index.vue"
import Owl from "@/views/login/components/Owl.vue"
import { useInput } from '@/composables/useInput'

const { isFocus, listenBlur, listenFocus } = useInput()
// 获取路由对象
const router = useRouter()

// 登录表单元素的引用
const loginFormRef = ref<FormInstance | null>(null)

// 登录按钮 Loading
const loading = ref(false)

// 验证码图片 URL
const codeUrl = ref("")

// 登录表单数据
const loginFormData: LoginRequestData = reactive({
  username: "admin",
  password: "12345678",
  code: ""
})

// 登录表单校验规则
const loginFormRules: FormRules = {
  username: [{ 
    required: true, 
    message: "请输入用户名", 
    trigger: "blur" }],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 8, max: 16, message: "长度在 8 到 16 个字符", trigger: "blur" }
  ],
  code: [{ required: true, message: "请输入验证码", trigger: "blur" }]
}

// 登录逻辑
const handleLogin = () => {
  loginFormRef.value?.validate((valid: boolean, fields) => {
    if (valid) {
      loading.value = true
      useUserStore()
        .login(loginFormData)
        .then(() => {
          router.push({ path: "/" })
        })
        .catch(() => {
          createCode()
          loginFormData.password = ""
        })
        .finally(() => {
          loading.value = false
        })
    } else {
      console.error("表单校验不通过", fields)
    }
  })
}

// 创建验证码
const createCode = () => {
  // 先清空验证码的输入
  loginFormData.code = ""
  // 获取验证码
  codeUrl.value = ""
  getLoginCodeApi().then((res) => {
    // codeUrl.value = res.data
    codeUrl.value = "https://dummyimage.com/100x40/3f80e8/fff&text=Cillian"
  })
}

// 初始化验证码
createCode()
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100%;
  position: relative;
  

  .theme-switch {
    position: fixed;
    top: 5%;
    left: 5%;
    cursor: pointer;
  }
  
  .login-card {
    
    width: 480px;
    border-radius: 30px;
    box-shadow: 0 0 10px #30b2d3;
    background-color: #ffffff;
    overflow: hidden;
    

    .title {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 150px;

      img {
        height: 120%;
      }
    }

    .content {
      padding: 30px ;

      :deep(.el-input-group__append) {
        padding: 0;
        overflow: hidden;

        .el-image {
          width: 100px;
          height: 40px;
          border-left: 0px;
          user-select: none;
          cursor: pointer;
          text-align: center;
        }
      }

      .el-button {
        width: 100%;
        margin-top: 10px;
      }
    }
  }
}
</style>
