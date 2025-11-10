<template>
  <div class="cover-image-upload">
    <el-upload
      class="cover-uploader"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :http-request="handleUpload"
      accept="image/*"
    >
      <div class="cover-wrapper" v-if="imageUrl">
        <img :src="imageUrl" class="cover-image" />
        <div class="upload-mask">
          <el-icon><Camera /></el-icon>
          <span>更换封面</span>
        </div>
      </div>
      <el-upload-dragger v-else>
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 jpg/png/gif 格式，文件大小不超过 5MB
          </div>
        </template>
      </el-upload-dragger>
    </el-upload>
    
    <div class="cover-actions" v-if="imageUrl">
      <el-button
        size="small"
        type="danger"
        text
        @click="handleDelete"
        :loading="loading"
      >
        删除封面
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Camera, UploadFilled } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

interface Props {
  imageUrl?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:imageUrl': [url: string | null]
  'uploaded': [url: string]
  'deleted': []
}>()

const authStore = useAuthStore()
const loading = ref(false)

const imageUrl = computed(() => props.imageUrl)

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB！')
    return false
  }
  return true
}

const handleUpload = async (options: any) => {
  loading.value = true
  try {
    const userId = authStore.user?.id
    
    if (!userId) {
      ElMessage.error('用户未登录')
      return
    }

    const file = options.file
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // 删除旧封面（如果存在）
    if (props.imageUrl) {
      try {
        const oldPath = props.imageUrl.split('/').slice(-2).join('/')
        await supabase.storage.from('covers').remove([oldPath])
      } catch (error) {
        // 忽略删除错误，可能文件不存在
        console.warn('删除旧封面失败:', error)
      }
    }

    // 上传新封面
    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // 获取公开 URL
    const { data } = supabase.storage
      .from('covers')
      .getPublicUrl(filePath)

    ElMessage.success('上传成功！')
    emit('update:imageUrl', data.publicUrl)
    emit('uploaded', data.publicUrl)
  } catch (error: any) {
    ElMessage.error('上传失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!props.imageUrl) return

  try {
    const filePath = props.imageUrl.split('/').slice(-2).join('/')
    
    const { error: deleteError } = await supabase.storage
      .from('covers')
      .remove([filePath])

    if (deleteError) throw deleteError

    ElMessage.success('删除成功！')
    emit('update:imageUrl', null)
    emit('deleted')
  } catch (error: any) {
    ElMessage.error('删除失败: ' + error.message)
  }
}
</script>

<style scoped lang="scss">
.cover-image-upload {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .cover-uploader {
    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      width: 100%;
    }
  }

  .cover-wrapper {
    position: relative;
    width: 100%;
    max-width: 100%;
    border: 1px dashed var(--el-border-color);
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: var(--el-color-primary);

      .upload-mask {
        opacity: 1;
      }
    }

    .cover-image {
      width: 100%;
      height: auto;
      display: block;
      max-height: 300px;
      object-fit: cover;
    }

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
      color: white;
      font-size: 14px;

      .el-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }
    }
  }

  .cover-actions {
    display: flex;
    justify-content: center;
  }
}
</style>

