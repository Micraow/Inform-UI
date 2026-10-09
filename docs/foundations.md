# 富文本、网格与结构化表格

这是开发中的54节点候选合同。新增字段和两个节点已接入源码、本地类型与测试；真实浏览器验收和新的固定CDN尚未完成。当前6797固定版本仍为52节点，不接受这里的扩展输入。

## 富文本

`text` 选择 `value` 或 `runs`，不能同时提供。旧的纯文本/表达式 `value` 保持兼容。

```json
{"type":"text","runs":[
  {"value":"命中率 ","bold":true},
  {"value":{"$":"rate"}},
  {"value":"cache_hit","code":true},
  {"value":"来源","href":"https://example.com/"}
]}
```

每段必须有 `value`，允许现有受约束表达式。可选 `bold`、`italic`、`underline`、`strike`、`code` 为布尔值，可组合；`href` 遵守普通链接相同的URL规则。文本始终转义，不接收HTML或事件。

`text`、`title`、`caption` 还可对整段设置 `italic`、`underline`、`strike`；原有语义色、字重和对齐保留。`shimmer:true` 是装饰性微光，不改变文字内容、不代表服务已连接，也不自动设置加载状态；减少动态效果时停止动画。

`code` 新增 `inline:true`，输出行内代码元素。默认仍是原来的预格式化代码块；暂未添加语法高亮、复制按钮或执行能力。Markdown仍为明确的纯文本降级，与这些显式结构独立。

## 引用与网格

`blockquote` 包含1–30个 `children`，可提供 `attribution` 和受限URL `cite`。来源由作者提供，组件不检索或验证出处；带来源的署名会形成可访问的普通链接。

`grid` 仍为1–6列，默认2列；新增 `mobileColumns`，在520px及以下生效，默认1列。`grid-item` 只能作为grid的直接子节点，包含1–30个children；桌面 `colSpan` 默认1、上限为父grid列数，`rowSpan` 默认1、上限20。窄屏 `mobileColSpan` 默认1、上限为父grid的mobileColumns；行跨度恢复自动。DOM阅读顺序保持作者顺序，没有密集重排或瀑布流。

可直接查看[合成示例JSON](../examples/foundations.json)。

## 结构化表格

表格保持 `columns` 必填（1–20个列名），并选择 `rows` 或 `sections`，不能同时提供。旧rows的每格标量/表达式继续支持。新单元格对象形如：

```json
{"value":"实验组A","header":true,"rowSpan":2,"colSpan":1,"align":"start"}
```

`value` 必填；`rowSpan` 为1–200，`colSpan` 为1–20，默认都是1。`header:true` 输出表头格；`align` 可为start/center/end。空值null是一个真实空格，0显示为0，不会互换。

sections有1–12段，按可选head、一个或多个body、可选foot排列。每段包含 `kind` 与二维 `rows`。head替代columns自动表头；未提供head时仍使用columns。所有段总计最多200个输入行。

每格按从左向右的首个空列放置，跨行/跨列矩形必须全部落在本段内。不得交叠、超宽、跨段或留下逻辑缺格。被先前rowSpan完全覆盖的行可以写空数组，其他空行不合法。组件不补格、不猜测合计或重排数据。

head内的所有格都是列头，默认scope为col；body/foot的header格默认scope为row，只关联其右侧且行范围重叠的单元格。可显式指定rowgroup，但必须从本段首行跨完整段。暂不提供colgroup。多层列头使用colSpan与自动生成的headers关联，不假造列组语义。

原生table/caption/thead/tbody/tfoot保留语义。所有数据格会引用适用的列头和同组左侧行头，header ID在不同实例及更新之间唯一。横向内容溢出时局部滚动，区域可用Tab聚焦及原生方向键滚动；没有伪装成可编辑grid。表格规则参考[HTML标准](https://html.spec.whatwg.org/multipage/tables.html)，视觉是采用项目tokens的原创实现。

`status` 可为ready/loading/error，默认ready；`message` 可覆盖默认状态文案。非ready时保留实际caption/表头，隐藏数据体；ready无数据时显示明确空态。所有示例均由调用方提供，组件不连接数据服务。

完整[结构化表格JSON](../examples/structured-tables.json)展示多层列头、跨行组、第二tbody和显式footer。常见错误码：TABLE_SOURCE、TABLE_SECTION、TABLE_LIMIT、TABLE_WIDTH、TABLE_SPAN、TABLE_OVERLAP、TABLE_SCOPE；非法状态引用和URL继续走共用校验。

## 验收边界

本阶段一起修正学习组件可见解释被aria-live重复展示的问题：播报区域继续保留，但视觉隐藏；这不是人工屏幕阅读器兼容性测试通过声明。基础增强需完成390/768/1100明暗、键盘、减少动态效果、表格真实布局和CDN验收后才进入已验计数。旧的52节点盲测输入与固定资产不改。
