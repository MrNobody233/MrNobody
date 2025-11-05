import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: '/post/:id',
        name: 'PostDetail',
        component: () => import('@/views/PostDetail.vue')
      },
      {
        path: '/category/:slug',
        name: 'Category',
        component: () => import('@/views/Category.vue')
      },
      {
        path: '/tag/:slug',
        name: 'Tag',
        component: () => import('@/views/Tag.vue')
      },
      {
        path: '/search',
        name: 'Search',
        component: () => import('@/views/Search.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 初始化认证状态
  if (authStore.user === null && !authStore.loading) {
    await authStore.initialize()
  }

  next()
})

export default router

