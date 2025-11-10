<template>
  <div class="search-page">
    <el-card class="search-header">
      <h2>搜索结果</h2>
      <el-input
        v-model="searchQuery"
        placeholder="搜索文章..."
        size="large"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
      <p v-if="searched" class="search-info">
        找到 {{ total }} 篇文章
      </p>
    </el-card>

    <div class="posts-grid" v-loading="loading">
      <el-card
        v-for="post in posts"
        :key="post.id"
        class="post-card"
        @click="goToPost(post.id)"
        shadow="hover"
      >
        <div class="post-cover">
          <el-image
            v-if="post.cover_image"
            :src="post.cover_image"
            fit="cover"
            :lazy="true"
          />
          <div v-else class="cover-placeholder">
            <el-icon :size="48"><Picture /></el-icon>
            <span>暂无封面</span>
          </div>
        </div>
        <div class="post-content">
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-excerpt" v-if="post.excerpt">{{ post.excerpt }}</p>
          <div class="post-meta">
            <el-tag v-if="post.category" size="small" type="info">
              {{ post.category.name }}
            </el-tag>
            <el-tag
              v-for="tag in post.tags"
              :key="tag.id"
              size="small"
              style="margin-left: 4px"
            >
              {{ tag.name }}
            </el-tag>
            <span class="post-date">{{ formatDate(post.created_at) }}</span>
          </div>
        </div>
      </el-card>

      <el-empty v-if="!loading && searched && posts.length === 0" description="未找到相关文章" />
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
import { Picture } from '@element-plus/icons-vue'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()

const posts = ref<Post[]>([])
const searchQuery = ref('')
const loading = ref(false)
const searched = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadPosts = async () => {
  if (!searchQuery.value.trim()) {
    posts.value = []
    total.value = 0
    searched.value = false
    return
  }

  loading.value = true
  searched.value = true
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        category:categories(id, name),
        tags(id, name)
      `, { count: 'exact' })
      .eq('status', 'published')
      .or(`title.ilike.%${searchQuery.value}%,content.ilike.%${searchQuery.value}%`)
      .order('created_at', { ascending: false })

    const start = (currentPage.value - 1) * pageSize.value
    query = query.range(start, start + pageSize.value - 1)

    const { data, error, count } = await query

    if (error) throw error

    posts.value = data as Post[]
    total.value = count || 0
  } catch (error: any) {
    ElMessage.error('搜索失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  router.push({ path: '/search', query: { q: searchQuery.value } })
  loadPosts()
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

watch(() => route.query.q, (newQuery) => {
  if (route.name === 'Search' && newQuery) {
    searchQuery.value = newQuery as string
    loadPosts()
  }
})

onMounted(() => {
  const query = route.query.q
  if (query) {
    searchQuery.value = query as string
    loadPosts()
  }
})
</script>

<style scoped lang="scss">
.search-page {
  .search-header {
    margin-bottom: 24px;

    h2 {
      margin: 0 0 16px;
      font-size: 28px;
      color: var(--el-text-color-primary);
    }

    .search-info {
      margin: 16px 0 0;
      color: var(--el-text-color-secondary);
      font-size: 14px;
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
        background-color: var(--el-fill-color-light);

        .el-image {
          width: 100%;
          height: 100%;
        }

        .cover-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--el-text-color-placeholder);
          background-color: var(--el-fill-color-lighter);

          .el-icon {
            margin-bottom: 8px;
            opacity: 0.5;
          }

          span {
            font-size: 14px;
          }
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

