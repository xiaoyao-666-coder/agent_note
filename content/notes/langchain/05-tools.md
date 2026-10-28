---
title: LangChain：Tools 工具调用
description: 掌握工具定义、参数 Schema、模型工具调用循环与执行控制。
publishDate: "2026-10-28"
category: 人工智能
tags:
  - LangChain
  - 工具调用
  - AI Agent
series: langchain
seriesOrder: 5
---

工具把查询、计算和外部服务等能力提供给模型。本章介绍工具定义、参数约束、调用循环与执行控制。

> 适用版本：LangChain 1.2.12。示例中的 `model` 需已初始化并支持工具调用。

## 1. 工具调用的核心机制

Tool 是具有名称、用途描述、输入 Schema 和执行逻辑的可调用能力，例如查询天气、计算金额、查询订单。模型从工具说明中决定是否调用以及传什么参数，真正执行由程序完成。

```text
问题 + 工具描述 → 模型生成 tool_calls
→ 应用执行工具 → ToolMessage 返回结果
→ 模型结合结果回答，或继续请求工具
```

**`bind_tools()` 只向模型暴露工具定义，并不会自动执行工具函数。** 用普通聊天模型时需自行管理循环；第 7 章的 `create_agent()` 会组织这个循环。

典型消息顺序：HumanMessage → 含调用请求的 AIMessage → 匹配的 ToolMessage → 最终 AIMessage。一次模型推理可以提出零个、一个或多个工具调用，不应理解为“一次只能调用一个工具”。

## 2. 两种定义方式

### 2.1 普通函数

```python
def multiply(a: float, b: float) -> float:
    """计算两个数的乘积。"""
    return a * b

model_with_tools = model.bind_tools([multiply])
```

框架可以把函数签名和 docstring 转换为工具描述；普通函数本身仍通过 `multiply(**args)` 执行。工具 Schema 可用 `langchain_core.utils.function_calling.convert_to_openai_tool` 等转换函数查看；具体集成也可能转换为其他厂商格式。

### 2.2 `@tool`：推荐的显式工具对象

```python
from langchain.tools import tool

@tool
def multiply(a: float, b: float) -> float:
    """计算两个数的乘积，适合精确乘法运算。"""
    return a * b

print(multiply.name)
print(multiply.description)
print(multiply.args)
print(multiply.invoke({"a": 3, "b": 4}))
```

装饰后变量代表工具对象，通常用 `.invoke()` / `.ainvoke()`。工具名称默认来自函数名，可用 `@tool("multiply_numbers")` 修改。`description=` 可显式提供用途描述；否则一般从 docstring 获取。

### 2.3 描述与参数 Schema

| 信息 | 从哪里来 | 为什么重要 |
| --- | --- | --- |
| 工具名称 | 函数名或自定义名称 | 模型选择与程序分发依据 |
| 工具用途 | docstring / `description` | 指明什么时候适合调用 |
| 参数类型 | 类型注解或显式 Schema | 表达 string、number、array 等 |
| 必填与默认值 | 函数签名、Schema | 没有默认值通常是必填 |
| 字段描述与约束 | `Field`、docstring 参数说明 | 说明含义、单位、范围和枚举 |

启用 `@tool(parse_docstring=True)` 时，可以解析 Google 风格的 `Args:` 字段说明；名称必须与函数参数一致，格式错误可能触发异常。未开启解析时，普通描述性 docstring 不要求必须写成完整 Google 风格。

```python
from typing import Literal
from pydantic import BaseModel, Field
from langchain.tools import tool

class WeatherInput(BaseModel):
    city: str = Field(min_length=1, description="城市名称，例如北京")
    unit: Literal["celsius", "fahrenheit"] = Field(
        default="celsius", description="温度单位"
    )

@tool(args_schema=WeatherInput)
def get_weather(city: str, unit: str = "celsius") -> str:
    """查询演示天气数据；这是教学模拟结果，不是实时天气。"""
    temperature = 20 if unit == "celsius" else 68
    return f"模拟数据：{city}晴，温度 {temperature}，单位 {unit}。"
```

Pydantic Schema 可表达枚举、范围、默认值和嵌套结构，并在工具执行入口验证参数。函数签名应与 Schema 保持一致；`config`、`runtime` 等框架注入名称不应当作普通业务参数随意占用。

也可用 JSON Schema **字典**作为 `args_schema`，其中是参数对象的 `type`、`properties`、`required` 等，不是整套含 `function` 外壳的工具定义。它适合动态或跨语言 Schema，但不要假设它具有 Pydantic 同样的本地校验行为。

## 3. 手动执行完整循环

下面沿用已创建的 `model` 与前面的 `get_weather` 工具，展示多轮工具请求的处理方式：

```python
from langchain.messages import HumanMessage

tool_registry = {get_weather.name: get_weather}
bound_model = model.bind_tools(list(tool_registry.values()))
messages = [HumanMessage(content="北京天气怎么样？")]

for _ in range(5):  # 显式限制示例中的模型调用轮数
    ai_message = bound_model.invoke(messages)
    messages.append(ai_message)

    if not ai_message.tool_calls:
        print(ai_message.content)
        break

    for call in ai_message.tool_calls:
        selected_tool = tool_registry.get(call["name"])
        if selected_tool is None:
            raise ValueError(f"未注册的工具：{call['name']}")
        messages.append(selected_tool.invoke(call))
else:
    raise RuntimeError("达到示例调用上限，仍未完成。")
```

注意传入对象不同，返回形式也可能不同：

- `tool.invoke({"city": "北京"})`：传入纯参数字典，通常得到工具本身的返回值。
- `tool.invoke(call)`：传入包含调用 ID 的完整 ToolCall，通常得到匹配的 ToolMessage。
- 手工执行普通函数时，需要自己构造 `ToolMessage(content=..., tool_call_id=call["id"])`。

示例用显式注册表选择工具，不把模型生成的工具名或参数直接当 Python 代码执行。每次返回的全部调用都要处理；之后模型仍可能提出新调用，所以需要循环和终止条件。

## 4. `tool_choice` 控制

| 取值 | 含义 | 使用注意 |
| --- | --- | --- |
| `auto` | 模型按需决定是否调用 | 常规默认选择 |
| `none` | 当前请求禁用工具调用 | 仍可自然语言回答 |
| `required` / 部分集成的 `any` | 当前请求必须使用工具 | 至少一个，不代表所有工具都会被调用 |
| 工具名或厂商规定的对象 | 强制指定工具 | 写法随集成协议变化 |

```python
forced_model = model.bind_tools([get_weather], tool_choice="get_weather")
```

能否使用工具名简写需看所选适配器。强制工具调用只约束当前模型请求，不证明参数正确；每轮都强制调用还可能使模型无法结束，应明确在哪个阶段使用。

## 5. 工具工程实践

### 5.1 让模型选得对

工具保持职责单一，说明输入、输出、单位与使用时机。功能相近的工具要说明区别。只提供本次任务需要的工具，工具数量没有普遍适用的“最佳固定值”。

### 5.2 三层失败处理

| 层次 | 处理内容 | 注意点 |
| --- | --- | --- |
| 工具内部 | 业务校验、已知错误、明确结果 | 不要伪造成功或吞掉全部异常 |
| Agent 循环 | 把可理解的错误反馈给模型，允许修正参数 | 提示词不能保证重试次数或成功 |
| 调用层 | 网络类错误的退避重试 | 限制次数；不要盲目重跑有副作用的整个任务 |

可使用 Tenacity 的 `@retry` 为工具配置重试策略。重试只对可恢复错误有意义，例如暂时性网络故障；参数错误需要修正，扣款或创建订单等操作需要幂等设计。

### 5.3 返回值与同步/异步

字符串方便模型直接理解；字典也可以使用，框架可按协议序列化，并非强制只能返回字符串。手工 JSON 序列化可用 `json.dumps(data, ensure_ascii=False)` 保留中文可读性；Unicode 转义是合法表示，不等于乱码。

简单本地运算可同步执行；网络、数据库等 I/O 任务适合异步。异步工具应配合异步调用链，不要在协程里用长期阻塞操作拖慢所有请求。

## 6. 本章要点

- 工具定义供模型选择，工具执行由程序负责。
- Schema 管结构，docstring 管用途，两者都要清楚。
- 保留含 tool_calls 的 AIMessage，工具结果通过 ID 配对。

### 思考题

1. `bind_tools()` 后为什么可能没有执行函数？
2. 纯参数 `.invoke()` 与 ToolCall `.invoke()` 返回有什么区别？
3. 强制工具调用为什么可能造成循环？

## 7. 参考资料

- [Tools](https://docs.langchain.com/oss/python/langchain/tools)
