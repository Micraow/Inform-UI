export const playerSummaryEnglish = {
  note:'Supplied player snapshots only. No live feed, inferred averages, rankings, or league rules.',
  search:'Search supplied periods and context',season:'Supplied period',all:'All',scope:'Record scope',surface:'Surface',
  order:'Display order',sourceOrder:'Supplied order',seasonOrder:'Period label (text order)',
  reset:'Reset filters',unknown:'Not supplied',empty:'No player records supplied.',noMatches:'No matching supplied records.',
  observed:'Supplied observation',source:'Source',newTab:'opens a new tab',context:'Context',noContext:'No extra context supplied.',
  team:'Team',games:'Games',minutesPerGame:'Minutes per game',pointsPerGame:'Points per game',reboundsPerGame:'Rebounds per game',assistsPerGame:'Assists per game',
  matches:'Matches',wins:'Wins',losses:'Losses',titles:'Titles',rank:'Supplied rank',
  descending:'highest first',ascending:'lowest first',
  scopes:{'regular-season':'Regular season',playoffs:'Playoffs',preseason:'Preseason',other:'Other',unknown:'Unknown'},
  surfaces:{hard:'Hard',clay:'Clay',grass:'Grass',carpet:'Carpet',other:'Other',unknown:'Unknown'},
  count:(shown:number,total:number)=>`${shown} of ${total} supplied records`,
};
export type PlayerSummaryLabels=typeof playerSummaryEnglish;
export const playerSummaryChinese:PlayerSummaryLabels = {
  note:'仅展示已提供的球员快照。不连接实时来源，不推算均值、排名或联赛规则。',
  search:'搜索已提供时期和详情',season:'已提供时期',all:'全部',scope:'记录范围',surface:'场地类型',
  order:'展示顺序',sourceOrder:'提供顺序',seasonOrder:'时期标签（文本顺序）',
  reset:'重置筛选',unknown:'未提供',empty:'未提供球员记录。',noMatches:'没有匹配的已提供记录。',
  observed:'提供的观测时间',source:'来源',newTab:'在新标签页打开',context:'详情',noContext:'未提供其他详情。',
  team:'球队',games:'场次',minutesPerGame:'场均分钟',pointsPerGame:'场均得分',reboundsPerGame:'场均篮板',assistsPerGame:'场均助攻',
  matches:'比赛场次',wins:'胜场',losses:'负场',titles:'冠军数',rank:'已提供名次',
  descending:'从高到低',ascending:'从低到高',
  scopes:{'regular-season':'常规赛',playoffs:'季后赛',preseason:'季前赛',other:'其他',unknown:'未知'},
  surfaces:{hard:'硬地',clay:'红土',grass:'草地',carpet:'地毯',other:'其他',unknown:'未知'},
  count:(shown,total)=>`${shown} / ${total} 条已提供记录`,
};
