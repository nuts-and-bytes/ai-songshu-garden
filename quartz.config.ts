import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: "AI 与一只松鼠",
    pageTitleSuffix: " · 数字花园",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "zh-CN",
    baseUrl: "aisongshu.example.com",
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
          light: "#f2f4f5", lightgray: "#e5ebef", gray: "#9fb0c8", darkgray: "#5f6d78",
          dark: "#0a1f3d", secondary: "#315d93", tertiary: "#6aa6e8",
          highlight: "rgba(49, 93, 147, 0.12)", textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#10151f", lightgray: "#283143", gray: "#5f6d78", darkgray: "#aebbd0",
          dark: "#e8eef6", secondary: "#6aa6e8", tertiary: "#4fd1a5",
          highlight: "rgba(106, 166, 232, 0.12)", textHighlight: "#b3aa0288",
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
