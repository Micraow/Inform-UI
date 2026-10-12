import {object,short,string,ref,choice,array,key} from '../primitives.mjs';
import {ledgerCurrency,ledgerCommon} from './ledger-source.mjs';
/** Existing authored declarations; preserve their historical wire values. */
export function install({defs,node}) {
const ledgerAmount = {type:'number',minimum:0,maximum:1e12};
defs.LedgerAccount = object({id:key,name:short,amount:{anyOf:[ledgerAmount,{type:'null'}]},currency:ledgerCurrency,category:short,note:string(2000)},['id','name','amount','currency']);
defs.LedgerTransaction = object({id:key,date:{type:'string',pattern:'^[1-9]\\d{3}-\\d{2}-\\d{2}$'},description:string(1000,1),amount:ledgerAmount,currency:ledgerCurrency,direction:choice('debit','credit'),status:choice('pending','posted'),counterparty:short,note:string(2000)},['id','date','description','amount','currency','direction']);
node('asset-distribution',{...ledgerCommon,observedAt:short,accounts:array(ref('LedgerAccount'),0,40)},['label','accounts'],'finance');
node('transaction-list',{...ledgerCommon,transactions:array(ref('LedgerTransaction'),0,100)},['label','transactions'],'finance');
}
