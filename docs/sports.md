# 体育：调用方供数的赛程、记分牌与积分榜

开发分支新增 `sports-schedule`、`sports-scoreboard`、`sports-standings`，共用一个 `data` 对象。它们是独立的领域视图，支持本地筛选、比赛详情、记分牌切换和积分榜排序。旧7c490585 CDN不含这三个节点；当前固定46节点入口与实际加载验收见[CDN文档](cdn.md)。

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
