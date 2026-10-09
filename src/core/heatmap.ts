import type {FinanceHeatmapNode} from '../schema/document.js';
import type {Issue} from './index.js';import{timestamp,validTimezone}from'./extensions.js';
export function inspectHeatmap(n:FinanceHeatmapNode,path:string,add:(issue:Issue)=>void,safeURL:(value:string)=>boolean){
 const error=(code:string,p:string,message:string)=>add({code,path:path+p,message}),asOf=timestamp(n.asOf);
 if(!validTimezone(n.timezone))error('TIMEZONE','/timezone','Use a recognized IANA time zone.');
 if(!Number.isFinite(asOf))error('FINANCE_DATE','/asOf','Use a valid timestamp with explicit offset.');
 if(n.source.url&&!safeURL(n.source.url))error('UNSAFE_URL','/source/url','Source URL is outside the allowed policy.');
 const ids=new Set<string>();n.cells.forEach((cell,i)=>{if(ids.has(cell.id))error('FINANCE_ID',`/cells/${i}/id`,'Heatmap cell ids must be unique.');ids.add(cell.id);const time=timestamp(cell.asOf);if(!Number.isFinite(time)||time>asOf)error('FINANCE_DATE',`/cells/${i}/asOf`,'Cell snapshot must be valid and no later than the supplied heatmap snapshot.');});
 if(n.initialSector!==undefined&&!n.cells.some(cell=>cell.sector===n.initialSector))error('FINANCE_FILTER','/initialSector','Initial sector must reference supplied data.');
}
