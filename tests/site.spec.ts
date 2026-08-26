import { expect, test } from '@playwright/test'

const base = '/ai-songshu-garden'
const slug = '如何用-claude-code-搭一个会自动整理的知识库'
const article = `${base}/posts/${slug}`

const navLabels = ['文章', '笔记', '日记', '分类', '标签', '时间线', '关于']

test('renders approved brand and complete navigation', async ({ page, request }) => {
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

  for (const href of await nav.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')!))) {
    const response = await request.get(href)
    expect(response.status(), href).toBe(200)
  }
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
  await expect.poll(() => decodeURI(new URL(page.url()).pathname)).toBe(article)

  const firstCode = page.locator('pre code').first()
  const expectedCode = await firstCode.textContent()
  const codeBlock = firstCode.locator('xpath=../..')
  await codeBlock.locator('.code-copy-button').click()
  await expect(codeBlock.locator('.code-copy-button')).toHaveClass(/copied/)
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

test('opens Pagefind search from modal and dedicated route', async ({ page }) => {
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
  await page.waitForFunction(() => document.fonts.status === 'loaded')
  expect(await page.evaluate(() => document.fonts.check('16px "Snell-Black"'))).toBe(true)
})

test('redirects every representative legacy route to its canonical page', async ({ page }) => {
  const cases = [
    [`${base}/如何用-Claude-Code-搭一个会自动整理的知识库.html`, article],
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
  await expect(page.locator('a[href*="/posts/"]')).toHaveCount(1)
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
