<template>
  <div class="post-detail-page" v-loading="loading">
    <el-card v-if="post" class="post-card">
      <!-- 文章头部 -->
      <div class="post-header">
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-meta">
          <el-tag v-if="post.category" type="info">{{ post.category.name }}</el-tag>
          <el-tag v-for="tag in post.tags" :key="tag.id" style="margin-left: 8px">
            {{ tag.name }}
          </el-tag>
          <span class="post-date">发布于 {{ formatDate(post.created_at) }}</span>
        </div>
      </div>

      <!-- 封面图片 -->
      <div v-if="post.cover_image" class="post-cover">
        <el-image :src="post.cover_image" fit="cover" />
      </div>

      <!-- 文章内容 -->
      <div class="post-content" v-html="renderedContent"></div>

      <!-- 返回按钮 -->
      <div class="post-footer">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
      </div>
    </el-card>

    <el-empty v-else-if="!loading" description="文章不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'
import MarkdownIt from 'markdown-it'
import markdownItMark from 'markdown-it-mark'

const route = useRoute()
const router = useRouter()

const post = ref<Post | null>(null)
const loading = ref(false)

// 初始化 Markdown 解析器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
})

md.use(markdownItMark)

// 处理隐藏文字
const processSpoiler = (text: string) => {
  return text.replace(/!!(.+?)!!/g, '<span class="spoiler">$1</span>')
}

const renderedContent = computed(() => {
  if (!post.value) return ''
  let html = md.render(post.value.content)
  html = processSpoiler(html)
  return html
})

const loadPost = async () => {
  loading.value = true
  try {
    const postId = route.params.id

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        category:categories(id, name),
        tags(id, name)
      `)
      .eq('id', postId)
      .eq('status', 'published')
      .single()

    if (error) throw error

    post.value = data as Post
  } catch (error: any) {
    ElMessage.error('加载文章失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadPost()
})
</script>

<style scoped lang="scss">
.post-detail-page {
  max-width: 900px;
  margin: 0 auto;

  .post-card {
    .post-header {
      margin-bottom: 24px;

      .post-title {
        margin: 0 0 16px;
        font-size: 32px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.4;
      }

      .post-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .post-date {
          margin-left: 8px;
          color: var(--el-text-color-secondary);
          font-size: 14px;
        }
      }
    }

    .post-cover {
      width: 100%;
      height: 400px;
      overflow: hidden;
      border-radius: 12px;
      margin-bottom: 32px;

      .el-image {
        width: 100%;
        height: 100%;
      }
    }

    .post-content {
      font-size: 16px;
      line-height: 1.8;
      color: var(--el-text-color-primary);
      margin-bottom: 32px;

      :deep(h1),
      :deep(h2),
      :deep(h3),
      :deep(h4),
      :deep(h5),
      :deep(h6) {
        margin: 24px 0 16px;
        font-weight: 600;
        line-height: 1.4;
      }

      :deep(h1) { font-size: 32px; }
      :deep(h2) { font-size: 28px; }
      :deep(h3) { font-size: 24px; }
      :deep(h4) { font-size: 20px; }

      :deep(p) {
        margin: 16px 0;
      }

      :deep(a) {
        color: var(--el-color-primary);
        text-decoration: none;
        &:hover {
          text-decoration: underline;
        }
      }

      :deep(code) {
        background-color: var(--el-fill-color-light);
        padding: 2px 8px;
        border-radius: 4px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 14px;
      }

      :deep(pre) {
        background-color: var(--el-fill-color-light);
        padding: 20px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 20px 0;

        code {
          background: none;
          padding: 0;
        }
      }

      :deep(blockquote) {
        border-left: 4px solid var(--el-color-primary);
        padding-left: 20px;
        margin: 20px 0;
        color: var(--el-text-color-secondary);
      }

      :deep(ul),
      :deep(ol) {
        padding-left: 30px;
        margin: 16px 0;
      }

      :deep(li) {
        margin: 8px 0;
      }

      :deep(img) {
        max-width: 100%;
        border-radius: 8px;
        margin: 20px 0;
      }

      :deep(table) {
        border-collapse: collapse;
        width: 100%;
        margin: 20px 0;

        th,
        td {
          border: 1px solid var(--el-border-color);
          padding: 12px 16px;
          text-align: left;
        }

        th {
          background-color: var(--el-fill-color-light);
          font-weight: 600;
        }
      }

      :deep(mark) {
        background-color: #fff566;
        padding: 2px 4px;
        border-radius: 2px;
      }

      :deep(.spoiler) {
        background-color: var(--el-text-color-primary);
        color: transparent;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        transition: all 0.3s;
        user-select: none;

        &:hover {
          background-color: var(--el-fill-color-light);
          color: var(--el-text-color-primary);
        }
      }
    }

    .post-footer {
      padding-top: 24px;
      border-top: 1px solid var(--el-border-color);
    }
  }
}
</style>

