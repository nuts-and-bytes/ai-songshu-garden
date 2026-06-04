import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: "nuts & bytes",
    pageTitleSuffix: " · nuts & bytes",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "goatcounter",
      websiteId: "nuts-and-bytes",
    },
    locale: "zh-CN",
    baseUrl: "nuts-and-bytes.github.io/ai-songshu-garden",
    ignorePatterns: ["private", "templates", ".obsidian", ".claude", ".claudian", "个人播客准备"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Noto Serif SC",
        body: "Noto Sans SC",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#fafaf8",
          lightgray: "#f0ece4",
          gray: "#c0b8a8",
          darkgray: "#555550",
          dark: "#1a1a18",
          secondary: "#1a1a18",
          tertiary: "#888880",
          highlight: "rgba(26,26,24,0.06)",
          textHighlight: "#f0e8d088",
        },
        darkMode: {
          light: "#0f0e0c",
          lightgray: "#1e1d1a",
          gray: "#3a3830",
          darkgray: "#888880",
          dark: "#e8e4dc",
          secondary: "#e8e4dc",
          tertiary: "#666660",
          highlight: "rgba(232,228,220,0.06)",
          textHighlight: "#4a3a2088",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({ priority: ["frontmatter", "git", "filesystem"] }),
      Plugin.SyntaxHighlighting({ theme: { light: "github-light", dark: "github-dark" }, keepBackground: false }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({ enableSiteMap: true, enableRSS: true }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
