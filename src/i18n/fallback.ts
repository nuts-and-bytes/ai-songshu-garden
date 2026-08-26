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
