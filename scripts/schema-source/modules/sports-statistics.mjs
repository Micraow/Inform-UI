import {object,short,string,array,ref,choice,integer,bool,suppliedKey,flightAt} from '../primitives.mjs';
/** Existing authored declarations; supplied facts and runtime semantics are unchanged. */
export function install({defs,node}){
// Original supplied boxscores. Explicit totals/overs/averages remain source data.
const boxCount={anyOf:[integer(0,1000000),{type:'null'}]};
const boxText={anyOf:[string(200,1),{type:'null'}]};
const boxRow={id:suppliedKey,label:short,note:string(2000),source:ref('TravelEventSource')};
defs.BasketballBoxPlayer=object({...boxRow,starter:{anyOf:[bool,{type:'null'}]},minutes:boxText,points:boxCount,rebounds:boxCount,assists:boxCount,steals:boxCount,blocks:boxCount,turnovers:boxCount,plusMinus:{anyOf:[integer(-1000000,1000000),{type:'null'}]},fieldGoals:boxText,threePointers:boxText,freeThrows:boxText},['id','label','starter','minutes','points','rebounds','assists','steals','blocks','turnovers','plusMinus']);
defs.BasketballBoxTeam=object({id:suppliedKey,label:short,score:boxCount,players:array(ref('BasketballBoxPlayer'),0,40),note:string(2000)},['id','label','score','players']);
defs.CricketBoxTeam=object({id:suppliedKey,label:short},['id','label']);
defs.CricketBattingRow=object({...boxRow,dismissal:boxText,runs:boxCount,balls:boxCount,fours:boxCount,sixes:boxCount,strikeRate:{anyOf:[{type:'number',minimum:0,maximum:1000000},{type:'null'}]}},['id','label','dismissal','runs','balls','fours','sixes','strikeRate']);
defs.CricketBowlingRow=object({...boxRow,overs:boxText,maidens:boxCount,runs:boxCount,wickets:boxCount,economy:{anyOf:[{type:'number',minimum:0,maximum:1000000},{type:'null'}]}},['id','label','overs','maidens','runs','wickets','economy']);
defs.CricketBoxInnings=object({id:suppliedKey,label:short,teamId:suppliedKey,runs:boxCount,wickets:boxCount,overs:boxText,extras:boxCount,batting:array(ref('CricketBattingRow'),0,30),bowling:array(ref('CricketBowlingRow'),0,30),note:string(2000),source:ref('TravelEventSource')},['id','label','teamId','runs','wickets','overs','extras','batting','bowling']);
const boxCommon={label:short,description:string(3000),status:choice('scheduled','live','final','postponed','cancelled','unknown'),statusText:string(1000),observedAt:flightAt,source:ref('TravelEventSource')};
node('nba-game-boxscore',{...boxCommon,teams:array(ref('BasketballBoxTeam'),2,2),periods:array(object({label:short,scores:array(boxCount,2,2)},['label','scores']),0,20)},['label','status','teams','periods'],'sports');
node('cricket-match-boxscore',{...boxCommon,teams:array(ref('CricketBoxTeam'),2,2),innings:array(ref('CricketBoxInnings'),0,12)},['label','status','teams','innings'],'sports');
const playerCount = {anyOf:[integer(0,1000000),{type:'null'}]};
const playerRate = {anyOf:[{type:'number',minimum:0,maximum:10000},{type:'null'}]};
const playerRank = {anyOf:[integer(1,1000000),{type:'null'}]};
const playerRecordCommon = {id:suppliedKey,season:short,note:string(2000),source:ref('TravelEventSource')};
defs.BasketballPlayerRecord=object({...playerRecordCommon,team:{anyOf:[short,{type:'null'}]},scope:choice('regular-season','playoffs','preseason','other','unknown'),games:playerCount,minutesPerGame:playerRate,pointsPerGame:playerRate,reboundsPerGame:playerRate,assistsPerGame:playerRate},['id','season','team','scope','games','minutesPerGame','pointsPerGame','reboundsPerGame','assistsPerGame']);
defs.TennisPlayerRecord=object({...playerRecordCommon,surface:choice('hard','clay','grass','carpet','other','unknown'),matches:playerCount,wins:playerCount,losses:playerCount,titles:playerCount,rank:playerRank},['id','season','surface','matches','wins','losses','titles','rank']);
const playerCommon={label:short,player:short,description:string(3000),observedAt:flightAt,source:ref('TravelEventSource')};
node('nba-player-summary',{...playerCommon,records:array(ref('BasketballPlayerRecord'),0,100)},['label','player','records'],'sports');
node('tennis-player-summary',{...playerCommon,records:array(ref('TennisPlayerRecord'),0,100)},['label','player','records'],'sports');
}
