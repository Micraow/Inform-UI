import type {BasketballTournamentNode,ElectionResultsNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {flightInstant} from './travel-events.js';

export function inspectSuppliedResults(node:BasketballTournamentNode|ElectionResultsNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string)=>boolean):void {
  const issue=(code:string,at:string,message:string)=>add({code,path:at,message});
  const source=(value:{url:string}|undefined,at:string)=>{if(value&&(!/^https?:\/\//i.test(value.url)||!safeURL(value.url)))issue('UNSAFE_URL',at+'/source/url','Use a safe supplied absolute HTTP(S) source.');};
  const time=(value:string|undefined,at:string)=>{if(value!==undefined&&!Number.isFinite(flightInstant(value)))issue('RESULT_TIME',at,'Use a real supplied Gregorian offset timestamp.');};
  const ids=(rows:readonly {id:string}[],at:string)=>{const seen=new Set<string>();rows.forEach((row,i)=>{if(seen.has(row.id))issue('DUPLICATE_ID',`${at}/${i}/id`,'IDs must be unique in the supplied collection.');seen.add(row.id);});};
  source(node.source,path);time(node.observedAt,path+'/observedAt');
  if(node.type==='election-results'){
    ids(node.contests,path+'/contests');node.contests.forEach((contest,i)=>{const at=`${path}/contests/${i}`;source(contest.source,at);time(contest.observedAt,at+'/observedAt');ids(contest.candidates,at+'/candidates');contest.candidates.forEach((candidate,j)=>source(candidate.source,`${at}/candidates/${j}`));});
    return;
  }
  ids(node.teams,path+'/teams');ids(node.rounds,path+'/rounds');
  const teamIds=new Set(node.teams.map(team=>team.id)),matches=new Map<string,number>();
  node.rounds.forEach((round,i)=>round.matches.forEach((match,j)=>{const at=`${path}/rounds/${i}/matches/${j}`;if(matches.has(match.id))issue('DUPLICATE_ID',at+'/id','Match IDs must be unique across supplied rounds.');else matches.set(match.id,i);}));
  node.rounds.forEach((round,i)=>round.matches.forEach((match,j)=>{
    const at=`${path}/rounds/${i}/matches/${j}`;source(match.source,at);time(match.startsAt,at+'/startsAt');
    const participants=new Set<string>();
    match.participants.forEach((participant,k)=>{if(participant.teamId===null)return;const p=`${at}/participants/${k}/teamId`;if(!teamIds.has(participant.teamId))issue('RESULT_TEAM',p,'Reference a supplied team or use null for an unknown participant.');if(participants.has(participant.teamId))issue('RESULT_PARTICIPANT',p,'A known team cannot occupy both supplied participant slots.');participants.add(participant.teamId);});
    if(match.winnerTeamId!==null&&!participants.has(match.winnerTeamId))issue('RESULT_WINNER',at+'/winnerTeamId','A supplied winner must be one of the known match participants.');
    if(match.advancesTo!==undefined){const target=matches.get(match.advancesTo);if(target===undefined||target<=i)issue('RESULT_ADVANCE',at+'/advancesTo','A supplied progression reference must target a match in a later supplied round.');}
  }));
}
