# 图表与真实坐标

此页对应开发分支的数值图表增量。当前CDN锁定提交包含本页合同；仍须成套使用相同提交的Schema、JS和CSS。未完成的表单、天气等领域组件不因这次图表提交而成为已支持能力。

```json
{
  "version": "iui/1",
  "body": [{
    "type": "chart",
    "kind": "line",
    "xScale": "linear",
    "xKey": "distance",
    "xLabel": "距离 (m)",
    "unit": "V",
    "data": [
      { "distance": 0, "voltage": 1 },
      { "distance": 1, "voltage": 2 },
      { "distance": 100, "voltage": 3 }
    ],
    "series": [{ "key": "voltage", "label": "合成电压" }]
  }]
}
```

第二个点位于全程的 1%，不是横轴的中间。省略 `xScale` 时保留原有 `category` 等距分类行为，因此已有文档仍可渲染。

| 属性 | 含义 |
| --- | --- |
| `kind` | `line`、`bar`、`scatter`、`area`、`donut` |
| `xScale` | `category` 默认等距分类；`linear` 使用有限数值；`time` 使用带时区偏移的 ISO 时间或 Unix 毫秒 |
| `xMin` / `xMax` | 可选数值域；不能裁掉已提供的观察值。时间轴也使用 Unix 毫秒边界 |
| `timezone` | 时间标签使用的 IANA 时区，默认 UTC |
| `xLabel` | 数据表的横轴列标题，适合携带单位 |
| `yMin` / `yMax` | 显式纵轴域；库拒绝域外观察值 |
| `status` | `ready` 默认、`loading` 或 `error`；只描述调用方提供的状态，不触发联网 |
| `message` | 可选状态说明；没有有效观察值时显示空状态 |

`line`、`area` 与 `bar` 的数值/时间 X 必须严格递增；`scatter` 允许无序或重复 X，但必须指定 `linear` 或 `time`。缺测 Y 需写 `null`，线和面积在这里断开。空数组、全缺测与单点都有明确显示。

`donut` 使用一列非负数据与分类标签，不接受坐标范围。比例直接来自原数值；零总量显示空状态，缺测保留在数据表中。当前没有堆叠、缩放、框选、数据导出或运行时切换图种。

系列开关、可展开数据表均支持键盘。图形获得焦点后，左右键逐点查看，Home/End 到首尾。数值显示仅消除机器浮点尾数，计算与 SVG 坐标保持原精度。

完整可复用例子：[numeric-charts.json](../examples/numeric-charts.json)。它包含五种图形、不等距/负值/缺测、单点、空/加载/错误状态，可直接纳入后续统一组件 Demo。
