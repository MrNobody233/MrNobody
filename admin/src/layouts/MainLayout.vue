<template>
  <el-container class="main-layout">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>MrNobody</h2>
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

          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info" @click.stop>
              <el-avatar
                v-if="profileStore.profile?.avatar_url"
                :src="profileStore.profile.avatar_url"
                :size="32"
                fit="cover"
              />
              <el-avatar
                v-else
                :size="32"
                :icon="User"
              />
              <span>{{ profileStore.profile?.username || authStore.user?.email }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="fx-settings">
                  <el-icon><Setting /></el-icon>
                  特效设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
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

    <el-dialog 
      v-model="secretVisible" 
      title="特效设置" 
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <el-form label-width="90px">
        <el-form-item label="启用特效">
          <el-switch v-model="effectEnabled" />
        </el-form-item>
        <el-form-item label="模式">
          <el-select v-model="effectMode" style="width: 200px">
            <el-option label="烟花" value="fireworks" />
            <el-option label="爱心" value="hearts" />
            <el-option label="纸屑" value="confetti" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelEffectSettings">取消</el-button>
          <el-button type="primary" @click="applyEffectSettings">应用</el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useThemeStore } from '@/stores/theme'
import { initClickFireworks, getEffectMode, getEffectEnabled, setEffectMode, setEffectEnabled } from '@/lib/fireworks'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const profileStore = useProfileStore()
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
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'fx-settings') {
    // 打开前同步为已保存的设置，避免上次未保存的临时修改残留
    effectMode.value = getEffectMode()
    effectEnabled.value = getEffectEnabled()
    secretVisible.value = true
  } else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        type: 'warning'
      })
      // 无论是否成功都跳转到登录页
      await authStore.signOut()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {
      // 用户取消或出错，都跳转到登录页
      router.push('/login')
    }
  }
}

// 加载用户资料
const loadProfile = async () => {
  if (authStore.user?.id) {
    await profileStore.loadProfile(authStore.user.id)
  }
}

// 监听用户登录状态
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    loadProfile()
  } else {
    profileStore.reset()
  }
})

onMounted(() => {
  initClickFireworks()
  if (authStore.user) {
    loadProfile()
  }
})

const effectMode = ref(getEffectMode())
const effectEnabled = ref(getEffectEnabled())
const secretVisible = ref(false)

function applyEffectSettings() {
  setEffectMode(effectMode.value as any)
  setEffectEnabled(effectEnabled.value)
  ElMessage.success('特效设置已应用')
  secretVisible.value = false
}

function cancelEffectSettings() {
  // 取消时还原到已保存的值
  effectMode.value = getEffectMode()
  effectEnabled.value = getEffectEnabled()
  secretVisible.value = false
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


