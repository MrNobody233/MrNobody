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
        <!-- 作者信息 -->
        <div class="post-author" v-if="authorProfile">
          <el-avatar
            v-if="authorProfile.avatar_url"
            :src="authorProfile.avatar_url"
            :size="40"
            fit="cover"
          />
          <el-avatar
            v-else
            :size="40"
            :icon="User"
          />
          <div class="author-info">
            <div class="author-name">{{ authorProfile.username || '作者' }}</div>
            <div class="author-bio" v-if="authorProfile.bio">{{ authorProfile.bio }}</div>
          </div>
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
import { User } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabase'
import type { Post, Profile } from '@/lib/supabase'
import MarkdownIt from 'markdown-it'
import markdownItMark from 'markdown-it-mark'

const route = useRoute()
const router = useRouter()

const post = ref<Post | null>(null)
const authorProfile = ref<Profile | null>(null)
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

// 处理提示文字：??文字|提示内容??
const processTooltip = (text: string) => {
  // QuestionFilled 图标的 SVG
  const questionIcon = '<svg class="tooltip-icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="14" height="14"><path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm23.744 191.488c-52.096 0-92.928 14.784-123.2 44.352-30.976 29.568-45.76 70.4-45.76 122.496 0 9.216 1.024 18.432 2.048 27.648l2.048 12.288h94.72l-2.048-12.288c-1.024-6.144-1.024-12.288-1.024-18.432 0-25.6 5.12-45.568 15.36-60.416 10.24-14.848 25.6-22.272 46.08-22.272 20.48 0 35.84 7.424 46.08 22.272 10.24 14.848 15.36 34.816 15.36 60.416 0 20.48-3.072 38.912-9.216 55.296-6.144 16.384-15.36 30.72-27.648 42.24-12.288 12.288-27.648 23.04-46.08 32.256-18.432 9.216-40.96 18.432-67.584 27.648l-15.36 4.608c-5.12 1.024-9.216 3.072-12.288 6.144-3.072 3.072-5.12 6.144-6.144 10.24-1.024 4.096-1.024 8.192-1.024 12.288v40.96h94.72v-20.48c0-6.144 1.024-11.264 3.072-15.36 2.048-4.096 5.12-7.168 9.216-9.216l15.36-4.608c26.624-9.216 49.152-18.432 67.584-27.648 18.432-9.216 33.792-20.48 46.08-32.256 12.288-12.288 21.504-26.624 27.648-42.24 6.144-16.384 9.216-34.816 9.216-55.296 0-52.096-14.784-92.928-44.352-123.2-29.568-30.976-70.4-45.76-122.496-45.76zm-12.288 510.976a38.4 38.4 0 1 0 0 76.8 38.4 38.4 0 0 0 0-76.8z"/></svg>'
  return text.replace(/\?\?(.+?)\|(.+?)\?\?/g, `<span class="tooltip-text" data-tooltip="$2">$1${questionIcon}</span>`)
}

const renderedContent = computed(() => {
  if (!post.value) return ''
  let html = md.render(post.value.content)
  html = processSpoiler(html)
  html = processTooltip(html)
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

    // 加载作者信息
    if (post.value.author_id) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', post.value.author_id)
        .single()

      if (!profileError && profileData) {
        authorProfile.value = profileData
      }
    }
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
    overflow: visible;
    
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
        margin-bottom: 16px;

        .post-date {
          margin-left: 8px;
          color: var(--el-text-color-secondary);
          font-size: 14px;
        }
      }

      .post-author {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background-color: var(--el-fill-color-lighter);
        border-radius: 8px;
        margin-top: 16px;

        .author-info {
          flex: 1;

          .author-name {
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
          }

          .author-bio {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            line-height: 1.4;
          }
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
      overflow: visible;

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

      :deep(.tooltip-text) {
        position: relative;
        display: inline-block;
        color: var(--el-color-primary);
        cursor: help;
        border-bottom: 1px dashed var(--el-color-primary);

        .tooltip-icon {
          display: inline-block;
          margin-left: 4px;
          vertical-align: middle;
          color: var(--el-color-primary);
          flex-shrink: 0;
        }

        &::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 16px;
          background-color: rgba(0, 0, 0, 0.95);
          color: white;
          font-size: 14px;
          line-height: 1.6;
          border-radius: 8px;
          white-space: pre-wrap;
          max-width: 350px;
          min-width: 120px;
          width: max-content;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.3s, visibility 0.3s;
          z-index: 999999;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          word-wrap: break-word;
        }

        &::before {
          content: '';
          position: absolute;
          bottom: calc(100% + 2px);
          left: 50%;
          transform: translateX(-50%);
          border: 8px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.95);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.3s, visibility 0.3s;
          z-index: 999999;
        }

        &:hover::after,
        &:hover::before {
          opacity: 1;
          visibility: visible;
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

