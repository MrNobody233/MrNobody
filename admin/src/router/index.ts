import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/posts',
    children: [
      {
        path: '/posts',
        name: 'Posts',
        component: () => import('@/views/Posts/index.vue')
      },
      {
        path: '/posts/create',
        name: 'CreatePost',
        component: () => import('@/views/Posts/Edit.vue')
      },
      {
        path: '/posts/edit/:id',
        name: 'EditPost',
        component: () => import('@/views/Posts/Edit.vue')
      },
      {
        path: '/categories',
        name: 'Categories',
        component: () => import('@/views/Categories/index.vue')
      },
      {
        path: '/tags',
        name: 'Tags',
        component: () => import('@/views/Tags/index.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 初始化认证状态
  if (authStore.user === null && !authStore.loading) {
    await authStore.initialize()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !authStore.user) {
    next('/login')
  } else if (to.path === '/login' && authStore.user) {
    next('/')
  } else {
    next()
  }
})

export default router

