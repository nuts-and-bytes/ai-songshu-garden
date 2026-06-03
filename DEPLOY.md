# AI 与一只松鼠 · 数字花园 —— 部署说明

这是一个 Quartz v4 站点。内容是 Markdown，改完重新构建即可。

## 一、最快上线（零基础推荐：拖拽部署）

1. 解压本项目，进入文件夹，命令行运行：
   ```
   npm install
   npx quartz build
   ```
   会生成一个 `public/` 文件夹（就是网站本体）。
2. 打开 https://app.netlify.com/drop ，把 `public/` 整个文件夹拖进去。
3. 几秒后就有一个公开网址了（可在 Netlify 改成自定义域名）。

> 想换域名 / 长期维护，建议走下面的 GitHub 方式。

## 二、长期方式（GitHub + 自动部署）

1. 把本项目推到一个 GitHub 仓库。
2. 按 Quartz 官方指引启用 GitHub Pages 自动构建：
   https://quartz.jzhao.xyz/hosting
3. 之后每次 `git push`，网站自动更新。

## 三、日常怎么更新内容

- 所有公开内容都在 `content/` 文件夹里，就是普通 Markdown。
- 新增一篇：在 `content/` 里放一个 `.md` 文件即可。
- 用 `[[双链]]` 互相链接，会自动出现在关系图谱里。
- 改完跑 `npx quartz build` 重新生成，或本地预览：`npx quartz build --serve` 然后打开 http://localhost:8080

## 四、改站点设置

- 站点名、配色、字体在 `quartz.config.ts`。
- 配色已设成你的 indigo 主题；`baseUrl` 记得改成你的真实域名。

## 已发布的内容（你可自行增删）

- 首页、关于这个花园、《如何用 Claude Code 搭一个会自动整理的知识库》
- Wiki 概念卡 13 张（技术 + 公共知识）
- 技术笔记 2 篇

> ⚠️ 隐私：我只挑了明显可公开的内容。你的 #personal 个人反思、个人播客准备等都没有放进来。要再公开哪些，把对应 .md 放进 content/ 即可。
