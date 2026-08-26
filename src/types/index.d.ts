import type { CollectionEntry } from 'astro:content'
import type { Language } from '@/i18n/config'

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

// The runtime shape is now derived from the Zod schema in config-schema.ts.
// The interface below is kept for editor tooling / docs and is structurally
// compatible with the inferred type.
export interface ThemeConfig {
  site: {
    title: string
    // Either a single subtitle for all languages, or a per-language map.
    subtitle: string | Partial<Record<Language, string>>
    description: string
    i18nTitle: boolean
    author: string
    url: string
    base: string
    favicon: string
  }
  color: {
    mode: 'light' | 'dark' | 'auto'
    light: {
      primary: string
      secondary: string
      background: string
      highlight: string
    }
    dark: {
      primary: string
      secondary: string
      background: string
      highlight: string
    }
  }
  global: {
    locale: Language
    moreLocales: Language[]
    fontStyle: 'sans' | 'serif'
    dateFormat: 'YYYY-MM-DD' | 'MM-DD-YYYY' | 'DD-MM-YYYY' | 'MMM D YYYY' | 'D MMM YYYY'
    toc: boolean
    katex: boolean
    reduceMotion: boolean
  }
  comment: {
    enabled: boolean
    giscus?: {
      repo?: string
      repoId?: string
      category?: string
      categoryId?: string
      mapping?: 'pathname' | 'url' | 'title' | 'og:title'
      strict?: '0' | '1'
      reactionsEnabled?: '0' | '1'
      emitMetadata?: '0' | '1'
      inputPosition?: 'top' | 'bottom'
    }
    twikoo?: {
      envId?: string
    }
    waline?: {
      serverURL?: string
      emoji?: string[]
      search?: boolean
      imageUploader?: boolean
    }
  }
  seo?: {
    twitterID?: string
    verification?: {
      google?: string
      bing?: string
      yandex?: string
      baidu?: string
    }
    googleAnalyticsID?: string
    umamiAnalyticsID?: string
    cloudflareAnalyticsToken?: string
    follow?: {
      feedID?: string
      userID?: string
    }
    apiflashKey?: string
    person?: {
      jobTitle?: string
      email?: string
      sameAs?: string[]
    }
    llms?: {
      featured?: string[]
    }
  }
  footer: {
    links: {
      name: string
      url: string
    }[]
    startYear: number
  }
  preload?: {
    imageHostURL?: string
    customGoogleAnalyticsJS?: string
    customUmamiAnalyticsJS?: string
  }
  collections?: Record<string, {
    enabled?: boolean
    intro?: Partial<Record<Language, string>>
    [key: string]: unknown
  }>
  poems?: Partial<Record<Language, Array<{
    id: string
    title: string
    author: string
    lines: string[]
  }>>>
}
