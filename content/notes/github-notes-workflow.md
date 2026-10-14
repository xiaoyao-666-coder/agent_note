---
title: GitHub 笔记发布流程
description: 从本地 Markdown 到 GitHub 和 Cloudflare 的安全发布步骤。
publishDate: "2026-07-15T10:00:00+08:00"
updatedDate: 2026-10-14
category: 建站
tags:
  - github
  - 发布流程
---

课程/读书笔记、工具速查和操作清单放入 `content/notes/`；知识库介绍、有完整论述的方法总结和项目复盘放入 `content/posts/`。笔记不限篇幅，长篇可以设置系列和阅读顺序。

发布前依次完成：

1. 确认内容可以公开，不包含账号信息、密钥、私人地址或未授权材料。
2. 运行内容安全检查、类型检查和生产构建。
3. 在桌面和手机视口检查排版、链接与全文搜索。
4. 将源码推送到 GitHub 的 `feature/astro-cactus-blog` 分支保存。
5. 通过 `pnpm exec wrangler pages deploy dist --project-name xiaoyao-knowledge --branch main` 上传构建结果到 Cloudflare Pages，再检查线上页面。

本站使用直接上传模式，推送 GitHub 不会自动发布。部署命令中的 `main` 是 Cloudflare 的生产分支设置。

其他仓库中的笔记只有在明确指定目录后才会同步，默认不会自动公开。
