<template>
  <el-container class="main-layout">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>博客管理</h2>
      </div>
      
      <el-menu
        :default-active="currentRoute"
        router
        class="menu"
      >
        <el-menu-item index="/posts">
          <el-icon><Document /></el-icon>
          <span>文章管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Folder /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/tags">
          <el-icon><Collection /></el-icon>
          <span>标签管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="breadcrumb">{{ breadcrumb }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <el-button circle @click="themeStore.toggleTheme">
            <el-icon v-if="themeStore.theme === 'dark'">
              <Sunny />
            </el-icon>
            <el-icon v-else>
              <Moon />
            </el-icon>
          </el-button>

          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-icon><User /></el-icon>
              <span>{{ authStore.user?.email }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const currentRoute = computed(() => route.path)

const breadcrumb = computed(() => {
  const map: Record<string, string> = {
    '/posts': '文章管理',
    '/posts/create': '创建文章',
    '/posts/edit': '编辑文章',
    '/categories': '分类管理',
    '/tags': '标签管理'
  }
  
  for (const key in map) {
    if (route.path.startsWith(key)) {
      return map[key]
    }
  }
  return ''
})

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        type: 'warning'
      })
      const { error } = await authStore.signOut()
      if (error) {
        ElMessage.error(error)
      } else {
        ElMessage.success('已退出登录')
        router.push('/login')
      }
    } catch {
      // 用户取消
    }
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  width: 100%;
  height: 100vh;

  .sidebar {
    background-color: var(--el-bg-color);
    border-right: 1px solid var(--el-border-color);
    transition: background-color 0.3s;

    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid var(--el-border-color);

      h2 {
        margin: 0;
        font-size: 20px;
        color: var(--el-color-primary);
      }
    }

    .menu {
      border-right: none;
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid var(--el-border-color);
    background-color: var(--el-bg-color);
    transition: background-color 0.3s;

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;

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
    background-color: var(--el-bg-color-page);
    padding: 20px;
    overflow-y: auto;
    transition: background-color 0.3s;
  }
}
</style>

