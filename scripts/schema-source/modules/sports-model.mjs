import {object,short,string,array,ref,choice,integer,bool,key,timestamp,date,number,nullableNumber} from '../primitives.mjs';
/** Existing authored declarations; supplied facts and runtime semantics are unchanged. */
export function install({defs,node}){
// Shared project-owned sports model. Data is supplied; no provider or league rules are inferred.
const sportsScore={anyOf:[integer(0,1000000),{type:'null'}]};
defs.SportsTeam=object({id:key,name:short,shortName:string(16,1),color:choice('blue','green','orange','red','purple','gray')},['id','name']);
defs.SportsGame=object({id:key,startAt:timestamp,homeTeam:key,awayTeam:key,status:choice('scheduled','live','final','postponed','cancelled'),homeScore:sportsScore,awayScore:sportsScore,period:short,clock:short,stage:short,venue:string(300),neutral:bool,winnerTeamId:key,detail:string(3000),periodScores:array(object({label:short,home:sportsScore,away:sportsScore},['label','home','away']),0,30),tieBreak:object({label:short,home:sportsScore,away:sportsScore},['label','home','away']),stats:array(object({label:short,home:{anyOf:[string(200),number,{type:'null'}]},away:{anyOf:[string(200),number,{type:'null'}]}},['label','home','away']),0,30)},['id','startAt','homeTeam','awayTeam','status','homeScore','awayScore']);
defs.SportsStanding=object({teamId:key,group:short,rank:integer(1,10000),played:sportsScore,won:sportsScore,drawn:sportsScore,lost:sportsScore,points:nullableNumber,for:sportsScore,against:sportsScore,note:string(500)},['teamId','rank','played','won','drawn','lost','points']);
defs.SportsData=object({league:object({id:key,name:short,sport:choice('football','basketball','baseball','hockey','other'),season:short},['id','name','sport']),timezone:short,updatedAt:timestamp,source:object({label:short,synthetic:bool,url:string(2048)},['label','synthetic']),teams:array(ref('SportsTeam'),0,100),games:array(ref('SportsGame'),0,300),standings:array(ref('SportsStanding'),0,100)},['league','timezone','updatedAt','source','teams','games']);
const sportsCommon={data:ref('SportsData'),status:choice('ready','loading','error'),message:string()};
node('sports-schedule',{...sportsCommon,initialDate:date,initialTeamId:key,initialStage:short},['data'], 'sports');
node('sports-scoreboard',{...sportsCommon,gameId:key},['data'], 'sports');
node('sports-standings',{...sportsCommon,initialTeamId:key,initialGroup:short},['data'], 'sports');
}
