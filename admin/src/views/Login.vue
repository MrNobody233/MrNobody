<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>登录 - 博客后台管理</h2>
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

        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            :loading="authStore.loading"
            @click="handleSubmit"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const formRef = ref<FormInstance>()
const rememberMe = ref(false)

const form = reactive({
  email: '',
  password: ''
})

// 从 localStorage 加载记住的密码
const loadRememberedCredentials = () => {
  const remembered = localStorage.getItem('remembered_credentials')
  if (remembered) {
    try {
      const credentials = JSON.parse(remembered)
      form.email = credentials.email || ''
      form.password = credentials.password || ''
      rememberMe.value = true
    } catch (e) {
      console.error('加载记住的密码失败:', e)
    }
  }
}

// 保存记住的密码
const saveRememberedCredentials = () => {
  if (rememberMe.value) {
    localStorage.setItem('remembered_credentials', JSON.stringify({
      email: form.email,
      password: form.password
    }))
  } else {
    localStorage.removeItem('remembered_credentials')
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
  ]
})

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    const { error } = await authStore.signIn(form.email, form.password)
    if (error) {
      ElMessage.error(error)
    } else {
      // 保存或清除记住的密码
      saveRememberedCredentials()
      ElMessage.success('登录成功')
      router.push('/')
    }
  })
}

onMounted(() => {
  loadRememberedCredentials()
})
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
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
    text-align: center;
    margin-top: 16px;
  }

  .login-options {
    width: 100%;
    display: flex;
    justify-content: flex-start;
  }

  .theme-toggle {
    position: absolute;
    top: 20px;
    right: 20px;
  }
}
</style>

