import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

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

export default router

