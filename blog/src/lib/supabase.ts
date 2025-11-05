import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt?: string
  cover_image?: string
  category_id?: number
  author_id: string
  status: 'draft' | 'published'
  published_at?: string
  created_at: string
  updated_at: string
  // 关联数据
  category?: Category
  tags?: Tag[]
  author?: User
}

export interface PostTag {
  post_id: number
  tag_id: number
  created_at: string
}

export interface Profile {
  id: string
  username?: string
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

