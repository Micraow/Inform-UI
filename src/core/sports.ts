import type {Node} from '../schema/document.js';
import type {Issue} from './index.js';
import {timestamp,validDate,validTimezone} from './extensions.js';
export type SportsNode=Extract<Node,{type:'sports-schedule'|'sports-scoreboard'|'sports-standings'}>;
export function isSports(node:Node):node is SportsNode{return node.type==='sports-schedule'||node.type==='sports-scoreboard'||node.type==='sports-standings';}
/** Validate identity and supplied facts; never manufacture a league's scoring or ranking rules. */
export function inspectSports(node:SportsNode,path:string,add:(issue:Issue)=>void,safeURL:(value:string)=>boolean){
  const error=(code:string,sub:string,message:string)=>add({code,path:path+sub,message}),d=node.data;
  if(!validTimezone(d.timezone))error('TIMEZONE','/data/timezone','Use a recognized IANA time zone.');
  if(!Number.isFinite(timestamp(d.updatedAt)))error('SPORTS_DATE','/data/updatedAt','Supply a valid update timestamp with an explicit offset.');
  if(d.source.url&&!safeURL(d.source.url))error('UNSAFE_URL','/data/source/url','Source URL is outside the allowed policy.');
  const teams=new Set<string>();d.teams.forEach((team,i)=>{if(teams.has(team.id))error('SPORTS_ID',`/data/teams/${i}/id`,'Team ids must be unique.');teams.add(team.id);});
  const games=new Set<string>();d.games.forEach((game,i)=>{
    const p=`/data/games/${i}`;
    if(games.has(game.id))error('SPORTS_ID',p+'/id','Game ids must be unique.');games.add(game.id);
    for(const side of ['homeTeam','awayTeam'] as const)if(!teams.has(game[side]))error('SPORTS_TEAM',p+'/'+side,'Game participants must reference supplied teams.');
    if(game.homeTeam===game.awayTeam)error('SPORTS_TEAM',p,'A game needs two distinct teams.');
    if(!Number.isFinite(timestamp(game.startAt)))error('SPORTS_DATE',p+'/startAt','Game startAt must be a valid timestamp with offset.');
    if(game.status==='scheduled'&&(game.homeScore!==null||game.awayScore!==null))error('SPORTS_STATUS',p,'An unstarted game uses null scores, not placeholder zeroes.');
    if(game.winnerTeamId!==undefined&&(game.status!=='final'||![game.homeTeam,game.awayTeam].includes(game.winnerTeamId)))error('SPORTS_RESULT',p+'/winnerTeamId','An explicit winner must be a participant in a final game.');
    if(game.tieBreak!==undefined&&!['live','final'].includes(game.status))error('SPORTS_STATUS',p+'/tieBreak','Tie-break observations belong to live or final games.');
    const labels=new Set<string>();game.periodScores?.forEach((period,j)=>{if(labels.has(period.label))error('SPORTS_PERIOD',p+`/periodScores/${j}/label`,'Period labels must be unique.');labels.add(period.label);});
    const statLabels=new Set<string>();game.stats?.forEach((stat,j)=>{if(statLabels.has(stat.label))error('SPORTS_STAT',p+`/stats/${j}/label`,'Stat labels must be unique.');statLabels.add(stat.label);});
  });
  const standings=new Set<string>();d.standings?.forEach((row,i)=>{
    const p=`/data/standings/${i}`;if(!teams.has(row.teamId))error('SPORTS_TEAM',p+'/teamId','Standing rows must reference supplied teams.');
    if(standings.has(row.teamId))error('SPORTS_ID',p+'/teamId','A team can have one supplied standing row per view.');standings.add(row.teamId);
    const outcomes=[row.won,row.drawn,row.lost];if(row.played!==null){const known=outcomes.filter((v):v is number=>v!==null).reduce((a,b)=>a+b,0);if(known>row.played||(outcomes.every(v=>v!==null)&&known!==row.played))error('SPORTS_RECORD',p,'Known wins, draws and losses cannot exceed played; complete records must sum to played.');}
  });
  if('initialTeamId'in node&&node.initialTeamId!==undefined&&!teams.has(node.initialTeamId))error('SPORTS_FILTER','/initialTeamId','Initial team must reference supplied teams.');
  if(node.type==='sports-scoreboard'&&node.gameId!==undefined&&!games.has(node.gameId))error('SPORTS_FILTER','/gameId','Scoreboard gameId must reference a supplied game.');
  if(node.type==='sports-schedule'){
    if(node.initialDate!==undefined&&!validDate(node.initialDate))error('SPORTS_DATE','/initialDate','Initial date must be a valid calendar date.');
    if(node.initialStage!==undefined&&!d.games.some(g=>g.stage===node.initialStage))error('SPORTS_FILTER','/initialStage','Initial stage must be supplied by a game.');
  }
  if(node.type==='sports-standings'&&node.initialGroup!==undefined&&!d.standings?.some(r=>r.group===node.initialGroup))error('SPORTS_FILTER','/initialGroup','Initial group must be supplied by a standing row.');
}
