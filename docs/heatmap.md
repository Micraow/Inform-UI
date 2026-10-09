# 金融热图：面积与颜色分别表达什么

开发分支的 `finance-heatmap` 是独立的领域视图，当前还不在固定f372c71的46节点CDN里。[完整原创合成例子](../examples/heatmap.json)。

必填字段：`source:{label,synthetic,url?}`、整体 `asOf` / `timezone`、`weightLabel`、`changeBasis`、`cells`。可选 `title`、`initialSector`、`status:ready|loading|error`、`message`。

每个cell包含唯一 `id`、`symbol`、`name`、`sector`、`weight`、`price`、`currency`、`changePercent`、`asOf`、`marketStatus`、`delayMinutes`。最多200项；权重与价格是非负数或null，涨跌幅是有限数或null，币种为3个大写字母。cell时间不能晚于整体快照，市场状态/声明延迟规则与[金融行情](finance.md)一致。

## 面积

矩形面积严格按已知正权重比例分配，使用原创矩形布局算法，按权重稳定排序。先缩放再求和，避免多个巨大有限权重相加溢出。0、null及低于数值精度无法画出的权重不获得伪造面积；全部条目仍在完整表中，页面明确说明省略范围。

`weightLabel` 是面积指标，例如“合成权重”或调用方已经统一单位的市值。库不把价格用作面积，也不自动把不同币种换算为可相加市值。调用方必须提供同口径权重。

## 色彩与原始值

颜色表示调用方给出的 `changePercent`，并用+/-文本与详情重复表达，不只依赖红绿。正值绿、负值红，0和缺测中性；色阶在±10%饱和。最高混色强度50%，保持亮暗文字可读。原始幅度（例如−100%）仍完整显示，不能从颜色饱和推断原始幅度等于±10%。

`changeBasis` 明确变化基准。库不从股票名字、时间或价格推断涨跌幅。小区域不强塞文字，采用裁切避免覆盖邻块；键盘详情和完整表保留全部名称/记录。

## 交互与状态

行业筛选只使用给定数据；方向键、Home/End逐项查看（包括无面积条目），Enter展开数据表。点选区域也会更新具名详情。当前/全体时间、来源、合成标记、市场状态和声明延迟均可读。空、全0/缺测、loading/error分别处理；没有联网、交易动作或实时更新。

`controller.update`替换快照并重置选择，非法更新保留旧界面，`dispose`清除事件。源码有面积比例/不重叠/边界、200项、极端值、键盘、重复操作及390/768/1100亮暗回归。错误沿用 `FINANCE_ID`、`FINANCE_DATE`、`FINANCE_FILTER`、`TIMEZONE`、`UNSAFE_URL`、`SCHEMA`。
