import type{LedgerIncomeTrackerNode}from'../schema/document.js';import type{Issue}from'./index.js';
export function inspectIncomeTracker(n:LedgerIncomeTrackerNode,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void{
 const label=(value:string|null|undefined,at:string,required=false)=>{if(required&&typeof value!=='string'||typeof value==='string'&&!value.trim())add({code:'INCOME_LABEL',path:at,message:'Supply nonblank display text for this field.'});};
 for(const key of['label','subtitle','estimatedMonthlyIncomeLabel','incomeSourcesLabel','emptyLabel','maskedLabel','estimatedLabel','nextPaycheckLabel','recurringIncomeLabel','noUpcomingLabel','dateUnavailableLabel']as const)label(n[key],path+'/'+key,n.hasIncome&&(key==='estimatedMonthlyIncomeLabel'||key==='incomeSourcesLabel'));
 const next=n.nextPaycheck;if(next){for(const key of['name','amountLabel','nextPayment','frequency','accountDetail']as const)label(next[key],path+'/nextPaycheck/'+key);if(next.logoUrl&&!safe(next.logoUrl,'image'))add({code:'UNSAFE_URL',path:path+'/nextPaycheck/logoUrl',message:'Supply a safe absolute HTTP(S) or supported inline raster logo.'});}
 if(n.source&&(!/^https?:\/\//i.test(n.source.url)||!safe(n.source.url)))add({code:'UNSAFE_URL',path:path+'/source/url',message:'Supply a safe absolute HTTP(S) source URL.'});
}
