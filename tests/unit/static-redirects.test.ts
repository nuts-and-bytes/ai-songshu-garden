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
