import type {LedgerFinanceStatusBannerNode} from '../schema/document.js';
export interface FinanceStatusIssue{code:string;path:string;message:string}
/** Structural validation runs first. No number parsing or account state is inferred. */
export function inspectFinanceStatus(node:LedgerFinanceStatusBannerNode,path:string,add:(issue:FinanceStatusIssue)=>void):void{
 if(!node.label.trim())add({code:'FINANCE_STATUS_LABEL',path:path+'/label',message:'Supply a nonblank accessible label.'});
 if('data' in node&&node.data&&!node.data.title.trim())add({code:'FINANCE_STATUS_TITLE',path:path+'/data/title',message:'Supply a nonblank status title.'});
}
