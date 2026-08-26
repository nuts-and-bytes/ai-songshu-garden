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
