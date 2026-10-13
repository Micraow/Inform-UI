import type {NbaGameBoxscoreNode,CricketMatchBoxscoreNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {flightInstant} from './travel-events.js';

export function inspectBoxscore(node:NbaGameBoxscoreNode|CricketMatchBoxscoreNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string)=>boolean):void {
  const source=(value:{url:string}|undefined,at:string)=>{
    if(value&&(!/^https?:\/\//i.test(value.url)||!safeURL(value.url)))
      add({code:'UNSAFE_URL',path:at+'/source/url',message:'Use a safe supplied absolute HTTP(S) source.'});
  };
  const inspectRows=(rows:readonly {id:string;source?:{url:string}}[],at:string)=>{
    const ids=new Set<string>();
    rows.forEach((row,i)=>{
      if(ids.has(row.id))add({code:'DUPLICATE_ID',path:`${at}/${i}/id`,message:'IDs must be unique in the supplied collection.'});
      ids.add(row.id);source(row.source,`${at}/${i}`);
    });
  };
  source(node.source,path);inspectRows(node.teams,path+'/teams');
  if(node.observedAt!==undefined&&!Number.isFinite(flightInstant(node.observedAt)))
    add({code:'BOXSCORE_TIME',path:path+'/observedAt',message:'Use a real supplied Gregorian offset timestamp.'});
  if(node.type==='nba-game-boxscore')node.teams.forEach((team,i)=>inspectRows(team.players,`${path}/teams/${i}/players`));
  else {
    inspectRows(node.innings,path+'/innings');const teams=new Set(node.teams.map(team=>team.id));
    node.innings.forEach((innings,i)=>{
      const at=`${path}/innings/${i}`;
      if(!teams.has(innings.teamId))add({code:'BOXSCORE_TEAM',path:at+'/teamId',message:'The supplied innings must reference a supplied team.'});
      inspectRows(innings.batting,at+'/batting');inspectRows(innings.bowling,at+'/bowling');
    });
  }
}
