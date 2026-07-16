---
title: Cloudflare Pages 发布检查清单
description: 从本地构建到 pages.dev 上线前，值得固定下来的检查项与常见失败点。
publishDate: 2026-07-16
category: 工程实践
series: cloudflare-deploy
seriesOrder: 1
tags:
  - cloudflare
  - 部署
  - 建站
---

把静态站发布到 Cloudflare Pages 时，流程本身不复杂，但失败往往卡在同一批细节上。这份清单用来减少「构建绿了、线上却不对」的情况。

## 发布前

1. **内容边界**：只提交可公开的 Markdown 与资源；不要带 `.env`、token、私钥。
2. **本地构建**：`pnpm test`、`pnpm check:content`、`pnpm check`、`pnpm build` 全部通过。
3. **输出目录**：确认 `dist/` 含 `index.html`、`404.html`、Pagefind 索引与 sitemap。
4. **预览**：本地 `pnpm preview` 抽查首页、文章、搜索、深浅主题。

## 配置侧

| 项 | 建议 |
|----|------|
| 构建命令 | `pnpm build` |
| 输出目录 | `dist` |
| Node 版本 | 与本地 / `.nvmrc` 一致 |
| 生产分支 | 默认主分支 |

## 上线后

- HTTPS 与主路径可访问
- `/rss.xml`、sitemap 返回正常
- 搜索能命中中文标题与正文
- 手机与桌面首屏无横向滚动

固定检查清单比每次临时回想更可靠；有新的失败模式时，把条目补进这页即可。
