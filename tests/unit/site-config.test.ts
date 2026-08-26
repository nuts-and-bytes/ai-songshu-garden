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
