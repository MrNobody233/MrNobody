<template>
  <div class="avatar-upload">
    <el-upload
      class="avatar-uploader"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :http-request="handleUpload"
      accept="image/*"
    >
      <div class="avatar-wrapper">
        <el-avatar
          v-if="avatarUrl"
          :src="avatarUrl"
          :size="size"
          fit="cover"
        />
        <el-avatar
          v-else
          :size="size"
          :icon="UserFilled"
        />
        <div class="upload-mask">
          <el-icon><Camera /></el-icon>
          <span>上传</span>
        </div>
      </div>
    </el-upload>
    
    <div class="avatar-actions" v-if="avatarUrl">
      <el-button
        size="small"
        type="danger"
        text
        @click="handleDelete"
        :loading="loading"
      >
        删除头像
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Camera } from '@element-plus/icons-vue'
import { useProfileStore } from '@/stores/profile'
import { useAuthStore } from '@/stores/auth'

interface Props {
  avatarUrl?: string
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 120
})

const emit = defineEmits<{
  'update:avatarUrl': [url: string | null]
  'uploaded': [url: string]
  'deleted': []
}>()

const profileStore = useProfileStore()
const loading = ref(false)

const avatarUrl = computed(() => props.avatarUrl)

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！')
    return false
  }
  return true
}

const authStore = useAuthStore()

const handleUpload = async (options: any) => {
  loading.value = true
  try {
    const userId = authStore.user?.id
    
    if (!userId) {
      ElMessage.error('用户未登录')
      return
    }

    const { data, error } = await profileStore.uploadAvatar(options.file, userId)
    
    if (error) {
      ElMessage.error('上传失败: ' + error)
      return
    }

    if (data) {
      ElMessage.success('上传成功！')
      emit('update:avatarUrl', data)
      emit('uploaded', data)
    }
  } catch (error: any) {
    ElMessage.error('上传失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  try {
    const { error } = await profileStore.deleteAvatar()
    
    if (error) {
      ElMessage.error('删除失败: ' + error)
      return
    }

    ElMessage.success('删除成功！')
    emit('update:avatarUrl', null)
    emit('deleted')
  } catch (error: any) {
    ElMessage.error('删除失败: ' + error.message)
  }
}
</script>

<style scoped lang="scss">
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .avatar-uploader {
    :deep(.el-upload) {
      border: 1px dashed var(--el-border-color);
      border-radius: 50%;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all 0.3s;

      &:hover {
        border-color: var(--el-color-primary);
      }
    }
  }

  .avatar-wrapper {
    position: relative;
    width: v-bind(size + 'px');
    height: v-bind(size + 'px');

    .upload-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
      border-radius: 50%;
      color: white;
      font-size: 14px;

      .el-icon {
        font-size: 24px;
        margin-bottom: 4px;
      }
    }

    &:hover .upload-mask {
      opacity: 1;
    }
  }

  .avatar-actions {
    margin-top: 8px;
  }
}
</style>

