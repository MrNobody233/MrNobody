# 博客项目

这是一个完整的博客系统，包含后台管理系统和前台展示系统。

## 项目结构

```
blogProject/
├── admin/          # 博客后台管理系统
│   ├── src/
│   ├── package.json
│   ├── README.md
│   └── ...
├── blog/           # 博客展示系统
│   ├── src/
│   ├── package.json
│   ├── README.md
│   └── ...
└── README.md       # 本文件
```

## 快速开始

### 1. 配置 Supabase 数据库

在使用项目前，请先在 Supabase 控制台执行以下 SQL 创建数据表：

#### 创建分类表

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

#### 创建标签表

```sql
CREATE TABLE tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 创建文章表

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

#### 创建文章-标签关联表

```sql
CREATE TABLE post_tags (
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);
```

#### 启用行级安全策略（RLS）

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

### 2. 配置环境变量

两个项目中都有 `env.txt` 文件，请将它们重命名为 `.env`（已包含 Supabase 配置）

### 3. 安装依赖并运行

#### 后台管理系统

```bash
cd admin
npm install
npm run dev
```

访问: http://localhost:3000

#### 博客展示系统

```bash
cd blog
npm install
npm run dev
```

访问: http://localhost:3001

## 功能特性

### 后台管理系统 (admin)

- ✅ 用户登录/注册
- ✅ 文章管理（创建、编辑、删除、发布/草稿）
- ✅ 分类管理
- ✅ 标签管理
- ✅ Markdown 编辑器（实时预览）
- ✅ 文章搜索
- ✅ 暗色/白色主题切换

### 博客展示系统 (blog)

- ✅ 用户登录/注册
- ✅ 文章列表展示（卡片式布局）
- ✅ 文章详情页（Markdown 渲染）
- ✅ 按分类筛选
- ✅ 按标签筛选
- ✅ 文章搜索
- ✅ 暗色/白色主题切换
- ✅ 分页功能

## Markdown 特殊语法

两个系统都支持以下特殊 Markdown 语法：

- `**加粗**` → **加粗**
- `*斜体*` → *斜体*
- `~~删除线~~` → ~~删除线~~
- `!!隐藏文字!!` → 鼠标悬停可见（特色功能）
- 标准 Markdown 语法（代码块、链接、图片、表格等）

## 使用流程

1. 在 Supabase 控制台执行 SQL 创建数据表
2. 打开后台管理系统，注册账号并登录
3. 创建分类和标签
4. 创建文章，编写内容，选择分类和标签
5. 将文章状态设置为"发布"
6. 打开博客展示系统，查看已发布的文章

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI 组件库**: Element Plus
- **路由管理**: Vue Router
- **状态管理**: Pinia
- **后端服务**: Supabase (BaaS)
- **Markdown 解析**: Markdown-it
- **样式预处理**: Sass

## 特色功能

### 🎨 主题切换
支持暗色和白色主题切换，主题偏好自动保存到本地存储。

### 📝 Markdown 编辑器
- 实时预览
- 工具栏快捷操作
- 支持特殊语法（隐藏文字等）

### 🎯 用户友好
- 卡片式设计
- 响应式布局
- 流畅的动画效果
- 直观的操作界面

### 🔍 强大的搜索
- 支持标题和内容搜索
- 按分类和标签筛选
- 分页展示

## 注意事项

1. 两个项目共享同一个 Supabase 数据库
2. 后台管理系统端口：3000
3. 博客展示系统端口：3001
4. 首次使用请先创建数据库表
5. 文章需要设置为"发布"状态才会在博客展示系统中显示

## 开发说明

- 项目使用 TypeScript 开发，提供完整的类型支持
- 使用 Vite 作为构建工具，开发体验流畅
- 代码结构清晰，易于维护和扩展
- 遵循 Vue 3 Composition API 最佳实践

## 生产部署

### 后台管理系统

```bash
cd admin
npm run build
# dist 目录中的文件可以部署到任何静态托管服务
```

### 博客展示系统

```bash
cd blog
npm run build
# dist 目录中的文件可以部署到任何静态托管服务
```

推荐部署平台：
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

## License

MIT

