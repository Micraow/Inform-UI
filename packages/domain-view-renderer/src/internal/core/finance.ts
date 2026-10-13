import type {Node} from '../schema/document.js';
import type {Issue} from './index.js';
import {timestamp,validTimezone} from './extensions.js';
export type FinanceNode=Extract<Node,{type:'finance-quote'|'finance-chart'|'finance-comparison'}>;
export function isFinance(n:Node):n is FinanceNode{return n.type==='finance-quote'||n.type==='finance-chart'||n.type==='finance-comparison';}
/** Verify supplied snapshots without fetching a provider, inferring market hours or converting currencies. */
export function inspectFinance(n:FinanceNode,path:string,add:(issue:Issue)=>void,safeURL:(value:string)=>boolean){
 const error=(code:string,p:string,message:string)=>add({code,path:path+p,message});
 if(n.source.url&&!safeURL(n.source.url))error('UNSAFE_URL','/source/url','Source URL is outside the allowed policy.');
 const instruments=n.type==='finance-comparison'?n.instruments:[n.instrument],ids=new Set<string>();
 if(n.type==='finance-comparison'){
  if(!Number.isFinite(timestamp(n.baselineAt)))error('FINANCE_DATE','/baselineAt','Use a valid common baseline timestamp with an explicit offset.');
  if(n.timezone!==undefined&&!validTimezone(n.timezone))error('TIMEZONE','/timezone','Use a recognized IANA time zone.');
 }
 instruments.forEach((instrument,i)=>{
  const p=n.type==='finance-comparison'?`/instruments/${i}`:'/instrument';
  if(ids.has(instrument.id))error('FINANCE_ID',p+'/id','Instrument ids must be unique within a comparison.');ids.add(instrument.id);
  if(!validTimezone(instrument.timezone))error('TIMEZONE',p+'/timezone','Use a recognized IANA time zone.');
  const asOf=timestamp(instrument.asOf);if(!Number.isFinite(asOf))error('FINANCE_DATE',p+'/asOf','Use a valid snapshot timestamp with an explicit offset.');
  let prior=-Infinity;
  instrument.history.forEach((point,j)=>{const time=timestamp(point.time);if(!Number.isFinite(time)||time<=prior)error('FINANCE_ORDER',p+`/history/${j}/time`,'History instants must be valid, unique and strictly increasing.');if(time>asOf)error('FINANCE_DATE',p+`/history/${j}/time`,'History observations cannot follow the supplied snapshot asOf.');prior=time;});
  if(instrument.price!==null&&instrument.previousClose!==null&&instrument.previousClose>0&&!Number.isFinite((instrument.price-instrument.previousClose)/instrument.previousClose*100))error('FINANCE_VALUE',p,'The reported price change percentage must remain finite.');
  if(n.type==='finance-comparison'){
   const baseline=instrument.history.find(point=>timestamp(point.time)===timestamp(n.baselineAt))?.price;
   // Missing/zero baselines deliberately remain valid and render as not comparable.
   if(typeof baseline==='number'&&baseline>0)instrument.history.forEach((point,j)=>{if(point.price!==null&&!Number.isFinite((point.price/baseline-1)*100))error('FINANCE_VALUE',p+`/history/${j}/price`,'Normalized change must remain finite.');});
  }
 });
 if(n.type!=='finance-quote'){
  const ranges=new Set<string>();n.ranges.forEach((range,i)=>{if(ranges.has(range.id))error('FINANCE_ID',`/ranges/${i}/id`,'Range ids must be unique.');ranges.add(range.id);const from=timestamp(range.from),to=timestamp(range.to);if(!Number.isFinite(from)||!Number.isFinite(to)||from>to)error('FINANCE_RANGE',`/ranges/${i}`,'Range endpoints must be valid ordered timestamps with offsets; equal instants select a single point.');});
  if(n.initialRange!==undefined&&!ranges.has(n.initialRange))error('FINANCE_RANGE','/initialRange','Initial range must reference a supplied range.');
 }
}
