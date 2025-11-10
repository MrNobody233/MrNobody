<template>
  <div class="posts-page">
    <el-card class="search-card">
      <el-form :inline="true">
        <el-form-item>
          <el-input
            v-model="searchQuery"
            placeholder="搜索文章标题"
            clearable
            style="width: 300px"
            @clear="loadPosts"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            创建文章
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="posts-card" v-loading="loading">
      <el-table :data="posts" style="width: 100%">
        <el-table-column label="封面" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.cover_image"
              :src="row.cover_image"
              fit="cover"
              style="width: 80px; height: 60px; border-radius: 4px"
              :preview-src-list="[row.cover_image]"
              preview-teleported
            />
            <span v-else style="color: var(--el-text-color-placeholder)">无封面</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="category.name" label="分类" width="120" />
        <el-table-column label="标签" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="tag in row.tags"
              :key="tag.id"
              size="small"
              style="margin-right: 4px"
            >
              {{ tag.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/lib/supabase'

const router = useRouter()

const posts = ref<Post[]>([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

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
      .order('created_at', { ascending: false })

    if (searchQuery.value) {
      query = query.ilike('title', `%${searchQuery.value}%`)
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

const handleSearch = () => {
  currentPage.value = 1
  loadPosts()
}

const handleCreate = () => {
  router.push('/posts/create')
}

const handleEdit = (post: Post) => {
  router.push(`/posts/edit/${post.id}`)
}

const handleDelete = async (post: Post) => {
  try {
    await ElMessageBox.confirm(`确定要删除文章 "${post.title}" 吗？`, '警告', {
      type: 'warning'
    })

    loading.value = true

    // 先删除关联的标签
    await supabase.from('post_tags').delete().eq('post_id', post.id)

    // 删除文章
    const { error } = await supabase.from('posts').delete().eq('id', post.id)

    if (error) throw error

    ElMessage.success('删除成功')
    loadPosts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped lang="scss">
.posts-page {
  .search-card {
    margin-bottom: 20px;
  }

  .posts-card {
    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
}
</style>

