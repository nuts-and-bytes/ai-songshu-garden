# Blog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把博客从默认三栏知识库风格改造为 Editorial × Apple 精工风格的顶导个人名片博客，亮色默认支持暗色切换。

**Architecture:** 修改 `quartz.layout.ts` 把导航移到顶部 header 并清空左侧栏；用 `custom.scss` 覆盖颜色/字体/间距实现暖米色调 + 衬线标题；首页 `index.md` 用 HTML 块构建居中 Hero 区 + 行式文章列表。

**Tech Stack:** Quartz v4 (TypeScript/TSX/SCSS), GitHub Pages via GitHub Actions

---

## File Map

| 文件 | 操作 | 职责 |
|------|------|------|
| `quartz.config.ts` | 修改 | 更新颜色 tokens、修正 baseUrl、字体 |
| `quartz.layout.ts` | 修改 | 移除 Explorer，PageTitle 移到 header，清空 left |
| `quartz/styles/custom.scss` | 重写 | 暖米色调、顶导样式、Hero 区、文章行列表、移除圆点背景 |
| `content/index.md` | 重写 | 居中 Hero HTML + 行式文章列表，删知识库入口 |
| `content/知识库/` | 删除 | 整目录删除 |
| `content/关于我.md` | 修改 | 删知识库相关表述 |

---

## Task 1: 更新 quartz.config.ts — 颜色 tokens + baseUrl

**Files:**
- Modify: `quartz.config.ts:12-34`

- [ ] **Step 1: 替换 baseUrl 和颜色 tokens**

在 `quartz.config.ts` 中，找到 `configuration` 对象，修改以下字段：

```typescript
pageTitle: "nuts & bytes",
pageTitleSuffix: " · nuts & bytes",
baseUrl: "nuts-and-bytes.github.io/ai-songshu-garden",
theme: {
  fontOrigin: "googleFonts",
  cdnCaching: true,
  typography: {
    header: "Noto Serif SC",    // 衬线，用于大标题和文章标题
    body: "Noto Sans SC",       // 保持中文正文
    code: "IBM Plex Mono",
  },
  colors: {
    lightMode: {
      light: "#fafaf8",          // 暖米色背景
      lightgray: "#f0ece4",      // 浅分割线 / 卡片背景
      gray: "#c0b8a8",           // 装饰色（箭头、细线）
      darkgray: "#555550",       // 正文次要色
      dark: "#1a1a18",           // 主文字色
      secondary: "#1a1a18",      // 链接 / accent
      tertiary: "#888880",       // 淡化文字
      highlight: "rgba(26,26,24,0.06)",
      textHighlight: "#f0e8d088",
    },
    darkMode: {
      light: "#0f0e0c",          // 暗棕底
      lightgray: "#1e1d1a",      // 暗分割线
      gray: "#3a3830",           // 暗装饰色
      darkgray: "#888880",       // 次要文字
      dark: "#e8e4dc",           // 主文字
      secondary: "#e8e4dc",      // 链接 accent
      tertiary: "#666660",       // 淡化文字
      highlight: "rgba(232,228,220,0.06)",
      textHighlight: "#4a3a2088",
    },
  },
},
```

- [ ] **Step 2: 验证 config 语法**

```bash
cd /Users/ericlu/Desktop/ai-songshu-garden
npx tsc --noEmit 2>&1 | head -20
```
预期：无报错（或只有非阻断性警告）

- [ ] **Step 3: Commit**

```bash
git add quartz.config.ts
git commit -m "style: update color tokens and baseUrl for editorial redesign"
```

---

## Task 2: 修改 quartz.layout.ts — 顶导 + 清空左栏

**Files:**
- Modify: `quartz.layout.ts`

- [ ] **Step 1: 重写 layout 文件**

完整替换 `quartz.layout.ts` 内容：

```typescript
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// 所有页面共享的顶部导航
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.PageTitle(),
    Component.Flex({
      components: [
        { Component: Component.Search(), grow: true },
        { Component: Component.Darkmode() },
      ],
    }),
  ],
  afterBody: [],
  footer: Component.Footer({
    links: {
      小红书: "https://www.xiaohongshu.com/user/profile/zhuxinyao99",
      GitHub: "https://github.com/nuts-and-bytes/ai-songshu-garden",
    },
  }),
}

// 文章页：无左栏，右侧保留图谱 + TOC + 反向链接
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// 列表页（标签/文件夹）：无左右栏
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [],
  right: [],
}
```

- [ ] **Step 2: 验证语法**

```bash
cd /Users/ericlu/Desktop/ai-songshu-garden
npx tsc --noEmit 2>&1 | head -20
```
预期：无新报错

- [ ] **Step 3: Commit**

```bash
git add quartz.layout.ts
git commit -m "layout: move nav to top header, remove left sidebar Explorer"
```

---

## Task 3: 重写 custom.scss — 暖米色系 + 顶导 + Editorial 文章样式

**Files:**
- Modify: `quartz/styles/custom.scss`

- [ ] **Step 1: 完整替换 custom.scss**

```scss
@use "./base.scss";

// ─── Root Tokens ───────────────────────────────────────────────
:root {
  --transition-speed: 0.2s;
  --transition-bezier: cubic-bezier(0.4, 0, 0.2, 1);
}

// ─── 移除圆点背景 ──────────────────────────────────────────────
body {
  background-color: var(--light);
  background-image: none;
}

// ─── 滚动条 ────────────────────────────────────────────────────
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--gray);
  border-radius: 3px;
  &:hover { background: var(--darkgray); }
}

// ─── 顶部导航栏 ────────────────────────────────────────────────
// Quartz 把 sharedPageComponents.header 渲染到 #quartz-header
#quartz-header {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 56px;
  border-bottom: 1px solid var(--lightgray);
  background: var(--light);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  box-sizing: border-box;

  // PageTitle 变成 LOGO
  h1.page-title {
    font-family: var(--bodyFont);
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--dark) !important;
    margin: 0;
    a { color: inherit !important; text-decoration: none !important; }
  }

  // 右侧搜索 + 暗色按钮
  .flex-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }
}

// ─── 无左侧栏时内容居中 ────────────────────────────────────────
// 当 left 为空，Quartz 会收缩到只有 center + right
.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

// ─── Hero 区（index.md 的 .hero-section class）─────────────────
.hero-section {
  text-align: center;
  padding: 4rem 2rem 3rem;
  border-bottom: 1px solid var(--lightgray);

  .hero-eyebrow {
    font-size: 0.65rem;
    color: var(--gray);
    letter-spacing: 0.25em;
    text-transform: uppercase;
    margin-bottom: 1.2rem;
  }

  .hero-title {
    font-family: var(--headerFont);
    font-size: 2.8rem;
    font-weight: 700;
    color: var(--dark);
    line-height: 1.1;
    letter-spacing: -0.03em;
    margin: 0 0 1rem;
  }

  .hero-divider {
    width: 40px;
    height: 1px;
    background: var(--gray);
    margin: 0 auto 1rem;
  }

  .hero-tagline {
    font-size: 0.85rem;
    color: var(--tertiary);
    line-height: 1.7;
    margin-bottom: 1.5rem;
  }

  .hero-links {
    display: inline-flex;
    gap: 0.6rem;

    a {
      border: 1px solid var(--gray);
      color: var(--darkgray) !important;
      padding: 0.3rem 0.9rem;
      border-radius: 2px;
      font-size: 0.7rem;
      letter-spacing: 0.05em;
      text-decoration: none !important;
      transition: border-color var(--transition-speed) ease,
                  color var(--transition-speed) ease;
      &:hover {
        border-color: var(--dark);
        color: var(--dark) !important;
      }
    }
  }
}

// ─── 文章行列表（首页 .article-list）──────────────────────────
.article-list-section {
  .article-list-label {
    font-size: 0.6rem;
    color: var(--gray);
    letter-spacing: 0.25em;
    text-transform: uppercase;
    padding: 1.2rem 0 0.7rem;
    border-bottom: 1px solid var(--lightgray);
    margin-bottom: 0;
  }
}

.article-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid var(--lightgray);
  text-decoration: none !important;

  &:last-child { border-bottom: none; }

  .article-row-body { flex: 1; }

  .article-row-title {
    font-family: var(--headerFont);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--dark) !important;
    line-height: 1.3;
    margin: 0 0 0.25rem;
    text-decoration: none !important;
  }

  .article-row-meta {
    font-size: 0.7rem;
    color: var(--gray);
    letter-spacing: 0.02em;
  }

  .article-row-arrow {
    color: var(--gray);
    font-size: 0.9rem;
    margin-left: 1.2rem;
    flex-shrink: 0;
    transition: color var(--transition-speed) ease,
                transform var(--transition-speed) ease;
  }

  &:hover {
    .article-row-title { color: var(--secondary) !important; }
    .article-row-arrow {
      color: var(--dark);
      transform: translateX(3px);
    }
  }
}

// ─── 文章页正文 ────────────────────────────────────────────────
article {
  h1, h2, h3, h4 {
    font-family: var(--headerFont);
    letter-spacing: -0.02em;
  }
}

// ─── 引用块 ────────────────────────────────────────────────────
blockquote {
  border-left: 2px solid var(--gray) !important;
  border-radius: 0;
  background: transparent;
  padding: 0.5rem 1rem !important;
  margin: 1.2rem 0 !important;
  font-style: italic;
  color: var(--darkgray);
}

// ─── 代码块 ────────────────────────────────────────────────────
pre {
  border-radius: 6px !important;
  border: 1px solid var(--lightgray) !important;
}

// ─── 标签胶囊 ──────────────────────────────────────────────────
.tag-link, .tag-list a {
  display: inline-block;
  background-color: var(--lightgray) !important;
  color: var(--darkgray) !important;
  padding: 0.15rem 0.55rem !important;
  border-radius: 2px !important;
  font-size: 0.75rem !important;
  margin-right: 0.35rem;
  margin-bottom: 0.35rem;
  border: 1px solid transparent;
  text-decoration: none !important;
  transition: background-color var(--transition-speed) ease !important;

  &:hover {
    background-color: var(--gray) !important;
    color: var(--light) !important;
  }

  &::before { content: "# "; opacity: 0.5; }
}

// ─── 搜索框 ────────────────────────────────────────────────────
.search input[type="text"] {
  background-color: var(--lightgray) !important;
  border: 1px solid transparent !important;
  border-radius: 4px !important;
  padding: 0.4rem 0.9rem 0.4rem 2.2rem !important;
  font-size: 0.8rem !important;
  transition: border-color var(--transition-speed) ease !important;
  &:focus {
    border-color: var(--gray) !important;
    outline: none;
  }
}

// ─── 右侧栏（文章页 TOC / Graph / Backlinks）──────────────────
.sidebar.right {
  .toc, .graph, .backlinks {
    border: none;
    background: transparent;
    padding: 0 !important;
    box-shadow: none;
    margin-bottom: 1.5rem;
    border-top: 1px solid var(--lightgray);
    padding-top: 1rem !important;
  }
}

// ─── 页脚 ──────────────────────────────────────────────────────
footer {
  border-top: 1px solid var(--lightgray);
  padding: 1rem 2rem;
  font-size: 0.7rem;
  color: var(--gray);
  letter-spacing: 0.05em;
}
```

- [ ] **Step 2: Commit**

```bash
git add quartz/styles/custom.scss
git commit -m "style: replace custom.scss with editorial warm minimal theme"
```

---

## Task 4: 重写 content/index.md — Hero + 行式文章列表

**Files:**
- Modify: `content/index.md`

- [ ] **Step 1: 重写首页内容**

完整替换 `content/index.md`：

```markdown
---
title: nuts & bytes
---

<div class="hero-section">
  <div class="hero-eyebrow">Personal Blog · Est. 2026</div>
  <h1 class="hero-title">用 AI 重做自己</h1>
  <div class="hero-divider"></div>
  <p class="hero-tagline">零基础开始，折腾工具，记录过程</p>
  <div class="hero-links">
    <a href="https://www.xiaohongshu.com/user/profile/zhuxinyao99" target="_blank">小红书</a>
    <a href="https://github.com/nuts-and-bytes" target="_blank">GitHub</a>
  </div>
</div>

<div class="article-list-section">
  <div class="article-list-label">最新文章</div>
</div>
```

> **注意**：Quartz 会自动在 `index.md` 下方渲染该目录的子页面列表。如果不自动渲染，可以手动补充文章链接行（见 Step 2）。

- [ ] **Step 2: 确认自动文章列表渲染行为**

本地跑一下（如果有本地 Node 环境）：

```bash
cd /Users/ericlu/Desktop/ai-songshu-garden
npx quartz build --serve 2>&1 | head -30
```

预期：在 `http://localhost:8080` 看到 Hero 区 + 文章列表。若文章列表未出现，在 index.md 末尾手动添加：

```markdown
<a class="article-row" href="/博客/your-article-slug">
  <div class="article-row-body">
    <div class="article-row-title">文章标题</div>
    <div class="article-row-meta">2026-06-03 · AI · 工作流</div>
  </div>
  <span class="article-row-arrow">→</span>
</a>
```

- [ ] **Step 3: Commit**

```bash
git add content/index.md
git commit -m "content: rewrite homepage with hero section and editorial article list"
```

---

## Task 5: 删除 content/知识库/ 目录

**Files:**
- Delete: `content/知识库/` (整目录)

- [ ] **Step 1: 删除知识库目录**

```bash
rm -rf "/Users/ericlu/Desktop/ai-songshu-garden/content/知识库"
```

- [ ] **Step 2: 验证删除**

```bash
ls /Users/ericlu/Desktop/ai-songshu-garden/content/
```

预期输出：`index.md  关于我.md  博客  资源推荐`（无知识库目录）

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "content: remove 知识库 directory"
```

---

## Task 6: 更新 content/关于我.md — 删知识库表述

**Files:**
- Modify: `content/关于我.md`

- [ ] **Step 1: 查看当前内容**

```bash
cat "/Users/ericlu/Desktop/ai-songshu-garden/content/关于我.md"
```

- [ ] **Step 2: 删除所有提及知识库的段落**

找到并删除类似以下内容的段落（使用 Edit 工具精确删除）：
- 任何包含"知识库"的段落、链接、描述

- [ ] **Step 3: Commit**

```bash
git add "content/关于我.md"
git commit -m "content: remove knowledge base references from about page"
```

---

## Task 7: Push 并验证部署

- [ ] **Step 1: Push 到 main**

```bash
git push origin main
```

- [ ] **Step 2: 等待 GitHub Actions 完成**

```bash
gh run list --limit 3
```

等待 status 变为 `completed`（约 2-3 分钟）。

- [ ] **Step 3: 打开线上地址验证**

访问 `https://nuts-and-bytes.github.io/ai-songshu-garden`

检查项：
- [ ] 顶部导航栏显示 NUTS&BYTES + 搜索 + 暗色切换
- [ ] 首页居中 Hero 区显示正确
- [ ] 文章列表行式展示，带 → 箭头
- [ ] 暗色切换正常工作
- [ ] 知识库链接/页面不再存在
- [ ] 文章页 TOC 在右侧不遮挡正文

---

## 已知限制

- Quartz 首页不自动生成文章行列表，需要手动维护 index.md 中的链接（Task 4 Step 2）
- 顶导 header 的响应式行为依赖 Quartz 内置，移动端可能需要额外调整
- Graph（关系图谱）在文章极少时视觉效果较稀疏，属正常现象
