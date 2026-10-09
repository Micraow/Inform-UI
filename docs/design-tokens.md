# 视觉依据、配色角色与不确定项

本库独立运行。颜色采用有明确许可的公开数值，按语义角色原创组织；不引入OpenAI SDK运行时。旧7c490585 CDN保留旧图表蓝色；新表对应固定8e8908d的50节点资产（同一配色基线），入口与实际CDN验收见[CDN文档](cdn.md)。

公开参考固定为 Apps SDK UI [0f00143](https://github.com/openai/apps-sdk-ui/tree/0f00143c7a639906f1621fe58e1b6be7b5bea46d)：[semantic](https://github.com/openai/apps-sdk-ui/blob/0f00143c7a639906f1621fe58e1b6be7b5bea46d/src/styles/variables-semantic.css)、[primitive](https://github.com/openai/apps-sdk-ui/blob/0f00143c7a639906f1621fe58e1b6be7b5bea46d/src/styles/variables-primitive.css)、[MIT许可](https://github.com/openai/apps-sdk-ui/blob/0f00143c7a639906f1621fe58e1b6be7b5bea46d/LICENSE)。此公开体系不等于私有Intelligent UI全部官方设计规范。

## 已证实的公开语义基线

| 角色 / 本库变量 | 亮色 | 深色 | 公开参考映射 |
| --- | --- | --- | --- |
| 背景 `bg` / `surface-primary` | #ffffff | #212121 | surface |
| 次级 / 三级背景 | #f9f9f9 / #f3f3f3 | #181818 / #131313 | surface-secondary / tertiary |
| 主 / 次 / 三级文字 | #0d0d0d / #5d5d5d / #8f8f8f | #ffffff / #afafaf / #8f8f8f | text / secondary / tertiary |
| 分隔线 `line` | rgb(13 13 13 / 10%) | rgb(255 255 255 / 12%) | border |
| 聚焦 `focus` | #0169cc | #0285ff | ring：blue500 / blue400 |
| 信息文字 `info` | #0169cc | #66b5ff | text-info：blue500 / blue200 |
| 成功 `success` | #00692a | #04b84c | text-success：green700 / green400 |
| 错误 `danger` | #911e1b | #e02e2a | text-danger：red700 / red500 |
| 警告 `warning` | #923b0f | #e25507 | text-warning：orange700 / orange500 |
| 普通按钮 hover / active | 主文字2% / 4% | 白色4% / 6% | primary-outline |
| 禁用背景 / 边框 | 主文字5% / 6% | 白色5% / 6% | disabled |
| 禁用文字 | #8f8f8f | #5d5d5d | gray400亮 / gray500深 |
| 实心提交按钮 normal / hover / active | #181818 / #303030 / #414141 | #f3f3f3 / #ededed / #dcdcdc | primary-solid |

信息/成功/错误/警告柔和背景亮色分别取公开blue50/green50/red50/orange50。深色采用对应公开alpha50；柔和背景上的文字单独使用SDK soft文本色。深色选择alpha背景是本库可读性选择，不声称与参考站逐像素一致。

## 静态观察与原创角色映射

| 角色 | 亮色 | 深色 | 依据与边界 |
| --- | --- | --- | --- |
| 链接 `link` | #339cff | #99ceff | 静态观察：非extension宿主link-foreground → app text-accent → blue300 / blue100 |
| 强调 `accent` | #339cff | #99ceff | 同一非extension宿主app text-accent链；不能把原图红色重点推成全局accent |
| 控件选中 `selection` | #0285ff | #0285ff | 采用公开info-solid蓝；与焦点轮廓分开 |
| 图表蓝 | #339cff | #339cff | 静态观察：非extension宿主charts-blue → app accent-blue → blue300 |
| 图表绿 | #008635 | #40c977 | green600 / green300 |
| 图表橙 | #b9480d | #ff8549 | orange600 / orange300 |
| 图表红 | #e02e2a | #ff6764 | red500 / red300 |
| 图表紫 | #8046d9 | #ad7bf9 | purple500 / purple300 |
| 图表灰 | #767676 | #afafaf | gray450亮 / gray700深 |

图表蓝、link和accent有上述非extension宿主条件下的变量链证据；extension分支改用VS Code宿主变量，不在本库模仿范围。其他系列使用公开基础色，具体色阶/顺序仍为原创近似。天气温度用橙、降水用蓝，球队文字标识用系列色；错误、获胜、进行中等状态用语义色。不得把focus蓝替换所有用途。`content-blue`是另一条brand蓝链（亮#3566f0、深#81a6f9，默认l a b通道），并非链接或图表蓝。捕获的app border-focus还有亮blue300、现代浏览器深色blue300 70%透明的宿主覆盖；本库焦点有意采用上表公开SDK控件基线，不宣称它等于所有宿主焦点。旧 `--iui-blue` 等仅作为系列色别名保留，不再控制链接/错误/聚焦；旧自选 #356fad / #8ab4e7 已从源码移除。

[完整机器可读数值表](color-tokens.json)与浏览器computedStyle测试对应。样例同时展示背景、文本、链接、语义状态、六色图表、可聚焦/选中/禁用控件。源码每个主题只有一处token定义，auto深色使用同一组值。

## 观察边界与排版

静态观察中，同名surface/text变量在不同嵌入应用与主题出现不同候选值，不能抽取一个值称作所有私有组件的统一规范。已看到的原参考截图只有亮色，提供中性白底、细灰线、开放指标排版与红色重点的视觉证据；没有深色像素一致的证据。私有捕获文件、源码和原截图不随本库分发。

4px为间距单位；16/24、14/20、12/18为正文和辅助文字字号/行高，字重400/500/600/700。默认相邻块8px；标题后一般16px，标题后正文/列表8px；连续正文及caption后正文0px，caption前4px，分隔线相邻16px。label到控件2px、hint4px、操作6px。JSON明确的gap/padding覆盖关系默认值。

指标默认开放排版，`metric.variant:"card"`可显式选卡片。天气120px图高、64px日期最小宽、28px日期图标是局部规格。中文使用系统无衬线后备字体，CI使用发行源Noto CJK；数学用独立MIT KaTeX字体。没有复制商业或私有字体。
