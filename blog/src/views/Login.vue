<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>{{ isLogin ? '登录' : '注册' }}</h2>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="0"
        size="large"
      >
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="邮箱"
            prefix-icon="Message"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item v-if="!isLogin" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="确认密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            :loading="authStore.loading"
            @click="handleSubmit"
          >
            {{ isLogin ? '登录' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-button type="text" @click="isLogin = !isLogin">
          {{ isLogin ? '还没有账号？去注册' : '已有账号？去登录' }}
        </el-button>
        <el-button type="text" @click="goBack">
          返回首页
        </el-button>
      </div>
    </el-card>

    <div class="theme-toggle">
      <el-button circle @click="themeStore.toggleTheme">
        <el-icon v-if="themeStore.theme === 'dark'">
          <Sunny />
        </el-icon>
        <el-icon v-else>
          <Moon />
        </el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const isLogin = ref(true)
const formRef = ref<FormInstance>()

const form = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (!isLogin.value) {
    if (value === '') {
      callback(new Error('请再次输入密码'))
    } else if (value !== form.password) {
      callback(new Error('两次输入密码不一致'))
    } else {
      callback()
    }
  } else {
    callback()
  }
}

const rules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    if (isLogin.value) {
      // 登录
      const { error } = await authStore.signIn(form.email, form.password)
      if (error) {
        ElMessage.error(error)
      } else {
        ElMessage.success('登录成功')
        router.push('/')
      }
    } else {
      // 注册
      const { error } = await authStore.signUp(form.email, form.password)
      if (error) {
        ElMessage.error(error)
      } else {
        ElMessage.success('注册成功，请登录')
        isLogin.value = true
        form.password = ''
        form.confirmPassword = ''
      }
    }
  })
}

const goBack = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;

  .login-card {
    width: 420px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    .card-header {
      text-align: center;

      h2 {
        margin: 0;
        font-size: 24px;
        color: var(--el-text-color-primary);
      }
    }
  }

  .login-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
  }

  .theme-toggle {
    position: absolute;
    top: 20px;
    right: 20px;
  }
}
</style>

