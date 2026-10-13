import type {NbaScoresNode,SoccerGamesNode,AmericanFootballGamesNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {flightInstant} from './travel-events.js';
import {validTimezone} from './extensions.js';
export type MatchScoresNode=NbaScoresNode|SoccerGamesNode|AmericanFootballGamesNode;
export function inspectMatchScores(node:MatchScoresNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string)=>boolean):void {
  const issue=(code:string,at:string,message:string)=>add({code,path:at,message});
  const source=(value:{url:string}|undefined,at:string)=>{if(value&&(!/^https?:\/\//i.test(value.url)||!safeURL(value.url)))issue('UNSAFE_URL',at+'/source/url','Use a safe absolute HTTP(S) source.');};
  const time=(value:string|null|undefined,at:string)=>{if(value!==undefined&&value!==null&&!Number.isFinite(flightInstant(value)))issue('SCORE_TIME',at,'Use a real Gregorian timestamp with an explicit offset.');};
  const ids=(rows:readonly {id:string}[],at:string)=>{const seen=new Set<string>();rows.forEach((row,i)=>{if(seen.has(row.id))issue('DUPLICATE_ID',`${at}/${i}/id`,'IDs must be unique within the supplied collection.');seen.add(row.id);});};
  if(!validTimezone(node.timezone))issue('TIMEZONE',path+'/timezone','Use a supported IANA timezone.');
  source(node.source,path);time(node.observedAt,path+'/observedAt');ids(node.teams,path+'/teams');ids(node.games,path+'/games');
  const teams=new Set(node.teams.map(team=>team.id));
  node.games.forEach((game,i)=>{
    const at=`${path}/games/${i}`;time(game.startsAt,at+'/startsAt');source(game.source,at);
    for(const key of['homeTeamId','awayTeamId']as const)if(!teams.has(game[key]))issue('SCORE_TEAM',at+'/'+key,'Reference a supplied team.');
    if(game.homeTeamId===game.awayTeamId)issue('SCORE_TEAM',at+'/awayTeamId','Home and away teams must be different.');
    const participant=(teamId:string|null,p:string)=>{if(teamId!==null&&teamId!==game.homeTeamId&&teamId!==game.awayTeamId)issue('SCORE_PARTICIPANT',p,'Reference one of this game\'s two teams.');};
    if('leaders'in game){ids(game.periods,at+'/periods');ids(game.leaders,at+'/leaders');game.leaders.forEach((leader,j)=>participant(leader.teamId,`${at}/leaders/${j}/teamId`));}
    else{
      ids(game.events,at+'/events');game.events.forEach((event,j)=>participant(event.teamId,`${at}/events/${j}/teamId`));
      if('possessionTeamId'in game){
        ids(game.periods,at+'/periods');participant(game.possessionTeamId,at+'/possessionTeamId');
        const periods=new Set(game.periods.map(period=>period.id)),positions=new Set<string>();
        game.periods.forEach((period,j)=>{const position=period.kind+':'+period.number;
          if(period.kind==='quarter'&&period.number>4)issue('FOOTBALL_QUARTER',`${at}/periods/${j}/number`,'A regulation quarter is numbered 1 through 4.');
          if(positions.has(position))issue('FOOTBALL_PERIOD',`${at}/periods/${j}/number`,'Each quarter or overtime number must be unique.');positions.add(position);
        });
        game.events.forEach((event,j)=>{if(event.periodId!==null&&!periods.has(event.periodId))issue('FOOTBALL_PERIOD',`${at}/events/${j}/periodId`,'Reference a supplied period in this game, or use null.');});
      }
    }
  });
}
