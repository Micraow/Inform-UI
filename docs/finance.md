# 金融快照、历史走势与共同基准比较

这是原创、纯本地的数据展示合同。调用方提供来源、时间和市场状态；库不连接行情服务，不推断实时性，不提供交易动作。示例均为合成数据，不构成投资建议。

开发分支新增 `finance-quote`、`finance-chart`、`finance-comparison`。它们尚未包含在固定f372c71的46节点CDN里；源代码构建使用当前49节点Schema。49节点源55bfa57已通过[浏览器CI](https://github.com/Micraow/Intelligent-UI/actions/runs/37870264183)和亮暗截图复核；新的金融CDN入口仍待独立实载验收。

[完整合成JSON](../examples/finance.json) · [Schema](../src/schema/iui.schema.json)

## 数据字段

三个节点均接受 `source:{label,synthetic,url?}`、可选 `title`、`status:ready|loading|error`、`message`。

`instrument`（行情/历史），或 `instruments` 数组（比较，2至6个）包含：

- `id`、`symbol`、`name`、`currency`（3个大写字母）、可选 `exchange`。
- `timezone`：IANA时区；`asOf`：含明确UTC偏移的真实日历时间戳。
- `marketStatus`：open / closed / pre / post / halted / unknown。它是数据源声明，不是本地时钟推断。
- `delayMinutes`：明确声明的延迟分钟数，0至10080。0显示“声明延迟0分钟”，不承诺实时。
- `price`、`previousClose`：非负有限数值或null；零是有效价格。
- `history`：最多500个 `{time,price}`，按实际时间严格递增，不能重复，也不能晚于asOf。null是缺测，折线保留断口。

行情变动为price−previousClose；只有previousClose>0时才计算百分比。缺测或零基准不伪造百分比，页面会明确说明。数据域过大导致定义好的变化百分比溢出时，校验拒绝。

## 范围与比较

历史/比较节点必须给 `ranges`（可空数组），每项 `{id,label,from,to}`。区间包含两端；from=to可选择单点。可选 `initialRange` 必须引用其中一个id。空ranges表示全部观测；选择没有观测的范围显示空态，不下载或合成数据。

比较节点还要求 `baselineAt`，可选 `timezone`（轴默认UTC）。每个系列用历史中与该时刻完全相同的正价格归一化为 `(price / baseline - 1) × 100%`。不同UTC偏移表达同一瞬间时视为同一时刻。找不到基准、基准缺测或为零的系列明确不可比，不借用临近日期。

比较只展示各自币种内相对同一时刻的百分比；不把不同币种绝对价格放在同一数值轴上，不做汇率换算。基准可以位于当前显示区间之外，仍会明确标注。调用方须自行说明拆股、复权和数据调整；库不会隐式改写历史。

## 页面行为与边界

范围按钮、系列开关、本地键盘游标及完整数据表由库实现；X轴按真实时间距离，不按索引等距。隐藏系列不删数据表里的观测。未知值、空数据、只有一个点、所有系列隐藏、加载和错误分别有可读状态。来源、合成标记、asOf、市场状态与延迟可见。窗口宽度变化、重复交互保留焦点；update重建快照，dispose清理事件。

当前不包含K线、成交量双轴、技术指标、交易下单或外汇换算。[热图](heatmap.md)使用独立合同推进验收，不把折线比较视为热图完成。

语义错误包括 `FINANCE_DATE`、`FINANCE_ORDER`、`FINANCE_ID`、`FINANCE_RANGE`、`FINANCE_VALUE`，并沿用 `TIMEZONE` / `UNSAFE_URL` 和结构错误 `SCHEMA`。
