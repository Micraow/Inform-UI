import {object,short,string,array,ref,choice,integer,suppliedKey,flightAt} from '../primitives.mjs';
/** Existing authored declarations; supplied facts and runtime semantics are unchanged. */
export function install({defs,node}){
// Original supplied tournament and election readers; no winner or progression inference.
const resultCount={anyOf:[integer(0,Number.MAX_SAFE_INTEGER),{type:'null'}]};
const resultPercent={anyOf:[{type:'number',minimum:0,maximum:100},{type:'null'}]};
defs.TournamentTeam=object({id:suppliedKey,label:short},['id','label']);
defs.TournamentParticipant=object({teamId:{anyOf:[suppliedKey,{type:'null'}]},placeholder:short,score:{anyOf:[integer(0,1000000),{type:'null'}]}},['teamId','score']);
defs.TournamentMatch=object({id:suppliedKey,label:short,status:choice('scheduled','live','final','postponed','cancelled','unknown'),participants:array(ref('TournamentParticipant'),2,2),winnerTeamId:{anyOf:[suppliedKey,{type:'null'}]},startsAt:flightAt,advancesTo:suppliedKey,note:string(2000),source:ref('TravelEventSource')},['id','label','status','participants','winnerTeamId']);
defs.TournamentRound=object({id:suppliedKey,label:short,matches:array(ref('TournamentMatch'),0,32)},['id','label','matches']);
node('basketball-tournament',{label:short,description:string(3000),teams:array(ref('TournamentTeam'),0,128),rounds:array(ref('TournamentRound'),0,12),observedAt:flightAt,source:ref('TravelEventSource')},['label','teams','rounds'],'sports');
defs.ElectionCandidate=object({id:suppliedKey,label:short,party:short,votes:resultCount,voteShare:resultPercent,outcome:choice('elected','not-elected','unknown'),note:string(2000),source:ref('TravelEventSource')},['id','label','votes','voteShare','outcome']);
defs.ElectionContest=object({id:suppliedKey,label:short,status:choice('pending','counting','complete','recount','unknown'),reportedPercent:resultPercent,totalVotes:resultCount,candidates:array(ref('ElectionCandidate'),0,50),observedAt:flightAt,note:string(2000),source:ref('TravelEventSource')},['id','label','status','reportedPercent','totalVotes','candidates']);
node('election-results',{label:short,description:string(3000),contests:array(ref('ElectionContest'),0,40),observedAt:flightAt,source:ref('TravelEventSource')},['label','contests']);
}
