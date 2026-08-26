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
