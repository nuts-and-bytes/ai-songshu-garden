# Retypeset Odyssey Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Quartz blog with a source-vendored Retypeset Odyssey v0.1.20 site at the existing GitHub Pages base path, migrate the user's content, preserve legacy URLs, and retain the reference theme's visual, motion, search, language, and sound behavior.

**Architecture:** Work in an isolated git worktree and vendor the audited upstream tag directly into the current repository. Keep upstream visual/interaction files intact; place project-specific behavior in `retypeset.config.yaml`, content collections, a small locale-fallback utility, and a static legacy-redirect generator. Verify pure behavior with Node/tsx tests, production behavior with Playwright, and deployment output with a GitHub Pages build.

**Tech Stack:** Astro 6, TypeScript, UnoCSS, Retypeset Odyssey v0.1.20, Pagefind, Astro View Transitions, Web Audio API, pnpm, Node test runner via tsx, Playwright, GitHub Pages Actions.

---

## Scope and source pin

- Design spec: `docs/superpowers/specs/2026-08-25-retypeset-odyssey-migration-design.md`
- Upstream: `https://github.com/lifeodyssey/retypeset-odyssey.git`
- Upstream tag: `v0.1.20`
- Required upstream commit: `20d41050d5cfdfef04cc81875b544aa566fea978`
- Existing production URL: `https://nuts-and-bytes.github.io/ai-songshu-garden/`
- Canonical migrated article slug: `如何用-claude-code-搭一个会自动整理的知识库`

## File and responsibility map

### Upstream-owned visual/runtime files

- `src/components/**`: Retypeset UI, navigation, lists, search, interaction widgets.
- `src/layouts/**`: document head, ClientRouter, global layout and rail.
- `src/styles/**`: fonts, paper palette, typography, transition choreography.
- `src/pages/**`: injected pages for posts, notes, journals, taxonomies, timeline, feeds, OG and 404.
- `public/fonts/**`, `public/sounds/**`, `public/icons/**`: self-hosted visual and audio assets.
- `integration.ts`, `uno.config.ts`, `astro.config.ts`: Astro integration, routes, markdown pipeline and base-path handling.

### Project-owned adaptation files

- `retypeset.config.yaml`: brand, URL/base, languages, footer, SEO and collection intros.
- `content/posts/*.md`: migrated canonical posts.
- `content/notes/.gitkeep`, `content/journals/.gitkeep`: enabled empty collections.
- `content/about/about-zh.md`: biography and contacts.
- `src/i18n/fallback.ts`: pure localized-entry fallback policy.
- `src/utils/content.ts`: applies fallback policy to posts, notes, journals, tags, categories and timeline.
- `scripts/seo/legacy-routes.ts`: explicit old-to-new route manifest.
- `scripts/seo/generate-static-redirects.ts`: writes GitHub Pages-compatible redirect HTML.
- `tests/unit/*.test.ts`: config, content, fallback, redirects and build-artifact tests.
- `tests/site.spec.ts`: browser acceptance tests.
- `.github/workflows/deploy.yml`: pnpm/Astro Pages deployment.
- `README.md`, `THEME_UPSTREAM.md`: project operation and attribution.

---

### Task 1: Create the isolated worktree and vendor the exact upstream theme

**Files:**
- Replace: `package.json`, `pnpm-lock.yaml`, `astro.config.ts`, `integration.ts`, `uno.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `playwright.config.ts`
- Create: `src/**`, `public/**`, `scripts/**`, `patches/**`, `skill/**`, `AI_USAGE.md`, `DESIGN.md`, `DESIGN_PROMPT.md`, `LICENSE`
- Remove: `quartz/**`, `quartz.config.ts`, `quartz.layout.ts`, Quartz build scripts and generated `public/**`
- Preserve: `content/**` until Task 3, `docs/superpowers/**`, `.github/workflows/deploy.yml`

- [ ] **Step 1: Create an isolated worktree**

Invoke `superpowers:using-git-worktrees`. Create a feature worktree from current `main`, and use branch:

```text
feat/retypeset-odyssey-migration
```

Verify the worktree starts at or after the approved spec commit:

```bash
git log -1 --oneline
git status --short --branch
```

Expected: clean feature worktree; the original checkout's Quartz cache modifications remain outside this worktree.

- [ ] **Step 2: Fetch and verify the pinned upstream tag**

```bash
git remote add retypeset-theme https://github.com/lifeodyssey/retypeset-odyssey.git
git fetch --depth=1 retypeset-theme refs/tags/v0.1.20
UPSTREAM_SHA="$(git rev-parse 'FETCH_HEAD^{commit}')"
test "$UPSTREAM_SHA" = "20d41050d5cfdfef04cc81875b544aa566fea978"
printf 'verified upstream: %s\n' "$UPSTREAM_SHA"
```

Expected: `verified upstream: 20d41050d5cfdfef04cc81875b544aa566fea978`.

- [ ] **Step 3: Remove the Quartz runtime without touching approved docs or content**

```bash
git rm -r quartz
git rm \
  .claude/launch.json \
  .node-version .npmrc .prettierignore .prettierrc \
  blogshot.mjs shot1.mjs \
  CODE_OF_CONDUCT.md DEPLOY.md Dockerfile \
  globals.d.ts index.d.ts LICENSE.txt \
  package-lock.json package.json README.md tsconfig.json \
  quartz.config.ts quartz.layout.ts
git ls-files -z docs \
  | python3 -c 'import sys; data=sys.stdin.buffer.read().split(b"\\0"); sys.stdout.buffer.write(b"\\0".join(p for p in data if p and not p.startswith(b"docs/superpowers/")) + b"\\0")' \
  | xargs -0 git rm --
git rm -r \
  .github/ISSUE_TEMPLATE \
  .github/dependabot.yml \
  .github/FUNDING.yml \
  .github/pull_request_template.md
```

Expected: `docs/superpowers/specs/` and `docs/superpowers/plans/` remain present.

- [ ] **Step 4: Check out only the required upstream source surfaces**

```bash
git checkout FETCH_HEAD -- \
  .editorconfig .gitattributes .gitignore \
  AI_USAGE.md DESIGN.md DESIGN_PROMPT.md LICENSE README.md \
  astro.config.ts default-config.yaml default-poems.yaml \
  discover-collections.ts eslint.config.mjs integration.ts \
  package.json pnpm-lock.yaml playwright.config.ts tsconfig.json uno.config.ts \
  patches public scripts skill src tests
git remote remove retypeset-theme
```

Do not import upstream `.github`, demo reports, test results, Cloudflare config, submission metadata or VS Code settings.

- [ ] **Step 5: Track project content and ignore only generated/local output**

Remove the upstream personal-content exclusions so this repository can commit its own Markdown:

```bash
python3 - <<'PY'
from pathlib import Path
path = Path('.gitignore')
removed = {
    'content/posts/',
    '!content/posts/_example-post.md',
    'content/journals/',
    '!content/journals/_example-journal.md',
    'content/notes/',
    '!content/notes/_example-note.md',
    'content/about.md',
    'src/content/about/',
    '!src/content/about/_example-about-en.md',
}
lines = [line for line in path.read_text().splitlines() if line not in removed]
path.write_text('\n'.join(lines).rstrip() + '\n')
PY
```

Ensure `.gitignore` contains these exact generated/local entries:

```gitignore
.superpowers/
.astro/
dist/
playwright-report/
test-results/
```

Run:

```bash
for entry in '.superpowers/' '.astro/' 'dist/' 'playwright-report/' 'test-results/'; do
  grep -qxF "$entry" .gitignore || printf '%s\n' "$entry" >> .gitignore
done
```

- [ ] **Step 6: Install the pinned dependency graph**

```bash
corepack pnpm install --frozen-lockfile
```

Expected: pnpm completes with exit code 0 and does not rewrite `pnpm-lock.yaml`.

- [ ] **Step 7: Verify the vendored source before customization**

```bash
pnpm astro check
test -f public/sounds/tap_01.wav
test -f public/sounds/type_05.wav
test -f public/fonts/Snell-Black-SF.woff2
git diff --check -- .gitignore docs/superpowers
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit the source import**

```bash
git add -A
git commit -m "build: vendor Retypeset Odyssey v0.1.20"
```

---

### Task 2: Configure brand, base path, scripts, assets, and GitHub Pages deployment

**Files:**
- Create: `retypeset.config.yaml`
- Create: `tests/unit/site-config.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/deploy.yml`
- Replace: `public/icons/favicon.svg`, `public/icons/og-logo.png`

- [ ] **Step 1: Write the failing site-configuration test**

Create `tests/unit/site-config.test.ts`:

```ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import yaml from 'yaml'

const config = yaml.parse(readFileSync('retypeset.config.yaml', 'utf8'))
const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8')
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))

const expectedFooterLinks = [
  ['RSS', '/atom.xml'],
  ['GitHub', 'https://github.com/nuts-and-bytes'],
  ['Portfolio', 'https://nuts-and-bytes.github.io/portfolio/'],
  ['小红书', 'https://www.xiaohongshu.com/user/profile/zhuxinyao99'],
]

test('uses the approved nuts & bytes identity and GitHub Pages base', () => {
  assert.equal(config.site.title, 'nuts & bytes')
  assert.equal(config.site.subtitle, '静水流深')
  assert.equal(config.site.author, 'nuts & bytes')
  assert.equal(config.site.url, 'https://nuts-and-bytes.github.io')
  assert.equal(config.site.base, '/ai-songshu-garden')
  assert.equal(config.site.i18nTitle, false)
})

test('enables the approved locales and disables comments', () => {
  assert.equal(config.global.locale, 'zh')
  assert.deepEqual(config.global.moreLocales, ['en', 'ja'])
  assert.equal(config.global.fontStyle, 'sans')
  assert.equal(config.comment.enabled, false)
})

test('uses only approved footer links', () => {
  assert.deepEqual(
    config.footer.links.map((link: { name: string, url: string }) => [link.name, link.url]),
    expectedFooterLinks,
  )
  assert.equal(config.footer.startYear, 2026)
})

test('deploy workflow builds dist with pnpm and runs tests', () => {
  assert.match(workflow, /pnpm\/action-setup@v4/)
  assert.match(workflow, /pnpm install --frozen-lockfile/)
  assert.match(workflow, /pnpm test:unit/)
  assert.match(workflow, /pnpm build/)
  assert.match(workflow, /path: dist/)
  assert.doesNotMatch(workflow, /quartz/)
})

test('package scripts expose unit and browser verification', () => {
  assert.equal(packageJson.scripts['test:unit'], 'tsx --test tests/unit/*.test.ts')
  assert.equal(packageJson.scripts['test:e2e'], 'playwright test')
})
```

- [ ] **Step 2: Run the test and verify the expected failure**

```bash
pnpm tsx --test tests/unit/site-config.test.ts
```

Expected: FAIL because `retypeset.config.yaml` does not exist and the workflow still describes Quartz.

- [ ] **Step 3: Create the complete site override**

Create `retypeset.config.yaml`:

```yaml
site:
  title: nuts & bytes
  subtitle: 静水流深
  description: 一个零基础编程用户用 AI 折腾工具、工作流与生活的个人博客。
  i18nTitle: false
  author: nuts & bytes
  url: https://nuts-and-bytes.github.io
  base: /ai-songshu-garden
  favicon: /icons/favicon.svg

color:
  mode: light

global:
  locale: zh
  moreLocales:
    - en
    - ja
  fontStyle: sans
  dateFormat: YYYY-MM-DD
  toc: true
  katex: true
  reduceMotion: false

comment:
  enabled: false

seo:
  person:
    email: zxy200204@126.com
    sameAs:
      - https://github.com/nuts-and-bytes
      - https://nuts-and-bytes.github.io/portfolio/
      - https://t.me/ericlibro
      - https://www.xiaohongshu.com/user/profile/zhuxinyao99
  llms:
    featured:
      - 如何用-claude-code-搭一个会自动整理的知识库

footer:
  links:
    - name: RSS
      url: /atom.xml
    - name: GitHub
      url: https://github.com/nuts-and-bytes
    - name: Portfolio
      url: https://nuts-and-bytes.github.io/portfolio/
    - name: 小红书
      url: https://www.xiaohongshu.com/user/profile/zhuxinyao99
  startYear: 2026

collections:
  posts:
    enabled: true
  notes:
    enabled: true
    intro:
      zh: 用过觉得好的东西，才放上来。不堆砌，只精选。
  journals:
    enabled: true
    intro:
      zh: 日常记录，保持原始与诚实。
```

All unspecified color and interaction values continue to inherit from `default-config.yaml`.

- [ ] **Step 4: Replace the workflow with Astro/pnpm Pages deployment**

Replace `.github/workflows/deploy.yml` with:

```yaml
name: Deploy Astro site to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.26.0
          run_install: false
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-22.04
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Add project verification scripts**

In `package.json`, set these exact script entries while preserving upstream authoring scripts:

```json
{
  "scripts": {
    "dev": "astro check && astro dev",
    "build": "astro check && astro build && pnpm apply-lqip",
    "preview": "astro preview",
    "check": "astro check",
    "test": "pnpm test:unit && pnpm test:e2e",
    "test:unit": "tsx --test tests/unit/*.test.ts",
    "test:e2e": "playwright test",
    "test:ui": "playwright test --ui",
    "astro": "astro",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "new-post": "tsx scripts/new-post.ts",
    "translate:new-posts": "node scripts/translation/run.mjs",
    "apply-lqip": "tsx scripts/apply-lqip.ts",
    "format-posts": "tsx scripts/format-posts.ts",
    "update-theme": "tsx scripts/update-theme.ts"
  }
}
```

- [ ] **Step 6: Create brand-safe favicon and OG logo**

Replace `public/icons/favicon.svg` with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#f2f1f5"/>
  <text x="32" y="39" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-weight="700" fill="#302e31">n&amp;b</text>
</svg>
```

Generate the PNG consumed by the OG route:

```bash
node --input-type=module - <<'NODE'
import sharp from 'sharp'
await sharp('public/icons/favicon.svg').resize(512, 512).png().toFile('public/icons/og-logo.png')
NODE
```

- [ ] **Step 7: Run the test and verify green**

```bash
pnpm tsx --test tests/unit/site-config.test.ts
git diff --check
```

Expected: all five tests PASS.

- [ ] **Step 8: Commit configuration and deployment**

```bash
git add retypeset.config.yaml package.json .github/workflows/deploy.yml \
  public/icons/favicon.svg public/icons/og-logo.png tests/unit/site-config.test.ts
git commit -m "feat: configure nuts and bytes Retypeset site"
```

---

### Task 3: Migrate the canonical post, empty collections, and About contacts

**Files:**
- Replace: `content/**`
- Create: `content/posts/如何用 Claude Code 搭一个会自动整理的知识库.md`
- Create: `content/notes/.gitkeep`, `content/journals/.gitkeep`
- Create: `content/about/about-zh.md`
- Create: `tests/unit/content-files.test.ts`

- [ ] **Step 1: Write the failing content-contract test**

Create `tests/unit/content-files.test.ts`:

```ts
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import yaml from 'yaml'

function readMarkdown(path: string) {
  const raw = readFileSync(path, 'utf8')
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  assert.ok(match, `${path} must have YAML frontmatter`)
  return { data: yaml.parse(match[1]), body: match[2] }
}

const postPath = 'content/posts/如何用 Claude Code 搭一个会自动整理的知识库.md'

test('contains exactly one canonical post with stable metadata', () => {
  const files = readdirSync('content/posts').filter(file => /\.mdx?$/.test(file))
  assert.deepEqual(files, ['如何用 Claude Code 搭一个会自动整理的知识库.md'])

  const post = readMarkdown(postPath)
  assert.equal(post.data.title, '如何用 Claude Code 搭一个会自动整理的知识库')
  assert.equal(post.data.published, '2026-06-03')
  assert.equal(post.data.updated, '2026-06-07')
  assert.equal(post.data.lang, 'zh')
  assert.equal(post.data.toc, true)
  assert.deepEqual(post.data.tags, ['AI', '工作流', 'Obsidian'])
  assert.match(post.body, /## 零、先问：这套东西适合你吗？/)
  assert.ok(Buffer.byteLength(post.body, 'utf8') > 18000)
})

test('keeps notes and journals empty without inventing content', () => {
  for (const directory of ['content/notes', 'content/journals']) {
    assert.ok(existsSync(`${directory}/.gitkeep`))
    assert.deepEqual(readdirSync(directory).filter(file => /\.mdx?$/.test(file)), [])
  }
})

test('about page contains every approved public contact', () => {
  const about = readMarkdown('content/about/about-zh.md')
  assert.equal(about.data.lang, 'zh')
  assert.match(about.body, /https:\/\/nuts-and-bytes\.github\.io\/portfolio\//)
  assert.match(about.body, /https:\/\/github\.com\/nuts-and-bytes/)
  assert.match(about.body, /mailto:zxy200204@126\.com/)
  assert.match(about.body, /mailto:zhuxinyao99@gmail\.com/)
  assert.match(about.body, /https:\/\/t\.me\/ericlibro/)
  assert.match(about.body, /xiaohongshu\.com\/user\/profile\/zhuxinyao99/)
})
```

- [ ] **Step 2: Run the test and verify red**

```bash
pnpm tsx --test tests/unit/content-files.test.ts
```

Expected: FAIL because the Retypeset content directories do not exist.

- [ ] **Step 3: Rebuild the content tree from the original `main` files**

Run this exact script from the feature worktree:

```bash
python3 - <<'PY'
from pathlib import Path
import re
import subprocess

source = subprocess.check_output([
    'git', 'show',
    'main:content/博客/如何用 Claude Code 搭一个会自动整理的知识库.md',
], text=True)
body = re.sub(r'^---\n[\s\S]*?\n---\n', '', source, count=1)
frontmatter = '''---
title: 如何用 Claude Code 搭一个会自动整理的知识库
published: 2026-06-03
updated: 2026-06-07
description: 一个零基础用户如何用 Claude Code、Obsidian 与转录工具搭出会自动整理、建 Wiki 和连双链的知识库。
tags:
  - AI
  - 工作流
  - Obsidian
categories:
  - AI 工作流
lang: zh
toc: true
draft: false
---

'''

root = Path('content')
if root.exists():
    for path in sorted(root.rglob('*'), reverse=True):
        if path.is_file() or path.is_symlink():
            path.unlink()
        elif path.is_dir():
            path.rmdir()
root.mkdir(exist_ok=True)

post_dir = root / 'posts'
post_dir.mkdir()
(post_dir / '如何用 Claude Code 搭一个会自动整理的知识库.md').write_text(
    frontmatter + body.lstrip('\n'), encoding='utf-8'
)
for name in ('notes', 'journals'):
    directory = root / name
    directory.mkdir()
    (directory / '.gitkeep').write_text('', encoding='utf-8')
(root / 'about').mkdir()
PY
```

- [ ] **Step 4: Write the approved About page**

Create `content/about/about-zh.md`:

```markdown
---
lang: zh
---

## 我是谁

一个零基础编程小白，对效率、美和科技有点执念，喜欢自己动手折腾工具。

不是什么大神，只是把摸索的过程老实记下来，给和我一样的人做个参考。

## 这个站有什么

- **文章**：我用 AI 折腾生活和工作的过程，教程、心得与踩坑
- **笔记**：真正用过、值得留下的 AI 工具、播客与书
- **日记**：还没有内容，保留给未来的日常记录

## 联系方式

- [Portfolio](https://nuts-and-bytes.github.io/portfolio/)
- [GitHub](https://github.com/nuts-and-bytes)
- [Email](mailto:zxy200204@126.com)
- [Gmail](mailto:zhuxinyao99@gmail.com)
- [Telegram](https://t.me/ericlibro)
- [小红书：AI 与一只松鼠](https://www.xiaohongshu.com/user/profile/zhuxinyao99)
```

- [ ] **Step 5: Run content tests and the first production build**

```bash
pnpm tsx --test tests/unit/content-files.test.ts
pnpm astro check
pnpm build
```

Expected: content tests PASS, Astro check exits 0, and `dist/index.html` exists.

- [ ] **Step 6: Verify no Quartz-only content remains**

```bash
! find content -type f -name '*.md' -print0 | xargs -0 rg -n 'github-cta|hero-grid|Component\.Graph|GoatCounter'
find content -maxdepth 2 -type f | sort
git diff --check
```

Expected: one post, one About file, two `.gitkeep` files; no Quartz layout markup.

- [ ] **Step 7: Commit migrated content**

```bash
git add -A content tests/unit/content-files.test.ts
git commit -m "feat: migrate blog content to Astro collections"
```

---

### Task 4: Implement Chinese fallback for missing English and Japanese content

**Files:**
- Create: `src/i18n/fallback.ts`
- Create: `tests/unit/fallback.test.ts`
- Modify: `src/types/index.d.ts`
- Modify: `src/utils/content.ts`
- Modify: `src/pages/[...lang]/posts/[slug].astro`
- Modify: `src/pages/[...lang]/notes/[slug].astro`
- Modify: `src/pages/[...lang]/journals/[slug].astro`
- Modify: `src/pages/[...lang]/about.astro`
- Modify: `src/layouts/Layout.astro`, `src/layouts/Head.astro`
- Modify: `src/components/PostList.astro`, `src/components/NoteList.astro`, `src/components/JournalList.astro`
- Modify: `src/pages/[...lang]/timeline.astro`

- [ ] **Step 1: Write the failing fallback-policy test**

Create `tests/unit/fallback.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveLocalizedEntry } from '../../src/i18n/fallback'

const zh = { id: 'zh-entry' }
const en = { id: 'en-entry' }

test('returns an exact translation without fallback metadata', () => {
  const result = resolveLocalizedEntry({ zh, en }, 'en', 'zh')
  assert.deepEqual(result, {
    entry: en,
    requestedLang: 'en',
    sourceLang: 'en',
    isFallback: false,
  })
})

test('falls back to the default Chinese entry', () => {
  const result = resolveLocalizedEntry({ zh }, 'ja', 'zh')
  assert.deepEqual(result, {
    entry: zh,
    requestedLang: 'ja',
    sourceLang: 'zh',
    isFallback: true,
  })
})

test('returns an empty resolution when neither language exists', () => {
  const result = resolveLocalizedEntry({}, 'ja', 'zh')
  assert.deepEqual(result, {
    entry: undefined,
    requestedLang: 'ja',
    sourceLang: undefined,
    isFallback: false,
  })
})
```

- [ ] **Step 2: Run the test and verify red**

```bash
pnpm tsx --test tests/unit/fallback.test.ts
```

Expected: FAIL with module-not-found for `src/i18n/fallback.ts`.

- [ ] **Step 3: Implement the pure fallback utility**

Create `src/i18n/fallback.ts`:

```ts
import type { Language } from '@/i18n/config'

export interface LocalizedResolution<T> {
  entry: T | undefined
  requestedLang: Language
  sourceLang: Language | undefined
  isFallback: boolean
}

export function resolveLocalizedEntry<T>(
  byLang: Partial<Record<Language, T>>,
  requestedLang: Language,
  defaultLocale: Language,
): LocalizedResolution<T> {
  const exact = byLang[requestedLang]
  if (exact) {
    return {
      entry: exact,
      requestedLang,
      sourceLang: requestedLang,
      isFallback: false,
    }
  }

  const fallback = byLang[defaultLocale]
  if (fallback) {
    return {
      entry: fallback,
      requestedLang,
      sourceLang: defaultLocale,
      isFallback: requestedLang !== defaultLocale,
    }
  }

  return {
    entry: undefined,
    requestedLang,
    sourceLang: undefined,
    isFallback: false,
  }
}
```

- [ ] **Step 4: Run the unit test and verify green**

```bash
pnpm tsx --test tests/unit/fallback.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Add localization metadata to content result types**

In `src/types/index.d.ts`, replace the three content aliases with:

```ts
interface ReadingTimeMeta {
  remarkPluginFrontmatter: {
    minutes: number
  }
}

export interface LocalizationMeta {
  requestedLang: Language
  sourceLang: Language
  isFallback: boolean
}

export type RenderedPost = CollectionEntry<'posts'> & ReadingTimeMeta
export type RenderedNote = CollectionEntry<'notes'> & ReadingTimeMeta
export type RenderedJournal = CollectionEntry<'journals'> & ReadingTimeMeta

export type Post = RenderedPost & { localization: LocalizationMeta }
export type Note = RenderedNote & { localization: LocalizationMeta }
export type Journal = RenderedJournal & { localization: LocalizationMeta }
```

In `src/utils/content.ts`, import `RenderedPost`, `RenderedNote`, and `RenderedJournal`. Change the return types of `addMetaToPost`, `addMetaToNote`, and `addMetaToJournal` to those rendered types. The public collection getters continue to return `Post`, `Note`, and `Journal` after adding localization metadata.

- [ ] **Step 6: Apply fallback in the three collection getters**

In `src/utils/content.ts`, import:

```ts
import { resolveLocalizedEntry } from '@/i18n/fallback'
```

Replace the selection body in `_getPosts` with:

```ts
  const selected = groups.flatMap((group) => {
    const resolution = resolveLocalizedEntry(group.byLang, currentLang, defaultLocale)
    return resolution.entry && resolution.sourceLang ? [resolution] : []
  })

  const enhancedPosts = await Promise.all(selected.map(async resolution => ({
    ...(await addMetaToPost(resolution.entry!)),
    localization: {
      requestedLang: resolution.requestedLang,
      sourceLang: resolution.sourceLang!,
      isFallback: resolution.isFallback,
    },
  })))
```

Apply the same resolved-selection shape in `_getNotes` and `_getJournals`, calling `addMetaToNote` and `addMetaToJournal` respectively.

When creating `TimelineEntry` values, add:

```ts
isFallback: entry.localization.isFallback
```

and extend `TimelineEntry` with:

```ts
isFallback: boolean
```

Replace `_getTagSupportedLangs` with:

```ts
async function _getTagSupportedLangs(tag: string): Promise<Language[]> {
  const checks = await Promise.all(allLocales.map(async locale => ({
    locale,
    matches: (await getPosts(locale)).some(post => post.data.tags?.includes(tag)),
  })))
  return checks.filter(check => check.matches).map(check => check.locale)
}
```

Replace `_getCategorySupportedLangs` with:

```ts
async function _getCategorySupportedLangs(category: PostCategory): Promise<Language[]> {
  const checks = await Promise.all(allLocales.map(async locale => ({
    locale,
    matches: (await getPosts(locale)).some(post => getPostCategory(post) === category),
  })))
  return checks.filter(check => check.matches).map(check => check.locale)
}
```

Replace `_getUserCategorySupportedLangs` with:

```ts
async function _getUserCategorySupportedLangs(name: string): Promise<Language[]> {
  const checks = await Promise.all(allLocales.map(async locale => ({
    locale,
    matches: (await getPosts(locale)).some((post) => {
      const categories = Array.isArray(post.data.categories)
        ? post.data.categories
        : [post.data.categories]
      return categories.includes(name)
    }),
  })))
  return checks.filter(check => check.matches).map(check => check.locale)
}
```

- [ ] **Step 7: Generate detail routes for all locales and mark fallback content**

For each of:

- `src/pages/[...lang]/posts/[slug].astro`
- `src/pages/[...lang]/notes/[slug].astro`
- `src/pages/[...lang]/journals/[slug].astro`

Import `defaultLocale` and `resolveLocalizedEntry`. In the post page, replace `getStaticPaths` with:

```ts
export async function getStaticPaths() {
  const groups = await getPostGroups()
  return allLocales.flatMap(lang => groups.map((group) => {
    const resolution = resolveLocalizedEntry(group.byLang, lang, defaultLocale)
    if (!resolution.entry) return null
    return {
      params: { lang: getLangRouteParam(lang), slug: group.slug },
      props: {
        post: resolution.entry,
        supportedLangs: allLocales,
        isFallback: resolution.isFallback,
      },
    }
  }).filter(Boolean))
}
```

In the note page, use:

```ts
export async function getStaticPaths() {
  const groups = await getNoteGroups()
  return allLocales.flatMap(lang => groups.map((group) => {
    const resolution = resolveLocalizedEntry(group.byLang, lang, defaultLocale)
    if (!resolution.entry) return null
    return {
      params: { lang: getLangRouteParam(lang), slug: group.slug },
      props: {
        note: resolution.entry,
        supportedLangs: allLocales,
        isFallback: resolution.isFallback,
      },
    }
  }).filter(Boolean))
}
```

In the journal page, use:

```ts
export async function getStaticPaths() {
  const groups = await getJournalGroups()
  return allLocales.flatMap(lang => groups.map((group) => {
    const resolution = resolveLocalizedEntry(group.byLang, lang, defaultLocale)
    if (!resolution.entry) return null
    return {
      params: { lang: getLangRouteParam(lang), slug: group.slug },
      props: {
        journal: resolution.entry,
        supportedLangs: allLocales,
        isFallback: resolution.isFallback,
      },
    }
  }).filter(Boolean))
}
```

Add `isFallback: boolean` to each Props interface and destructuring assignment. Add `pagefindIgnore={isFallback}` to each existing Layout opening tag without removing its existing metadata props. The post tag becomes:

```astro
<Layout
  postTitle={post.data.title}
  postDescription={description}
  postSlug={post.id}
  supportedLangs={supportedLangs}
  pagefindIgnore={isFallback}
  noindex={isFallback}
  article={{
    type: 'BlogPosting',
    published: post.data.published,
    updated: post.data.updated,
    tags: post.data.tags,
  }}
>
```

The note tag becomes:

```astro
<Layout
  postTitle={note.data.title}
  postDescription={description}
  postSlug={`notes/${note.id}`}
  supportedLangs={supportedLangs}
  pagefindIgnore={isFallback}
  noindex={isFallback}
  article={{
    type: 'Article',
    published: note.data.published,
    updated: note.data.updated,
    tags: note.data.tags,
  }}
>
```

The journal tag becomes:

```astro
<Layout
  postTitle={journal.data.title}
  postDescription={description}
  postSlug={`journals/${journal.id}`}
  supportedLangs={supportedLangs}
  pagefindIgnore={isFallback}
  noindex={isFallback}
  article={{
    type: 'Article',
    published: journal.data.published,
    updated: journal.data.updated,
    tags: journal.data.tags,
  }}
>
```

Mark each article root:

```astro
<article
  class="heti"
  data-content-fallback={isFallback ? defaultLocale : undefined}
  data-pagefind-ignore={isFallback ? 'all' : undefined}
>
```

Keep the metadata values shown above unchanged; the project-specific additions are `pagefindIgnore={isFallback}` and `noindex={isFallback}`.

- [ ] **Step 8: Apply fallback to Layout, About, and list/search surfaces**

In `src/layouts/Layout.astro`, extend Props and destructuring:

```ts
interface Props {
  postTitle?: string
  postDescription?: string
  postSlug?: string
  supportedLangs?: Language[]
  pagefindIgnore?: boolean
  noindex?: boolean
  article?: {
    type: 'Article' | 'BlogPosting'
    published?: Date
    updated?: Date
    tags?: string[]
  }
}

const {
  postTitle,
  postDescription,
  postSlug,
  supportedLangs = [],
  pagefindIgnore = false,
  noindex = false,
  article,
} = Astro.props
```

Pass the flag to Head:

```astro
<Head
  {postTitle}
  {postDescription}
  {postSlug}
  {supportedLangs}
  {article}
  forceNoindex={noindex}
/>
```

Add this attribute to `<body>`:

```astro
data-pagefind-ignore={pagefindIgnore ? 'all' : undefined}
```

In `src/layouts/Head.astro`, add `forceNoindex?: boolean` to Props, destructure it with `false`, and replace the existing noindex assignment and meta condition with:

```ts
const pageNoindex = forceNoindex || shouldNoindex(Astro.url.pathname)
```

```astro
{pageNoindex && <meta name="robots" content="noindex, follow" />}
```

In `src/pages/[...lang]/about.astro`, select content in this order:

```ts
const exactAbout = allAboutEntries.find(entry => entry.data.lang === currentLang)
const defaultAbout = allAboutEntries.find(entry => entry.data.lang === defaultLocale)
const universalAbout = allAboutEntries.find(entry => entry.data.lang === '')
const aboutEntry = exactAbout ?? defaultAbout ?? universalAbout
const isFallback = Boolean(aboutEntry && !exactAbout && currentLang !== defaultLocale)
```

Pass both `pagefindIgnore={isFallback}` and `noindex={isFallback}` to the About `<Layout>`. Wrap rendered About content with:

```astro
<div
  class="heti"
  data-content-fallback={isFallback ? defaultLocale : undefined}
  data-pagefind-ignore={isFallback ? 'all' : undefined}
>
  {Content && <Content />}
</div>
```

In `PostList.astro`, mark each root `<li>`:

```astro
data-pagefind-ignore={post.localization.isFallback ? 'all' : undefined}
data-content-fallback={post.localization.isFallback ? post.localization.sourceLang : undefined}
```

In `NoteList.astro`, use:

```astro
data-pagefind-ignore={note.localization.isFallback ? 'all' : undefined}
data-content-fallback={note.localization.isFallback ? note.localization.sourceLang : undefined}
```

In `JournalList.astro`, use:

```astro
data-pagefind-ignore={journal.localization.isFallback ? 'all' : undefined}
data-content-fallback={journal.localization.isFallback ? journal.localization.sourceLang : undefined}
```

In `timeline.astro`, mark each timeline `<li>`:

```astro
data-pagefind-ignore={entry.isFallback ? 'all' : undefined}
```

- [ ] **Step 9: Verify type safety, content fallback, and build**

```bash
pnpm test:unit
pnpm astro check
pnpm build
```

Expected: unit tests PASS; all three commands exit 0; build output includes default, `/en`, and `/ja` article routes.

- [ ] **Step 10: Commit locale fallback**

```bash
git add src tests/unit/fallback.test.ts
git commit -m "feat: fall back missing translations to Chinese"
```

---

### Task 5: Generate GitHub Pages-compatible legacy redirects

**Files:**
- Create: `scripts/seo/legacy-routes.ts`
- Create: `scripts/seo/generate-static-redirects.ts`
- Create: `tests/unit/static-redirects.test.ts`
- Remove: `scripts/seo/generate-legacy-redirects.ts`, `public/_redirects`
- Modify: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Write the failing redirect-generator test**

Create `tests/unit/static-redirects.test.ts`:

```ts
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { generateStaticRedirects } from '../../scripts/seo/generate-static-redirects'

const base = '/ai-songshu-garden'
const origin = 'https://nuts-and-bytes.github.io'

test('writes a noindex Pagefind-ignored redirect document', () => {
  const output = mkdtempSync(join(tmpdir(), 'songshu-redirects-'))
  generateStaticRedirects(output, [{ from: '/关于我.html', to: '/about' }])

  const html = readFileSync(join(output, '关于我.html'), 'utf8')
  assert.match(html, /data-pagefind-ignore="all"/)
  assert.match(html, /name="robots" content="noindex, follow"/)
  assert.match(html, new RegExp(`${origin}${base}/about`))
  assert.match(html, /location\.replace/)
})

test('writes nested index and root html routes to exact legacy locations', () => {
  const output = mkdtempSync(join(tmpdir(), 'songshu-redirects-'))
  generateStaticRedirects(output, [
    { from: '/博客/index.html', to: '/' },
    {
      from: '/如何用-Claude-Code-搭一个会自动整理的知识库.html',
      to: '/posts/如何用-claude-code-搭一个会自动整理的知识库',
    },
  ])

  assert.match(readFileSync(join(output, '博客/index.html'), 'utf8'), /ai-songshu-garden\//)
  assert.match(
    readFileSync(join(output, '如何用-Claude-Code-搭一个会自动整理的知识库.html'), 'utf8'),
    /ai-songshu-garden\/posts\/如何用-claude-code/,
  )
})

test('rejects paths that escape public output', () => {
  const output = mkdtempSync(join(tmpdir(), 'songshu-redirects-'))
  assert.throws(
    () => generateStaticRedirects(output, [{ from: '/../escape.html', to: '/' }]),
    /Unsafe legacy route/,
  )
})
```

- [ ] **Step 2: Run the test and verify red**

```bash
pnpm tsx --test tests/unit/static-redirects.test.ts
```

Expected: FAIL because the generator module does not exist.

- [ ] **Step 3: Create the explicit route manifest**

Create `scripts/seo/legacy-routes.ts`:

```ts
export interface LegacyRoute {
  from: string
  to: string
}

const article = '/posts/如何用-claude-code-搭一个会自动整理的知识库'

export const legacyRoutes: LegacyRoute[] = [
  { from: '/如何用-Claude-Code-搭一个会自动整理的知识库.html', to: article },
  { from: '/博客/如何用-Claude-Code-搭一个会自动整理的知识库.html', to: article },
  { from: '/博客/index.html', to: '/' },
  { from: '/资源推荐/index.html', to: '/notes' },
  { from: '/关于我.html', to: '/about' },
  { from: '/tags/index.html', to: '/tags' },
]

// Individual legacy tag URLs already match Astro's build.format="file"
// outputs (for example /tags/AI.html), so generating redirects for them
// would collide with the real tag pages.
```

- [ ] **Step 4: Implement the static redirect generator**

Create `scripts/seo/generate-static-redirects.ts`:

```ts
import type { LegacyRoute } from './legacy-routes'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, normalize, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { legacyRoutes } from './legacy-routes'

const SITE_ORIGIN = 'https://nuts-and-bytes.github.io'
const BASE = '/ai-songshu-garden'

function targetPath(to: string): string {
  return to === '/' ? `${BASE}/` : `${BASE}${to}`
}

function outputPath(outputRoot: string, from: string): string {
  const relative = decodeURIComponent(from).replace(/^\/+/, '')
  const normalized = normalize(relative)
  if (!relative || normalized === '..' || normalized.startsWith(`..${sep}`)) {
    throw new Error(`Unsafe legacy route: ${from}`)
  }
  return join(outputRoot, normalized)
}

function redirectDocument(to: string): string {
  const path = targetPath(to)
  const canonical = new URL(path, SITE_ORIGIN).href
  const jsTarget = JSON.stringify(path)
  const escapedPath = path.replaceAll('&', '&amp;').replaceAll('"', '&quot;')

  return `<!doctype html>
<html lang="zh-CN" data-pagefind-ignore="all">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <meta http-equiv="refresh" content="0;url=${escapedPath}">
  <link rel="canonical" href="${canonical}">
  <title>页面已迁移 · nuts &amp; bytes</title>
  <script>location.replace(${jsTarget} + location.search + location.hash)</script>
</head>
<body data-pagefind-ignore="all">
  <p>页面已迁移。<a href="${escapedPath}">继续阅读</a></p>
</body>
</html>
`
}

export function generateStaticRedirects(
  outputRoot: string,
  routes: LegacyRoute[] = legacyRoutes,
): void {
  for (const route of routes) {
    const destination = outputPath(outputRoot, route.from)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, redirectDocument(route.to), 'utf8')
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : ''
if (import.meta.url === invokedPath) {
  const projectRoot = fileURLToPath(new URL('../../', import.meta.url))
  generateStaticRedirects(join(projectRoot, 'public'))
  console.log(`Generated ${legacyRoutes.length} static legacy redirects.`)
}
```

- [ ] **Step 5: Run the redirect tests and verify green**

```bash
pnpm tsx --test tests/unit/static-redirects.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 6: Add redirect generation to the build**

Remove the unused Netlify/Cloudflare redirect surface:

```bash
git rm scripts/seo/generate-legacy-redirects.ts public/_redirects
```

Add to `package.json` scripts:

```json
"generate-static-redirects": "tsx scripts/seo/generate-static-redirects.ts",
"build": "pnpm generate-static-redirects && astro check && astro build && pnpm apply-lqip"
```

Remove the `generate-legacy-redirects` script entry. Append generated outputs to `.gitignore`:

```gitignore
/public/如何用-Claude-Code-搭一个会自动整理的知识库.html
/public/关于我.html
/public/博客/
/public/资源推荐/
/public/tags/index.html
```

- [ ] **Step 7: Generate, build, and inspect exact output locations**

```bash
pnpm generate-static-redirects
pnpm build
test -f 'dist/关于我.html'
test -f 'dist/博客/index.html'
test -f 'dist/资源推荐/index.html'
test -f 'dist/tags/AI.html'
rg -n 'noindex, follow|data-pagefind-ignore="all"' 'dist/关于我.html'
```

Expected: all files exist and the redirect document contains both exclusion markers.

- [ ] **Step 8: Commit the redirect bridge**

```bash
git add -A scripts/seo public/_redirects tests/unit/static-redirects.test.ts package.json .gitignore
git commit -m "feat: preserve legacy GitHub Pages routes"
```

---

### Task 6: Replace upstream demo tests with project browser acceptance tests

**Files:**
- Remove: `tests/migration.spec.ts`
- Create: `tests/site.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `src/components/SearchModal.astro`, `src/pages/[...lang]/search.astro`, `src/components/Footer.astro`
- Create: `tests/site.spec.ts-snapshots/**` after approved screenshot generation

- [ ] **Step 1: Remove target-owner demo assertions**

```bash
git rm tests/migration.spec.ts
```

This removes assertions for `Life Odyssey`, `zhenjia.dev`, and unavailable demo posts.

- [ ] **Step 2: Write the project-specific Playwright suite**

Create `tests/site.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

const base = '/ai-songshu-garden'
const slug = '如何用-claude-code-搭一个会自动整理的知识库'
const article = `${base}/posts/${slug}`

const navLabels = ['文章', '笔记', '日记', '分类', '标签', '时间线', '关于']

test('renders approved brand and complete navigation', async ({ page }) => {
  await page.goto(`${base}/`)
  await expect(page).toHaveTitle(/nuts & bytes - 静水流深/)
  await expect(page.locator('#site-title-link')).toHaveText('nuts & bytes')
  await expect(page.getByText('静水流深', { exact: true })).toBeVisible()
  const nav = page.locator('nav[aria-label="Site Navigation"]')
  await expect(nav.locator('a')).toHaveCount(7)
  expect(await nav.locator('a').allTextContents()).toEqual(navLabels)
  await expect(page.locator('a[href*="/posts/"]')).toHaveCount(1)
  await expect(page.locator('footer a[name="RSS"]')).toHaveAttribute(
    'href',
    '/ai-songshu-garden/atom.xml',
  )
})

test('renders the canonical article and article interactions', async ({ page }) => {
  await page.goto(article)
  await expect(page.locator('h1.post-title')).toContainText('如何用 Claude Code')
  await expect(page.locator('#post-date')).toContainText('2026-06-03')
  await expect(page.locator('#toc-container')).toBeVisible()
  await expect(page.locator('pre code').first()).toBeVisible()
  await expect(page.locator('#back-button')).toBeVisible()
})

test('cycles locale routes in the approved zh → en → ja order', async ({ page }) => {
  const cases = [
    [`${base}/`, `${base}/en`],
    [`${base}/en`, `${base}/ja`],
    [`${base}/ja`, `${base}/`],
  ]
  for (const [path, next] of cases) {
    await page.goto(path)
    await expect(page.locator('#language-switcher')).toHaveAttribute('href', next)
  }
})

test('falls English and Japanese article routes back to Chinese', async ({ page }) => {
  for (const locale of ['en', 'ja']) {
    await page.goto(`${base}/${locale}/posts/${slug}`)
    await expect(page.locator('html')).toHaveAttribute('lang', new RegExp(locale))
    await expect(page.locator('article')).toHaveAttribute('data-content-fallback', 'zh')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await expect(page.locator('h1.post-title')).toContainText('如何用 Claude Code')
  }
})

test('copies code, zooms images, and returns through article history', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(`${base}/`)
  await page.locator('a[href*="/posts/"]').click()
  await expect(page).toHaveURL(new RegExp(`/posts/${slug}$`))

  const firstCode = page.locator('pre code').first()
  const expectedCode = await firstCode.textContent()
  await firstCode.locator('xpath=..').locator('.code-copy-button').click()
  await expect(firstCode.locator('xpath=..').locator('.code-copy-button')).toHaveClass(/copied/)
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expectedCode)

  await page.evaluate(() => {
    const image = new Image(240, 240)
    image.id = 'zoom-fixture'
    image.alt = 'zoom interaction fixture'
    image.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="gold"/></svg>'
    document.querySelector('#post-content')?.append(image)
  })
  const fixture = page.locator('#zoom-fixture')
  await expect(fixture).toBeVisible()
  await fixture.click()
  await expect(page.locator('.zoom-overlay')).toBeVisible()
  await expect(page.locator('.zoom-img')).toBeVisible()
  await page.locator('.zoom-overlay').click({ position: { x: 4, y: 4 } })
  await expect(page.locator('.zoom-img')).toHaveCount(0)

  await page.locator('#back-button').click()
  await expect(page).toHaveURL(new RegExp(`${base}/$`))
})

test('keeps notes and journals as intentional empty states', async ({ page }) => {
  await page.goto(`${base}/notes`)
  await expect(page.getByText('还没有笔记。')).toBeVisible()
  await page.goto(`${base}/journals`)
  await expect(page.getByText('还没有日记。')).toBeVisible()
})

test('provides a themed 404 with a working home route', async ({ page }) => {
  await page.goto(`${base}/404`)
  await expect(page.getByText('PAGE', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/ai-songshu-garden/')
})

test('shows every approved About contact', async ({ page }) => {
  await page.goto(`${base}/about`)
  const about = page.locator('.heti')
  await expect(about.locator('a[href="https://nuts-and-bytes.github.io/portfolio/"]')).toBeVisible()
  await expect(about.locator('a[href="https://github.com/nuts-and-bytes"]')).toBeVisible()
  await expect(about.locator('a[href="mailto:zxy200204@126.com"]')).toBeVisible()
  await expect(about.locator('a[href="mailto:zhuxinyao99@gmail.com"]')).toBeVisible()
  await expect(about.locator('a[href="https://t.me/ericlibro"]')).toBeVisible()
})

test('opens and closes Pagefind search with keyboard', async ({ page }) => {
  await page.goto(`${base}/`)
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K')
  const dialog = page.locator('#search-modal')
  await expect(dialog).toHaveAttribute('open', '')
  await expect(dialog.locator('input')).toBeFocused()
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K')
  await expect(dialog).not.toHaveAttribute('open', '')

  await page.goto(`${base}/search`)
  await expect(page.locator('#search .pagefind-ui__search-input')).toBeVisible()
})

test('persists dark theme and exposes 44px control hit areas', async ({ page }) => {
  await page.goto(`${base}/`)
  const themeButton = page.locator('#theme-toggle-button')
  const box = await themeButton.boundingBox()
  expect(box).not.toBeNull()
  const hitArea = await themeButton.evaluate((element) => {
    const before = getComputedStyle(element, '::before')
    return {
      width: Number.parseFloat(before.width),
      height: Number.parseFloat(before.height),
    }
  })
  expect(hitArea.width).toBeGreaterThanOrEqual(44)
  expect(hitArea.height).toBeGreaterThanOrEqual(44)
  await themeButton.click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('plays theme tap sound on desktop and stays silent on mobile', async ({ page }) => {
  const desktopRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/sounds/')) desktopRequests.push(request.url())
  })
  await page.goto(`${base}/`)
  await page.waitForTimeout(800)
  await page.locator('#theme-toggle-button').click()
  await expect.poll(() => desktopRequests.some(url => /tap_0[1-5]\.wav/.test(url))).toBe(true)

  await page.setViewportSize({ width: 390, height: 844 })
  const mobilePage = await page.context().newPage()
  await mobilePage.setViewportSize({ width: 390, height: 844 })
  const mobileRequests: string[] = []
  mobilePage.on('request', (request) => {
    if (request.url().includes('/sounds/')) mobileRequests.push(request.url())
  })
  await mobilePage.goto(`${base}/`)
  await mobilePage.waitForTimeout(800)
  await mobilePage.locator('#theme-toggle-button').click()
  expect(mobileRequests).toEqual([])
  await mobilePage.close()
})

test('honors reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${base}/`)
  await expect(page.locator('html')).toHaveClass(/reduce-motion/)
  await page.locator('#theme-toggle-button').click()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('serves fonts, feeds, search data and SEO artifacts under the base path', async ({ page, request }) => {
  for (const path of [
    '/fonts/Snell-Black-SF.woff2',
    '/sounds/tap_01.wav',
    '/rss.xml',
    '/atom.xml',
    '/sitemap-index.xml',
    '/llms.txt',
    '/og/site.png',
  ]) {
    const response = await request.get(`${base}${path}`)
    expect(response.status(), path).toBe(200)
  }
  await page.goto(`${base}/`)
  expect(await page.evaluate(() => document.fonts.check('16px "Snell-Black"'))).toBe(true)
})

test('redirects every representative legacy route to its canonical page', async ({ page }) => {
  const cases = [
    [`${base}/关于我.html`, `${base}/about`],
    [`${base}/博客/index.html`, `${base}/`],
    [`${base}/资源推荐/index.html`, `${base}/notes`],
    [`${base}/博客/如何用-Claude-Code-搭一个会自动整理的知识库.html`, article],
  ]
  for (const [from, to] of cases) {
    await page.goto(from)
    await page.waitForURL(url => decodeURI(url.pathname) === to)
  }
})

test('keeps legacy tag html URLs as real canonical tag pages', async ({ page }) => {
  const response = await page.goto(`${base}/tags/AI.html`)
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/AI/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://nuts-and-bytes.github.io/ai-songshu-garden/tags/AI',
  )
})

test('has no horizontal overflow on desktop, tablet, or mobile', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(`${base}/`)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  }
})

test('matches approved desktop and mobile baselines', async ({ page }) => {
  test.skip(!!process.env.CI, 'Local visual baseline uses macOS system font metrics')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(`${base}/`)
  await expect(page).toHaveScreenshot('home-desktop.png', { fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${base}/`)
  await expect(page).toHaveScreenshot('home-mobile.png', { fullPage: true })
})
```

- [ ] **Step 3: Configure desktop, tablet, and mobile projects**

Replace `playwright.config.ts` with:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm preview --host 127.0.0.1',
    url: 'http://127.0.0.1:4321/ai-songshu-garden/',
    reuseExistingServer: !process.env.CI,
  },
})
```

The suite changes viewport sizes inside tests, so one Chromium project is sufficient and avoids tripling sound/redirect coverage.

- [ ] **Step 4: Build and run tests to identify real integration failures**

```bash
pnpm build
pnpm test:e2e --grep-invert 'matches approved desktop and mobile baselines'
```

Expected before fixes: failures are allowed only where project adaptation is incomplete. Do not weaken assertions; fix base-path, selector, fallback, focus, or route behavior at its source.

- [ ] **Step 5: Implement the approved 404 return path**

Replace `src/pages/404.astro` with:

```astro
---
import Layout from '@/layouts/Layout.astro'
import { getLocalizedPath } from '@/i18n/path'

const home = getLocalizedPath('/')
---

<Layout>
  <div class="uno-decorative-line" />
  <h3 class="mt--1.3 flex flex-col text-8 c-primary font-bold leading-1.2em font-navbar lg:text-9">
    <span>PAGE</span>
    <span>NOT</span>
    <span>FOUND</span>
  </h3>
  <p class="mt-3.6 flex flex-col text-3.6 leading-1.4em font-navbar lg:(mt-4 text-4)">
    <span>页面不存在，或者已经移动。</span>
  </p>
  <p class="mt-6 font-navbar">
    <a class="relative highlight-hover after:bottom-0.35em" href={home}>返回首页</a>
  </p>
</Layout>
```

Run the single test:

```bash
pnpm test:e2e --grep 'themed 404'
```

Expected: PASS.

- [ ] **Step 6: Fix Pagefind and RSS assets for the GitHub Pages base path, then address remaining failures**

The search acceptance test exposes the upstream root-path assumption. In both `src/components/SearchModal.astro` and `src/pages/[...lang]/search.astro`, add:

```ts
import { base } from '@/config'
```

Replace each file's Pagefind asset tags with:

```astro
<link href={`${base}/pagefind/pagefind-ui.css`} rel="stylesheet" />
<script is:inline src={`${base}/pagefind/pagefind-ui.js`} type="text/javascript"></script>
```

In `src/components/Footer.astro`, replace the RSS branch's production-only string slicing with:

```ts
if (isRSS) {
  return {
    name,
    href: getLocalizedPath(url, currentLang),
    target: '_blank',
    rel: 'noopener noreferrer',
  }
}
```

Run:

```bash
pnpm build
pnpm test:e2e --grep 'Pagefind search|complete navigation'
```

Expected: PASS, and the footer link ends in `atom.xml`, never `atom.xm`. For other remaining failures, permitted files are limited to:

```text
integration.ts
src/i18n/fallback.ts
src/utils/content.ts
src/pages/[...lang]/**
src/pages/404.astro
src/pages/[...lang]/search.astro
src/components/SearchModal.astro
src/components/Footer.astro
src/components/Widgets/SoundEffect.astro
scripts/seo/**
retypeset.config.yaml
```

Do not redesign or retime upstream CSS. For each failure, run its single Playwright test, confirm red, make one targeted fix, then rerun that test.

- [ ] **Step 7: Generate and inspect screenshot baselines**

```bash
pnpm test:e2e --grep 'matches approved desktop and mobile baselines' --update-snapshots
```

Open both generated PNGs and compare them with the approved companion mockup and `zhenjia.dev`:

```text
home-desktop.png: left content column, fixed right rail, paper background, yellow active mark
home-mobile.png: title → subtitle → nav → content, no horizontal clipping
```

If either screenshot differs in structure, fix the source and regenerate once. Do not use screenshot thresholds to hide differences.

- [ ] **Step 8: Run the full browser suite**

```bash
pnpm test:e2e
```

Expected: all tests PASS with zero retries locally.

- [ ] **Step 9: Commit browser acceptance coverage**

```bash
git add tests playwright.config.ts src integration.ts scripts retypeset.config.yaml
git commit -m "test: cover Retypeset migration interactions"
```

---

### Task 7: Verify build artifacts, provenance, and operator documentation

**Files:**
- Create: `tests/artifacts/dist-artifacts.test.ts`
- Create: `THEME_UPSTREAM.md`
- Replace: `README.md`
- Modify: `package.json`, `.github/workflows/deploy.yml`, `tests/unit/site-config.test.ts`

- [ ] **Step 1: Write the build-artifact test**

Create `tests/artifacts/dist-artifacts.test.ts`:

```ts
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const requiredFiles = [
  'dist/index.html',
  'dist/about.html',
  'dist/notes.html',
  'dist/journals.html',
  'dist/tags.html',
  'dist/categories.html',
  'dist/timeline.html',
  'dist/rss.xml',
  'dist/atom.xml',
  'dist/sitemap-index.xml',
  'dist/llms.txt',
  'dist/llms-full.txt',
  'dist/og/site.png',
  'dist/关于我.html',
  'dist/博客/index.html',
]

test('production build contains every required surface', () => {
  for (const path of requiredFiles) {
    assert.ok(existsSync(path), `missing ${path}`)
  }
})

test('homepage assets and canonical URL include the GitHub Pages base', () => {
  const html = readFileSync('dist/index.html', 'utf8')
  assert.match(html, /https:\/\/nuts-and-bytes\.github\.io\/ai-songshu-garden\//)
  assert.match(html, /\/ai-songshu-garden\/_astro\//)
  assert.doesNotMatch(html, /href=["']?\/pagefind\//)
  assert.doesNotMatch(html, /atom\.xm(?:["' >])/)
  assert.doesNotMatch(html, /Life Odyssey|zhenjia\.dev|quartz/)
})

test('fallback article copies are excluded from Pagefind', () => {
  const html = readFileSync(
    'dist/en/posts/如何用-claude-code-搭一个会自动整理的知识库.html',
    'utf8',
  )
  assert.match(html, /data-content-fallback=["']?zh/)
  assert.match(html, /data-pagefind-ignore=["']?all/)
  assert.match(html, /<meta(?=[^>]*name=["']?robots)(?=[^>]*content="noindex, follow")[^>]*>/)
})
```

- [ ] **Step 2: Run against an absent/stale build and verify red when appropriate**

```bash
rm -rf dist
pnpm tsx --test tests/artifacts/dist-artifacts.test.ts
```

Expected: FAIL with missing `dist/index.html`.

- [ ] **Step 3: Build and verify green artifact tests**

```bash
pnpm build
pnpm tsx --test tests/artifacts/dist-artifacts.test.ts
```

Expected: all artifact tests PASS, including the exact fallback output `dist/en/posts/如何用-claude-code-搭一个会自动整理的知识库.html`.

- [ ] **Step 4: Wire artifact verification after the production build**

Add these package script values:

```json
"test": "pnpm test:unit && pnpm build && pnpm test:artifacts && pnpm test:e2e",
"test:artifacts": "tsx --test tests/artifacts/*.test.ts"
```

In `.github/workflows/deploy.yml`, add these steps immediately after `pnpm build` and before artifact upload:

```yaml
      - run: pnpm test:artifacts
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```

Add these assertions to `tests/unit/site-config.test.ts` inside the deployment test:

```ts
assert.match(workflow, /pnpm test:artifacts/)
assert.match(workflow, /playwright install --with-deps chromium/)
assert.match(workflow, /pnpm test:e2e/)
```

Run:

```bash
pnpm test:unit
pnpm test:artifacts
```

Expected: both commands PASS because `dist/` was produced in Step 3.

- [ ] **Step 5: Document upstream provenance**

Create `THEME_UPSTREAM.md`:

```markdown
# Theme provenance

This repository vendors Retypeset Odyssey under the MIT License.

- Upstream: https://github.com/lifeodyssey/retypeset-odyssey
- Imported tag: `v0.1.20`
- Imported commit: `20d41050d5cfdfef04cc81875b544aa566fea978`
- Original base theme: https://github.com/radishzzz/astro-theme-retypeset

The local site identity, content, contacts, GitHub Pages base-path integration,
Chinese fallback behavior, and static legacy redirects are project-specific.
The upstream `LICENSE` file remains in the repository.
```

- [ ] **Step 6: Replace README with project operations**

Replace `README.md`:

~~~~markdown
# nuts & bytes

`nuts & bytes` is a personal blog about learning, building, and using AI tools.
It runs on Astro and a source-vendored Retypeset Odyssey theme.

## Local development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The production base path is `/ai-songshu-garden`.

## Verification

```bash
pnpm test:unit
pnpm build
pnpm test:artifacts
pnpm test:e2e
```

## Content

- Posts: `content/posts/`
- Notes: `content/notes/`
- Journals: `content/journals/`
- About: `content/about/`

Chinese is the source language. English and Japanese routes fall back to the
Chinese entry when a translation file is absent.

## Deployment

Pushes to `main` deploy `dist/` to:

https://nuts-and-bytes.github.io/ai-songshu-garden/

## Theme license

Retypeset Odyssey and Astro Theme Retypeset are used under the MIT License.
See `THEME_UPSTREAM.md` and `LICENSE`.
~~~~

- [ ] **Step 7: Run all non-browser verification**

```bash
pnpm test:unit
pnpm check
pnpm build
pnpm test:artifacts
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit documentation and artifact coverage**

```bash
git add README.md THEME_UPSTREAM.md tests/artifacts/dist-artifacts.test.ts \
  package.json .github/workflows/deploy.yml tests/unit/site-config.test.ts
git commit -m "docs: document Retypeset migration operations"
```

---

### Task 8: Final visual QA, mechanical audit, review, and branch handoff

**Files:**
- Inspect: all changed files
- Modify only if a verified defect is found

- [ ] **Step 1: Run the complete automated verification from a clean build**

```bash
rm -rf dist .astro playwright-report test-results
pnpm test:unit
pnpm check
pnpm build
pnpm test:artifacts
pnpm test:e2e
git diff --check
```

Expected: every command exits 0; Playwright reports zero failures.

- [ ] **Step 2: Run the one required Impeccable detector pass**

```bash
node /Users/ericlu/.pi/skills/impeccable/scripts/detect.mjs --json \
  src retypeset.config.yaml content/about content/posts public/icons
```

Review every finding. Fix only genuine defects or project-specific regressions; do not rewrite upstream theme signatures merely to satisfy generic design heuristics. Rerun the relevant automated test after each accepted fix. Do not run the detector a second time.

- [ ] **Step 3: Perform one bounded browser comparison pass**

Use the `ego-browser` skill with one reusable task space. Open:

```text
http://127.0.0.1:4321/ai-songshu-garden/
https://zhenjia.dev/
```

Inspect together at 1440×1000 and 390×844:

- title/subtitle typography;
- left content and fixed right rail;
- yellow hover marker;
- theme reveal direction and duration;
- search dialog and keyboard focus;
- article transition, TOC, code copy, image zoom;
- desktop sound and mobile silence;
- dark mode and reduced motion;
- no horizontal overflow.

Capture desktop and mobile screenshots in the browser task space. Make one batched correction if defects are visible, then perform at most one confirmation pass. Complete the browser task space with `{ keep: false }`.

- [ ] **Step 4: Re-run verification after any QA correction**

```bash
pnpm test:unit
pnpm check
pnpm build
pnpm test:artifacts
pnpm test:e2e
git diff --check
```

Expected: all commands exit 0 after the final source state.

- [ ] **Step 5: Confirm the final diff contains no Quartz runtime**

```bash
! git ls-files | rg '^(quartz/|quartz\.config\.ts$|quartz\.layout\.ts$|package-lock\.json$)'
! rg -n 'GoatCounter|GithubCTA|ReadCount|Component\.Graph' src content retypeset.config.yaml package.json
rg -n 'Powered by.*Astro|Retypeset' src/components/Footer.astro
rg -n 'nuts & bytes|静水流深|/ai-songshu-garden' retypeset.config.yaml
```

Expected: the first two negative checks exit 0; attribution and brand checks return matching lines.

- [ ] **Step 6: Request code review**

Invoke `superpowers:requesting-code-review`. Review against:

```text
docs/superpowers/specs/2026-08-25-retypeset-odyssey-migration-design.md
```

Resolve Blocker and Important findings with targeted red-green verification. Record non-blocking follow-ups separately rather than expanding this migration.

- [ ] **Step 7: Verify branch status and commit any final accepted fix**

```bash
git status --short
git log --oneline --decorate -8
```

If QA or review produced tracked changes:

```bash
git add -A src integration.ts scripts tests retypeset.config.yaml README.md \
  THEME_UPSTREAM.md public/icons content .github package.json pnpm-lock.yaml
git commit -m "fix: resolve Retypeset migration review findings"
```

Then rerun Step 4.

- [ ] **Step 8: Finish the development branch**

Invoke `superpowers:finishing-a-development-branch`. Present merge, pull-request, or cleanup options only after the complete verification output is green.
