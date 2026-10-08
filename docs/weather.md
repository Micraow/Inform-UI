# 天气视图：数据由调用方提供

`weather` 是独立的领域组件，提供地点、更新时间、当前观测、逐日预报、逐小时曲线/数据表。℃/℉、日期、温度/降水概率及图表/表格切换都在本地完成，不查询天气服务，也不自动刷新。

完整原创例子：[weather.json](../examples/weather.json)。它刻意使用合成数据覆盖跨日与夏令时，不能当成实时天气预报。

| 字段 | 约定 |
| --- | --- |
| `location` | `{ name, timezone }`，时区为有效 IANA 名称 |
| `updatedAt` | 这批数据的更新时间，ISO 时间且带 `Z` 或明确偏移 |
| `source` | `{ label, synthetic, url? }`，明确数据来源和是否合成 |
| `units.temperature` | 原始数据单位：`celsius` 或 `fahrenheit`；切换始终从原值换算 |
| `current` | 观测 `time`、`temperature`、`condition`；可选 `feelsLike` 与 `humidity` |
| `daily` | 当地日历 `date`、`low`、`high`、`condition`、`precipitationProbability` |
| `hourly` | 带时区偏移的 `time`、`temperature`、`precipitationProbability` |
| `status` / `message` | `ready` 默认、`loading`、`error` 与可选状态说明 |
| `initialDate` | 可选，必须是提供的逐日日期之一 |

温度、湿度或降水概率未知时用 `null`；湿度与降水概率单位为百分比 `0–100`，`0` 不代表缺测。日期必须递增且不重复；逐小时顺序根据真实时间，而不是本地时钟文字。夏令时出现两次 `01:00` 时，数据表和读数保留各自偏移。

状态测试文档见 [weather/states.json](../examples/weather/states.json)。它们可直接作为后续统一组件 Demo 的可编辑 JSON 输入。旧固定 CDN 只支持其对应 Schema；新节点在浏览器矩阵和截图验收通过后才会更新到新的固定入口。
