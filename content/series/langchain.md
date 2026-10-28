---
title: LangChain 学习笔记
description: 从模型接入、消息与工具调用，到智能体、中间件、上下文与记忆，以及 RAG 知识库问答的十章学习路径。
order: 2
---

本系列围绕 LangChain 1.2 展开，从模型接入、消息与提示词，到工具调用、智能体、中间件、记忆和 RAG，逐步介绍大模型应用的核心概念与实现方法。

## 章节目录

| 章节 | 核心内容 |
| --- | --- |
| [01-LangChain概述](/notes/langchain/01-overview/) | 生态组件、包结构、环境准备与技术选型 |
| [02-模型的创建与调用](/notes/langchain/02-models/) | 云端与本地模型、参数配置、同步、流式、批量与异步调用 |
| [03-LangSmith的使用](/notes/langchain/03-langsmith/) | 调用追踪、运行分析、调试与评测 |
| [04-Message与提示词模板](/notes/langchain/04-messages-prompts/) | 消息角色、工具响应配对、多轮历史与提示词模板 |
| [05-Tools](/notes/langchain/05-tools/) | 工具定义、参数 Schema、调用循环与执行控制 |
| [06-结构化输出](/notes/langchain/06-structured-output/) | Schema 设计、输出方式、结果校验与解析 |
| [07-智能体](/notes/langchain/07-agents/) | Agent 创建、工具循环、结构化结果与流式输出 |
| [08-中间件](/notes/langchain/08-middleware/) | 历史摘要、人工审核、调用限制、重试与自定义钩子 |
| [09-上下文与记忆](/notes/langchain/09-context-memory/) | State、检查点、Store、运行时 Context 与消息治理 |
| [10-RAG](/notes/langchain/10-rag/) | 文档加载、文本切分、嵌入、向量检索与知识库问答 |

## 阅读顺序

建议按章节顺序阅读：先理解框架与模型调用，再掌握消息、工具和输出结构；随后用 Agent 组织任务，通过中间件控制执行，通过记忆维持上下文，最后构建 RAG 知识库。LangSmith 可贯穿后续章节，用于观察运行过程和评估效果。

每章包含概念说明、对比表、代码示例、实践要点、思考题与参考资料。已有相关基础时，也可以按目录直接查阅对应主题。

## 环境与版本

主要依赖版本如下：

| 依赖 | 版本 |
| --- | --- |
| `langchain` | `1.2.12` |
| `langchain-core` | `1.2.18` |
| `langgraph` | `1.1.2` |
| `langchain-text-splitters` | `1.1.1` |
| `langgraph-checkpoint` | `4.0.1` |

模型集成、数据库和文档解析组件需按对应章节安装。不同版本的导入路径、参数和返回结构可能存在差异，复用示例时应先确认本地依赖版本。

## 示例使用约定

- 模型名、API Key、服务地址与测试文件按实际环境配置；敏感配置通过环境变量或本地配置文件加载。
- 后续示例可能复用前文创建的 `model`、`embeddings`、Store 或数据库连接，应结合上下文运行。
- 内存存储和模拟工具用于说明机制；实际应用需补充持久化、用户隔离、错误处理与业务校验。
- 代码示例聚焦接口用法，完整应用还需结合实际模型、依赖与服务环境验证。
