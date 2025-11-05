<template>
  <div class="tag-page">
    <el-card class="tag-header">
      <h2>标签：{{ tagName }}</h2>
    </el-card>

    <div class="posts-grid" v-loading="loading">
      <el-card
        v-for="post in posts"
        :key="post.id"
        class="post-card"
        @click="goToPost(post.id)"
        shadow="hover"
      >
        <div v-if="post.cover_image" class="post-cover">
          <el-image :src="post.cover_image" fit="cover" />
        </div>
        <div class="post-content">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-excerpt" v-if="post.excerpt">{{ post.excerpt }}</p>
          <div class="post-meta">
            <el-tag v-if="post.category" size="small" type="info">
              {{ post.category.name }}
            </el-tag>
            <span class="post-date">{{ formatDate(post.created_at) }}</span>
          </div>
        </div>
      </el-card>

      <el-empty v-if="!loading && posts.length === 0" description="该标签下暂无文章" />
    </div>

    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()

const posts = ref<Post[]>([])
const tagName = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tagId = ref<number | null>(null)

const loadTag = async () => {
  const slug = route.params.slug as string
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    ElMessage.error('标签不存在')
    router.push('/')
    return
  }

  tagId.value = data.id
  tagName.value = data.name
}

const loadPosts = async () => {
  if (!tagId.value) return

  loading.value = true
  try {
    // 先获取该标签下的所有文章ID
    const { data: postTags, error: postTagsError } = await supabase
      .from('post_tags')
      .select('post_id')
      .eq('tag_id', tagId.value)

    if (postTagsError) throw postTagsError

    const postIds = postTags?.map(pt => pt.post_id) || []

    if (postIds.length === 0) {
      posts.value = []
      total.value = 0
      loading.value = false
      return
    }

    // 获取文章详情
    let query = supabase
      .from('posts')
      .select(`
        *,
        category:categories(id, name),
        tags(id, name)
      `, { count: 'exact' })
      .eq('status', 'published')
      .in('id', postIds)
      .order('created_at', { ascending: false })

    const start = (currentPage.value - 1) * pageSize.value
    query = query.range(start, start + pageSize.value - 1)

    const { data, error, count } = await query

    if (error) throw error

    posts.value = data as Post[]
    total.value = count || 0
  } catch (error: any) {
    ElMessage.error('加载文章失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = () => {
  currentPage.value = 1
  loadPosts()
}

const handleCurrentChange = () => {
  loadPosts()
}

const goToPost = (id: number) => {
  router.push(`/post/${id}`)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

watch(() => route.params.slug, async () => {
  if (route.name === 'Tag') {
    await loadTag()
    loadPosts()
  }
})

onMounted(async () => {
  await loadTag()
  loadPosts()
})
</script>

<style scoped lang="scss">
.tag-page {
  .tag-header {
    margin-bottom: 24px;

    h2 {
      margin: 0;
      font-size: 28px;
      color: var(--el-text-color-primary);
    }
  }

  .posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
    margin-bottom: 24px;

    .post-card {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .post-cover {
        width: 100%;
        height: 200px;
        overflow: hidden;
        border-radius: 8px;
        margin-bottom: 16px;

        .el-image {
          width: 100%;
          height: 100%;
        }
      }

      .post-content {
        .post-title {
          margin: 0 0 12px;
          font-size: 20px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .post-excerpt {
          margin: 0 0 16px;
          color: var(--el-text-color-secondary);
          font-size: 14px;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .post-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;

          .post-date {
            margin-left: auto;
            font-size: 13px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }
}
</style>

