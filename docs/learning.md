# 本地自测与闪卡

开发分支新增 `quiz` 和 `flashcards`。这是完整的本地学习流程；固定7c490585 CDN 尚不含新增节点。无联网、持久化、远程批改或监考，答案是调用方提供的教学内容，直接包含在文档中，不能用于保密考试。

[原创组合示例](../examples/learning.json) · [状态样本](../examples/learning/states.json)

## 自测

`{type:"quiz", title, questions, description?, status?, message?}`。`questions`最多100题，允许空数组显示空态。每题：

- `id` 唯一；`kind` 为 `single` 或 `multiple`；`prompt` 是纯文本，`latex` 可选。
- `choices` 为2至20项 `{id,label}`，题内id唯一。
- `correct` 是正确选项id数组，不重复且必须存在；单选恰好一个。
- `explanation` 为答案解释文本，可选 `explanationLatex`。
- `points` 可选1至100的整数，默认1。

选择后主动确认，才显示参考答案与解释。提交后锁定本题，重复点击不重复计分。多选需与正确集合完全相同才得分，没有部分分。已提交才能进入下一题；上一题支持回看。最后显示得分、总分和逐题结果；重新开始清空所有选择和得分。题目数量/进度与加权分数分开。

## 闪卡

`{type:"flashcards", title, cards, description?, status?, message?}`。`cards`最多100张，允许空数组。每张 `{id,front,back,hint?,frontLatex?,backLatex?}`；id唯一、正反面为纯文本，可各有一条公式。

先揭晓，再标记“已掌握”或“再练一次”；重复标记仅更新当前卡片，不叠加计数。前后导航保留本轮标记且新卡回到正面。全部评估后可查看掌握数量和总结；回看保留标记，重新开始清空。这里没有长期记忆模型或间隔重复调度。

## 生命周期和可访问性

两种节点均有 `ready` / `loading` / `error`、自定义 `message` 和独立空态。交互只修改视图局部状态，不写文档 `state`。`controller.update` 使用新文档重置整轮，非法更新保留旧页面，`dispose` 清理事件。

单选与多选采用原生radio/checkbox；翻面和导航是原生按钮。题目切换将焦点移到新题目，提交后移到下一步；反馈有live region，公式使用同一KaTeX/MathML链路。无翻牌动画，支持减少动态效果偏好。文本不会作为HTML执行。

结构错误使用 `SCHEMA`；重复题目/卡片/选项id为 `LEARNING_ID`，答案引用或单选答案数量错误为 `QUIZ_ANSWER`。
