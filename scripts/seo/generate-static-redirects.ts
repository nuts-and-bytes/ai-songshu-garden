import type { LegacyRoute } from './legacy-routes'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, normalize, sep } from 'node:path'
import process from 'node:process'
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
