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

状态测试文档见 [weather/states.json](../examples/weather/states.json)。它们可直接作为后续统一组件 Demo 的可编辑 JSON 输入。旧固定CDN只支持其对应Schema；新固定入口与本页合同一起列于cdn.md，真实加载验收由该提交的CI记录。

## 可选供数展示与本地意图

原有必填快照字段、默认当前观测标题、默认摄氏/华氏来源单位、图表默认展示，以及 `weatherTemperature`、`weatherHours`、`weatherCoordinates` 三个 helper 的接口均保留。以下字段只做增量扩展；旧 JSON 无需迁移。`loading` / `error` 仍需要原快照结构，缺少快照时由父层提供等待或错误展示。

- `presentation`: `chart`（默认）、`table`、`compact`。紧凑模式展示供数摘要与来源，不提供交互入口。
- `initialUnit`、`initialMetric`: 初始显示温标与 `temperature` / `precipitation`；转换始终使用原始数值，不连续换算已显示文字。
- `useCurrent`: 初始摘要使用当前观测还是所选日期高低温。显式提供后，选择当前当地日期会显示当前观测，选择其它日期显示那一天的预报。省略时保留旧版始终显示当前观测的行为。
- `showDatePicker: false`: 隐藏日期栏，保留其他本地控件。
- `chartWindow: { points, startTime? }`: 1–48 个连续供数时刻；起始时间必须标识供数中的真实瞬间。所选日期与起点同日时从起点开始，否则从所选日期第一时刻开始。窗口可以跨午夜；数据表仍完整展示所选当地日期。省略时保留旧版整日曲线。位置按实际经过的时间计算，缺测断线、零值、夏令时重复时刻保持可辨。
- `current.description`、`daily[].label/description`、`hourly[].label/description/condition`: 直接提供展示文字及逐小时天气状况。存在逐小时描述或状况时，表格增加天气列。
- `current.temperatureLabels`、`hourly[].temperatureLabels`、`daily[].highLabels/lowLabels`: `{ celsius, fahrenheit, a11yCelsius?, a11yFahrenheit? }`。两种温标的文字均由调用方提供，作为完整展示文字，不再自动添加单位；图形几何仍只由数值决定。
- `labels`: 可覆盖 `current/hourly/daily/temperature/precipitation/conditions/time/unit/metric/view/high/low/observation/selected/chartView/tableView/missing/source/updated`。`regionLabel`、`tableDateLabel` 分别覆盖区域名与表格标题；中英文缺省文字跟随宿主语言。
- `disabled`: 禁止本地控件；`resetLabel`、`requestedLabel`、`cancelledLabel` 可覆盖重置按钮和本地请求回执。

`share: { label, available?, placement? }` 显示顶部（默认）或 `bottom` 分享入口。`locationAction: { label, available?, query? }` 显示位置请求入口。两者必须明确 `available: true` 才能触发。组件不会查询天气、获取位置、调用系统分享、写剪贴板、访问账户或记录分析事件。这里的能力字段仅允许发出本地意图，不表示已得到浏览器权限或外部服务结果。

`followUps` 以及 `daily[].followUps` 接受最多 12 个 `{ id, label, query, disabled? }`；同一组 ID 不重复。初始显示顶层问题，选择日期后显示该日问题，无该日问题时不保留旧日问题。每组只展示前三项，区域宽度低于 576px / 380px 时分别显示两项 / 一项，隐藏项不会触发请求。

三个入口统一发出 `iui:weather-action`，事件会冒泡、可取消、不跨 shadow boundary；冻结的 `detail` 包含 `id`、`intent`（`share` / `request-location` / `follow-up`）、所选 `date`、显示 `unit` 与 `metric`。位置请求可带供数 `query`；问题请求带 `actionId` 与 `query`。`preventDefault()` 会显示取消回执；接受只表示宿主接受本地请求，不宣称分享、定位或查询已经成功。

项目提供可见的本地 “Reset weather view” 按钮。它恢复初始日期、单位、指标、视图、摘要模式和问题组并清空回执，也作为原生 `form.reset()` 的稳定可见锚点。原生重置被取消时保留当前选择；稍后输入优先于待定重置。禁用、隐藏、inert、脱离原归属或已销毁的控件不能执行操作。`update` 建立新的供数视图，旧事件及待定重置不能覆盖新视图。

域源码验证见 `tests/weather-supplied.test.mjs`；原 `tests/weather.test.mjs` 继续覆盖旧接口、数值与时区。`tests/browser/weather-supplied.spec.mjs` 提供原生键盘、重置、响应式及零外部能力回归，需在允许启动浏览器的环境实际执行；测试发现列表不等同于浏览器通过记录。

The integrated keyboard follow-up filters Ctrl/Alt/Meta/Shift, composition and legacy keyCode229 inside the existing guarded admission for both date tabs and chart navigation. Original modifier/IME failures remain recorded; ordinary arrows/Home/End are unchanged.
