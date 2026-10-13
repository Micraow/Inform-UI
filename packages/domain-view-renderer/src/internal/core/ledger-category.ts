import type{LedgerSpendByCategoryNode,LedgerSpendByCategoryDetailNode,LedgerSpendByCategoryRecentTransactionsNode}from'../schema/document.js';
import type{Issue}from'./index.js';
type CategoryNode=LedgerSpendByCategoryNode|LedgerSpendByCategoryDetailNode|LedgerSpendByCategoryRecentTransactionsNode;
export function inspectLedgerCategory(node:CategoryNode,path:string,add:(issue:Issue)=>void,safe:(url:string,kind?:'link'|'image')=>boolean):void{
 const issue=(code:string,at:string,message:string)=>add({code,path:at,message});
 const labels=(value:unknown,at:string):void=>{if(typeof value==='string'&&!value.trim())issue('CATEGORY_LABEL',at,'Supply nonblank text or explicit null for an unknown value.');};
 labels(node.label,path+'/label');
 const unique=(items:readonly{id:string}[],at:string)=>{const seen=new Set<string>();items.forEach((item,index)=>{if(seen.has(item.id))issue('CATEGORY_ID',at+'/'+index+'/id','IDs must be unique within this supplied list.');seen.add(item.id);});};
 if(node.type==='ledger-spend-by-category'){
  const months=node.months??[];unique(months,path+'/months');if(node.selectedMonthId!==undefined&&!months.some(m=>m.id===node.selectedMonthId))issue('CATEGORY_MONTH',path+'/selectedMonthId','Select an existing supplied month.');
  months.forEach((month,index)=>{const at=path+'/months/'+index;labels(month.label,at+'/label');labels(month.totalLabel,at+'/totalLabel');unique(month.segments,at+'/segments');month.segments.forEach((segment,i)=>labels(segment.label,at+'/segments/'+i+'/label'));for(const field of['topCategories','categories']as const){unique(month[field],at+'/'+field);month[field].forEach((item,i)=>{for(const key of['label','amountLabel','percentLabel']as const)labels(item[key],at+'/'+field+'/'+i+'/'+key);});}});
 }else if(node.type==='ledger-spend-by-category-detail'){unique(node.groups??[],path+'/groups');node.groups?.forEach((item,i)=>{labels(item.label,path+'/groups/'+i+'/label');labels(item.subtotalLabel,path+'/groups/'+i+'/subtotalLabel');});}
 else{unique(node.transactions??[],path+'/transactions');node.transactions?.forEach((item,i)=>{for(const key of['title','dateLabel','amountLabel']as const)labels(item[key],path+'/transactions/'+i+'/'+key);if(item.logoSrc!==undefined&&!safe(item.logoSrc,'image'))issue('CATEGORY_SOURCE',path+'/transactions/'+i+'/logoSrc','Supply a safe image URL.');});}
}
