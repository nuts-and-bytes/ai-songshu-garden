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
