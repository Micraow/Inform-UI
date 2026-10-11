import type{LedgerSpendSoFarThisMonthNode}from'../schema/document.js';import type{Issue}from'./index.js';
export function inspectSpendMonth(node:LedgerSpendSoFarThisMonthNode,path:string,add:(issue:Issue)=>void):void{inspectSpendTrends(node,path,add);const ids=new Set<string>();for(const field of['label','periodLabel','totalLabel']as const)if(node[field]!==null&&!node[field].trim())add({code:'SPEND_LABEL',path:path+'/'+field,message:'Supply nonblank display text or explicit null for unknown totals.'});node.categories.forEach((item,index)=>{const at=path+'/categories/'+index;if(ids.has(item.id))add({code:'SPEND_ID',path:at+'/id',message:'Category IDs must be unique.'});ids.add(item.id);for(const field of['label','amountLabel']as const)if(item[field]!==null&&!item[field].trim())add({code:'SPEND_LABEL',path:at+'/'+field,message:'Supply nonblank category text or explicit unknown amount.'});});}

function inspectSpendTrends(node:LedgerSpendSoFarThisMonthNode,path:string,add:(issue:Issue)=>void):void{
 const issue=(code:string,at:string,message:string)=>add({code,path:path+at,message});
 const ids=new Set<string>();for(const [i,month]of(node.months??[]).entries()){if(ids.has(month.id)||month.id==='previous'||month.id==='average')issue('SPEND_MONTH_ID','/months/'+i+'/id','Supply unique month IDs other than previous and average.');ids.add(month.id);}
 for(const[at,series]of[...(node.months??[]).map((m,i)=>['/months/'+i,m]as const),...(node.averageSeries?[['/averageSeries',node.averageSeries]as const]:[]),...(node.previousSeries?[['/previousSeries',node.previousSeries]as const]:[])]){
  if(!series.label.trim())issue('SPEND_LABEL',at+'/label','Supply a nonblank month label.');
  if(series.current&&series.daysElapsed===undefined)issue('SPEND_DAY',at+'/daysElapsed','Current months require explicit elapsed days.');
  if(series.daysElapsed!==undefined&&series.daysElapsed>series.dayCount)issue('SPEND_DAY',at+'/daysElapsed','Elapsed days cannot exceed the supplied month length.');
  let day=-1;series.points.forEach((point,i)=>{if(point.day<=day||point.day>series.dayCount)issue('SPEND_DAY',at+'/points/'+i+'/day','Days must increase strictly within the supplied month.');day=point.day;if(point.label!==null&&!point.label.trim())issue('SPEND_LABEL',at+'/points/'+i+'/label','Supply a display label or explicit null.');});
 }
 if(node.selectedMonth!==undefined&&!ids.has(node.selectedMonth))issue('SPEND_MONTH','/selectedMonth','Select a supplied month ID.');
 if(node.comparison!==undefined&&!['previous','average'].includes(node.comparison)&&!ids.has(node.comparison))issue('SPEND_COMPARISON','/comparison','Select previous, average or a supplied month ID.');
 if(node.comparison==='average'&&!node.averageSeries)issue('SPEND_COMPARISON','/comparison','Average comparisons require an explicit supplied series.');
 if(node.months&&node.comparison===(node.selectedMonth??node.months[0]?.id))issue('SPEND_COMPARISON','/comparison','A month cannot compare with itself.');
}
