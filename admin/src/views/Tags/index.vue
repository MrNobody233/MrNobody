<template>
  <div class="tags-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>标签管理</h3>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新增标签
          </el-button>
        </div>
      </template>

      <el-table :data="tags" v-loading="loading">
        <el-table-column prop="name" label="标签名称" />
        <el-table-column prop="slug" label="标识符" />
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
      :title="isEdit ? '编辑标签' : '创建标签'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标识符" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入标识符（英文）" />
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
import type { Tag } from '@/lib/supabase'

const tags = ref<Tag[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
  slug: ''
})

const rules = reactive<FormRules>({
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  slug: [
    { required: true, message: '请输入标识符', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符', trigger: 'blur' }
  ]
})

const loadTags = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    tags.value = data || []
  } catch (error: any) {
    ElMessage.error('加载标签失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  editId.value = null
  form.name = ''
  form.slug = ''
  dialogVisible.value = true
}

const handleEdit = (tag: Tag) => {
  isEdit.value = true
  editId.value = tag.id
  form.name = tag.name
  form.slug = tag.slug
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
        updated_at: new Date().toISOString()
      }

      if (isEdit.value && editId.value) {
        const { error } = await supabase
          .from('tags')
          .update(data)
          .eq('id', editId.value)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tags')
          .insert([{ ...data, created_at: new Date().toISOString() }])

        if (error) throw error
      }

      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadTags()
    } catch (error: any) {
      ElMessage.error('保存失败: ' + error.message)
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = async (tag: Tag) => {
  try {
    await ElMessageBox.confirm(`确定要删除标签 "${tag.name}" 吗？`, '警告', {
      type: 'warning'
    })

    loading.value = true
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tag.id)

    if (error) throw error

    ElMessage.success('删除成功')
    loadTags()
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
  loadTags()
})
</script>

<style scoped lang="scss">
.tags-page {
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

