---
title: LangChain：中间件
description: 通过摘要、人工审核、调用限制、重试和自定义钩子管理 Agent 的运行过程。
publishDate: "2026-10-28"
category: 人工智能
tags:
  - LangChain
  - AI Agent
  - 中间件
series: langchain
seriesOrder: 8
---

中间件在 Agent 的运行过程中加入可复用的处理策略。本章介绍摘要、人工审核、调用限制与重试，并说明自定义钩子的状态更新和执行顺序。

> 适用版本：LangChain 1.2.12。示例中的 `model` 为已初始化的聊天模型，创建方式见[第 2 章](/notes/langchain/02-models/)。

## 1. 中间件解决什么问题

中间件是在 Agent 执行关键位置挂载的处理逻辑。模型负责决策，工具负责执行，系统提示词描述规则；中间件则在运行过程中实施日志记录、请求调整、次数限制、重试和人工审核等策略。

如果把这些公共需求写进每个工具或 Agent 主流程，代码会重复且难维护。通过 `create_agent(..., middleware=[...])` 统一挂载，可以复用策略，也便于观察策略在什么时机生效。

| 类别 | 代表能力 | 解决的问题 |
| --- | --- | --- |
| 成本与资源控制 | 调用限制、摘要、上下文编辑 | 循环过长、费用过高、上下文过大 |
| 容错 | 模型回退、模型重试、工具重试 | 临时失败后如何恢复 |
| 审核与信息处理 | 人工审核、PII 检测 | 外部动作的确认、特定敏感信息处理 |
| 规划与工具选择 | 待办列表、工具筛选 | 长任务遗漏步骤、工具过多难以选择 |
| 执行能力扩展 | 文件搜索、Shell、文件系统、子 Agent | 提供环境操作与任务拆分能力 |
| 开发测试 | 工具模拟 | 在真实工具未就绪时验证流程 |

按实现来源，中间件可分为内置、自定义和提供商专属类型。Filesystem、Subagent 属于 Deep Agents 相关能力，使用时需确认对应安装包和导入路径；可用中间件也随版本变化。

## 2. 历史摘要 SummarizationMiddleware

达到阈值后，用摘要模型压缩较早历史，再保留最近一段原始消息。摘要会影响后续使用的消息状态，并不是仅把日志打印得更短。

| 参数 | 含义 |
| --- | --- |
| `model` | 用于生成摘要的模型，可与主模型不同 |
| `trigger` | 一个触发条件，或多个条件组成的列表；列表中任一条件满足即可触发 |
| `keep` | 保留近期原始内容的预算，接收一种条件 |
| `token_counter` | Token 计数函数；近似计数与实际计费可能不同 |
| `summary_prompt` | 自定义摘要要求，包含 `{messages}` 占位符 |
| `trim_tokens_to_summarize` | 摘要调用自身处理历史的 Token 预算，注意与触发阈值配合 |

`trigger` 和 `keep` 的条件可按 `("tokens", 数量)`、`("messages", 数量)`、`("fraction", 比例)` 表达。比例依赖模型 profile 中可靠的 `max_input_tokens`，不能把错误的上下文上限填进去只为消除报错。

```python
from langchain.agents import create_agent
from langchain.agents.middleware import SummarizationMiddleware
from langgraph.checkpoint.memory import InMemorySaver

agent = create_agent(
    model=model,
    middleware=[
        SummarizationMiddleware(
            model=model,
            trigger=("messages", 20),
            keep=("messages", 6),
            summary_prompt=(
                "总结以下对话，保留已确认事实、用户要求和未完成事项。"
                "不确定内容仍标注为不确定。\n{messages}"
            ),
        )
    ],
    checkpointer=InMemorySaver(),
)
config = {"configurable": {"thread_id": "summary-demo"}}
```

20 条触发、保留 6 条只是演示参数。实际保留边界还需要维护工具调用与结果的完整关系。摘要也可能遗漏或扭曲信息，重要事实可另外结构化保存；是否节省费用，要同时考虑新增的摘要调用与后续输入减少量。

## 3. 人工审核 HumanInTheLoopMiddleware

它在指定工具执行前暂停图，返回待审核动作；用户作出决定后，从原检查点恢复。

| 决策 | 行为 |
| --- | --- |
| `approve` | 按原参数执行 |
| `edit` | 修改工具名称或参数后执行 |
| `reject` | 拒绝该动作，并向 Agent 提供反馈 |

`interrupt_on` 按工具名设置策略：`True` 启用审核，`False` 不拦截，也可用字典指定 `allowed_decisions` 和 `description`。`description_prefix` 设置通用提示文字。

```python
from langchain.agents import create_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langchain.tools import tool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command

@tool
def preview_booking(city: str) -> str:
    """生成教学用的模拟预订结果，不进行真实预订。"""
    return f"模拟结果：目的地为{city}"

review_agent = create_agent(
    model=model,
    tools=[preview_booking],
    middleware=[HumanInTheLoopMiddleware(
        interrupt_on={
            "preview_booking": {
                "allowed_decisions": ["approve", "edit", "reject"]
            }
        }
    )],
    checkpointer=InMemorySaver(),
)
review_config = {"configurable": {"thread_id": "review-demo"}}
result = review_agent.invoke(
    {"messages": [{"role": "user", "content": "调用工具生成北京的模拟预订结果"}]},
    config=review_config,
)
interrupts = result.get("__interrupt__", [])
if interrupts:
    print(interrupts[0].value)
```

下面是**审核界面已收到用户同意之后**的恢复示例，仅适用于当前中断恰好含一个待审核动作：

```python
if interrupts:
    pending = interrupts[0].value["action_requests"]
    if len(pending) != 1:
        raise ValueError("请按待审核动作逐项收集决定")
    final_state = review_agent.invoke(
        Command(resume={"decisions": [{"type": "approve"}]}),
        config=review_config,
    )
```

多动作的 `decisions` 必须与 `action_requests` 顺序对应；允许的选项来自对应审核配置。恢复需要同一 `thread_id` 和可用的 checkpointer，不能重新发送原问题来代替恢复。恢复后仍可能发生新的中断，调用方应继续检查。

## 4. PII 信息处理

`PIIMiddleware` 检测个人身份相关信息，可按内置类型（如 email、credit_card、ip、mac_address、url）或自定义检测器处理。

| 策略 | 处理效果 |
| --- | --- |
| `redact` | 用类型标签替换命中内容 |
| `mask` | 遮蔽部分内容 |
| `hash` | 替换为散列表示，便于关联统计；不等于绝对匿名 |
| `block` | 命中时抛出异常，阻断当前处理 |

```python
from langchain.agents.middleware import PIIMiddleware

email_filter = PIIMiddleware(
    pii_type="email",
    strategy="redact",
    apply_to_input=True,
    apply_to_output=True,
    apply_to_tool_results=True,
)
```

三个 `apply_to_*` 决定检查输入、模型输出、工具结果中的哪些位置；仅处理最终输出不能阻止之前已发送给模型的数据。检测能力取决于类型、正则或自定义函数，不能把它理解为所有敏感信息都能自动识别。

## 5. 待办列表 TodoListMiddleware

该中间件提供 `write_todos` 工具，帮助 Agent 把大任务拆成步骤，并在状态中保存 `todos`。每项包含 `content` 和 `status`，常用状态为 `pending`、`in_progress`、`completed`。

```python
from langchain.agents.middleware import TodoListMiddleware

planning_middleware = TodoListMiddleware()
```

可以通过 `system_prompt` 调整规划规则，通过 `tool_description` 调整待办工具描述。待办工具的名称为 `write_todos`。

以修复程序错误为例，任务可拆分为：列出工作区文件 → 读取加法实现与测试 → 执行测试定位问题 → 修改实现 → 再运行测试 → 汇报结果。待办记录有助于跟踪进度，但“标记完成”仍是模型的状态更新，不能代替测试通过等真实证据；中间件也不会自动提供文件读写与测试工具。

## 6. 调用限制、回退与重试

### 6.1 限制模型和工具调用

| 中间件 | 关键参数 | 超限处理 |
| --- | --- | --- |
| `ModelCallLimitMiddleware` | `run_limit`、`thread_limit`、`exit_behavior` | 结束当前运行或抛异常 |
| `ToolCallLimitMiddleware` | 同上，可通过 `tool_name` 限制指定工具 | `continue`、`end`、`error` |

`run_limit` 针对一次 Agent 运行；`thread_limit` 针对同一线程累计，需要保留相应状态。线程限制不是全站、全用户或进程级的统一配额。

```python
from langchain.agents.middleware import (
    ModelCallLimitMiddleware,
    ToolCallLimitMiddleware,
)

limits = [
    ModelCallLimitMiddleware(run_limit=8, exit_behavior="error"),
    ToolCallLimitMiddleware(run_limit=5, exit_behavior="continue"),
]
```

工具超限后 `continue` 的意思是把限制反馈给模型，让它决定后续步骤，超限工具不会因此照常执行；这也不保证模型立即停止，所以常配合模型次数或图步数上限。`end` 结束本次运行，不表示删除整段会话。

### 6.2 三种容错策略

| 策略 | 行为 | 适用场景 |
| --- | --- | --- |
| `ModelFallbackMiddleware` | 主模型失败后尝试备用模型 | 提供商不可用或特定模型失败 |
| `ModelRetryMiddleware` | 重试失败的模型请求 | 可恢复的超时、限流等 |
| `ToolRetryMiddleware` | 重试失败的工具执行 | 工具依赖的临时故障 |

重试常关注 `max_retries`、`initial_delay`、`backoff_factor`、`max_delay`、`jitter`、`retry_on` 和失败后的行为。指数退避逐步拉长间隔，抖动让并发请求错开。实际等待时间还受重试序号、延迟上限和抖动设置影响，应结合参数配置与运行日志确认。

模型客户端本身可能已有重试，再叠中间件会增加总尝试次数。调用限制、重试与回退的嵌套顺序也会影响计数和实际 API 请求数，应通过 Trace 验证。对有副作用的工具，先明确幂等与去重方式，再决定是否重试。

### 6.3 工具筛选与模拟

`LLMToolSelectorMiddleware` 用一个模型从工具集合中挑选与问题相关的工具。`model` 指筛选模型，`max_tools` 控制模型筛选出的工具数量，`always_include` 指定始终包含的工具，这些工具不计入 `max_tools`。**筛选数量不等于工具执行次数限制**，也不能替代执行时的权限校验；筛选本身还会增加一次模型开销。

`LLMToolEmulator` 用模型模拟工具结果，适合验证流程或原型。它给出的天气、查询结果或执行结果都不是真实业务证据，不能用模拟结果验证真实工具是否正确。

## 7. 上下文编辑与执行扩展

`ContextEditingMiddleware` 可通过类似 `ClearToolUsesEdit` 的策略移除模型请求中较旧、较大的工具结果内容，同时保留必要的调用关系。重点区分：模型实际看到的消息可以变少，而持久状态中仍可保留原记录；检查请求或输入 Token 才能确认效果。

文件搜索类中间件利用 Glob 匹配路径、Grep 检索内容。Shell 类能力执行命令；Filesystem 提供文件操作；Subagent 用于拆分任务。接入这些能力时，需要根据对应版本配置安装包、执行环境、可访问目录与工具集合。

## 8. 自定义中间件的六个钩子

| 类型 | 钩子 | 时机与用途 |
| --- | --- | --- |
| Node-style | `before_agent` | 一次运行开始时，初始化或检查 |
| Node-style | `before_model` | 每次模型调用前，验证、更新状态 |
| Node-style | `after_model` | 每次模型调用后，检查输出、更新状态 |
| Node-style | `after_agent` | 一次运行正常完成时，最终处理 |
| Wrap-style | `wrap_model_call` | 包裹模型请求，可改请求、重试、回退 |
| Wrap-style | `wrap_tool_call` | 包裹工具执行，可校验、捕获异常、调整执行 |

`before_model` / `after_model` 可能在一次 Agent 运行中执行多次。`after_agent` 不能当作异常时必然执行的 `finally` 清理钩子。

### 8.1 节点钩子：读状态，返回更新

节点钩子接收 `state` 与 `runtime`。返回 `None` 表示不提交状态更新；返回字典由图按照各字段的 reducer 合并。不要仅原地修改消息对象后返回 `None` 来表达持久更新。

```python
from langchain.agents.middleware import before_model
from langchain.messages import AIMessage

@before_model(can_jump_to=["end"])
def stop_on_explicit_command(state, runtime):
    last = state["messages"][-1]
    if last.type == "human" and last.content == "/stop":
        return {
            "messages": [AIMessage(content="已结束本次运行。")],
            "jump_to": "end",
        }
    return None
```

跳转需用 `can_jump_to` 声明允许目标，再返回 `jump_to`。LangChain 1.2.12 中间件支持的目标为 `"end"`、`"tools"`、`"model"`；这些公开值与底层图节点名称属于不同层次。跳到工具节点前，还需准备有效的工具调用消息。

### 8.2 包装钩子：接收请求与 handler

```python
from langchain.agents.middleware import wrap_model_call

@wrap_model_call
def count_visible_messages(request, handler):
    print("本次模型请求的消息数：", len(request.messages))
    response = handler(request)
    return response
```

`handler(request)` 执行内层处理。调用一次是正常转发；多次调用可能产生多次真实请求；不调用则需要返回合法的替代结果，不能随意返回 `None`。

通过 `request.override(...)` 生成修改后的模型请求，可动态调整模型、消息和可见工具等；这类临时请求修改不等于提交 Agent 状态更新。工具包装器处理的是工具请求，其结果通常为 `ToolMessage`，也可能涉及更新状态的 `Command`，不能照搬模型响应的类型。

## 9. 装饰器、类与执行顺序

单个钩子、简单逻辑通常用装饰器；需要多个钩子共享配置、复用或提供同步/异步实现时，继承 `AgentMiddleware` 更清楚。二者底层都形成中间件对象，能力并非两套互不相通的机制。

```python
from langchain.agents.middleware import AgentMiddleware

class MessageCountLogger(AgentMiddleware):
    def before_model(self, state, runtime):
        print("调用前：", len(state["messages"]))
        return None

    def after_model(self, state, runtime):
        print("调用后：", len(state["messages"]))
        return None
```

顺序取决于 `middleware=[A, B, C]` 的排列：

```text
before_*：A → B → C
wrap_*：A 进入 → B 进入 → C 进入 → 实际调用 → C 返回 → B 返回 → A 返回
after_*：C → B → A
```

不同类别的钩子仍分别运行在各自生命周期位置，不能把整个中间件列表简单理解为“执行完 A 的所有方法才执行 B”。例如，放在摘要之前的输入处理会影响摘要模型能看到什么；重试包装器放在回退包装器外部或内部，也会改变每次失败后的行为。

## 10. 本章要点

- 中间件负责执行策略，工具负责具体能力；名称相近不代表职责相同。
- 节点钩子提交状态更新，包装钩子控制一次模型或工具请求。
- 摘要、裁剪、调用限制、重试分别控制不同问题，参数不能互相替代。

### 思考题

1. 一次 Agent 调用中 `before_model` 会运行几次？
2. 工具筛选能否限制调用次数？
3. 为什么恢复人工审核要保留 `thread_id`？

## 11. 参考资料

- [Middleware overview](https://docs.langchain.com/oss/python/langchain/middleware/overview)
- [Built-in middleware](https://docs.langchain.com/oss/python/langchain/middleware/built-in)
- [Custom middleware](https://docs.langchain.com/oss/python/langchain/middleware/custom)
- [Human-in-the-loop](https://docs.langchain.com/oss/python/langchain/human-in-the-loop)
