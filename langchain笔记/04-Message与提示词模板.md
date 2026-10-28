# 04-Message与提示词模板

消息组织角色与交互历史，提示词模板将固定指令与动态输入组合起来。本章介绍消息结构、工具响应配对、多轮历史和模板的使用方式。

> 适用版本：LangChain 1.2.12。示例中的 `model` 为已初始化的聊天模型，创建方式见[第 2 章](<02-模型的创建与调用.md>)。

## 1. Message 是交互的基本单位

消息不只是文字，还包含**角色、内容、身份标识、工具调用与响应元信息**。聊天模型用角色区分谁在说话，用当前输入中的消息序列理解上下文。普通无状态 API 不会自动保存并重新发送应用历史。

| 角色 | 字典写法 | 消息对象 | 职责 |
| --- | --- | --- | --- |
| 系统 | `{"role": "system", "content": "..."}` | `SystemMessage` | 定义角色、任务边界与回答要求 |
| 用户 | `{"role": "user", "content": "..."}` | `HumanMessage` | 表达用户输入 |
| 助手 | `{"role": "assistant", "content": "..."}` | `AIMessage` | 模型回复，也可能携带工具调用 |
| 工具 | `{"role": "tool", "content": "...", "tool_call_id": "..."}` | `ToolMessage` | 返回某次工具执行的结果 |

消息字典列表是可序列化为 JSON 的 Python 对象。调用时应按接口要求传入对象，区分消息列表与已经编码的 JSON 字符串。

```python
from langchain.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage

messages = [
    SystemMessage(content="你是 Python 学习助手，用简短示例解释问题。"),
    HumanMessage(content="什么是列表？"),
]
response = model.invoke(messages)
messages.append(response)
```

## 2. 消息字段与工具配对

### 2.1 关键字段

- `content`：字符串或内容块列表。
- `name`：可选名称；适配器是否传递、模型是否利用它，取决于提供商，不能作为可靠的身份认证机制。
- `id`：消息标识，有助于状态合并、更新与删除。
- `response_metadata`：响应相关信息；`usage_metadata` 在 AIMessage 上提供标准化用量。
- `tool_calls`：AIMessage 中解析后的调用列表，元素通常含 `name`、`args`、`id`、`type`。
- `tool_call_id`：ToolMessage 必须关联的调用 ID。

通用“元信息”不等于所有信息都放在一个名为 `metadata` 的消息字段中；消息元数据、Runnable 的追踪 metadata 和模型请求字段要分开理解。

### 2.2 完整工具消息链

```text
HumanMessage：查询北京天气
AIMessage：tool_calls=[{name: get_weather, args: {...}, id: call_1}]
ToolMessage：content=查询结果，tool_call_id=call_1
AIMessage：结合工具结果回复用户
```

模型提出调用的 AIMessage 必须保留，然后追加匹配的 ToolMessage，再交给模型。一次 AIMessage 可提出多个调用，应为每个调用补全对应结果；不能只追加工具结果而丢掉调用请求，也不能混入不相关消息破坏协议顺序。

## 3. 管理多轮历史

对无状态模型调用，应用维护历史的基本过程是：追加本轮用户消息 → 调用模型 → 追加模型回复 → 下一轮继续。

```python
history = [SystemMessage(content="你是耐心的学习助手。")]

def ask(question: str):
    history.append(HumanMessage(content=question))
    answer = model.invoke(history)
    history.append(answer)
    return answer.content

print(ask("我正在学习 LangChain。"))
print(ask("我刚才说在学什么？"))
```

这段示例只适合单用户的内存演示。多用户应用需要隔离历史；程序退出后列表消失；长历史需要裁剪或摘要。

**多轮对话需要保留足够的有效上下文。** 可以按 Token 预算保留系统规则、近期消息和关键摘要，避免历史无限增长。包含工具调用时，简单截取最后 N 条可能留下孤立的 ToolMessage，应按有效消息序列裁剪。

流式聊天中需要把块合并为完整回复后写入历史；不要把每个碎片都当作独立的一轮助手消息。

## 4. `content` 与 `content_blocks`

| 属性 | 理解方式 | 使用建议 |
| --- | --- | --- |
| `content` | 原始文本或提供商格式的内容 | 纯文本场景最直观，先判断类型 |
| `content_blocks` | 按标准 `type` 组织的内容视图 | 多模态、引用、推理等跨厂商处理 |

标准内容块可以包含 text、image、audio、video、tool_call、reasoning 等类型，但并非每个模型都支持全部输入输出。标准化会在访问时解析可识别内容，不会凭空增加模型能力，也不会暴露模型没有返回的内部推理。

```python
for block in response.content_blocks:
    if block["type"] == "text":
        print(block["text"])
```

图像输入要按模型要求提供 URL 或正确编码的图像数据。把本地文件路径写进提示词，不等于模型已经读取图像；远程服务也不能直接访问本机路径。

## 5. 提示词模板

### 5.1 模板的作用

模板把固定指令和运行时变量分离，便于复用、检查缺失变量、记录版本和组合多角色消息。

- `PromptTemplate`：构造文本提示；仍适合单段文本任务。
- `ChatPromptTemplate`：构造包含明确角色的聊天消息。

二者不是简单的“旧版不能用、新版必须用”。聊天模板也不会自动保存历史，变量校验更不等于防止提示词注入或保证模型服从。

### 5.2 创建与调用

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是{subject}教师，适合{level}学习者。"),
    ("human", "请解释：{question}"),
])
values = {"subject": "Python", "level": "初学", "question": "装饰器"}

prompt_value = prompt.invoke(values)
answer = model.invoke(prompt_value)
print(answer.content)
```

也可以用 `ChatPromptTemplate([...])` 构造。常见的三种渲染方法：

| 方法 | 输入 | 返回 |
| --- | --- | --- |
| `invoke({...})` | 变量字典 | `ChatPromptValue`，可交给模型 |
| `format(**values)` | 关键字参数 | 拼成的字符串，适合展示 |
| `format_messages(**values)` | 关键字参数 | 消息对象列表 |

模板支持字符串、角色元组、角色字典、消息对象、消息模板和子聊天模板等输入。学习时优先使用角色元组，结构最清楚。`HumanMessage(content="{question}")` 是已经构造好的消息，里面的花括号不会自动变成模板变量；应改用 `("human", "{question}")`。

### 5.3 与模型组合

```python
chain = prompt | model
result = chain.invoke(values)
```

这里的管道表达“模板输出交给模型”，不是旧版 `LLMChain` 对象。模板还能用字符串片段或 `+` 组合；组合后仍应检查消息顺序、重复系统指令与变量名冲突。

## 6. 高级模板能力

### 6.1 `partial()` 预填变量

```python
python_prompt = prompt.partial(subject="Python", level="初学")
result = (python_prompt | model).invoke({"question": "生成器"})
```

预填适合角色、语言、风格等重复配置；剩余变量在每次调用时传入。需要随时间变化的值，不要在创建模板时固定成过期常量。

### 6.2 `MessagesPlaceholder` 插入历史

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

chat_prompt = ChatPromptTemplate.from_messages([
    ("system", "你是学习助手，结合已提供的历史回答。"),
    MessagesPlaceholder(variable_name="history", optional=True),
    ("human", "{question}"),
])
value = chat_prompt.invoke({
    "history": [
        HumanMessage(content="我刚学完函数。"),
        AIMessage(content="下一步可以学习装饰器。"),
    ],
    "question": "下一步学什么？",
})
```

占位符插入的是一组完整消息，保留各自角色；`{question}` 等普通变量填入单条消息文本。占位符只负责放置消息，不会自动检索或存储历史。简写 `("placeholder", "{history}")` 也可表达消息占位符。

### 6.3 模板库

把常用模板集中到 `templates.py` 等模块，业务代码传入变量；为不同任务建立清晰名称，并记录必要的版本。模板里需要输出字面量 JSON 花括号时，默认 f-string 风格通常要写 `{{` 和 `}}`。

## 7. 本章要点

- 消息列表、单条 AIMessage 和 PromptValue 是不同对象，不要把字符串化后的历史当成仍有角色结构的消息列表。
- 多轮调用要保留必要上下文；裁剪时注意工具调用与结果配对。
- 模板变量负责格式化，消息占位符负责插入消息列表，两者不能互换。

### 思考题

1. `format_messages()` 与 `invoke()` 返回类型是什么？
2. 已有消息对象里的 `{name}` 会不会被替换？
3. 为什么 ToolMessage 需要 `tool_call_id`？

## 8. 参考资料

- [Messages](https://docs.langchain.com/oss/python/langchain/messages)
- [ChatPromptTemplate API](https://reference.langchain.com/python/langchain-core/prompts/)
