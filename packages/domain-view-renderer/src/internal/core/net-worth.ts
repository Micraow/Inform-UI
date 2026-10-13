import type {LedgerNetWorthNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {validInputDate} from './extensions.js';
export function inspectNetWorth(n:LedgerNetWorthNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string)=>boolean):void {
 const label=(value:string,at:string)=>{if(!value.trim())add({code:'NET_WORTH_LABEL',path:at,message:'Use a nonblank supplied label.'});};label(n.label,path+'/label');
 if(n.source&&(!/^https?:\/\//i.test(n.source.url)||!safeURL(n.source.url)))add({code:'UNSAFE_URL',path:path+'/source/url',message:'Use a safe supplied absolute HTTP(S) source.'});
 const ids=new Set<string>();n.intervals.forEach((view,index)=>{const at=`${path}/intervals/${index}`;if(ids.has(view.id))add({code:'NET_WORTH_INTERVAL',path:at+'/id',message:'Interval IDs must be unique.'});ids.add(view.id);label(view.label,at+'/label');label(view.changeWindow,at+'/changeWindow');let previous='';view.points.forEach((point,i)=>{const where=`${at}/points/${i}/date`;if(!validInputDate(point.date))add({code:'NET_WORTH_DATE',path:where,message:'Use a real supplied Gregorian date.'});if(previous&&point.date<=previous)add({code:'NET_WORTH_ORDER',path:where,message:'Dates within each supplied interval must be strictly increasing without duplicates.'});previous=point.date;});});
 if(n.initialIntervalId!==undefined&&!ids.has(n.initialIntervalId))add({code:'NET_WORTH_INTERVAL',path:path+'/initialIntervalId',message:'The initial interval must reference a supplied interval.'});
}
