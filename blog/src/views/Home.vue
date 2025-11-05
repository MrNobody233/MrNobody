<template>
  <div class="home-page">
    <!-- 标签筛选 -->
    <el-card class="filter-card">
      <div class="tags-filter">
        <span class="filter-label">标签筛选：</span>
        <el-tag
          :type="selectedTag === null ? 'primary' : ''"
          @click="handleTagFilter(null)"
          style="cursor: pointer; margin-right: 8px"
        >
          全部
        </el-tag>
        <el-tag
          v-for="tag in tags"
          :key="tag.id"
          :type="selectedTag === tag.id ? 'primary' : ''"
          @click="handleTagFilter(tag.id)"
          style="cursor: pointer; margin-right: 8px; margin-bottom: 8px"
        >
          {{ tag.name }}
        </el-tag>
      </div>
    </el-card>

    <!-- 文章列表 -->
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

      <el-empty v-if="!loading && posts.length === 0" description="暂无文章" />
    </div>

    <!-- 分页 -->
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'
import type { Post, Tag } from '@/lib/supabase'

const router = useRouter()

const posts = ref<Post[]>([])
const tags = ref<Tag[]>([])
const loading = ref(false)
const selectedTag = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadTags = async () => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  if (!error && data) {
    tags.value = data
  }
}

const loadPosts = async () => {
  loading.value = true
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        category:categories(id, name),
        tags(id, name)
      `, { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    // 标签筛选
    if (selectedTag.value !== null) {
      query = query.contains('tags', [{ id: selectedTag.value }])
    }

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

const handleTagFilter = (tagId: number | null) => {
  selectedTag.value = tagId
  currentPage.value = 1
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

onMounted(() => {
  loadTags()
  loadPosts()
})
</script>

<style scoped lang="scss">
.home-page {
  .filter-card {
    margin-bottom: 24px;

    .tags-filter {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;

      .filter-label {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
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

