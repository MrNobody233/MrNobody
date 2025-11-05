import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)

  // 初始化，检查用户登录状态
  const initialize = async () => {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null
    } catch (error) {
      console.error('Initialize auth error:', error)
    } finally {
      loading.value = false
    }
  }

  // 注册
  const signUp = async (email: string, password: string) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      user.value = data.user
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 登录
  const signIn = async (email: string, password: string) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      user.value = data.user
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const signOut = async () => {
    loading.value = true
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      user.value = null
      return { error: null }
    } catch (error: any) {
      return { error: error.message }
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    initialize,
    signUp,
    signIn,
    signOut,
  }
})

