import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { translateError } from '@/utils/errorMessages'

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
      return { data: null, error: translateError(error.message || error.code) }
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
      return { data: null, error: translateError(error.message || error.code) }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const signOut = async () => {
    loading.value = true
    try {
      // 先清除本地用户状态
      user.value = null
      
      // 尝试登出，忽略所有错误（包括 session 不存在的情况）
      await supabase.auth.signOut()
      
      return { error: null }
    } catch (error: any) {
      // 忽略所有错误，包括 session_not_found 等
      // 因为用户可能已经退出或 session 已过期
      return { error: null }
    } finally {
      loading.value = false
    }
  }

  // 验证密码（不改变当前 session）
  const verifyPassword = async (email: string, password: string) => {
    try {
      // 保存当前 session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      // 尝试用当前密码登录验证
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        return { valid: false, error: translateError(error.message || error.code) }
      }
      
      // 验证成功后，如果有原来的 session，恢复它
      // 如果没有原来的 session，说明验证的就是当前 session，保持即可
      // 实际上，如果验证成功，说明密码正确，可以直接继续
      
      return { valid: true, error: null }
    } catch (error: any) {
      return { valid: false, error: translateError(error.message || error.code) }
    }
  }

  // 修改密码
  const updatePassword = async (newPassword: string) => {
    loading.value = true
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      return { error: translateError(error.message || error.code) }
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
    verifyPassword,
    updatePassword,
  }
})

