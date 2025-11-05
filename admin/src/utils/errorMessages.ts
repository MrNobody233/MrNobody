/**
 * 将 Supabase 错误信息转换为中文
 */
export function translateError(error: string | null | undefined): string {
  if (!error) return '未知错误'

  const errorLower = error.toLowerCase()

  // 错误代码映射
  const errorCodeMap: Record<string, string> = {
    'invalid_credentials': '邮箱或密码错误',
    'email_not_confirmed': '邮箱未验证，请先验证邮箱',
    'email_address_not_authorized': '邮箱地址未授权',
    'signup_disabled': '注册功能已禁用',
    'email_rate_limit_exceeded': '邮件发送过于频繁，请稍后再试',
    'too_many_requests': '请求过于频繁，请稍后再试',
    'invalid_request': '请求无效',
    'invalid_token': '令牌无效或已过期',
    'token_expired': '令牌已过期',
    'session_not_found': '会话不存在',
    'user_not_found': '用户不存在',
    'user_already_registered': '该邮箱已被注册',
    'weak_password': '密码强度不够，请使用更复杂的密码',
    'password_too_short': '密码长度不够',
  }

  // 错误消息映射（包含关键词）
  const errorMessageMap: Record<string, string> = {
    'invalid login credentials': '邮箱或密码错误',
    'invalid credentials': '邮箱或密码错误',
    'email not confirmed': '邮箱未验证，请先验证邮箱',
    'email already registered': '该邮箱已被注册',
    'password should be at least': '密码长度至少',
    'too many requests': '请求过于频繁，请稍后再试',
    'session not found': '会话不存在或已过期',
    'user not found': '用户不存在',
    'invalid token': '令牌无效或已过期',
    'token expired': '令牌已过期',
  }

  // 先检查错误代码
  for (const [code, message] of Object.entries(errorCodeMap)) {
    if (errorLower.includes(code)) {
      return message
    }
  }

  // 再检查错误消息
  for (const [key, message] of Object.entries(errorMessageMap)) {
    if (errorLower.includes(key)) {
      // 如果是密码长度错误，尝试提取具体长度
      if (key === 'password should be at least') {
        const match = error.match(/(\d+)/)
        if (match) {
          return `密码长度至少${match[1]}位`
        }
      }
      return message
    }
  }

  // 如果都不匹配，返回原始错误（但去除一些技术细节）
  return error.replace(/^.*?: /, '').trim() || '操作失败，请重试'
}

