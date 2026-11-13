# stone

`stone` 是一个记录 AI 工具、工作流与个人实践的博客，使用 Astro 和源码内置的 Retypeset Odyssey 主题构建。

## 本地开发

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

生产站点为 `https://blog.heystone.site`，基础路径为 `/`。

## 验证

```bash
corepack pnpm test:unit
corepack pnpm build
corepack pnpm test:artifacts
corepack pnpm test:e2e
```

## 内容目录

- 文章：`content/posts/`
- 笔记：`content/notes/`
- 日记：`content/journals/`
- 关于：`content/about/`

中文是内容源语言。英文或日文译文缺失时，对应语言路由会回退到中文内容。

## 部署

推送到 `main` 后，GitHub Actions 会将 `dist/` 部署到：

https://blog.heystone.site/

## AI 技巧文章写作

文章从具体经历写起，口语、随意一些；讲清为什么做、用起来有什么变化，以及别人怎样实现同样的效果。删除通用困扰句、空比喻、口号式标签和刻意的排比，个人使用证据与待验证项分开。

配图使用 `orange-line-illustration`：细黑线、白底留白、橙色点缀，每篇按内容单独设计，保留原有照片和截图。2026-11-13 为 wait-what 和 18 篇旧文配图；原始出图与提示词留在本机，网页使用 `public/images/illustrations/` 下的 WebP。

wait-what 的发布源为 `content/posts/AI 说了半天我没懂，所以我做了个 wait-what.md`，Skill 下载源为 `public/downloads/wait-what/SKILL.md`；其余三篇 AI 技巧文章仍为 `draft: true`，待用户审阅后再发布。详细选题与口吻反馈留在本地 `docs/editorial/`。

## 主题许可

Retypeset Odyssey 与 Astro Theme Retypeset 按 MIT License 使用。详见 `THEME_UPSTREAM.md` 和 `LICENSE`。
