---
title: GitHub 笔记发布流程
description: 从本地 Markdown 到 GitHub 和 Cloudflare 的安全发布步骤。
publishDate: "2026-07-15T10:00:00+08:00"
---

新的公开笔记放入 `content/notes/`，完整文章放入 `content/posts/`。

发布前依次完成：

1. 确认内容可以公开，不包含账号信息、密钥、私人地址或未授权材料。
2. 运行内容安全检查、类型检查和生产构建。
3. 在桌面和手机视口检查排版、链接与全文搜索。
4. 推送到 GitHub，由 Cloudflare 构建并发布。

其他仓库中的笔记只有在明确指定目录后才会同步，默认不会自动公开。
