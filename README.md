# 逍遥哥的知识库

基于 Astro Cactus 的中文知识型个人博客，用于整理技术实践、项目复盘、GitHub 笔记和长期可复用的知识。

## 内容目录

- `content/posts/`：完整文章（`category` + `tags`；可选 `series` / `seriesOrder`）。
- `content/notes/`：短笔记、命令和阶段性记录。
- `content/categories/`：一级分类说明（建站 / 知识管理 / 工程实践等）。
- `content/series/`：系列说明与阅读顺序元数据。
- `content/tags/`：标签说明。

### 浏览结构

| 入口 | 路径 | 作用 |
|------|------|------|
| 文章 | `/posts/` | 完整长文列表 |
| 笔记 | `/notes/` | 速记与片段 |
| 分类 | `/categories/` | 一级主题导航 |
| 系列 | `/series/` | 按阅读顺序的专题目录 |
| 标签 | `/tags/` | 细粒度交叉检索 |
| 归档 | `/archives/` | 按时间浏览全部内容 |

只有放入内容目录并通过检查的内容会参与发布。其他仓库或私人文件不会自动同步。

## 本地开发

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

常用检查：

```powershell
pnpm test
pnpm check:content
pnpm check
pnpm build
```

`pnpm build` 会先执行公开内容安全检查，再生成静态页面、RSS、站点地图、OG 图片和 Pagefind 中文搜索索引。输出目录为 `dist/`。

## Cloudflare Pages

Wrangler 配置位于 `wrangler.jsonc`，Pages 项目名为 `xiaoyao-knowledge`。

首次创建项目：

```powershell
pnpm exec wrangler pages project create xiaoyao-knowledge --production-branch main
```

直接发布：

```powershell
pnpm build
pnpm exec wrangler pages deploy dist --project-name xiaoyao-knowledge --branch main
```

GitHub 仓库：[xiaoyao-666-coder/agent_note](https://github.com/xiaoyao-666-coder/agent_note)

生产地址：[https://xiaoyao-knowledge.pages.dev/](https://xiaoyao-knowledge.pages.dev/)
