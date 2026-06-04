# 博客 GitHub 深度绑定 + 浏览量统计 设计文档

**日期:** 2026-06-04
**仓库:** nuts-and-bytes/ai-songshu-garden(Quartz v4.5.2 静态站,GitHub Pages 部署)

## 目标

1. 把博客和 GitHub 深度绑定:每篇文章引导访客去给 repo 点 Star、去 Issues 公开讨论使用体验/提建议、去看作者的其他项目。
2. 把现有 Clarity 换成能看浏览量(PV/UV)的统计方案,方便对外展示博客热度。

## 范围决策(已与用户确认)

| 决策点 | 选择 |
|--------|------|
| Star-gate 强度 | **只引导不拦截**(内容自由访问,不做技术门禁) |
| 分析需求 | **只要浏览量统计**(PV/UV/来源/热门页),不要人口画像 |
| 分析工具 | **GoatCounter**(免费托管、隐私友好、无需 cookie 横幅) |
| GoatCounter code | `nuts-and-bytes`(面板 https://nuts-and-bytes.goatcounter.com) |
| 引流卡片位置 | **文章底部 + 首页都放** |
| 阅读徽章 | **做**(每篇文章顶部显示"👁 已阅读 N 次") |

## 非目标(YAGNI — 明确不做)

- **不做硬门禁**:静态站内容本就是公开 HTML,"必须 star 才能看"无法可靠实现,且伤 SEO 和阅读体验。
- **不做 GitHub OAuth 登录**:那需要 serverless 后端存 client secret,过重。
- **不做人口统计画像**(年龄/性别/兴趣):需要 GA4 + cookie 横幅,个人博客流量下也不准。

---

## 系统 A:GitHub 引流卡片

### A1. 引流卡片组件(文章底部)

新建 Quartz 组件 `quartz/components/GithubCTA.tsx`,通过 `afterBody` 条件注入到**博客文章页**(slug 以 `博客/` 开头且非 `博客/index`,复用现有 RecentNotes 的 filter 模式)。

卡片三个行动,对应用户的三个目的:

```
┌──────────────────────────────────────────────┐
│  觉得这篇有用?                                  │
│                                                │
│  ⭐ 给本项目点个 Star    [GitHub Star 按钮+计数] │
│  💬 有想法或建议?来 Issues 公开聊聊  →          │
│  🔭 逛逛我的其他开源项目  →                      │
└──────────────────────────────────────────────┘
```

- **Star 按钮 + 实时计数**:用 GitHub 官方 [github-buttons](https://buttons.github.io/)(`<a class="github-button" data-show-count="true">`),纯前端,不需登录/后端,自带实时 star 数。脚本 `https://buttons.github.io/buttons.js`。
- **Issues 链接**:`https://github.com/nuts-and-bytes/ai-songshu-garden/issues` — 文案点明"公开讨论使用体验、提建议"。
- **其他项目链接**:`https://github.com/nuts-and-bytes` — 引导逛作者主页/pinned repos。

### A2. 首页引流区

在 `content/index.md` 的"探索"区下方,加一个更醒目的 GitHub 引流 section(复用同一套 SCSS class,内容更大):同样三件事 + 一句"这个博客本身就是开源的,欢迎 Star / 提 issue"。

### A3. 样式

在 `quartz/styles/custom.scss` 新增 `.github-cta` 一组样式,延续站点 Editorial × 暖米色调:卡片用 `var(--lightgray)` 边框、`8px` 圆角、`1.6rem` 内边距,与现有 `.hero-feature` / `.explore-card` 视觉统一。暗色模式跟随现有变量。

---

## 系统 B:GoatCounter 浏览量统计

### B1. 替换 Clarity → GoatCounter

`quartz.config.ts` 的 analytics 块:

```ts
analytics: {
  provider: "goatcounter",
  websiteId: "nuts-and-bytes",
},
```

Quartz 原生支持 goatcounter(`componentResources.ts:136`),会自动:
- 注入 `https://gc.zgo.at/count.js`
- 上报到 `https://nuts-and-bytes.goatcounter.com/count`
- 监听 Quartz SPA 的 `nav` 事件,翻页自动重新计数

同时移除 `quartz/components/Head.tsx` 里的 Clarity 内联脚本块(`clarityProjectId` 相关,约 39-40、92-99 行)。

### B2. 阅读徽章组件(文章顶部 "👁 已阅读 N 次")

新建 `quartz/components/ReadCount.tsx`,注入到博客文章页 `beforeBody`(ContentMeta 附近)。

GoatCounter 提供公开访问计数 endpoint:
`https://nuts-and-bytes.goatcounter.com/counter/<PATH>.json` → 返回 `{ "count": "1,234", "count_unique": "..." }`。

组件客户端逻辑:取当前页 `location.pathname`(中文 path 需 `encodeURIComponent` 处理),fetch 对应 `.json`,把数字填进"👁 已阅读 N 次"。拿不到(新页面/被拦)时静默隐藏徽章,不报错、不占位。

> ⚠️ **前置手动步骤(需用户在 GoatCounter 后台开启):**
> Settings → 勾选 **"Allow using the GoatCounter API and visitor counter publicly"**(允许公开访问计数)。不开启则 B2 的 `.json` 会 403,徽章静默不显示(不影响 B1 的统计上报)。

---

## 涉及文件清单

| 文件 | 操作 |
|------|------|
| `quartz.config.ts` | 改 analytics provider 为 goatcounter |
| `quartz/components/Head.tsx` | 删除 Clarity 内联脚本 |
| `quartz/components/GithubCTA.tsx` | 新建 — 文章底部引流卡片 |
| `quartz/components/ReadCount.tsx` | 新建 — 阅读量徽章 |
| `quartz/components/index.ts` | 导出两个新组件 |
| `quartz/layout.ts`(quartz.layout.ts) | afterBody 加 GithubCTA、beforeBody 加 ReadCount(均条件渲染博客文章页) |
| `content/index.md` | 加首页 GitHub 引流区 |
| `quartz/styles/custom.scss` | 加 `.github-cta` / `.read-count` 样式 |

## 验证方式

1. `npx quartz build` 构建无报错。
2. 浏览器预览(preview_eval / screenshot):
   - 文章底部出现引流卡片,Star 按钮显示真实 star 数,三个链接指向正确。
   - 文章顶部出现"👁 已阅读 N 次"(GoatCounter 公开计数开启后)。
   - Head 里不再有 clarity.ms 脚本,出现 gc.zgo.at/count.js。
   - 亮色 + 暗色模式样式都正常。
3. 部署后在 GoatCounter 面板确认有 pageview 数据进来。

## 用户需手动完成的事

1. ✅ 已注册 GoatCounter,code = `nuts-and-bytes`。
2. ⬜ GoatCounter Settings 开启"公开访问计数"(供阅读徽章用)。
3. ⬜ 部署后等几分钟,确认面板收到数据。
