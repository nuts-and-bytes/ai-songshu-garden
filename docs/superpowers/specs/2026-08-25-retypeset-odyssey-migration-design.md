# nuts & bytes Retypeset Odyssey 完整迁移设计

**日期：** 2026-08-25
**仓库：** `nuts-and-bytes/ai-songshu-garden`
**线上地址：** `https://nuts-and-bytes.github.io/ai-songshu-garden/`

## 1. 目标

将现有 Quartz v4 个人博客完整迁移到 Astro 6 与 Retypeset Odyssey，使它在排版、布局、页面转场、搜索、主题切换、声音反馈和响应式行为上与 `https://zhenjia.dev/` 使用同一套主题实现，同时保留现有 GitHub Pages 地址、内容和历史链接。

迁移后的站点继续使用 `nuts & bytes` 品牌与用户自己的内容、联系方式和社交链接，不复制目标站的文章、作者身份或品牌文案。

## 2. 已确认决策

| 决策 | 选择 |
|---|---|
| 迁移方式 | 直接迁入官方 Retypeset Odyssey 源码 |
| 主题版本 | `lifeodyssey/retypeset-odyssey` v0.1.20，commit `20d4105` |
| 许可 | MIT；保留上游许可证与来源说明 |
| 还原优先级 | 完整迁移，交互优先 |
| 线上地址 | 保持 `https://nuts-and-bytes.github.io/ai-songshu-garden/` |
| 旧链接 | 全部保留，通过静态重定向桥接 |
| Quartz 专属能力 | 舍弃关系图谱、反向链接、GoatCounter 阅读量与 GitHub CTA |
| 导航 | 文章、笔记、日记、分类、标签、时间线、关于 |
| 空栏目 | 保留入口并提供主题原生风格空状态 |
| 默认语言 | 中文 |
| 其他语言 | 英文、日文；缺少译文时回退中文 |
| 品牌标题 | `nuts & bytes` |
| 副标题 | `静水流深` |
| 页脚署名 | `nuts & bytes` |
| 评论 | 不启用 |

## 3. 来源与边界

Retypeset Odyssey 是 `zhenjia.dev` 的实际主题，基于 `radishzzz/astro-theme-retypeset`，以 MIT 许可证发布。本项目直接采用其已公开源码、字体、图标和声音资源，以减少视觉与交互偏差。

迁移必须保留：

- 上游 `LICENSE`；
- 页脚 `Powered by Astro and Retypeset`；
- README 中的主题来源说明；
- 本项目自己的品牌、内容、联系方式和 SEO 信息。

不复制目标站的文章、个人资料、统计标识、分析脚本、域名配置或第三方账户凭证。

## 4. 技术架构

### 4.1 仓库内替换

在现有仓库和 Git 历史中完成迁移，不新建生产仓库：

1. 以 Retypeset Odyssey v0.1.20 源码作为新站骨架；
2. 移除 Quartz 构建代码、布局组件、缓存和 Quartz 专属依赖；
3. 迁移 Markdown 内容与静态资源；
4. 将站点配置改为 `nuts & bytes`；
5. 更新 GitHub Actions，构建并发布 Astro 的 `dist/`。

旧 Quartz 实现由 Git 历史保留，不在新主分支中维护第二套运行时。

### 4.2 固定配置

- `site.url`: `https://nuts-and-bytes.github.io`
- `site.base`: `/ai-songshu-garden`
- `site.title`: `nuts & bytes`
- `site.subtitle`: `静水流深`
- `site.i18nTitle`: `false`，避免多语言 UI 默认值覆盖品牌名
- 默认 locale：`zh`
- 更多 locale：`en`、`ja`
- 默认主题：亮色
- 评论系统：关闭
- 内容目录：`content/posts`、`content/notes`、`content/journals`、`content/about`
- 包管理器：pnpm，与上游锁文件保持一致

### 4.3 部署

GitHub Actions 使用 Node 22 和 pnpm：

1. 安装锁定依赖；
2. 运行类型与内容检查；
3. 构建 Astro、Pagefind、Sitemap、RSS、OG 图和重定向页；
4. 上传 `dist/`；
5. 通过 GitHub Pages 发布到原地址。

## 5. 信息架构

### 5.1 全站导航

按目标主题保留七个入口：

1. 文章 `/`
2. 笔记 `/notes/`
3. 日记 `/journals/`
4. 分类 `/categories/`
5. 标签 `/tags/`
6. 时间线 `/timeline/`
7. 关于 `/about/`

英文和日文路径通过主题的 locale 路由生成，并自动带上 `/ai-songshu-garden` 基础路径。

### 5.2 桌面布局

- 主内容位于左侧窄栏，最大宽度遵循主题原值；
- 右侧固定书脊栏包含站名、副标题、导航、搜索、语言、主题按钮和页脚；
- 首页为纯文章列表，不保留 Quartz Hero、探索卡片、关系图谱或 GitHub CTA；
- 页面身份、目录和时间信息沿用主题的固定边栏规则。

### 5.3 移动布局

- 单栏顺序为站名、副标题、导航、主内容、页脚；
- 文章页收起非必要导航并使用浮动工具按钮；
- 点击区至少 44×44 CSS px；
- 不使用固定高度视口；
- 移动端关闭声音，避免误触、性能和浏览器自动播放问题。

### 5.4 空状态

`notes` 与 `journals` 暂无正式内容时仍生成可访问页面。空状态只使用标题、简短说明和返回入口，不引入卡片、插画、图标墙或虚构内容。

## 6. 视觉系统

视觉实现不重新设计，严格采用主题原值：

- 亮色背景：`oklch(96% 0.005 298)`；
- 主文字：`oklch(25% 0.005 298)`；
- 次级文字：`oklch(40% 0.005 298)`；
- 唯一强调色：黄色高亮 `oklch(0.93 0.195089 103.2532)`；
- 暗色模式沿用 Retypeset Odyssey 配置；
- 站名使用 Snell-Black；
- 日期使用 Snell-Bold；
- 副标题与元信息使用 STIX-Italic；
- 正文使用 STIX 与 EarlySummer/Noto Sans SC 回退；
- 不增加第二强调色、卡片网格、渐变 Hero、玻璃拟态或装饰性图谱。

品牌替换仅包括：

- `Life Odyssey` → `nuts & bytes`
- 原副标题 → `静水流深`
- 原作者与页脚年份 → `nuts & bytes`，起始年份 2026
- 原站点链接与 SEO 实体 → 用户自己的地址

## 7. 内容迁移

### 7.1 映射

| Quartz 内容 | Astro 目标 |
|---|---|
| `content/博客/*.md` | `content/posts/*.md` |
| `content/资源推荐/index.md` | `notes` 栏目中文介绍 |
| `content/关于我.md` | `content/about/about-zh.md` |
| 根目录重复文章 | 与博客目录版本合并，不生成第二篇文章 |
| `content/index.md` | 不直接迁移布局 HTML；提取品牌与描述进入配置/About |

正文只做构建兼容所需转换：

- 转换 frontmatter 字段；
- 保留标题、段落、代码块、链接、图片、数学和标签；
- 将 Quartz/Obsidian 专属双链转换为有效站内链接或普通文本；
- 删除只服务旧首页布局的内联 HTML；
- 不生成用户未写过的文章、笔记或日记。

### 7.2 Canonical 路径

首篇文章的新 canonical 地址使用：

`/ai-songshu-garden/posts/如何用-Claude-Code-搭一个会自动整理的知识库/`

所有现有路径，包括根目录文章、`博客/` 中文路径及 `.html` 版本，生成静态 HTML 重定向页。GitHub Pages 不支持 `_redirects` 规则，因此不能仅依赖该文件。

重定向页包含：

- `meta refresh`；
- canonical link；
- 可点击的兜底链接；
- `noindex`；
- 不进入 Pagefind 索引。

### 7.3 多语言回退

- 中文文件是内容真源；
- `.en.md` 或 `.ja.md` 存在时显示对应译文；
- 缺失译文时，对应 locale 路由渲染中文正文，而不是 404；
- 页面保留清晰的语言状态，不伪装成已翻译内容；
- 搜索只索引实际存在的语言正文，避免三份重复中文结果。

## 8. 联系方式

About 页面使用 Portfolio 中已经公开的信息：

- Portfolio：`https://nuts-and-bytes.github.io/portfolio/`
- GitHub：`https://github.com/nuts-and-bytes`
- Email：`mailto:zxy200204@126.com`
- Gmail：`mailto:zhuxinyao99@gmail.com`
- Telegram：`https://t.me/ericlibro`
- 小红书：沿用现有博客链接

页脚保持简洁，只显示 RSS、GitHub、Portfolio、小红书和版权；两组邮箱与 Telegram 放在 About 联系方式区，避免页脚变成链接列表。

## 9. 交互规格

### 9.1 链接反馈

- 导航和文本链接使用黄色荧光笔背景；
- 悬停时标记从右向左铺开；
- 当前导航项保持静态高亮；
- 不使用卡片上浮、通用阴影或装饰性缩放；
- 工具按钮按下缩放至 90%。

### 9.2 页面转场

- 使用 Astro ClientRouter 与 View Transitions；
- 站名、文章标题和日期使用共享元素转场；
- 正文元素执行 500ms 上浮淡入并按主题原节奏错峰；
- 返回按钮、日期和 TOC 使用主题原始进入动画；
- 浏览器不支持 View Transitions 时自然降级，不阻塞导航。

### 9.3 明暗主题

- 点击主题按钮触发 700ms 裁切揭幕；
- 亮转暗与暗转亮方向相反；
- 主题偏好写入 `localStorage`；
- 首屏渲染前恢复偏好，避免闪烁；
- 跟随系统主题变化；
- `prefers-reduced-motion` 时取消揭幕动画并立即切换。

### 9.4 搜索

- Pagefind 提供全文检索；
- 搜索按钮和 `Ctrl/⌘ + K` 打开纸张式原生 `dialog`；
- 打开后自动聚焦；
- 再次按快捷键、关闭按钮或点击背景关闭；
- 命中词使用唯一黄色强调色；
- 关闭后恢复合理焦点位置。

### 9.5 音效

直接采用主题自带并由 MIT 许可证覆盖的十个本地 WAV：

- `tap_01.wav` 至 `tap_05.wav`
- `type_01.wav` 至 `type_05.wav`

行为保持主题原样：

- 桌面端点击语言和主题按钮时，从五个 tap 音效中随机播放；
- 评论关闭，因此 typing 音效资源保留但当前页面没有触发入口；
- 音频通过 Web Audio API 空闲预加载、解码和缓存；
- 首次用户交互后恢复挂起的 AudioContext；
- 资源或播放失败时静默降级并只记录警告；
- 1023px 及以下设备不初始化也不播放音效。

### 9.6 文章交互

- TOC 在宽屏固定，在较窄视口折叠，并跟随当前锚点；
- 大图点击后克隆放大，背景变为纸色遮罩，再次点击或调整窗口时还原；
- 代码块悬停显示复制按钮，并提供已复制状态；
- 分页省略号可切换为页码输入；
- 文章页提供返回按钮；
- 所有交互可用键盘访问。

## 10. 组件边界

优先保留上游组件职责，不将多个交互合并为单个自定义脚本：

- `Layout`：页面骨架与全局挂件；
- `Header`：站名、副标题、共享转场；
- `Navbar`：七项导航与当前状态；
- `Button`/`FloatingButtons`：搜索、语言、主题按钮；
- `PostList`、`NoteList`、`JournalList`：列表与元数据；
- `SearchModal`：Pagefind 与键盘交互；
- `SoundEffect`：声音预载与事件过滤；
- `TOC`、`ImageZoom`、`CodeCopyButton`、`BackButton`：文章级交互；
- `Footer`：精简社交链接与许可来源；
- 独立重定向生成器：旧路径清单到静态 HTML 的纯构建步骤。

与上游不同的功能只允许出现在清晰、可测试的适配层：基础路径、内容迁移、多语言中文回退、旧路径重定向和用户配置。

## 11. 数据流与错误处理

### 11.1 构建时

1. Astro 读取站点 YAML 配置；
2. Zod 校验配置和 Markdown frontmatter；
3. 内容集合生成文章、笔记、日记、分类、标签和时间线；
4. 多语言解析器选择译文或中文回退；
5. 重定向生成器输出旧路径桥接页；
6. Pagefind、Sitemap、RSS、OG 和 llms.txt 从正式内容生成；
7. `dist/` 交给 GitHub Pages。

配置或 frontmatter 不合法时构建失败，并输出具体文件与字段。构建不能静默丢弃文章。

### 11.2 运行时

- 搜索初始化失败：关闭搜索结果区并显示简短文字错误，不影响浏览；
- 声音加载失败：静默无声降级；
- 图片加载失败：保留替代文本与正文流；
- 不存在的路由：进入同一视觉系统的 404，并提供首页返回入口；
- 语言译文缺失：回退中文，不进入 404；
- View Transitions 不可用：使用普通 Astro 导航。

## 12. 验证与验收

### 12.1 自动检查

- `pnpm install --frozen-lockfile`
- `pnpm astro check`
- `pnpm build`
- Playwright 测试生产预览
- 内部链接与重定向清单检查
- Pagefind、Sitemap、RSS、OG、llms.txt 产物检查

### 12.2 浏览器场景

至少覆盖：

- 1440px 桌面；
- 768px 平板；
- 390px 手机；
- 亮色和暗色；
- 中文、英文、日文；
- 鼠标、键盘和 reduced-motion。

交互测试包括：

- 导航与黄色高亮；
- 页面共享元素转场；
- 搜索快捷键、背景关闭和焦点；
- 主题揭幕与偏好持久化；
- 语言切换与中文回退；
- 桌面音效和移动静音；
- TOC、图片缩放、代码复制、分页与返回；
- 404 与所有历史 URL。

### 12.3 视觉检查

以 `zhenjia.dev` 和 Retypeset Odyssey v0.1.20 为基准，对比：

- 字体是否实际加载；
- 内容栏和右栏尺寸；
- 页面留白；
- OKLCH 颜色；
- 高亮位置和速度；
- 主题揭幕方向与时长；
- 正文、TOC 和返回按钮动画；
- 移动端顺序和点击区。

仅进行一轮桌面与移动端联合检查、一轮集中修复，并最多再确认一次。

### 12.4 完成标准

1. 原 GitHub Pages 地址继续工作；
2. 所有现有公开 URL 到达正确内容；
3. 用户内容与联系方式完整；
4. 七个栏目均可访问；
5. 页面视觉和交互与同版本主题一致；
6. 构建、测试和部署均通过；
7. 不残留 Quartz 运行时代码、图谱、反向链接、阅读量或旧 CTA。

## 13. 非目标

- 不迁移 Quartz 关系图谱与反向链接；
- 不保留 GoatCounter 阅读量徽章；
- 不启用评论系统；
- 不生成不存在的笔记、日记或文章；
- 不自动生成完整中英日翻译；
- 不添加订阅弹窗、卡片式首页、滚动劫持或额外音效；
- 不改变 Portfolio 项目；
- 不申请自定义域名。

## 14. 风险与缓解

| 风险 | 缓解 |
|---|---|
| GitHub Pages 子路径导致资源 404 | 所有内部路径通过主题 base helper 生成，并在生产预览验证 |
| GitHub Pages 不支持服务器重定向 | 构建真实静态重定向 HTML |
| 中文文件名与编码路径不一致 | 维护显式旧路径清单并测试编码前后 URL |
| 缺少译文导致语言页 404 | 在内容解析层实现中文回退并添加三语路由测试 |
| 上游源码后续变化造成漂移 | 首次迁移固定 v0.1.20；后续升级单独评估 |
| 浏览器限制自动播放 | 只在用户交互后恢复 AudioContext，失败时无声降级 |
| 一次性替换范围较大 | 在隔离分支/worktree 实施，保留主分支与 Git 历史作为回滚点 |
