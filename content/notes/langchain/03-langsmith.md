---
title: LangChain：LangSmith 的使用
description: 从调用追踪与运行分析入手，介绍大模型应用的调试、数据集和实验评测。
publishDate: "2026-10-28"
category: 人工智能
tags:
  - LangChain
  - LangSmith
  - 可观测性
series: langchain
seriesOrder: 3
---

LangSmith 将模型与工具的运行过程转化为可查看、可比较的追踪记录。本章从追踪配置入手，介绍如何定位问题，并通过数据集与实验评估改动效果。

## 1. LangSmith 解决什么问题

LangSmith 用于观察、调试、评测和管理大模型应用。Agent 的一次回答可能包含多轮模型请求和多个工具调用，最终文本只能说明结果；追踪记录能解释中间发生了什么。

| 功能 | 看什么 / 做什么 | 使用时机 |
| --- | --- | --- |
| Tracing | 每次运行的输入、输出、子调用、耗时、错误、Token | 从第一个模型调用开始 |
| Monitoring | 一段时间内的延迟、错误率、吞吐和成本趋势 | 关注稳定性与资源开销时 |
| Datasets & Experiments | 用同一批样本比较模型或 Prompt 版本 | 修改配置后判断效果 |
| Evaluators | 规则评分、模型评分等 | 建立可重复的质量标准 |
| Annotation Queues | 人工审阅、标注与反馈 | 需要专家判断的结果 |
| Prompts | 提示词版本与协作管理 | 模板需要集中维护时 |
| Playground | 快速更换输入、模型参数并试验 | 分析某次失败或调 Prompt |
| Studio | 可视化检查图结构、状态和执行 | 调试复杂 Agent / LangGraph |

Deployment 与 Sandbox 等部署或执行环境能力，与调用追踪分别配置；启用 tracing 并不会自动部署应用。平台界面与权限会变化，先掌握 Tracing 和 Playground，再引入数据集与评测。

## 2. 开启追踪

1. 打开 [LangSmith](https://smith.langchain.com/)，注册或登录并进入目标工作空间。
2. 在设置中创建 API Key，保存到自己的本地配置。
3. 配置环境变量，并在模型/Agent 调用前加载。
4. 运行程序，在对应项目中查找记录。

追踪配置主要使用以下四个环境变量：

```dotenv
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=填写自己的LangSmith密钥
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_PROJECT=langchain-course
```

`ENDPOINT` 需要与账号区域或自托管部署相匹配；上面使用默认云端地址。模型调用另需模型服务商的 Key，**LangSmith Key 用于追踪服务，不用于购买或调用模型推理**。

```python
import os
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

load_dotenv()
model = init_chat_model(
    model=os.environ["DEEPSEEK_MODEL"],
    model_provider="deepseek",
)
response = model.invoke(
    "用一句话说明为什么需要调用追踪。",
    config={
        "run_name": "chapter03-first-trace",
        "tags": ["course", "chapter03"],
        "metadata": {"example": "basic-model-call"},
    },
)
print(response.content)
```

运行示例前需完成第 2 章的模型配置。启用追踪后，相应运行数据会发送到 LangSmith；开发与测试时应使用适合上传的样例数据。

## 3. 如何读一次运行

进入 Tracing，选择 `LANGSMITH_PROJECT` 对应项目，再打开目标记录。**Trace 是一次完整调用链，Run 是链中的一次具体运行或子步骤**。

建议按以下顺序查看：

1. **输入：** 系统提示、用户问题、对话历史是否按预期传入？
2. **执行链：** 调用了几次模型？是否调用了正确工具？工具参数和结果是什么？
3. **输出与错误：** 模型回答、结构化结果、结束原因或异常是否合理？
4. **耗时：** 时间主要花在模型、检索、外部工具还是重试？
5. **Token 与成本：** 是否重复发送过长历史或检索内容？用量和费用是否有提供商元数据支持？

一个 Agent 请求会拆出多个子 Run，因此“外层只有一次 invoke”不等于“只计费一次模型调用”。平台展示的成本也依赖模型映射、用量与价格配置，不能把缺失值当成零成本。

## 4. 从调试走向评测

可以通过以下流程持续评估应用效果：收集典型问题与失败案例 → 固定测试集 → 修改 Prompt 或模型 → 运行对比实验 → 按相同标准检查结果。

| 现象 | 优先检查 | 可能的改进 |
| --- | --- | --- |
| 没有 trace | 环境变量、加载时机、Key、endpoint、项目/工作空间 | 先跑最小模型示例确认配置 |
| 回复慢 | 各子步骤耗时和重试次数 | 限制无效工具循环，缩短输入，优化慢服务 |
| 费用高 | 输入/输出 Token、多轮次数 | 裁剪历史、压缩检索片段、选择适当模型 |
| 工具用错 | 工具描述、Schema、实际参数 | 明确工具边界并补充失败样例 |
| Prompt 改后感觉更好 | 是否仅凭一两个例子 | 在固定数据集上比较成功率与错误类型 |

评估器的分数不等于客观事实：规则可能过于粗糙，模型评委也可能偏差，需要结合人工抽查与业务标准。

## 5. 本章要点

- Tracing 回答“这一次发生了什么”；Monitoring 回答“最近整体表现怎样”；Evaluation 回答“改动是否更好”。
- 用 `run_name`、`tags` 和 `metadata` 让实验可识别、可筛选、可比较。

### 思考题

1. 模型 Key 与 LangSmith Key 有什么区别？
2. 一次 Agent 调用为什么会有多个 Run？
3. 错误率降低是否足以说明答案质量提升？

## 6. 参考资料

- [LangSmith 文档](https://docs.langchain.com/langsmith/home)
