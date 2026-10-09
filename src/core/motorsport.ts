import type {F1RacesNode,F1StandingsNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {flightInstant} from './travel-events.js';
export function inspectMotorsport(n:F1RacesNode|F1StandingsNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string)=>boolean):void {
 const issue=(code:string,at:string,message:string)=>add({code,path:at,message});
 const source=(s:{url:string}|undefined,at:string)=>{if(s&&(!/^https?:\/\//i.test(s.url)||!safeURL(s.url)))issue('UNSAFE_URL',at+'/source/url','Use a safe supplied absolute HTTP(S) source.');};
 const ids=new Set<string>();
 if(n.type==='f1-races') {
  const rounds=new Set<string>();
  n.races.forEach((race,i)=>{
   const at=`${path}/races/${i}`,round=`${race.season}/${race.round}`;
   if(ids.has(race.id))issue('DUPLICATE_ID',at+'/id','Race IDs must be unique.');ids.add(race.id);
   if(rounds.has(round))issue('MOTORSPORT_ROUND',at+'/round','Each supplied season/round pair must be unique.');rounds.add(round);source(race.source,at);
   const sessions=new Set<string>();
   race.sessions.forEach((session,j)=>{const sp=`${at}/sessions/${j}`;
    if(sessions.has(session.id))issue('DUPLICATE_ID',sp+'/id','Session IDs must be unique within a race.');sessions.add(session.id);
    const start=session.startsAt===null?NaN:flightInstant(session.startsAt);
    if(session.startsAt!==null&&!Number.isFinite(start))issue('MOTORSPORT_TIME',sp+'/startsAt','Use a real supplied Gregorian offset timestamp.');
    if(session.endsAt!==undefined){const end=flightInstant(session.endsAt);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)issue('MOTORSPORT_INTERVAL',sp+'/endsAt','An end requires a valid start and must be later.');}
   });
  });
 } else {
  if(n.observedAt!==undefined&&!Number.isFinite(flightInstant(n.observedAt)))issue('MOTORSPORT_TIME',path+'/observedAt','Use a real supplied Gregorian offset timestamp.');
  n.standings.forEach((row,i)=>{const at=`${path}/standings/${i}`;if(ids.has(row.id))issue('DUPLICATE_ID',at+'/id','Standing IDs must be unique.');ids.add(row.id);source(row.source,at);});
 }
}
