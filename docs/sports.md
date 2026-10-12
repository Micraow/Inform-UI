# 体育：调用方供数的赛程、记分牌与积分榜

开发分支新增 `sports-schedule`、`sports-scoreboard`、`sports-standings`，共用一个 `data` 对象。它们是独立的领域视图，支持本地筛选、比赛详情、记分牌切换和积分榜排序。旧7c490585 CDN不含这三个节点；当前固定50节点入口与实际加载验收见[CDN文档](cdn.md)。

[完整原创 JSON](../examples/sports.json) · [状态样本](../examples/sports/states.json) · [正式 Schema](../src/schema/iui.schema.json)

## 最小例子

```json
{
  "version": "iui/1",
  "body": [{
    "type": "sports-scoreboard",
    "data": {
      "league": {"id": "demo", "name": "合成示例杯", "sport": "football"},
      "timezone": "Asia/Shanghai",
      "updatedAt": "2026-10-08T18:00:00+08:00",
      "source": {"label": "原创教学数据", "synthetic": true},
      "teams": [{"id": "a", "name": "甲队"}, {"id": "b", "name": "乙队"}],
      "games": [{"id": "g", "startAt": "2026-10-08T19:00:00+08:00", "homeTeam": "a", "awayTeam": "b", "status": "scheduled", "homeScore": null, "awayScore": null}]
    }
  }]
}
```

## 共享数据合同

- `league`：`id`、`name`、`sport`（football / basketball / baseball / hockey / other），可选 `season`。
- `timezone`：明确的 IANA 时区。`updatedAt` 与比赛 `startAt` 是含 UTC 偏移的时间戳。日期分组按指定时区，夏令时重复小时会显示偏移。
- `source`：`label`、`synthetic`，可选安全的 `url`。合成数据明确标记；来源链接不会自动请求。
- `teams`：最多100队，唯一 `id`、`name`，可选 `shortName`、六色语义 `color`。图形标识是原创文字缩写，无商标图片下载。
- `games`：最多300场，唯一 `id`、`startAt`、`homeTeam`、`awayTeam`、`status`、`homeScore`、`awayScore`。参赛队必须存在且不同；分数为非负整数或 `null`。
- `standings`：可选，最多100行。`teamId`、`rank`、`played`、`won`、`drawn`、`lost`、`points` 必填。除名次外允许 `null`；积分可为负数，保留来源给出的扣分。可选 `group`、`for`、`against`、`note`。

比赛状态为 `scheduled` / `live` / `final` / `postponed` / `cancelled`。未开赛必须用 `null` 分数；进行中的真实 0:0 保留零。已结束仍可有缺测比分，不补零。延期或取消可能保留中断前的分数，不自动推断比赛结果。

可选比赛详情：`period`、`clock`、`stage`、`venue`、`neutral`、`detail`；`periodScores` 是 `{label,home,away}` 数组，`tieBreak` 是同形对象，`stats` 是同形数组（统计值可为字符串、数值或null）。同一数组内标签不重复。加赛/点球只属于进行中或已结束场次；`winnerTeamId` 仅适用于已结束比赛且必须是参赛队。

库不推断不同联赛的赛制、计时、总分规则、胜负或排名：例如点球、弃权、两回合总比分都可能需要调用方明确解释。分节值可以缺测，不强求其和等于总比分。已知胜/平/负之和不得超过场次，三项全知时必须相等。每个视图内每队只能有一条积分记录；不同赛季/联赛用独立节点表示。

## 交互与状态

- 赛程按实际时间排序，按当地日期分组；日期、球队、阶段可组合筛选。原生详情组件可键盘展开，包含完整带偏移时间。可选 `initialDate`（允许无比赛日期）、`initialTeamId`、`initialStage`。
- 记分牌通过原生选择器切换比赛；可选 `gameId`，否则优先首场进行中比赛，再取时间最早一场。主客队、明确获胜标记、分节和统计分开展示。
- 积分榜可选 `initialTeamId` / `initialGroup`。名次与各数值列可排序，保留数据源的并列名次；缺测总在末尾，相同值稳定排序。窄屏表格在有名称且可聚焦的区域内横向滚动。
- 三种节点都接受 `status: ready | loading | error` 及可选 `message`。空数据/无匹配有单独可读提示。loading/error 隐藏控件、分别暴露 busy/status 或 alert。
- 筛选与排序属于视图状态，不改全局 `state`；`controller.update` 接收新的完整快照并重置局部选择，`dispose` 移除事件。库不轮询、不倒计时、不自动联系体育数据服务。

## 支持边界与校验

当前覆盖上述三个领域视图，不包含球员档案、逐球事件、投篮图、完整 box score、淘汰赛树、赛车圈速或赛道动画。一个带统计表的记分牌不代表这些组件已完成。

语义诊断：`SPORTS_ID`、`SPORTS_TEAM`、`SPORTS_DATE`、`SPORTS_STATUS`、`SPORTS_RESULT`、`SPORTS_PERIOD`、`SPORTS_STAT`、`SPORTS_RECORD`、`SPORTS_FILTER`，以及共用 `TIMEZONE` / `UNSAFE_URL`。结构错误仍返回 `SCHEMA`。所有错误沿用 `{code,path,message}`，非法更新不会替换当前页面。

## 源模块与精确校验边界

`sports/model` 维护原有三个节点及其共享 `SportsData` 定义，依赖 `shared/value`。这套历史 sports 数据合同与 `sports/match-scores` 的 supplied 比分合同不同；不得互相套用状态、URL、时间或 ID 限制。选定结构 Schema 后仍须运行未改动的完整 `validateDocument`。

- `short` 字段（如球队名、联赛名、来源名、分组、阶段、period/统计 label）长度为1–200，但没有额外 trim/nonblank 语义检查。`shortName` 为1–16。可选 venue（≤300）、detail（≤3000）、standing note（≤500）、message（≤12000）及 stats 字符串（≤200）可为空。
- 球队、比赛、联赛和引用使用既有 `key` 正则，不替换为较严格的 `suppliedKey`。它以 ASCII 字母或下划线开头，后接至多79个 ASCII 字母、数字、下划线、点或连字符；保持原正则字面定义；当前 JavaScript/AJV 校验拒绝尾随换行符。引用按原字符串精确匹配。可选节点 id 沿用1–200字符及文档内唯一规则。
- 球队 ID、比赛 ID 各在自己的列表唯一。periodScores label、stats label 各在每场自己的列表唯一；不同列表可以重用标签。standing 每队只出现一次，rank 为1–10000整数，允许并列。比分、场次、胜平负、进失球为0–1000000整数或 null；points 为数值或 null，可为负或小数。stats 数值不限定为整数。
- 只有 scheduled 主客总分必须同时为 null；不要求其他状态分数非空。只有明确的 `winnerTeamId` 要求 final 且为该场参赛队，比分本身不会推断赢家。tieBreak 只允许 live/final；periodScores 没有该状态限制，也不要求各期求和等于总分。
- played 非 null 时，已知 won/drawn/lost 之和不可大于 played；三者均已知则必须相等。played 为 null 时不作该求和检查。不校验 points 与胜平负的计分公式。
- `updatedAt`/`startAt` 使用既有 timestamp helper：真实 `YYYY-MM-DD` 日期、显式 `Z` 或偏移，分钟后允许秒及1–3位小数秒，且须被 JavaScript 日期解析为有限值。这里不套用 `flightAt` 的1000年起点、仅分钟或14小时偏移上限；例如 `+15:00` 保留历史可解析行为。`initialDate` 必须通过真实日期回读检查，但可以没有对应比赛。时区由运行环境的 `Intl.DateTimeFormat` 识别。
- 初始球队、比赛、阶段、分组必须引用已有相应内容。来源 URL 可省略或为空；非空时使用通用安全链接策略，允许安全的 HTTP(S)、受限 mailto/tel 或片段，不额外要求 HTTP(S)。不会请求来源、校验来源真实性或推断更新时间与开赛时间先后。
