<template>
  <div class="categories-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>分类管理</h3>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增分类
          </el-button>
        </div>
      </template>

      <el-table :data="categories" v-loading="loading">
        <el-table-column prop="name" label="分类名称" />
        <el-table-column prop="slug" label="标识符" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '创建分类'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="标识符" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入标识符（英文）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述（选填）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/lib/supabase'

const categories = ref<Category[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
  slug: '',
  description: ''
})

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  slug: [
    { required: true, message: '请输入标识符', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符', trigger: 'blur' }
  ]
})

const loadCategories = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    categories.value = data || []
  } catch (error: any) {
    ElMessage.error('加载分类失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  editId.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  dialogVisible.value = true
}

const handleEdit = (category: Category) => {
  isEdit.value = true
  editId.value = category.id
  form.name = category.name
  form.slug = category.slug
  form.description = category.description || ''
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const data = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        updated_at: new Date().toISOString()
      }

      if (isEdit.value && editId.value) {
        const { error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', editId.value)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ ...data, created_at: new Date().toISOString() }])

        if (error) throw error
      }

      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadCategories()
    } catch (error: any) {
      ElMessage.error('保存失败: ' + error.message)
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = async (category: Category) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类 "${category.name}" 吗？`, '警告', {
      type: 'warning'
    })

    loading.value = true
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)

    if (error) throw error

    ElMessage.success('删除成功')
    loadCategories()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped lang="scss">
.categories-page {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
    }
  }
}
</style>

