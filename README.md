# nuts & bytes

`nuts & bytes` 是一个记录 AI 工具、工作流与个人实践的博客，使用 Astro 和源码内置的 Retypeset Odyssey 主题构建。

## 本地开发

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

生产环境基础路径为 `/ai-songshu-garden`。

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

https://nuts-and-bytes.github.io/ai-songshu-garden/

## 主题许可

Retypeset Odyssey 与 Astro Theme Retypeset 按 MIT License 使用。详见 `THEME_UPSTREAM.md` 和 `LICENSE`。
