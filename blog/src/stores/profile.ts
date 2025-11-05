import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile | null>(null)
  const loading = ref(false)

  // 加载用户资料
  const loadProfile = async (userId: string) => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = 未找到记录
      profile.value = data
    } catch (error: any) {
      console.error('Load profile error:', error)
      profile.value = null
    } finally {
      loading.value = false
    }
  }

  // 重置资料
  const reset = () => {
    profile.value = null
  }

  return {
    profile,
    loading,
    loadProfile,
    reset
  }
})

