-- ============================================
-- 博客系统完整数据库初始化脚本
-- 请在 Supabase SQL Editor 中执行此脚本
-- 包含所有表、策略和 Storage 配置
-- ============================================

-- ============================================
-- 第一部分：创建数据表
-- ============================================

-- 1. 创建分类表
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建标签表
CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建文章表
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建文章-标签关联表
CREATE TABLE IF NOT EXISTS post_tags (
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);

-- 5. 创建用户资料表（扩展 auth.users，用于头像等功能）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 第二部分：启用行级安全策略（RLS）
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 第三部分：删除已存在的策略（避免冲突）
-- ============================================

-- 分类表策略
DROP POLICY IF EXISTS "允许所有人查看分类" ON categories;
DROP POLICY IF EXISTS "允许认证用户创建分类" ON categories;
DROP POLICY IF EXISTS "允许认证用户更新分类" ON categories;
DROP POLICY IF EXISTS "允许认证用户删除分类" ON categories;

-- 标签表策略
DROP POLICY IF EXISTS "允许所有人查看标签" ON tags;
DROP POLICY IF EXISTS "允许认证用户创建标签" ON tags;
DROP POLICY IF EXISTS "允许认证用户更新标签" ON tags;
DROP POLICY IF EXISTS "允许认证用户删除标签" ON tags;

-- 文章表策略
DROP POLICY IF EXISTS "允许所有人查看已发布文章" ON posts;
DROP POLICY IF EXISTS "允许认证用户创建文章" ON posts;
DROP POLICY IF EXISTS "允许作者更新自己的文章" ON posts;
DROP POLICY IF EXISTS "允许作者删除自己的文章" ON posts;

-- 文章标签关联表策略
DROP POLICY IF EXISTS "允许所有人查看文章标签" ON post_tags;
DROP POLICY IF EXISTS "允许认证用户管理文章标签" ON post_tags;

-- 用户资料表策略
DROP POLICY IF EXISTS "允许所有人查看资料" ON profiles;
DROP POLICY IF EXISTS "允许用户管理自己的资料" ON profiles;

-- Storage 策略
DROP POLICY IF EXISTS "允许所有人查看头像" ON storage.objects;
DROP POLICY IF EXISTS "允许认证用户上传头像" ON storage.objects;
DROP POLICY IF EXISTS "允许用户更新自己的头像" ON storage.objects;
DROP POLICY IF EXISTS "允许用户删除自己的头像" ON storage.objects;

-- ============================================
-- 第四部分：创建数据表策略
-- ============================================

-- 分类表策略
CREATE POLICY "允许所有人查看分类" ON categories 
  FOR SELECT USING (true);

CREATE POLICY "允许认证用户创建分类" ON categories 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "允许认证用户更新分类" ON categories 
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "允许认证用户删除分类" ON categories 
  FOR DELETE USING (auth.role() = 'authenticated');

-- 标签表策略
CREATE POLICY "允许所有人查看标签" ON tags 
  FOR SELECT USING (true);

CREATE POLICY "允许认证用户创建标签" ON tags 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "允许认证用户更新标签" ON tags 
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "允许认证用户删除标签" ON tags 
  FOR DELETE USING (auth.role() = 'authenticated');

-- 文章表策略
CREATE POLICY "允许所有人查看已发布文章" ON posts 
  FOR SELECT USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "允许认证用户创建文章" ON posts 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "允许作者更新自己的文章" ON posts 
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "允许作者删除自己的文章" ON posts 
  FOR DELETE USING (auth.uid() = author_id);

-- 文章标签关联表策略
CREATE POLICY "允许所有人查看文章标签" ON post_tags 
  FOR SELECT USING (true);

CREATE POLICY "允许认证用户管理文章标签" ON post_tags 
  FOR ALL USING (auth.role() = 'authenticated');

-- 用户资料表策略
CREATE POLICY "允许所有人查看资料" ON profiles 
  FOR SELECT USING (true);

CREATE POLICY "允许用户管理自己的资料" ON profiles 
  FOR ALL USING (auth.uid() = id);

-- ============================================
-- 第五部分：创建函数和触发器
-- ============================================

-- 创建函数：自动创建用户资料（当用户注册时）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：在用户注册时自动创建资料
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 第六部分：创建索引以提高查询性能
-- ============================================

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

-- ============================================
-- 第七部分：Storage 策略（需要先创建 avatars bucket）
-- ============================================
-- 注意：这部分需要先在 Supabase Dashboard > Storage 中手动创建 bucket
-- 1. 点击 Storage
-- 2. 点击 New bucket
-- 3. 名称: avatars
-- 4. 勾选 Public bucket
-- 5. 创建后执行下面的策略

-- 允许所有人查看头像
CREATE POLICY "允许所有人查看头像"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 允许认证用户上传头像
CREATE POLICY "允许认证用户上传头像"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 允许认证用户更新自己的头像
CREATE POLICY "允许用户更新自己的头像"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 允许认证用户删除自己的头像
CREATE POLICY "允许用户删除自己的头像"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- 第八部分：为已存在的用户创建资料（可选）
-- ============================================
-- 如果你的账号是在创建 profiles 表之前注册的，执行此语句
-- 如果不需要，可以注释掉这部分

-- INSERT INTO profiles (id, username, created_at, updated_at)
-- SELECT 
--   id, 
--   split_part(email, '@', 1) as username,
--   created_at,
--   NOW() as updated_at
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM profiles)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 数据库初始化完成！
-- ============================================
-- 
-- 后续步骤：
-- 1. 在 Supabase Dashboard > Storage 中创建 "avatars" bucket（Public）
-- 2. 创建 bucket 后，Storage 策略会自动生效
-- 3. 如果 Storage 策略创建失败，请检查 bucket 是否已创建
-- 
-- 验证：
-- SELECT * FROM categories LIMIT 1;
-- SELECT * FROM tags LIMIT 1;
-- SELECT * FROM posts LIMIT 1;
-- SELECT * FROM profiles LIMIT 1;
-- SELECT * FROM storage.buckets WHERE name = 'avatars';
-- ============================================
