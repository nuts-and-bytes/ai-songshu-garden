# Blog Redesign Design Spec
Date: 2026-06-04

## Goal
把个人博客从默认 Quartz 三栏知识库风格，改造为有艺术设计感的个人名片式技术博客。

---

## Layout

**结构**：B 方案 — 顶部导航 + 居中 Hero + 文章列表

- 顶部固定导航栏：LOGO（全大写 NUTS&BYTES）左侧，页面链接右侧，亮/暗色切换按钮最右
- 居中 Hero 区：大标语（Georgia 衬线字体）+ 分割线 + 一行 tagline + 社交链接
- 文章列表区：行式列表，标题用 Georgia，元数据用系统字体，右侧箭头 →
- 极简页脚：版权 + "Powered by Quartz"

**移除**：左侧文件树、右侧 TOC（文章页内保留 TOC，但只在正文右侧 sticky，不遮挡内容）

---

## Visual Style

**融合方案**：Editorial 排版质感 × Apple 精工留白

| Token | 亮色 | 暗色 |
|-------|------|------|
| 背景 | `#fafaf8` | `#0f0e0c` |
| 正文 | `#1a1a18` | `#e8e4dc` |
| 次要文字 | `#888` | `#666` |
| 分割线 | `#e8e5df` | `#2a2820` |
| 箭头/装饰 | `#c0b8a8` | `#3a3830` |

**字体**：
- 标题（大标语、文章标题）：Georgia serif
- UI / 元数据 / 导航：`-apple-system, Inter, system-ui`

**暗色切换**：手动按钮（导航栏右侧），默认亮色，持久化到 localStorage

---

## Content Changes

1. **删除** `content/知识库/` 目录及所有子文件
2. **更新** `content/index.md`：去掉知识库入口，改为直接展示最新文章
3. **更新** `content/关于我.md`：去掉知识库相关表述
4. **保留** 关系图谱（Graph）和文章内 TOC，但修复定位问题（不遮挡正文）

---

## Implementation Approach

Quartz 是 TypeScript/TSX 组件系统，不支持直接套 CSS 主题，需要：

1. **自定义 Layout**：修改 `quartz.layout.ts`，移除 `Explorer`（文件树），调整组件位置
2. **自定义 CSS**：新建 `quartz/styles/custom.scss`（Quartz 支持 SCSS 覆盖），覆盖颜色、字体、间距
3. **自定义 Head 组件**：在 `quartz/components/Head.tsx` 引入 Google Fonts（Inter）
4. **HomePage 组件**（可选）：如需特殊首页布局，新建 `quartz/components/HomePage.tsx`
5. **暗色切换**：Quartz 已内置 lightmode/darkmode，修改触发按钮样式即可

---

## Files to Change

| 文件 | 改动 |
|------|------|
| `quartz.layout.ts` | 移除左侧 Explorer，调整 Graph/TOC 定位 |
| `quartz/styles/custom.scss` | 新建，覆盖主色 / 字体 / 间距 |
| `quartz/components/Head.tsx` | 引入 Inter 字体 |
| `content/index.md` | 去知识库，加文章列表 |
| `content/知识库/` | 整目录删除 |
| `content/关于我.md` | 去知识库表述 |

---

## Out of Scope

- 评论系统
- 搜索改版（保留 Quartz 内置搜索）
- RSS / sitemap（Quartz 自动生成，不改）
- 文章迁移（现有文章保持原路径）
