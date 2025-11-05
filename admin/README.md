# 博客后台管理系统

基于 Vue 3 + TypeScript + Element Plus + Supabase 开发的博客后台管理系统。

## 功能特性

- ✅ 用户登录/注册
- ✅ 文章管理（增删改查）
- ✅ Markdown 编辑器（支持实时预览）
  - 支持 `**加粗**`、`*斜体*`、`~~删除线~~`
  - 支持 `!!隐藏文字!!`（鼠标悬停显示）
  - 支持代码高亮、图片、链接等
- ✅ 分类管理
- ✅ 标签管理
- ✅ 文章搜索
- ✅ 暗色/白色主题切换
- ✅ 响应式设计

## 安装依赖

```bash
npm install
```

## 配置环境变量

将 `env.txt` 文件重命名为 `.env`（已包含你的 Supabase 配置）

## 运行开发服务器

```bash
npm run dev
```

访问: http://localhost:3000

## 构建生产版本

```bash
npm run build
```

## 数据库配置

在使用前，请先在 Supabase 控制台执行以下 SQL 创建数据表：

### 1. 创建分类表

```sql
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. 创建标签表

```sql
CREATE TABLE tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. 创建文章表

```sql
CREATE TABLE posts (
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
```

### 4. 创建文章-标签关联表

```sql
CREATE TABLE post_tags (
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);
```

### 5. 启用行级安全策略（RLS）

```sql
-- 启用 RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

-- 分类表策略
CREATE POLICY "允许所有人查看分类" ON categories FOR SELECT USING (true);
CREATE POLICY "允许认证用户创建分类" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "允许认证用户更新分类" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "允许认证用户删除分类" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- 标签表策略
CREATE POLICY "允许所有人查看标签" ON tags FOR SELECT USING (true);
CREATE POLICY "允许认证用户创建标签" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "允许认证用户更新标签" ON tags FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "允许认证用户删除标签" ON tags FOR DELETE USING (auth.role() = 'authenticated');

-- 文章表策略
CREATE POLICY "允许所有人查看已发布文章" ON posts FOR SELECT USING (status = 'published' OR auth.uid() = author_id);
CREATE POLICY "允许认证用户创建文章" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "允许作者更新自己的文章" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "允许作者删除自己的文章" ON posts FOR DELETE USING (auth.uid() = author_id);

-- 文章标签关联表策略
CREATE POLICY "允许所有人查看文章标签" ON post_tags FOR SELECT USING (true);
CREATE POLICY "允许认证用户管理文章标签" ON post_tags FOR ALL USING (auth.role() = 'authenticated');
```

## 技术栈

- Vue 3
- TypeScript
- Element Plus
- Vue Router
- Pinia
- Supabase
- Markdown-it
- Sass

## 特色功能

### Markdown 编辑器

支持以下特殊语法：

- `**加粗**` → **加粗**
- `*斜体*` → *斜体*
- `~~删除线~~` → ~~删除线~~
- `!!隐藏文字!!` → 鼠标悬停可见
- 代码块、链接、图片等标准 Markdown 语法

### 主题切换

点击右上角按钮即可切换暗色/白色主题，主题偏好会自动保存。

