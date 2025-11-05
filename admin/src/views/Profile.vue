<template>
  <div class="profile-page">
    <el-card v-loading="profileStore.loading">
      <template #header>
        <div class="card-header">
          <h3>个人资料</h3>
        </div>
      </template>

      <div class="profile-content">
        <div class="profile-avatar">
          <AvatarUpload
            :avatar-url="profileStore.profile?.avatar_url"
            :size="120"
            @uploaded="handleAvatarUploaded"
            @deleted="handleAvatarDeleted"
          />
        </div>

        <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          label-width="100px"
          style="max-width: 600px; margin-top: 32px"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              clearable
            />
          </el-form-item>

          <el-form-item label="邮箱">
            <el-input
              :value="authStore.user?.email"
              disabled
            />
            <el-text type="info" size="small" style="margin-left: 8px">
              邮箱无法修改
            </el-text>
          </el-form-item>

          <el-form-item label="个人简介">
            <el-input
              v-model="form.bio"
              type="textarea"
              :rows="4"
              placeholder="介绍一下你自己..."
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSave" :loading="saving">
              保存
            </el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button type="warning" @click="passwordDialogVisible = true">
              修改密码
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        label-width="100px"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { translateError } from '@/utils/errorMessages'
import AvatarUpload from '@/components/AvatarUpload.vue'

const authStore = useAuthStore()
const profileStore = useProfileStore()

const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const saving = ref(false)
const changingPassword = ref(false)
const passwordDialogVisible = ref(false)

const form = reactive({
  username: '',
  bio: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const rules = reactive<FormRules>({
  username: [
    { max: 50, message: '用户名不能超过50个字符', trigger: 'blur' }
  ]
})

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = reactive<FormRules>({
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

const loadProfile = async () => {
  if (!authStore.user?.id) return

  await profileStore.loadProfile(authStore.user.id)
  
  if (profileStore.profile) {
    form.username = profileStore.profile.username || ''
    form.bio = profileStore.profile.bio || ''
  } else {
    // 如果 profile 不存在，清空表单（让用户填写）
    form.username = ''
    form.bio = ''
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  if (!authStore.user?.id) {
    ElMessage.error('用户未登录')
    return
  }

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      // 如果 profile 不存在，先加载或创建
      if (!profileStore.profile) {
        await profileStore.loadProfile(authStore.user.id)
        // 如果还是不存在，说明需要创建
        if (!profileStore.profile) {
          // 通过更新来创建（updateProfile 会自动创建）
          const { error: createError } = await profileStore.updateProfile({
            username: form.username || null,
            bio: form.bio || null
          }, authStore.user.id)
          
          if (createError) {
            ElMessage.error('保存失败: ' + createError)
            return
          }
        }
      }

      const { error } = await profileStore.updateProfile({
        username: form.username || null,
        bio: form.bio || null
      }, authStore.user.id)

      if (error) {
        ElMessage.error('保存失败: ' + translateError(error))
      } else {
        ElMessage.success('保存成功！')
      }
    } catch (error: any) {
      ElMessage.error('保存失败: ' + translateError(error.message || error))
    } finally {
      saving.value = false
    }
  })
}

const handleReset = () => {
  if (profileStore.profile) {
    form.username = profileStore.profile.username || ''
    form.bio = profileStore.profile.bio || ''
  }
}

const handleAvatarUploaded = () => {
  // 头像上传成功后，重新加载资料
  loadProfile()
}

const handleAvatarDeleted = () => {
  // 头像删除成功后，重新加载资料
  loadProfile()
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return

    if (!authStore.user?.email) {
      ElMessage.error('用户信息获取失败')
      return
    }

    changingPassword.value = true
    try {
      // 先验证当前密码是否正确
      const { valid, error: verifyError } = await authStore.verifyPassword(
        authStore.user.email,
        passwordForm.currentPassword
      )
      
      if (!valid) {
        ElMessage.error(verifyError || '当前密码不正确')
        return
      }

      // 验证通过后，修改密码
      const { error } = await authStore.updatePassword(passwordForm.newPassword)
      
      if (error) {
        ElMessage.error('修改密码失败: ' + translateError(error))
      } else {
        ElMessage.success('密码修改成功！')
        passwordDialogVisible.value = false
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
      }
    } catch (error: any) {
      ElMessage.error('修改密码失败: ' + translateError(error.message || error))
    } finally {
      changingPassword.value = false
    }
  })
}

watch(() => authStore.user, (newUser) => {
  if (newUser) {
    loadProfile()
  }
})

watch(() => passwordDialogVisible, (visible) => {
  if (!visible) {
    // 关闭对话框时重置表单
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    passwordFormRef.value?.clearValidate()
  }
})

onMounted(() => {
  if (authStore.user) {
    loadProfile()
  }
})
</script>

<style scoped lang="scss">
.profile-page {
  .card-header {
    h3 {
      margin: 0;
    }
  }

  .profile-content {
    display: flex;
    flex-direction: column;
    align-items: center;

    .profile-avatar {
      margin-bottom: 32px;
    }
  }
}
</style>

