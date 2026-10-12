import {object,short,string,array,ref,choice,integer,suppliedKey,flightAt} from '../primitives.mjs';
/** Existing authored declarations; supplied facts and runtime semantics are unchanged. */
export function install({defs,node}){
const matchCount={anyOf:[integer(0,1000000),{type:'null'}]};
defs.ScoreTeam=object({id:suppliedKey,label:short,record:string(200)},['id','label']);
defs.ScorePair=object({home:matchCount,away:matchCount},['home','away']);
defs.ScorePeriod=object({id:suppliedKey,label:short,home:matchCount,away:matchCount},['id','label','home','away']);
defs.ScoreLeader=object({id:suppliedKey,label:short,teamId:suppliedKey,points:matchCount,rebounds:matchCount,assists:matchCount},['id','label','teamId','points','rebounds','assists']);
defs.SoccerEvent=object({id:suppliedKey,minute:short,kind:choice('goal','yellow-card','red-card','substitution','var','other'),teamId:{anyOf:[suppliedKey,{type:'null'}]},player:short,note:string(1000)},['id','minute','kind','teamId']);
const scoreGame={id:suppliedKey,label:short,competition:short,startsAt:{anyOf:[flightAt,{type:'null'}]},homeTeamId:suppliedKey,awayTeamId:suppliedKey,status:choice('scheduled','live','final','postponed','cancelled','unknown'),homeScore:matchCount,awayScore:matchCount,outcome:choice('home-win','away-win','draw','unknown'),periodLabel:short,clock:short,venue:short,note:string(2000),source:ref('TravelEventSource')};
defs.NbaScoreGame=object({...scoreGame,periods:array(ref('ScorePeriod'),0,20),leaders:array(ref('ScoreLeader'),0,8)},[...Object.keys(scoreGame).filter(k=>!['periodLabel','clock','venue','note','source'].includes(k)),'periods','leaders']);
defs.SoccerScoreGame=object({...scoreGame,aggregate:{anyOf:[ref('ScorePair'),{type:'null'}]},penalties:{anyOf:[ref('ScorePair'),{type:'null'}]},events:array(ref('SoccerEvent'),0,120)},[...Object.keys(scoreGame).filter(k=>!['periodLabel','clock','venue','note','source'].includes(k)),'aggregate','penalties','events']);
for(const[type,game]of[['nba-scores','NbaScoreGame'],['soccer-games','SoccerScoreGame']])node(type,{label:short,description:string(3000),timezone:short,teams:array(ref('ScoreTeam'),0,100),games:array(ref(game),0,100),observedAt:flightAt,source:ref('TravelEventSource')},['label','timezone','teams','games'],'sports');

// Independent supplied football contract: periods, field situation and scoring events stay separate.
defs.FootballPeriod=object({...defs.ScorePeriod.properties,kind:choice('quarter','overtime'),number:integer(1,20)},[...defs.ScorePeriod.required,'kind','number']);
defs.FootballSituation=object({down:{anyOf:[integer(1,4),{type:'null'}]},distance:{anyOf:[integer(0,100),{type:'null'}]},ballOn:{anyOf:[short,{type:'null'}]}},['down','distance','ballOn']);
defs.FootballScoringEvent=object({id:suppliedKey,periodId:{anyOf:[suppliedKey,{type:'null'}]},clock:{anyOf:[short,{type:'null'}]},kind:choice('touchdown','field-goal','extra-point','two-point','safety','other'),teamId:{anyOf:[suppliedKey,{type:'null'}]},points:matchCount,note:string(1000)},['id','periodId','clock','kind','teamId','points']);
defs.FootballGame=object({...scoreGame,periods:array(ref('FootballPeriod'),0,24),possessionTeamId:{anyOf:[suppliedKey,{type:'null'}]},situation:{anyOf:[ref('FootballSituation'),{type:'null'}]},events:array(ref('FootballScoringEvent'),0,120)},[...Object.keys(scoreGame).filter(k=>!['periodLabel','clock','venue','note','source'].includes(k)),'periods','possessionTeamId','situation','events']);
node('american-football-games',{label:short,description:string(3000),timezone:short,teams:array(ref('ScoreTeam'),0,100),games:array(ref('FootballGame'),0,100),observedAt:flightAt,source:ref('TravelEventSource')},['label','timezone','teams','games'],'sports');

}
