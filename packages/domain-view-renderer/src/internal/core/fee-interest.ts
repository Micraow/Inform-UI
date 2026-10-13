import type{LedgerFeeInterestPaidNode}from'../schema/document.js';import type{Issue}from'./index.js';
/** Labels and amounts are supplied observations, not a calculation or account service. */
export function inspectFeeInterest(n:LedgerFeeInterestPaidNode,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void{
 const label=(value:string|undefined,at:string)=>{if(value!==undefined&&!value.trim())add({code:'FEE_INTEREST_LABEL',path:at,message:'Use a nonblank supplied label.'});};
 for(const key of['label','showMoreLabel','showLessLabel','maskedLabel']as const)label(n[key],path+'/'+key);
 if(n.source&&(!/^https?:\/\//i.test(n.source.url)||!safe(n.source.url)))add({code:'UNSAFE_URL',path:path+'/source/url',message:'Use a safe supplied absolute HTTP(S) source.'});
 const ranges=new Set<string>();n.ranges.forEach((range,index)=>{const at=`${path}/ranges/${index}`;if(ranges.has(range.id))add({code:'FEE_INTEREST_RANGE',path:at+'/id',message:'Supplied range IDs must be unique.'});ranges.add(range.id);for(const key of['label','totalPaidLabel','totalStatusLabel','conversionNote','emptyLabel']as const)label(range[key],at+'/'+key);
 const ids=new Set<string>();range.transactions.forEach((row,i)=>{const where=`${at}/transactions/${i}`;if(ids.has(row.id))add({code:'FEE_INTEREST_TRANSACTION',path:where+'/id',message:'Transaction IDs must be unique inside each supplied range.'});ids.add(row.id);for(const key of['displayName','dateLabel','categoryLabel','accountDetail','amountLabel','maskedAmountLabel']as const)label(row[key],where+'/'+key);if(row.logoUrl&&!safe(row.logoUrl,'image'))add({code:'UNSAFE_URL',path:where+'/logoUrl',message:'Logos require a safe supplied absolute HTTP(S) or inline raster source.'});});});
 if(n.initialRangeId!==undefined&&!ranges.has(n.initialRangeId))add({code:'FEE_INTEREST_RANGE',path:path+'/initialRangeId',message:'The initial range must reference a supplied range.'});
}
