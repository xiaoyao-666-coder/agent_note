# Muse 重构入口

本仓库包含「逍遥哥的知识库」的 Astro Cactus 源码、已发布 Markdown、原始学习材料和静态资源。重构时以 `content/` 为正式内容来源，以 `src/` 为现有页面和功能的参考。

- 仓库：<https://github.com/xiaoyao-666-coder/agent_note>（私有，需要通过 GitHub 授权访问）
- 源码分支：`feature/astro-cactus-blog`（当前默认分支）
- 现有站点：<https://xiaoyao-knowledge.pages.dev/>
- 内容快照：[docs/muse-content-inventory.json](./docs/muse-content-inventory.json)

## 获取与运行

```sh
git clone --branch feature/astro-cactus-blog https://github.com/xiaoyao-666-coder/agent_note.git
cd agent_note
pnpm install --frozen-lockfile
pnpm dev
```

本次本地验证环境为 Node.js `24.14.1`、pnpm `11.25.0`；Astro 依赖声明的 Node.js 最低版本为 `22.12.0`。依赖以 `package.json` 和 `pnpm-lock.yaml` 为准。

```sh
pnpm test
pnpm check:content
pnpm build
```

构建产物在 `dist/`，包含 HTML、RSS、站点地图、OG 图片和 Pagefind 搜索索引。`node_modules/`、`dist/`、`.astro/`、本地环境变量和 Obsidian 插件状态均不属于需要上传的站点源码。

本次现有测试 5 项通过，完整构建通过，共生成 102 个页面，搜索索引收录 23 篇笔记。构建会提示 `post` 和 `tag` 元数据集合为空，这是目前没有文章和独立标签说明文件所致；标签页面仍从笔记元数据正常生成。

## 源码入口

| 路径 | 用途 |
| --- | --- |
| `content/notes/` | 正式笔记及 YAML frontmatter，导入内容的主要来源 |
| `content/posts/` | 文章集合，目前无已发布文章；空目录可能不出现在 Git 中 |
| `content/series/`、`content/categories/`、`content/tags/` | 系列、分类和标签元数据；标签也从正文 frontmatter 汇总 |
| `src/content.config.ts` | 内容字段、默认值与校验规则 |
| `src/data/post.ts` | URL、分类/标签汇总、系列排序、前后篇和关联阅读规则 |
| `src/pages/` | 首页、知识索引、笔记、系列、分类、标签、归档、关于、RSS 等页面 |
| `src/layouts/BlogPost.astro`、`src/components/blog/` | 正文布局、目录、系列导航、关联阅读等 |
| `src/site.config.ts`、`src/styles/` | 站点名称、语言、导航、主题和样式 |
| `astro.config.ts`、`src/plugins/` | Markdown、数学公式、代码块、提示块、脚注等处理 |
| `public/`、`src/assets/` | 图标、社交分享图、重定向和字体原始文件 |
| `package.json`、`pnpm-lock.yaml`、`wrangler.jsonc` | 依赖、构建与现有 Cloudflare Pages 配置 |
| `langchain笔记/` | 已保存的原始学习笔记和 Python 示例，供参考，不要与正式笔记重复导入 |
| `docs/`、`outputs/qa/` | 设计记录与页面参考截图，供重构参考，不是博客文章 |

## 内容快照与迁移规则

2026-11-12 核对的正式内容为 **23 篇笔记、0 篇文章、2 个系列**：李宏毅 AI 课程 12 篇、LangChain 10 篇、Agent Harness 独立笔记 1 篇。使用中的分类为「人工智能」；另有「工程实践」分类定义，目前没有正式内容。

内容清单记录每篇笔记的源文件、现有路径、日期、分类、标签、系列、顺序和文本 SHA-256。它是本次交接快照；后续增删内容以 `content/` 和内容 schema 为准。SHA-256 按 UTF-8、LF 换行的源文本计算，不受 Git 在 Windows 上转换换行的影响。

迁移时保留 `title`、`description`、`publishDate`、`updatedDate`、`category`、`tags`、`series`、`seriesOrder`、`draft`、`pinned` 及图片字段（若存在）。`draft` 默认为 `false`，`pinned` 默认为 `false`；实际站点会将标签转换为小写并去重。发布日期不能改成导入日期。

现有正文路径为 `/notes/<相对 content/notes 的文件路径，去掉扩展名>/`，例如 `/notes/langchain/01-overview/`；文章路径采用 `/posts/`。系列路径为 `/series/<seriesId>/`，顺序按 `seriesOrder` 升序，再按发布日期升序。保留系列目录和系列内上一篇/下一篇。

保留 Markdown 正文、代码语言、表格、链接、脚注和数学公式。当前公式由 KaTeX 处理；正文中出现的 Mermaid 代码块也应保留，并在目标系统中单独验证图表渲染。不要将 YAML frontmatter 原样展示给读者。

现有 `public/_redirects` 记录部分历史 `/posts/` 地址到 `/notes/` 的 301 跳转。如果新系统改变路径，需要建立「源文件 → 原路径 → 新文章 ID/路径」映射，更新内部链接和锚点，并在新服务器实现对应重定向。切换到新域名时，旧 `pages.dev` 地址的跳转仍需要在 Cloudflare 一侧设置。

## 在 Muse 中重构

先在单独目录或分支实现新站，通过内容清单核对迁移结果。现有站点的导航、知识索引、系列阅读、正文目录、分类/标签、归档、搜索、RSS、明暗主题和移动端布局是功能参考。

如果选择 Typecho，需要实现或调整 PHP 主题，并将 Markdown 正文和元数据导入数据库；Astro 的 `.astro` 组件不能直接作为 Typecho 主题运行。分类和标签可映射到目标系统对应结构，系列 ID、系列顺序和原始路径应另存为自定义字段或显式映射。此清单不包含导入器或现成的 Typecho 主题。

导入仅针对正式内容集合。仓库说明、配置文件、原始学习材料和页面参考截图不要自动变成文章，也不要把整个源码仓库设为公开静态目录。

重构结果至少核对：

- 23 篇笔记全部导入，正文与日期完整，没有把原始 LangChain 笔记重复导入。
- 两个系列分别为 12 篇和 10 篇，章节顺序、目录和前后篇正确。
- 分类、标签、知识索引、搜索和 RSS 可用；没有发布维护文档。
- 长篇正文、代码、公式、表格、链接和移动端阅读正常。
- 旧路径的跳转和正文内部链接可用；新站具备可恢复的数据备份。

源码推送与上线是两件事：现有 Cloudflare Pages 采用直接上传模式，部署环境分支名为 `main`；GitHub 上的源码分支是 `feature/astro-cactus-blog`。本次交接只上传源码与说明。新站迁移验证完成后，再安排正式切换。

## 可交给 Muse 的任务描述

> 请读取私有仓库 `xiaoyao-666-coder/agent_note` 的 `feature/astro-cactus-blog` 分支，先看 `MUSE-REBUILD.md` 和 `docs/muse-content-inventory.json`。以 `content/` 为唯一正式文章来源，结合 `src/` 的页面和功能，在独立环境重构知识库。保留全部 23 篇笔记的正文、日期、分类、标签与两个系列的章节顺序，完成链接迁移和内容核对，提供可预览的新站供我验收。
