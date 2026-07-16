---
title: pnpm 常用命令速查
description: 本地开发与 CI 中高频使用的 pnpm 命令。
publishDate: "2026-07-16T09:30:00+08:00"
category: 工程实践
tags:
  - pnpm
  - 命令
---

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm check
pnpm build
pnpm preview --host 127.0.0.1
```

安装依赖后若 sharp 相关构建异常，可再执行一次 `pnpm rebuild sharp`。生产发布前以 `pnpm build` 的 `dist/` 为准。
