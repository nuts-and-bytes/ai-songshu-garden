---
type: concept
---

分布式版本控制系统，由 Linus Torvalds 于 2005 年创建，是现代软件开发的基础设施。

## 核心概念

- **Commit**：项目状态快照，版本控制基本单位，形成可回溯的历史链路
- **Branch**：独立开发线，避免多人开发相互干扰；默认主干为 `main` 或 `master`
- **Merge**：将功能分支合入主干；同一文件同一行冲突时产生 Merge Conflict
- **Work Tree**：允许在同一仓库中并行检出多个分支，实现多任务开发
- **Detached HEAD**：checkout 到 commit ID（而非分支名）时的危险状态，此时提交易丢失

## 常用恢复操作

| 场景 | 命令 |
|------|------|
| 放弃本地未提交改动 | `discard` / `git restore` |
| 回退到历史版本 | `reset` |
| 撤销已推送的 commit | `revert`（生成反向提交） |
| 拣选特定 commit | `cherry pick` |

## AI 时代用法

配合 Cursor、Claude Code 等 AI 工具，无需记忆命令，自然语言描述意图即可执行版本控制操作。

## 相关笔记

- [[GitHub]] — 基于 Git 的远端代码托管平台
- [[2026-05-19-video-git-github-ai-era]]
