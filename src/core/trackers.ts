import type {PackageTrackerNode, FlightTrackerNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {flightInstant} from './travel-events.js';

/** Supplied snapshots only: no system clock, provider state or inferred progress. */
export function inspectTracker(n:PackageTrackerNode|FlightTrackerNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string)=>boolean):void {
 const time=(value:string,at:string)=>{if(!Number.isFinite(flightInstant(value)))add({code:'TRACKER_TIME',path:at,message:'Use a real Gregorian minute timestamp with an explicit Z or offset, years 1000–9999.'});};
 time(n.observedAt,`${path}/observedAt`);
 if(n.source&&(!/^https?:\/\//i.test(n.source.url)||!safeURL(n.source.url)))add({code:'UNSAFE_URL',path:`${path}/source/url`,message:'Source links require allowed absolute HTTP(S) destinations.'});
 const ids=new Set<string>();
 if(n.type==='package-tracker'){
  let current=0;
  n.milestones.forEach((item,index)=>{const at=`${path}/milestones/${index}`;if(ids.has(item.id))add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Milestone IDs must be unique.'});ids.add(item.id);
   if(item.state==='current'&&++current>1)add({code:'TRACKER_CURRENT',path:`${at}/state`,message:'At most one supplied milestone may be current.'});
   if(item.occurredAt!==undefined){time(item.occurredAt,`${at}/occurredAt`);if(item.state==='pending')add({code:'TRACKER_PENDING',path:`${at}/occurredAt`,message:'A pending milestone cannot have a supplied occurrence timestamp.'});}
  });
 }else{
  for(const [key,endpoint] of [['departure',n.departure],['arrival',n.arrival]] as const)for(const field of ['scheduledAt','estimatedAt','actualAt'] as const){const value=endpoint[field];if(value!==undefined)time(value,`${path}/${key}/${field}`);}
  for(const field of ['scheduledAt','estimatedAt','actualAt'] as const){const a=n.departure[field],b=n.arrival[field];if(a!==undefined&&b!==undefined&&Number.isFinite(flightInstant(a))&&Number.isFinite(flightInstant(b))&&flightInstant(b)<=flightInstant(a))add({code:'TRACKER_ORDER',path:`${path}/arrival/${field}`,message:'The supplied arrival must be after departure for the same time category.'});}
  n.updates.forEach((item,index)=>{const at=`${path}/updates/${index}`;if(ids.has(item.id))add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Update IDs must be unique.'});ids.add(item.id);time(item.at,`${at}/at`);});
 }
}
