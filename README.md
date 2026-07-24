# 逍遥哥的知识库

基于 Astro Cactus 的中文知识库，用于长期整理人工智能、工程实践、知识管理与建站过程中的研究笔记、方法总结和项目经验。

- 在线站点：[xiaoyao-knowledge.pages.dev](https://xiaoyao-knowledge.pages.dev/)
- 统一索引：[在线知识索引](https://xiaoyao-knowledge.pages.dev/knowledge/)
- GitHub 仓库：[xiaoyao-666-coder/agent_note](https://github.com/xiaoyao-666-coder/agent_note)

## 知识地图

网站的 `/knowledge/` 页面直接读取内容元数据，是文章数量、系列顺序、分类和标签的唯一实时索引。README 只保留稳定的信息架构与主要入口，避免维护两套互相冲突的目录。

截至 2026-07-24，仓库包含 17 篇完整文章、2 条短笔记、4 个一级分类和 3 条系列阅读路径。

| 一级主题 | 当前内容 | 主要入口                           | 源文件位置                                                                               |
| -------- | -------: | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| 人工智能 |    12 篇 | 李宏毅老师 AI 课程 PPT 学习笔记    | [`content/posts/ai-agent-course/`](./content/posts/ai-agent-course/)                     |
| 工程实践 |     3 篇 | Agent Harness、Cloudflare 发布实践 | [`content/posts/`](./content/posts/)                                                     |
| 知识管理 |     1 篇 | 分类、标签与长期维护原则           | [`content/posts/knowledge-base-taxonomy.md`](./content/posts/knowledge-base-taxonomy.md) |
| 建站     |     1 篇 | 知识库定位与技术组成               | [`content/posts/hello-knowledge-base.md`](./content/posts/hello-knowledge-base.md)       |
| 短笔记   |     2 条 | GitHub 发布流程、pnpm 常用命令     | [`content/notes/`](./content/notes/)                                                     |

### 系列阅读路径

1. **李宏毅老师 AI 课程 PPT 学习笔记**：12 章，覆盖基础模型、预训练、后训练、推理、AI Agent、可解释性、模型编辑、模型合并、Mamba 与语音模型。
2. **知识库从 0 到 1**：从知识库定位到分类与标签设计。
3. **Cloudflare 静态站发布**：发布检查、预览环境与回滚流程。

## 浏览结构

| 入口     | 站点路径       | 作用                                       |
| -------- | -------------- | ------------------------------------------ |
| 知识索引 | `/knowledge/`  | 汇总系列、分类、独立文章、短笔记与热门标签 |
| 文章     | `/posts/`      | 浏览全部完整文章                           |
| 笔记     | `/notes/`      | 浏览命令、流程和阶段性记录                 |
| 系列     | `/series/`     | 按固定顺序系统阅读专题                     |
| 分类     | `/categories/` | 按一级主题浏览文章                         |
| 标签     | `/tags/`       | 跨分类检索方法和技术关键词                 |
| 归档     | `/archives/`   | 按发布时间回看全部内容                     |

## 内容与索引规则

- `content/posts/`：完整文章，必须设置 `title`、`description`、`publishDate`、`category` 和 `tags`。
- `content/notes/`：短笔记、命令和阶段性记录。
- `content/categories/`：一级分类名称、说明和展示顺序。
- `content/series/`：系列名称、说明和展示顺序；文章使用 `series` 与 `seriesOrder` 加入阅读路径。
- `content/tags/`：需要额外说明的标签元数据；实际标签列表从文章自动生成。

新增内容后不需要手工修改首页数量或知识索引，Astro 会在构建时从内容集合自动计算。

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

`pnpm build` 会先执行公开内容安全检查，再生成静态页面、RSS、站点地图、OG 图片和 Pagefind 中文搜索索引。输出目录为 `dist/`。

## 发布到 Cloudflare Pages

Wrangler 配置位于 `wrangler.jsonc`，Pages 项目名为 `xiaoyao-knowledge`。

当前 GitHub 默认分支为 `feature/astro-cactus-blog`，下面的生产分支参数与仓库实际状态保持一致。后续若迁移到 `main`，需要同时修改 GitHub 默认分支、Cloudflare Pages 设置和此处命令。

首次创建项目：

```powershell
pnpm exec wrangler pages project create xiaoyao-knowledge --production-branch feature/astro-cactus-blog
```

直接发布：

```powershell
pnpm build
pnpm exec wrangler pages deploy dist --project-name xiaoyao-knowledge --branch feature/astro-cactus-blog
```

生产构建会生成静态页面、RSS、站点地图、OG 图片和 Pagefind 中文全文搜索索引。
