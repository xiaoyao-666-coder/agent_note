# 逍遥哥的知识库

基于 Astro Cactus 的中文技术博客，记录基础模型、AI Agent 与 Agent Harness 的学习笔记。

- 在线站点：[xiaoyao-knowledge.pages.dev](https://xiaoyao-knowledge.pages.dev/)
- 统一索引：[在线知识索引](https://xiaoyao-knowledge.pages.dev/knowledge/)
- GitHub 仓库：[xiaoyao-666-coder/agent_note](https://github.com/xiaoyao-666-coder/agent_note)

## 知识地图

网站的 `/knowledge/` 页面直接读取内容元数据，是文章数量、系列顺序、分类和标签的唯一实时索引。README 只保留稳定的信息架构与主要入口，避免维护两套互相冲突的目录。

截至 2026-10-19，公开内容包含 13 篇技术笔记、1 个主题分类和 1 条课程阅读路径。文章栏目在有公开文章时自动显示。

| 一级主题 | 当前内容  | 主要入口                        | 源文件位置                                                           |
| -------- | --------- | ------------------------------- | -------------------------------------------------------------------- |
| 人工智能 | 12 篇笔记 | 李宏毅老师 AI 课程 PPT 学习笔记 | [`content/notes/ai-agent-course/`](./content/notes/ai-agent-course/) |
| 人工智能 | 1 篇笔记  | Agent Harness 的运行机制        | [`agent-harness-notes.md`](./content/notes/agent-harness-notes.md)   |

### 系列阅读路径

1. **李宏毅老师 AI 课程 PPT 学习笔记**：12 章，覆盖基础模型、预训练、后训练、推理、AI Agent、可解释性、模型编辑、模型合并、Mamba 与语音模型。

## 浏览结构

| 入口     | 站点路径       | 作用                                     |
| -------- | -------------- | ---------------------------------------- |
| 知识索引 | `/knowledge/`  | 汇总系列、分类、文章、独立笔记与热门标签 |
| 笔记     | `/notes/`      | 浏览课程/读书笔记、工具速查与操作清单    |
| 系列     | `/series/`     | 按固定顺序系统阅读专题                   |
| 分类     | `/categories/` | 按一级主题浏览文章与笔记                 |
| 标签     | `/tags/`       | 跨分类检索方法和技术关键词               |
| 归档     | `/archives/`   | 按发布时间回看全部内容                   |

## 内容与索引规则

- `content/posts/`：有完整论述的技术实践、方法总结与项目复盘。无公开文章时不生成文章列表。
- `content/notes/`：课程/读书笔记、工具速查、操作清单与阶段性记录。笔记不限篇幅，长篇同样保留正文目录和系列阅读。
- 两类内容都应设置 `title`、`description`、`publishDate`、`category` 和 `tags`；修改正文时可设置 `updatedDate`，不改原始发布日期。
- `content/categories/`：一级分类名称、说明和展示顺序。
- “人工智能”收录 AI 课程、读书与技术学习笔记；“工程实践”仅收录自己实际参与的项目、实验、问题排查与复盘，没有公开内容时自动隐藏。
- `content/series/`：系列名称、说明和展示顺序；文章和笔记都可使用 `series` 与 `seriesOrder` 加入阅读路径。
- `content/tags/`：需要额外说明的标签元数据；实际标签列表从文章与笔记自动生成。

新增内容后不需要手工修改首页数量或知识索引，Astro 会在构建时从内容集合自动计算。

`/rss.xml` 订阅全站内容，`/notes/rss.xml` 订阅笔记。迁移内容时更新内部链接，并在 `public/_redirects` 为原地址保留 301 跳转；12 章 AI 课程与 Harness 笔记均保留了旧文章地址的入口。

站点维护说明、发布流程和目录约定仅保留在仓库文档中，不作为公开文章或笔记。已移除的维护页面不再出现在搜索、订阅或站点地图中。

只有放入公开内容目录并通过安全检查的文件才会参与发布。`.obsidian/`、其他仓库和私人文件不会自动发布。

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

`pnpm build` 会先执行公开内容安全检查并刷新内容缓存，再生成静态页面、RSS、站点地图、OG 图片和 Pagefind 中文搜索索引。输出目录为 `dist/`。强制刷新可避免清空某个内容集合后，旧缓存继续发布已删除的页面。

## 发布到 Cloudflare Pages

Wrangler 配置位于 `wrangler.jsonc`，Pages 项目名为 `xiaoyao-knowledge`。

当前代码在 GitHub 的 `feature/astro-cactus-blog` 分支维护，但 Cloudflare Pages 采用直接上传模式，生产分支配置为 `main`。`--branch` 指定的是 Cloudflare 部署环境，不是本地当前 Git 分支；正式发布必须使用 `main`。

首次创建项目：

```powershell
pnpm exec wrangler pages project create xiaoyao-knowledge --production-branch main
```

直接发布：

```powershell
pnpm build
pnpm exec wrangler pages deploy dist --project-name xiaoyao-knowledge --branch main
```

生产构建会生成静态页面、RSS、站点地图、OG 图片和 Pagefind 中文全文搜索索引。
