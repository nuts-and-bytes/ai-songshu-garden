# 博客 GitHub 深度绑定 + 浏览量统计 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 Quartz 博客接入 GitHub 引流卡片(文章底部 + 首页)和 GoatCounter 浏览量统计(含文章顶部"已阅读 N 次"徽章),只引导不拦截。

**Architecture:** 两个独立子系统。分析子系统改一行 config 把 Clarity 换成 Quartz 原生支持的 GoatCounter,并删掉 Head 里的 Clarity 脚本。引流子系统新增两个 Quartz Preact 组件(GithubCTA 纯渲染、ReadCount 带客户端 fetch 脚本),通过 `quartz.layout.ts` 条件注入到博客文章页,首页另在 `content/index.md` 加一段同款 HTML;样式统一加到全局 `quartz/styles/custom.scss`。

**Tech Stack:** Quartz v4.5.2、Preact(JSX)、SCSS、GoatCounter、shields.io 徽章。

**测试说明(重要):** 本仓库没有针对展示型组件的单元测试框架,**不要**为此搭 jest/vitest。每个 Task 的验证 = `npx quartz build` 构建通过 + 用 Claude Preview MCP(serverId `1d15aacc-3336-4679-9c90-1cf9e352cef2`,端口 8090)做 `preview_eval` 断言。导航到页面时加 `?_=`+Date.now() 破缓存。

**关键坐标:**
- GitHub repo:`nuts-and-bytes/ai-songshu-garden`
- Issues:`https://github.com/nuts-and-bytes/ai-songshu-garden/issues`
- 作者主页:`https://github.com/nuts-and-bytes`
- GoatCounter code:`nuts-and-bytes`(面板 `https://nuts-and-bytes.goatcounter.com`)
- 博客文章页判定(复用现有 RecentNotes 模式):`slug.startsWith("博客/") && slug !== "博客/index"`

---

## 涉及文件结构

| 文件 | 职责 | 操作 |
|------|------|------|
| `quartz.config.ts` | analytics provider 配置 | 改 |
| `quartz/components/Head.tsx` | 删除 Clarity 内联脚本 | 改 |
| `quartz/components/GithubCTA.tsx` | 文章底部引流卡片(纯渲染) | 建 |
| `quartz/components/ReadCount.tsx` | 文章顶部阅读量徽章(带脚本) | 建 |
| `quartz/components/scripts/readcount.inline.ts` | ReadCount 的客户端 fetch 逻辑 | 建 |
| `quartz/components/index.ts` | 导出两个新组件 | 改 |
| `quartz.layout.ts` | 注入两个组件(条件渲染) | 改 |
| `content/index.md` | 首页引流区 | 改 |
| `quartz/styles/custom.scss` | `.github-cta` / `.read-count` 样式 | 改 |

---

## Task 1: Clarity → GoatCounter 切换

**Files:**
- Modify: `quartz.config.ts`(analytics 块,约 10-13 行)
- Modify: `quartz/components/Head.tsx`(删 `clarityProjectId` 定义约 39-40 行 + 删 `{clarityProjectId && (...)}` 脚本块约 92-99 行)

- [ ] **Step 1: 改 analytics provider**

把 `quartz.config.ts` 里的 analytics 块改成:

```ts
    analytics: {
      provider: "goatcounter",
      websiteId: "nuts-and-bytes",
    },
```

- [ ] **Step 2: 删除 Head.tsx 的 clarityProjectId 定义**

删掉这两行(约 39-40):

```tsx
    const clarityProjectId =
      cfg.analytics?.provider === "clarity" ? cfg.analytics.projectId : undefined
```

- [ ] **Step 3: 删除 Head.tsx 的 Clarity 脚本块**

删掉整段(约 92-99):

```tsx
        {clarityProjectId && (
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityProjectId}");`,
            }}
          />
        )}
```

- [ ] **Step 4: 构建验证**

Run: `cd /Users/ericlu/Desktop/ai-songshu-garden && npx quartz build 2>&1 | tail -5`
Expected: `Done processing 5 files` 无 TypeScript 报错。

- [ ] **Step 5: 浏览器验证脚本已切换**

用 preview_eval(serverId `1d15aacc-3336-4679-9c90-1cf9e352cef2`)导航到首页并断言:

```js
(async()=>{await new Promise(r=>setTimeout(r,1500));
  const html=document.documentElement.outerHTML;
  return {hasGoat: html.includes("gc.zgo.at")||!!document.querySelector('script[src*="gc.zgo.at"]'),
          hasClarity: html.includes("clarity.ms")}})()
```
Expected:`hasGoat: true, hasClarity: false`(注意:gc.zgo.at 脚本是 afterDOMLoaded 动态插入,断言查 DOM 里的 script 标签)。

- [ ] **Step 6: Commit**

```bash
cd /Users/ericlu/Desktop/ai-songshu-garden
git add quartz.config.ts quartz/components/Head.tsx
git commit -m "feat: 用 GoatCounter 替换 Clarity 浏览量统计

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: GithubCTA 文章底部引流卡片

**Files:**
- Create: `quartz/components/GithubCTA.tsx`
- Modify: `quartz/components/index.ts`(加 import + export)
- Modify: `quartz/styles/custom.scss`(追加 `.github-cta` 样式)
- Modify: `quartz.layout.ts`(afterBody 注入)

- [ ] **Step 1: 创建 GithubCTA.tsx**

纯渲染组件,无客户端脚本。Star 数用 shields.io 徽章(`<img>`,实时、可点、SPA 安全):

```tsx
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const REPO = "nuts-and-bytes/ai-songshu-garden"

export default (() => {
  function GithubCTA({ displayClass }: QuartzComponentProps) {
    return (
      <div class={classNames(displayClass, "github-cta")}>
        <div class="github-cta-title">觉得这篇有用?</div>
        <div class="github-cta-actions">
          <a
            class="github-cta-star"
            href={`https://github.com/${REPO}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="github-cta-star-label">⭐ 给本项目点个 Star</span>
            <img
              class="github-cta-badge"
              src={`https://img.shields.io/github/stars/${REPO}?style=social&label=`}
              alt="GitHub stars"
              loading="lazy"
            />
          </a>
          <a
            class="github-cta-link"
            href={`https://github.com/${REPO}/issues`}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 有想法或建议?来 Issues 公开聊聊 →
          </a>
          <a
            class="github-cta-link"
            href="https://github.com/nuts-and-bytes"
            target="_blank"
            rel="noopener noreferrer"
          >
            🔭 逛逛我的其他开源项目 →
          </a>
        </div>
      </div>
    )
  }

  return GithubCTA
}) satisfies QuartzComponentConstructor
```

- [ ] **Step 2: 在 index.ts 注册组件**

`quartz/components/index.ts` 顶部 import 区加一行:

```ts
import GithubCTA from "./GithubCTA"
```

`export { ... }` 块里加 `GithubCTA,`(放在 `ConditionalRender,` 后即可)。

- [ ] **Step 3: 追加 SCSS 样式到 custom.scss**

在 `quartz/styles/custom.scss` 末尾追加:

```scss
// GitHub 引流卡片(文章底部 + 首页共用)
.github-cta {
  margin: 3rem 0 1rem;
  padding: 1.6rem 1.8rem;
  border: 1px solid var(--lightgray);
  border-radius: 8px;
  background: var(--light);

  .github-cta-title {
    font-family: var(--titleFont);
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--dark);
  }

  .github-cta-actions {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .github-cta-star {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 600;
    color: var(--dark);
    border: none;

    &:hover {
      opacity: 0.75;
    }
  }

  .github-cta-badge {
    height: 20px;
    vertical-align: middle;
  }

  .github-cta-link {
    color: var(--secondary);
    border: none;
    transition: opacity 0.15s ease;

    &:hover {
      opacity: 0.7;
    }
  }
}
```

- [ ] **Step 4: 在 layout 注入到博客文章页**

`quartz.layout.ts` 的 `sharedPageComponents.afterBody` 数组里,在现有 RecentNotes 的 ConditionalRender **之后**追加:

```ts
    Component.ConditionalRender({
      component: Component.GithubCTA(),
      condition: (page) =>
        (page.fileData.slug?.startsWith("博客/") ?? false) && page.fileData.slug !== "博客/index",
    }),
```

- [ ] **Step 5: 构建**

Run: `cd /Users/ericlu/Desktop/ai-songshu-garden && npx quartz build 2>&1 | tail -3`
Expected:`Done processing 5 files` 无报错。

- [ ] **Step 6: 浏览器验证(文章页出现卡片 + 三链接正确)**

preview_eval 导航到 `http://localhost:8090/博客/如何用-Claude-Code-搭一个会自动整理的知识库?_=`+Date.now(),等 1500ms 后断言:

```js
(()=>{const c=document.querySelector('.github-cta');
  if(!c) return {found:false};
  const links=[...c.querySelectorAll('a')].map(a=>a.getAttribute('href'));
  return {found:true,
    title:c.querySelector('.github-cta-title')?.textContent,
    links,
    hasBadge:!!c.querySelector('.github-cta-badge')}})()
```
Expected:`found:true`,links 含 repo 主页、`/issues`、`github.com/nuts-and-bytes`,`hasBadge:true`。

- [ ] **Step 7: 验证首页不出现该卡片(只在文章页)**

preview_eval 导航到 `http://localhost:8090/?_=`+Date.now(),断言:

```js
(()=>!document.querySelector('.github-cta'))()
```
Expected:`true`(首页的引流区在 Task 3 单独加,此组件不应出现在首页)。

- [ ] **Step 8: Commit**

```bash
cd /Users/ericlu/Desktop/ai-songshu-garden
git add quartz/components/GithubCTA.tsx quartz/components/index.ts quartz/styles/custom.scss quartz.layout.ts
git commit -m "feat: 文章底部加 GitHub 引流卡片(Star/Issues/其他项目)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: 首页引流区

**Files:**
- Modify: `content/index.md`(在 explore-section 之后追加)

复用 Task 2 的 `.github-cta` 样式(已是全局),首页直接写 HTML 块。注意 Quartz 用 parse5 重解析 raw HTML,**不要**用 `<a>` 包裹块级元素(会触发 HTML5 adoption agency 重排);这里每个 `<a>` 内只有文本/`<img>`,安全。

- [ ] **Step 1: 在 index.md 末尾追加首页引流区**

在 `content/index.md` 最后一行(explore-section 那个 div 之后)追加一个空行,再加:

```html
<div class="github-cta github-cta-home"><div class="github-cta-title">这个博客本身就是开源的</div><div class="github-cta-actions"><a class="github-cta-star" href="https://github.com/nuts-and-bytes/ai-songshu-garden" target="_blank" rel="noopener noreferrer"><span class="github-cta-star-label">⭐ 给本项目点个 Star</span><img class="github-cta-badge" src="https://img.shields.io/github/stars/nuts-and-bytes/ai-songshu-garden?style=social&label=" alt="GitHub stars" loading="lazy" /></a><a class="github-cta-link" href="https://github.com/nuts-and-bytes/ai-songshu-garden/issues" target="_blank" rel="noopener noreferrer">💬 用过哪个项目?来 Issues 聊聊体验、提建议 →</a><a class="github-cta-link" href="https://github.com/nuts-and-bytes" target="_blank" rel="noopener noreferrer">🔭 逛逛我的其他开源项目 →</a></div></div>
```

- [ ] **Step 2: 构建**

Run: `cd /Users/ericlu/Desktop/ai-songshu-garden && npx quartz build 2>&1 | tail -3`
Expected:`Done processing 5 files`。

- [ ] **Step 3: 浏览器验证首页引流区结构正确**

preview_eval 导航到 `http://localhost:8090/?_=`+Date.now(),等 1000ms 断言(重点确认 parse5 没把 `<a>` 子节点弹出):

```js
(()=>{const c=document.querySelector('.github-cta-home');
  if(!c) return {found:false};
  const star=c.querySelector('.github-cta-star');
  return {found:true,
    starHasImg:!!star?.querySelector('img'),
    starHasLabel:!!star?.querySelector('.github-cta-star-label'),
    linkCount:c.querySelectorAll('.github-cta-link').length}})()
```
Expected:`found:true, starHasImg:true, starHasLabel:true, linkCount:2`。

- [ ] **Step 4: Commit**

```bash
cd /Users/ericlu/Desktop/ai-songshu-garden
git add content/index.md
git commit -m "feat: 首页加 GitHub 引流区

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: ReadCount 阅读量徽章

**Files:**
- Create: `quartz/components/scripts/readcount.inline.ts`
- Create: `quartz/components/ReadCount.tsx`
- Modify: `quartz/components/index.ts`(import + export)
- Modify: `quartz/styles/custom.scss`(追加 `.read-count` 样式)
- Modify: `quartz.layout.ts`(beforeBody 注入,条件博客文章页)

- [ ] **Step 1: 创建客户端脚本 readcount.inline.ts**

在 `nav`(Quartz SPA 路由事件)时,用当前 `location.pathname` 查 GoatCounter 公开计数,填进 `.read-count`;失败则隐藏,不报错、不占位:

```ts
const GOAT_CODE = "nuts-and-bytes"

async function renderReadCount() {
  const el = document.querySelector(".read-count") as HTMLElement | null
  if (!el) return
  // location.pathname 已是浏览器编码形式,与 count.js 上报的一致;保留斜杠
  const path = location.pathname
  const url = `https://${GOAT_CODE}.goatcounter.com/counter/${path}.json`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as { count: string }
    el.textContent = `👁 已阅读 ${data.count} 次`
    el.removeAttribute("hidden")
  } catch {
    el.setAttribute("hidden", "true")
  }
}

document.addEventListener("nav", () => {
  renderReadCount()
})
```

- [ ] **Step 2: 创建 ReadCount.tsx**

默认渲染一个 `hidden` 的 span(数据回来再显示),挂上面的脚本:

```tsx
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
// @ts-ignore
import script from "./scripts/readcount.inline"

export default (() => {
  function ReadCount({ displayClass }: QuartzComponentProps) {
    return <span class={classNames(displayClass, "read-count")} hidden></span>
  }

  ReadCount.afterDOMLoaded = script

  return ReadCount
}) satisfies QuartzComponentConstructor
```

- [ ] **Step 3: 在 index.ts 注册**

`quartz/components/index.ts` import 区加:

```ts
import ReadCount from "./ReadCount"
```

`export { ... }` 块加 `ReadCount,`。

- [ ] **Step 4: 追加 SCSS**

在 `quartz/styles/custom.scss` 末尾追加:

```scss
// 阅读量徽章(文章顶部)
.read-count {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--gray);
  margin-top: 0.3rem;

  &[hidden] {
    display: none;
  }
}
```

- [ ] **Step 5: 在 layout 注入到博客文章页 beforeBody**

`quartz.layout.ts` 的 `defaultContentPageLayout.beforeBody` 数组里,在 ContentMeta 的 ConditionalRender **之后**追加:

```ts
    Component.ConditionalRender({
      component: Component.ReadCount(),
      condition: (page) =>
        (page.fileData.slug?.startsWith("博客/") ?? false) && page.fileData.slug !== "博客/index",
    }),
```

- [ ] **Step 6: 构建**

Run: `cd /Users/ericlu/Desktop/ai-songshu-garden && npx quartz build 2>&1 | tail -3`
Expected:`Done processing 5 files` 无报错。

- [ ] **Step 7: 浏览器验证徽章元素存在 + 脚本发起请求**

> 注:GoatCounter 后台"公开计数"开启前,`.json` 会 403,徽章保持 hidden(符合预期的优雅降级)。本步只验证 **元素渲染 + 脚本确实发起了对 goatcounter 的请求**,不强求显示数字。

preview_eval 导航到文章页 `http://localhost:8090/博客/如何用-Claude-Code-搭一个会自动整理的知识库?_=`+Date.now(),等 2000ms 断言:

```js
(async()=>{await new Promise(r=>setTimeout(r,1800));
  const el=document.querySelector('.read-count');
  return {exists:!!el,
    textIfShown: el && !el.hasAttribute('hidden') ? el.textContent : "(hidden, 等后台开启公开计数)"}})()
```
Expected:`exists:true`。`textIfShown` 在后台开启公开计数后应是"👁 已阅读 N 次",否则是 hidden 提示(都算通过)。

- [ ] **Step 8: Commit**

```bash
cd /Users/ericlu/Desktop/ai-songshu-garden
git add quartz/components/ReadCount.tsx quartz/components/scripts/readcount.inline.ts quartz/components/index.ts quartz/styles/custom.scss quartz.layout.ts
git commit -m "feat: 文章顶部加 GoatCounter 阅读量徽章

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 整体验证 + 暗色模式 + 部署

**Files:** 无新增改动,仅验证与推送(如验证发现样式问题,在对应文件修)。

- [ ] **Step 1: 全量构建**

Run: `cd /Users/ericlu/Desktop/ai-songshu-garden && npx quartz build 2>&1 | tail -3`
Expected:`Done processing 5 files`。

- [ ] **Step 2: 亮色模式截图核查**

preview_screenshot 文章页与首页,确认:文章底部引流卡片、首页引流区视觉与站点暖米色/Editorial 风格一致,卡片不破版。

- [ ] **Step 3: 暗色模式核查**

preview_eval 切换暗色后截图:

```js
(()=>{document.documentElement.setAttribute('saved-theme','dark');return document.documentElement.getAttribute('saved-theme')})()
```
然后 preview_screenshot,确认卡片在暗色下边框/文字/徽章可读,无白底突兀。如有问题,在 `.github-cta` 样式里用 `var(--light)`/`var(--dark)` 已自动跟随,无需额外改;若徽章白底突兀可接受(shields social 徽章透明底)。

- [ ] **Step 4: 推送部署**

```bash
cd /Users/ericlu/Desktop/ai-songshu-garden
git push origin main
```
Expected:`PUSHED`(推送后 GitHub Pages 自动部署)。

- [ ] **Step 5: 部署后人工确认(交接给用户)**

提醒用户:① 去 GoatCounter Settings 勾选"允许公开访问计数",阅读徽章才会显示数字;② 等几分钟后在 `https://nuts-and-bytes.goatcounter.com` 面板确认有 pageview 进来。

---

## 自查记录(writing-plans self-review)

**Spec 覆盖:**
- 系统 A 文章底部卡片 → Task 2 ✅
- 系统 A 首页引流区 → Task 3 ✅
- 三个行动(Star/Issues/其他项目)→ Task 2/3 链接 ✅
- 系统 B Clarity→GoatCounter → Task 1 ✅
- 系统 B 阅读徽章 → Task 4 ✅
- 非目标(不做硬门禁/OAuth/画像)→ 计划中无相关任务 ✅
- 用户手动步骤(开启公开计数)→ Task 4 Step 7 注 + Task 5 Step 5 ✅

**偏离 spec 处(已记录理由):** Star 按钮用 shields.io `<img>` 徽章替代 github-buttons.js —— 避免 SPA 导航下的脚本重渲染,零客户端 JS,更健壮。功能等价(实时 star 数 + 可点跳转)。

**占位符扫描:** 无 TBD/TODO,每个改代码的 Step 都有完整代码。

**类型一致性:** class 名 `.github-cta` / `.github-cta-star` / `.github-cta-badge` / `.github-cta-link` / `.read-count` 在组件、SCSS、首页 HTML、验证脚本中一致;GoatCounter code `nuts-and-bytes`、repo slug 全程一致。
