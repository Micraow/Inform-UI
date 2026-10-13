export const boxscoreEnglish={
  note:'Supplied boxscore only. No live feed, inferred result, scoring rules, averages or totals.',
  status:'Supplied status',observed:'Supplied observation',source:'Source',newTab:'opens a new tab',unknown:'Not supplied',
  search:'Search supplied player names and notes',team:'Team',all:'All',starterFilter:'Lineup role',starter:'Starter',bench:'Bench',unknownRole:'Role not supplied',
  order:'Player display order',sourceOrder:'Supplied order',reset:'Reset filters',descending:'highest first',ascending:'lowest first',
  player:'Player',minutes:'Minutes',points:'Points',rebounds:'Rebounds',assists:'Assists',steals:'Steals',blocks:'Blocks',turnovers:'Turnovers',plusMinus:'Plus/minus',fieldGoals:'Field goals',threePointers:'Three-pointers',freeThrows:'Free throws',
  context:'Context',noContext:'No extra context supplied.',emptyPlayers:'No player rows supplied.',noMatches:'No matching supplied players.',period:'Supplied period',periods:'Supplied period scores',noPeriods:'No period scores supplied.',score:'Supplied score',
  innings:'Supplied innings',noInnings:'No innings supplied.',batting:'Batting',bowling:'Bowling',battingOrder:'Batting display order',bowlingOrder:'Bowling display order',runs:'Runs',wickets:'Wickets',overs:'Overs (supplied text)',extras:'Extras',dismissal:'Dismissal',balls:'Balls',fours:'Fours',sixes:'Sixes',strikeRate:'Supplied strike rate',maidens:'Maidens',economy:'Supplied economy',
  statuses:{scheduled:'Scheduled',live:'Live (supplied status)',final:'Final',postponed:'Postponed',cancelled:'Canceled',unknown:'Unknown'},
  count:(shown:number,total:number)=>`${shown} of ${total} supplied players`,
};
export type BoxscoreLabels=typeof boxscoreEnglish;
export const boxscoreChinese:BoxscoreLabels={
  note:'仅展示已提供技术统计。不连接实时来源，不推断赛果、计分规则、均值或总分。',
  status:'已提供状态',observed:'提供的观测时间',source:'来源',newTab:'在新标签页打开',unknown:'未提供',
  search:'搜索已提供球员名称和备注',team:'队伍',all:'全部',starterFilter:'阵容角色',starter:'首发',bench:'替补',unknownRole:'未提供角色',
  order:'球员展示顺序',sourceOrder:'提供顺序',reset:'重置筛选',descending:'从高到低',ascending:'从低到高',
  player:'球员',minutes:'分钟',points:'得分',rebounds:'篮板',assists:'助攻',steals:'抢断',blocks:'盖帽',turnovers:'失误',plusMinus:'正负值',fieldGoals:'投篮',threePointers:'三分',freeThrows:'罚球',
  context:'详情',noContext:'未提供其他详情。',emptyPlayers:'未提供球员行。',noMatches:'没有匹配的已提供球员。',period:'已提供赛段',periods:'已提供各赛段得分',noPeriods:'未提供赛段得分。',score:'已提供比分',
  innings:'已提供局次',noInnings:'未提供局次。',batting:'击球',bowling:'投球',battingOrder:'击球展示顺序',bowlingOrder:'投球展示顺序',runs:'得分',wickets:'出局数',overs:'轮数（提供的文本）',extras:'额外分',dismissal:'出局信息',balls:'球数',fours:'四分球',sixes:'六分球',strikeRate:'已提供击球率',maidens:'零分轮',economy:'已提供失分率',
  statuses:{scheduled:'已安排',live:'进行中（已提供状态）',final:'已结束',postponed:'已推迟',cancelled:'已取消',unknown:'未知'},
  count:(shown,total)=>`${shown} / ${total} 名已提供球员`,
};
