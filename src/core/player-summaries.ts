import type {NbaPlayerSummaryNode, TennisPlayerSummaryNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {flightInstant} from './travel-events.js';

/** Supplied records are opaque snapshots; never reconcile totals or infer a scoring system. */
export function inspectPlayerSummary(
  node:NbaPlayerSummaryNode|TennisPlayerSummaryNode,
  path:string,
  add:(issue:Issue)=>void,
  safeURL:(url:string)=>boolean,
):void {
  const source=(value:{url:string}|undefined,at:string)=>{
    if(value&&(!/^https?:\/\//i.test(value.url)||!safeURL(value.url)))
      add({code:'UNSAFE_URL',path:at+'/source/url',message:'Use a safe supplied absolute HTTP(S) source.'});
  };
  source(node.source,path);
  if(node.observedAt!==undefined&&!Number.isFinite(flightInstant(node.observedAt)))
    add({code:'PLAYER_SUMMARY_TIME',path:path+'/observedAt',message:'Use a real supplied Gregorian offset timestamp.'});
  const ids=new Set<string>();
  node.records.forEach((record,index)=>{
    const at=`${path}/records/${index}`;
    if(ids.has(record.id))add({code:'DUPLICATE_ID',path:at+'/id',message:'Supplied player record IDs must be unique.'});
    ids.add(record.id);source(record.source,at);
  });
}
