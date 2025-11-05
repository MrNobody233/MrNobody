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

  // 更新用户资料
  const updateProfile = async (updates: Partial<Profile>, userId?: string) => {
    const targetUserId = userId || profile.value?.id
    if (!targetUserId) {
      return { data: null, error: 'User ID is required' }
    }

    loading.value = true
    try {
      // 先检查 profile 是否存在
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()

      let result

      // 如果记录存在（没有错误或错误不是 PGRST116）
      if (existingProfile && (!checkError || checkError.code !== 'PGRST116')) {
        // 如果存在，更新
        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUserId)
          .select()
          .single()

        if (error) throw error
        result = { data, error: null }
      } else {
        // 如果不存在，创建新记录
        const { data, error } = await supabase
          .from('profiles')
          .insert([{
            id: targetUserId,
            ...updates,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) throw error
        result = { data, error: null }
      }

      // 更新本地状态
      if (result.data) {
        profile.value = result.data
      }

      return result
    } catch (error: any) {
      return { data: null, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 上传头像
  const uploadAvatar = async (file: File, userId?: string) => {
    const targetUserId = userId || profile.value?.id
    if (!targetUserId) {
      return { data: null, error: 'User ID is required' }
    }

    loading.value = true
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${targetUserId}-${Date.now()}.${fileExt}`
      const filePath = `${targetUserId}/${fileName}`

      // 删除旧头像（如果存在）
      if (profile.value?.avatar_url) {
        const oldPath = profile.value.avatar_url.split('/').slice(-2).join('/')
        await supabase.storage.from('avatars').remove([oldPath])
      }

      // 上传新头像
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // 获取公开 URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 更新资料中的头像 URL
      const { error: updateError } = await updateProfile({
        avatar_url: data.publicUrl
      }, targetUserId)

      if (updateError) throw updateError

      return { data: data.publicUrl, error: null }
    } catch (error: any) {
      return { data: null, error: error.message }
    } finally {
      loading.value = false
    }
  }

  // 删除头像
  const deleteAvatar = async () => {
    if (!profile.value || !profile.value.avatar_url) return { error: 'No avatar to delete' }

    loading.value = true
    try {
      const filePath = profile.value.avatar_url.split('/').slice(-2).join('/')
      
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      if (deleteError) throw deleteError

      const { error: updateError } = await updateProfile({ avatar_url: null })

      if (updateError) throw updateError

      return { error: null }
    } catch (error: any) {
      return { error: error.message }
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
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    reset
  }
})

