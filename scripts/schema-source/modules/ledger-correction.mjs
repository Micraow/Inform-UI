import {object,short,string,ref,array,bool,suppliedKey,travelDate} from '../primitives.mjs';
import {ledgerCommon} from './ledger-source.mjs';
/** Existing authored declarations; preserve their historical wire values. */
export function install({defs,node}) {
defs.LedgerCorrectionCategory=object({id:suppliedKey,label:short},['id','label']);
defs.LedgerCorrectionTransaction=object({id:suppliedKey,label:short,date:{anyOf:[travelDate,{type:'null'}]},money:ref('LedgerExactMoney'),originalCategoryId:{anyOf:[suppliedKey,{type:'null'}]},suggestedCategoryId:{anyOf:[suppliedKey,{type:'null'}]},confidence:{anyOf:[{type:'number',minimum:0,maximum:1},{type:'null'}]},note:string(2000)},['id','label','date','money','originalCategoryId','suggestedCategoryId','confidence']);
node('ledger-low-confidence-category-correction',{...ledgerCommon,snapshotId:suppliedKey,categories:array(ref('LedgerCorrectionCategory'),0,40),transactions:array(ref('LedgerCorrectionTransaction'),0,60),disabled:bool},['label','snapshotId','categories','transactions'],'finance');
}
