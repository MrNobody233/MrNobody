<template>
  <div class="main-layout">
    <!-- 导航栏 -->
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <router-link to="/" class="logo">
            <h1>MrNobody</h1>
          </router-link>
        </div>

        <nav class="nav">
          <router-link to="/" class="nav-item">首页</router-link>
          <el-dropdown @command="handleCategoryClick">
            <span class="nav-item">
              分类
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu v-if="categories.length > 0">
                <el-dropdown-item
                  v-for="category in categories"
                  :key="category.id"
                  :command="category.slug"
                >
                  {{ category.name }}
                </el-dropdown-item>
              </el-dropdown-menu>
              <el-dropdown-menu v-else>
                <el-dropdown-item disabled>暂无分类</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </nav>

        <div class="header-right">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文章..."
            class="search-input"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <el-button circle @click="themeStore.toggleTheme">
            <el-icon v-if="themeStore.theme === 'dark'">
              <Sunny />
            </el-icon>
            <el-icon v-else>
              <Moon />
            </el-icon>
          </el-button>

          <el-dropdown trigger="click" @command="handleFxCommand">
            <el-button type="default" @click.stop>
              <el-icon><Setting /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="open-settings">站点设置</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <p>© 2024 MrNobody. All rights reserved.</p>
      </div>
    </footer>

    <el-dialog 
      v-model="settingsVisible" 
      title="站点设置" 
      width="520px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <el-form label-width="100px">
        <el-form-item label="启用特效">
          <el-switch v-model="effectEnabled" />
        </el-form-item>
        <el-form-item label="特效模式">
          <el-select v-model="effectMode" style="width: 260px">
            <el-option label="烟花" value="fireworks" />
            <el-option label="爱心" value="hearts" />
            <el-option label="纸屑" value="confetti" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelSettings">取消</el-button>
          <el-button type="primary" @click="applySettings">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useThemeStore } from '@/stores/theme'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/lib/supabase'
import { initClickFireworks, setEffectMode, getEffectMode, setEffectEnabled, getEffectEnabled } from '@/lib/fireworks'

const router = useRouter()
const themeStore = useThemeStore()

const searchQuery = ref('')
const categories = ref<Category[]>([])
const effectMode = ref(getEffectMode())
const effectEnabled = ref(getEffectEnabled())
const settingsVisible = ref(false)

const loadCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (!error && data) {
    categories.value = data
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value } })
  }
}

const handleCategoryClick = (slug: string) => {
  router.push(`/category/${slug}`)
}

function handleFxCommand(command: string) {
  if (command === 'open-settings') {
    // 打开前同步为已保存的设置，避免上次未保存的临时修改残留
    effectMode.value = getEffectMode()
    effectEnabled.value = getEffectEnabled()
    settingsVisible.value = true
  }
}

onMounted(() => {
  loadCategories()
  initClickFireworks()
})

function applySettings() {
  setEffectEnabled(effectEnabled.value)
  setEffectMode(effectMode.value as any)
  ElMessage.success('设置已保存')
  settingsVisible.value = false
}

function cancelSettings() {
  // 取消时还原到已保存的值
  effectMode.value = getEffectMode()
  effectEnabled.value = getEffectEnabled()
  settingsVisible.value = false
}
</script>

<style scoped lang="scss">
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: background-color 0.3s;

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .header-left {
      .logo {
        text-decoration: none;
        
        h1 {
          margin: 0;
          font-size: 24px;
          color: var(--el-color-primary);
          font-weight: 700;
        }
      }
    }

    .nav {
      display: flex;
      align-items: center;
      gap: 24px;

      .nav-item {
        cursor: pointer;
        text-decoration: none;
        color: var(--el-text-color-primary);
        font-size: 16px;
        font-weight: 500;
        transition: color 0.3s;
        display: flex;
        align-items: center;

        &:hover {
          color: var(--el-color-primary);
        }

        &.router-link-active {
          color: var(--el-color-primary);
        }
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .search-input {
        width: 200px;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 6px;
        transition: background-color 0.3s;

        &:hover {
          background-color: var(--el-fill-color-light);
        }
      }
    }
  }

  .main-content {
    flex: 1;
    background-color: var(--el-bg-color-page);
    transition: background-color 0.3s;

    .content-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
  }

  .footer {
    background-color: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color);
    transition: background-color 0.3s;

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>

