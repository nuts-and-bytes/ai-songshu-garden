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

test('fallback article copies are excluded from Pagefind and search engines', () => {
  const html = readFileSync(
    'dist/en/posts/如何用-claude-code-搭一个会自动整理的知识库.html',
    'utf8',
  )
  assert.match(html, /data-content-fallback=["']?zh/)
  assert.match(html, /data-pagefind-ignore=["']?all/)
  assert.match(html, /<meta(?=[^>]*name=["']?robots)(?=[^>]*content="noindex, follow")[^>]*>/)
})
