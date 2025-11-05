import { supabase } from '@/lib/supabase'

export async function uploadAvatar(file: File, userId: string) {
  // 基本校验
  if (!file) throw '未选择文件'
  if (!userId) throw '未登录或用户信息缺失'
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) throw '文件过大，最大 5MB'

  const fileExt = file.name.split('.').pop() || 'png'
  const filePath = `avatars/${userId}/${Date.now()}.${fileExt}`

  // 上传
  const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'image/png',
  })
  if (uploadError) {
    // 常见配置类错误提示
    if (String(uploadError.message || '').includes('bucket')) {
      throw 'Storage bucket 不存在或名称错误（应为 avatars）'
    }
    if (String(uploadError.message || '').toLowerCase().includes('unauthorized')) {
      throw '无权限上传，请确认已登录且 Storage 策略允许 authenticated 写入'
    }
    throw uploadError.message
  }

  // 公开地址（需 bucket 设置为 public 或有签名 URL 策略）
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
  const publicUrl = data.publicUrl
  if (!publicUrl) throw '获取文件地址失败，请检查 bucket 公共读取权限'

  // 更新用户元数据
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  })
  if (updateError) throw updateError.message

  return publicUrl
}


