import {object,short,string,ref,choice,array,bool,suppliedKey,flightAt,travelDate} from '../primitives.mjs';
import {ledgerCommon} from './ledger-source.mjs';
/** Existing authored declarations; preserve their historical wire values. */
export function install({defs,node}) {
defs.LedgerAccountSnapshot=object({id:suppliedKey,label:short,institution:short,kind:choice('cash','credit','investment','loan','other','unknown'),status:choice('active','closed','unknown'),suffix:{type:'string',pattern:'^[A-Za-z0-9]{1,4}$(?![\\s\\S])'},balance:ref('LedgerExactMoney'),observedAt:flightAt,note:string(3000),source:ref('LedgerSource')},['id','label','institution','kind','status']);
node('ledger-accounts',{...ledgerCommon,accounts:array(ref('LedgerAccountSnapshot'),0,40),initiallyRevealed:bool},['label','accounts'],'finance');
defs.LedgerRecurringRecord=object({id:suppliedKey,label:short,counterparty:short,cadence:choice('weekly','monthly','yearly','other','unknown'),status:choice('scheduled','paused','unknown'),direction:choice('incoming','outgoing','unknown'),estimatedAmount:ref('LedgerExactMoney'),nextDate:travelDate,observedAt:flightAt,note:string(3000),source:ref('LedgerSource')},['id','label','cadence','status','direction']);
node('ledger-recurring-transactions',{...ledgerCommon,records:array(ref('LedgerRecurringRecord'),0,60),initialReviewedIds:array(suppliedKey,0,60)},['label','records'],'finance');
}
