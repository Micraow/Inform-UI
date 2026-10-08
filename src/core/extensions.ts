import type {Node} from '../schema/document.js';
import type {Issue,Scalar} from './index.js';
export function validDate(date: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date; }
export function timestamp(value: unknown): number {
  if (typeof value === 'number') return Math.abs(value) <= 8.64e15 ? value : NaN;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !validDate(value.slice(0,10))) return NaN;
  return Date.parse(value);
}
export function validTimezone(zone: string): boolean { try { new Intl.DateTimeFormat('en', { timeZone:zone }).format(0); return true; } catch { return false; } }
export function dateInZone(value: string|number, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));
  const get=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function inspectExtension(node:Node,path:string,state:Record<string,Scalar>,add:(issue:Issue)=>void){const error=(code:string,sub:string,message:string)=>add({code,path:path+sub,message});
  if(node.type==='chart') {
    const scale=node.xScale??'category';
    if(node.xMin!==undefined&&node.xMax!==undefined&&(!(node.xMin<node.xMax)||!Number.isFinite(node.xMax-node.xMin))) error('CHART_BOUNDS','','xMin must be smaller than xMax with a finite span.');
    if(scale==='category'&&(node.xMin!==undefined||node.xMax!==undefined)) error('CHART_AXIS','','Category axes cannot have numeric bounds.');
    if(node.timezone&&!validTimezone(node.timezone)) error('TIMEZONE','/timezone','Use a recognized IANA time zone.');
    if(node.kind==='scatter'&&scale==='category') error('CHART_AXIS','/xScale','Scatter requires an explicit linear or time xScale.');
    if(node.kind==='donut'&&(node.series.length!==1||scale!=='category'||node.xMin!==undefined||node.xMax!==undefined||node.yMin!==undefined||node.yMax!==undefined)) error('CHART_DONUT','','Donut uses one nonnegative series, category labels and no Cartesian bounds.');
  }
}
/** Stable finite domains, including a single extreme value; bounds never turn into NaN SVG coordinates. */
export function chartXDomain(values:readonly number[],min?:number,max?:number,time=false):[number,number]{
  let low=min??Math.min(...values),high=max??Math.max(...values);if(!values.length)return[0,1];
  if(low===high){const offset=time?3_600_000:Math.max(1,Math.abs(low)*.05),limit=time?8.64e15:Number.MAX_VALUE;
    if(min===undefined)low=Math.max(-limit,low-offset);if(max===undefined)high=Math.min(limit,high+offset);
  }return[low,high];
}
