export const suppliedResultsEnglish={
  tournamentNote:'Supplied rounds only. No live feed, inferred winner, automatic advancement or scoring rule.',
  electionNote:'Supplied election snapshot only. No live feed, inferred winner, vote totals or percentages.',
  searchMatches:'Search supplied matches and teams',searchCandidates:'Search supplied candidates and affiliations',all:'All',round:'Supplied round',team:'Team',status:'Supplied status',reset:'Reset filters',unknown:'Not supplied',
  source:'Source',newTab:'opens a new tab',observed:'Supplied observation',starts:'Supplied start',winner:'Supplied winner',advance:'Supplied next match',context:'Context',noContext:'No extra context supplied.',
  noRounds:'No rounds supplied.',noMatches:'No matching supplied matches.',noRoundMatches:'No matches supplied in this round.',
  contest:'Supplied contest',noContests:'No contests supplied.',noCandidates:'No candidates supplied.',noCandidateMatches:'No matching supplied candidates.',candidate:'Candidate',party:'Supplied affiliation',votes:'Supplied votes',share:'Supplied vote share',outcome:'Supplied outcome',totalVotes:'Supplied total votes',reported:'Supplied percent reported',order:'Display order',sourceOrder:'Supplied order',nameOrder:'Candidate name',votesOrder:'Votes, highest first',shareOrder:'Vote share, highest first',
  matchStatuses:{scheduled:'Scheduled',live:'Live (supplied status)',final:'Final',postponed:'Postponed',cancelled:'Canceled',unknown:'Unknown'},
  contestStatuses:{pending:'Pending',counting:'Counting',complete:'Complete',recount:'Recount',unknown:'Unknown'},
  outcomes:{elected:'Elected (supplied)', 'not-elected':'Not elected (supplied)',unknown:'Outcome not supplied'},
  matchCount:(shown:number,total:number)=>`${shown} of ${total} supplied matches`,candidateCount:(shown:number,total:number)=>`${shown} of ${total} supplied candidates`,
};
export type SuppliedResultsLabels=typeof suppliedResultsEnglish;
export const suppliedResultsChinese:SuppliedResultsLabels={
  tournamentNote:'仅展示已提供轮次。不连接实时来源，不推断赢家，不自动晋级或应用计分规则。',
  electionNote:'仅展示已提供的选举快照。不连接实时来源，不推断赢家、票数总和或百分比。',
  searchMatches:'搜索已提供对阵和队伍',searchCandidates:'搜索已提供候选人和所属组织',all:'全部',round:'已提供轮次',team:'队伍',status:'已提供状态',reset:'重置筛选',unknown:'未提供',
  source:'来源',newTab:'在新标签页打开',observed:'提供的观测时间',starts:'已提供开始时间',winner:'已提供赢家',advance:'已提供下一场对阵',context:'详情',noContext:'未提供其他详情。',
  noRounds:'未提供轮次。',noMatches:'没有匹配的已提供对阵。',noRoundMatches:'此轮次未提供对阵。',
  contest:'已提供选区',noContests:'未提供选区。',noCandidates:'未提供候选人。',noCandidateMatches:'没有匹配的已提供候选人。',candidate:'候选人',party:'已提供所属组织',votes:'已提供票数',share:'已提供得票率',outcome:'已提供结果',totalVotes:'已提供总票数',reported:'已提供报告百分比',order:'展示顺序',sourceOrder:'提供顺序',nameOrder:'候选人名称',votesOrder:'票数，从高到低',shareOrder:'得票率，从高到低',
  matchStatuses:{scheduled:'已安排',live:'进行中（已提供状态）',final:'已结束',postponed:'已推迟',cancelled:'已取消',unknown:'未知'},
  contestStatuses:{pending:'待定',counting:'计票中',complete:'已完成',recount:'重新计票',unknown:'未知'},
  outcomes:{elected:'当选（已提供）','not-elected':'未当选（已提供）',unknown:'未提供结果'},
  matchCount:(shown,total)=>`${shown} / ${total} 场已提供对阵`,candidateCount:(shown,total)=>`${shown} / ${total} 名已提供候选人`,
};
