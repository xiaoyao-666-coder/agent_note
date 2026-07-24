---
title: 李宏毅 AI 课程：预训练与能力来源
description: 整理预训练、指令微调、数据质量、合成数据和基础模型能力来源。
publishDate: "2026-07-24"
category: 人工智能
tags:
  - 预训练
  - 指令微调
  - 数据工程
  - 基础模型
series: li-hongyi-ai-course
seriesOrder: 2
---

# 02 预训练：能力从哪里来

> 原始课件：`pretrain (v10).pptx`（61 页）

## 1. 三阶段训练框架

现代语言模型通常经历三个阶段：

1. **预训练**：使用海量文本做下一个 token 预测，形成知识和基础能力。
2. **监督微调**：使用高质量指令回答样本，教模型按照任务格式作答。
3. **偏好对齐**：使用人类或模型反馈优化有用性、安全性和风格。

基础模型直接对话时可能表现混乱，并不表示它没有能力。对齐数据更像一把“钥匙”，将预训练中已经形成但不容易调用的能力转成指令跟随行为。

## 2. 少量对齐数据为何有效

[LIMA: Less Is More for Alignment](https://arxiv.org/abs/2305.11206) 表明，只用约一千条精心选择的监督样本，也能让强基础模型形成良好的对话行为。其核心假设是：知识和能力主要来自预训练，对齐阶段主要学习输出格式和交互风格。

课件同时强调，不能把这个结论简单理解为“数据越少越好”。基础模型强度、样本质量、任务覆盖和训练目标都会影响结果。[Long Is More for Alignment](https://arxiv.org/abs/2402.04833) 等研究进一步说明，更丰富、信息密度更高的回答可能提高对齐效果。

### 2.1 数据质量控制

- 删除低质量、重复或互相矛盾的指令。
- 保留覆盖不同任务和回答形式的样本。
- 用强模型生成候选，再进行筛选和修订。
- 避免只优化表面风格而损失事实性和推理能力。

[AlpaGasus](https://arxiv.org/abs/2307.08701) 使用模型筛选 Alpaca 数据，说明较小但更干净的数据子集可以优于完整数据集。

## 3. 指令能力可能已存在于预训练中

课件列出多项研究，支持“指令跟随具有预训练内生基础”的观点：

- [The Unlocking Spell on Base LLMs](https://arxiv.org/abs/2312.01552)：合适的提示形式可以唤起基础模型已有的对话或任务能力。
- [Inherent Instruction-Following Capabilities of Large Language Models](https://arxiv.org/abs/2410.02465)：研究基础模型中自然形成的指令理解能力。
- [Instruction Following without Instruction Tuning](https://arxiv.org/abs/2409.14254)：探索在不进行常规指令微调时形成任务跟随能力的条件。
- [Self-Rewarding Language Models](https://arxiv.org/abs/2401.10020)：让模型同时生成回答和评价信号，迭代改进自身。

这不意味着监督微调不重要，而是说明其作用经常是“重组和显化已有能力”，而非独立创造全部能力。

## 4. 预训练数据的表述多样性

模型并不会因为某个事实在训练集中出现一次，就稳定地学会在各种问题形式下使用它。课件引用的 [Physics of Language Models: Part 3.1](https://arxiv.org/abs/2309.14316) 显示，同一知识以多种叙述和问法重复出现，会显著提高模型在新表达下提取知识的能力。

由此得到的数据设计原则是：

- 不只追求原始 token 数量，也要追求语义覆盖和表达多样性。
- 对重要概念提供解释、问答、推导、例子和反例等不同视角。
- 减少机械重复，因为重复文本增加计算量，却不一定增加可迁移能力。

## 5. 数据规模与计算规模

[Llama 3](https://arxiv.org/abs/2407.21783) 和 [DeepSeek-V3](https://arxiv.org/abs/2412.19437) 展示了大规模预训练数据、模型规模和工程优化共同扩展能力的路线。[Scaling Data-Constrained Language Models](https://arxiv.org/abs/2211.04325) 则讨论在高质量数据有限时如何重复使用数据，以及重复带来的收益递减。

[FineWeb](https://arxiv.org/abs/2406.17557) 构建了约 15 万亿 token 的清洗网页语料，说明数据去重、过滤和质量评估本身已成为基础模型训练的核心工程。

## 6. 数据质量、合成数据与重写

### 6.1 教科书式合成数据

[Textbooks Are All You Need](https://arxiv.org/abs/2306.11644) 使用具有教学结构的合成数据训练代码模型。重要启示不是“合成数据一定更好”，而是高密度、结构清楚、难度合适的数据可能比随意抓取的网页更有效。

### 6.2 重写网页数据

[Rephrasing the Web](https://arxiv.org/abs/2401.16380) 用模型重写网页内容，改善可读性和训练价值。这种方法可以增加表达多样性，但也可能引入生成模型的偏见、错误和风格同质化。

### 6.3 大规模网页清洗

[RefinedWeb](https://arxiv.org/abs/2306.01116) 说明经过严格过滤和去重的公开网页数据，也能训练出有竞争力的模型。课件进一步引用有关数据混合与多样性的研究：[arXiv:2305.16264](https://arxiv.org/abs/2305.16264) 与 [arXiv:2409.16295](https://arxiv.org/abs/2409.16295)。共同结论是，在计算预算固定时，覆盖更多有差异的信息通常比反复训练高度相似的数据更有效。

## 7. 模仿强模型的边界

用强模型生成指令数据，是低成本建立聊天模型的常用方案，但存在明确限制：

- 学生模型受到自身预训练能力上限约束。
- 模仿回答风格不等于复制知识和推理过程。
- 生成数据中的错误会被系统性放大。
- 仅在未知领域注入答案，模型未必能真正吸收。

[The False Promise of Imitating Proprietary LLMs](https://arxiv.org/abs/2305.15717) 指出，表面相似的对话风格可能掩盖明显的能力差距。[Maybe Only 0.5% Data is Needed](https://arxiv.org/abs/2405.05904) 相关实验说明，模型已经“部分知道”的数据往往最容易通过微调获得收益；完全超出基础模型能力的数据更难学会。

## 8. 预训练留下的深层惯性

预训练不仅提供知识，也留下难以消除的行为倾向。[Embers of Autoregression](https://arxiv.org/abs/2309.13638) 讨论自回归训练目标如何在模型行为中留下持续影响。通过 logit lens 等分析方法，可以观察到某些不希望出现的 token 倾向在中间层已经形成，即使最终输出被对齐策略压制，它们仍可能保留在内部表示中。

因此，后训练可以显著改变外显行为，却未必真正删除预训练形成的知识、偏见或危险模式。这也是越狱、灾难性遗忘和安全回退的重要背景。

## 9. 重要方法与研究索引

| 方法 | 解决的问题 | 对应研究 |
| --- | --- | --- |
| 少量高质量监督微调 | 用较少样本激活基础模型能力 | [LIMA](https://arxiv.org/abs/2305.11206) |
| 指令数据筛选 | 去除低质量样本，提高单位数据价值 | [AlpaGasus](https://arxiv.org/abs/2307.08701) |
| 高信息量回答对齐 | 比较短回答与长回答的训练价值 | [Long Is More for Alignment](https://arxiv.org/abs/2402.04833) |
| 多表述知识训练 | 提高知识在新问法下的可提取性 | [Physics of Language Models 3.1](https://arxiv.org/abs/2309.14316) |
| 教科书式合成数据 | 提高训练数据的信息密度和结构性 | [Textbooks Are All You Need](https://arxiv.org/abs/2306.11644) |
| 网页重写 | 将低质量网页改写成更适合学习的文本 | [Rephrasing the Web](https://arxiv.org/abs/2401.16380) |
| 网页过滤与去重 | 构造大规模高质量预训练语料 | [RefinedWeb](https://arxiv.org/abs/2306.01116)、[FineWeb](https://arxiv.org/abs/2406.17557) |
| 强模型蒸馏 | 用教师模型生成监督数据 | [The False Promise of Imitating Proprietary LLMs](https://arxiv.org/abs/2305.15717) |
| 自我奖励 | 由模型生成并评价训练信号 | [Self-Rewarding Language Models](https://arxiv.org/abs/2401.10020) |

## 10. 本章结论

1. 大部分通用知识和潜在能力来自预训练，对齐负责让这些能力更容易被调用。
2. 数据的多样性、密度、真实性和去重质量，与数据总量同样重要。
3. 用强模型生成数据很有效，但无法绕过学生模型自身的基础能力上限。
4. 后训练能够压制某些行为，却未必删除预训练中已经形成的内部倾向。
