-- ============================================
-- 博客系统数据库初始化脚本
-- 请在 Supabase SQL Editor 中执行此脚本
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

-- 5. 启用行级安全策略（RLS）
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- 6. 删除已存在的策略（如果有）
DROP POLICY IF EXISTS "允许所有人查看分类" ON categories;
DROP POLICY IF EXISTS "允许认证用户创建分类" ON categories;
DROP POLICY IF EXISTS "允许认证用户更新分类" ON categories;
DROP POLICY IF EXISTS "允许认证用户删除分类" ON categories;

DROP POLICY IF EXISTS "允许所有人查看标签" ON tags;
DROP POLICY IF EXISTS "允许认证用户创建标签" ON tags;
DROP POLICY IF EXISTS "允许认证用户更新标签" ON tags;
DROP POLICY IF EXISTS "允许认证用户删除标签" ON tags;

DROP POLICY IF EXISTS "允许所有人查看已发布文章" ON posts;
DROP POLICY IF EXISTS "允许认证用户创建文章" ON posts;
DROP POLICY IF EXISTS "允许作者更新自己的文章" ON posts;
DROP POLICY IF EXISTS "允许作者删除自己的文章" ON posts;

DROP POLICY IF EXISTS "允许所有人查看文章标签" ON post_tags;
DROP POLICY IF EXISTS "允许认证用户管理文章标签" ON post_tags;

-- 7. 创建分类表策略
CREATE POLICY "允许所有人查看分类" ON categories 
  FOR SELECT USING (true);

CREATE POLICY "允许认证用户创建分类" ON categories 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "允许认证用户更新分类" ON categories 
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "允许认证用户删除分类" ON categories 
  FOR DELETE USING (auth.role() = 'authenticated');

-- 8. 创建标签表策略
CREATE POLICY "允许所有人查看标签" ON tags 
  FOR SELECT USING (true);

CREATE POLICY "允许认证用户创建标签" ON tags 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "允许认证用户更新标签" ON tags 
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "允许认证用户删除标签" ON tags 
  FOR DELETE USING (auth.role() = 'authenticated');

-- 9. 创建文章表策略
CREATE POLICY "允许所有人查看已发布文章" ON posts 
  FOR SELECT USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "允许认证用户创建文章" ON posts 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "允许作者更新自己的文章" ON posts 
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "允许作者删除自己的文章" ON posts 
  FOR DELETE USING (auth.uid() = author_id);

-- 10. 创建文章标签关联表策略
CREATE POLICY "允许所有人查看文章标签" ON post_tags 
  FOR SELECT USING (true);

CREATE POLICY "允许认证用户管理文章标签" ON post_tags 
  FOR ALL USING (auth.role() = 'authenticated');

-- 11. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

-- ============================================
-- 数据库初始化完成！
-- 现在你可以开始使用博客系统了
-- ============================================

