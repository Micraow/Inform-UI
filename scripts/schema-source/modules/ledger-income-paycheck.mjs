import {object,short,string,choice} from '../primitives.mjs';
/** Existing authored declarations; preserve their historical wire values. */
export function install({defs,node}) {
defs.LedgerIncomePaycheck=object({name:{anyOf:[short,{type:'null'}]},amountLabel:{anyOf:[short,{type:'null'}]},nextPayment:{anyOf:[short,{type:'null'}]},frequency:{anyOf:[short,{type:'null'}]},accountDetail:{anyOf:[short,{type:'null'}]},logoUrl:string(8192,1),icon:choice('banknote','bank','briefcase','calendar')},[]);
}
