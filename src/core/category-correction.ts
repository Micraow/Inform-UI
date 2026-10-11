import type {LedgerLowConfidenceCategoryCorrectionNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {validTravelDate} from './travel-events.js';
export function inspectCategoryCorrection(node:LedgerLowConfidenceCategoryCorrectionNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string)=>boolean):void {
  const issue=(code:string,at:string,message:string)=>add({code,path:at,message});
  const unique=(rows:readonly {id:string}[],at:string)=>{const seen=new Set<string>();rows.forEach((row,i)=>{if(seen.has(row.id))issue('CORRECTION_ID',`${at}/${i}/id`,'Supplied IDs must be unique.');seen.add(row.id);});return seen;};
  const categories=unique(node.categories,path+'/categories');unique(node.transactions,path+'/transactions');
  node.transactions.forEach((row,i)=>{
    const at=`${path}/transactions/${i}`;
    if(row.date!==null&&!validTravelDate(row.date))issue('CORRECTION_DATE',at+'/date','Use a real supplied Gregorian date, or null.');
    for(const key of['originalCategoryId','suggestedCategoryId']as const)if(row[key]!==null&&!categories.has(row[key]))issue('CORRECTION_CATEGORY',at+'/'+key,'Reference a supplied category, or use null.');
  });
  if(node.source&&(!/^https?:\/\//i.test(node.source.url)||!safeURL(node.source.url)))issue('UNSAFE_URL',path+'/source/url','Use a safe supplied absolute HTTP(S) source.');
}
