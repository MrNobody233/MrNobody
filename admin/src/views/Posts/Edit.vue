<template>
  <div class="edit-post-page">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <h3>{{ isEdit ? '编辑文章' : '创建文章' }}</h3>
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="文章标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入文章标题" />
            </el-form-item>

            <el-form-item label="文章内容" prop="content">
              <MarkdownEditor v-model="form.content" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item>
              <template #label>
                <HelpTooltip
                  text="分类"
                  tooltip="选择文章所属的分类，用于文章分类展示"
                />
              </template>
              <el-select
                v-model="form.category_id"
                placeholder="请选择分类"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item>
              <template #label>
                <HelpTooltip
                  text="标签"
                  tooltip="可以为文章添加多个标签，用于文章分类和检索"
                />
              </template>
              <el-select
                v-model="form.tagIds"
                placeholder="请选择标签"
                multiple
                style="width: 100%"
              >
                <el-option
                  v-for="tag in tags"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item>
              <template #label>
                <HelpTooltip
                  text="封面图片"
                  tooltip="上传文章封面图片，建议尺寸为 1200x600 像素，支持 JPG、PNG、GIF 格式，文件大小不超过 5MB"
                />
              </template>
              <CoverImageUpload
                :image-url="form.cover_image"
                @update:image-url="(url) => form.cover_image = url || ''"
                @uploaded="(url) => form.cover_image = url"
                @deleted="() => form.cover_image = ''"
              />
            </el-form-item>

            <el-form-item>
              <template #label>
                <HelpTooltip
                  text="摘要"
                  tooltip="文章摘要会显示在文章列表中，如果不填写，系统会自动截取文章内容的前150个字符作为摘要"
                />
              </template>
              <el-input
                v-model="form.excerpt"
                type="textarea"
                :rows="4"
                placeholder="文章摘要（选填）"
              />
            </el-form-item>

            <el-form-item>
              <template #label>
                <HelpTooltip
                  text="状态"
                  tooltip="草稿：文章不会在前台显示，只有作者可以查看；发布：文章会立即在前台显示"
                />
              </template>
              <el-radio-group v-model="form.status">
                <el-radio label="draft">草稿</el-radio>
                <el-radio label="published">发布</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSave" :loading="saving">
                保存
              </el-button>
              <el-button @click="handleCancel">取消</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Category, Tag } from '@/lib/supabase'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import CoverImageUpload from '@/components/CoverImageUpload.vue'
import HelpTooltip from '@/components/HelpTooltip.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isEdit = computed(() => !!route.params.id)
const postId = computed(() => route.params.id as string)

const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  title: '',
  content: '',
  excerpt: '',
  cover_image: '',
  category_id: null as number | null,
  status: 'draft' as 'draft' | 'published',
  tagIds: [] as number[]
})

const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])

const rules = reactive<FormRules>({
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }]
})

const loadCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    ElMessage.error('加载分类失败: ' + error.message)
  } else {
    categories.value = data || []
  }
}

const loadTags = async () => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  if (error) {
    ElMessage.error('加载标签失败: ' + error.message)
  } else {
    tags.value = data || []
  }
}

const loadPost = async () => {
  if (!isEdit.value) return

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_tags(tag_id)
      `)
      .eq('id', postId.value)
      .single()

    if (error) throw error

    form.title = data.title
    form.content = data.content
    form.excerpt = data.excerpt || ''
    form.cover_image = data.cover_image || ''
    form.category_id = data.category_id
    form.status = data.status
    form.tagIds = data.post_tags?.map((pt: any) => pt.tag_id) || []
  } catch (error: any) {
    ElMessage.error('加载文章失败: ' + error.message)
    router.back()
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const postData = {
        title: form.title,
        slug: form.title.toLowerCase().replace(/\s+/g, '-'),
        content: form.content,
        excerpt: form.excerpt || null,
        cover_image: form.cover_image || null,
        category_id: form.category_id || null,
        status: form.status,
        author_id: authStore.user?.id,
        updated_at: new Date().toISOString()
      }

      let postIdValue: number

      if (isEdit.value) {
        // 更新文章
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', postId.value)

        if (error) throw error
        postIdValue = parseInt(postId.value)
      } else {
        // 创建文章
        const { data, error } = await supabase
          .from('posts')
          .insert([{ ...postData, created_at: new Date().toISOString() }])
          .select()
          .single()

        if (error) throw error
        postIdValue = data.id
      }

      // 更新标签关联
      await supabase.from('post_tags').delete().eq('post_id', postIdValue)

      if (form.tagIds.length > 0) {
        const postTags = form.tagIds.map(tagId => ({
          post_id: postIdValue,
          tag_id: tagId
        }))

        const { error: tagError } = await supabase
          .from('post_tags')
          .insert(postTags)

        if (tagError) throw tagError
      }

      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      router.push('/posts')
    } catch (error: any) {
      ElMessage.error('保存失败: ' + error.message)
    } finally {
      saving.value = false
    }
  })
}

const handleCancel = () => {
  router.back()
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadTags()])
  await loadPost()
})
</script>

<style scoped lang="scss">
.edit-post-page {
  .card-header {
    h3 {
      margin: 0;
    }
  }
}
</style>

