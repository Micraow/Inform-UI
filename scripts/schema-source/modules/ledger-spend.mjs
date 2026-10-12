import {object,short,string,number,bool,integer,choice,array,ref,key} from '../primitives.mjs';
/** Existing authored declarations; preserve their historical wire values. */
export function install({defs,node}) {
defs.SpendTrendPoint=object({day:integer(0,31),value:{anyOf:[number,{type:'null'}]},label:{anyOf:[short,{type:'null'}]}},['day','value','label']);
defs.SpendTrendSeries=object({id:key,label:short,totalValue:{anyOf:[number,{type:'null'}]},totalLabel:{anyOf:[short,{type:'null'}]},dayCount:integer(1,31),points:array(ref('SpendTrendPoint'),0,32),current:bool,daysElapsed:integer(0,31),groupLabel:short},['id','label','totalValue','totalLabel','dayCount','points']);
defs.SpendCategory=object({id:key,label:short,amountLabel:{anyOf:[short,{type:'null'}]},fraction:{anyOf:[{type:'number',minimum:0,maximum:1},{type:'null'}]}},['id','label','amountLabel','fraction']);
node('ledger-spend-so-far-this-month',{label:short,periodLabel:short,totalLabel:{anyOf:[short,{type:'null'}]},categories:array(ref('SpendCategory'),0,24),months:array(ref('SpendTrendSeries'),1,24),averageSeries:ref('SpendTrendSeries'),previousSeries:ref('SpendTrendSeries'),selectedMonth:key,comparison:key,status:choice('pending','resolved','failed'),fallback:short,hasConnectedAccounts:bool,noAccountsLabel:short,previousLabel:short,averageLabel:short,comparisonLabel:short,emptyLabel:short,masked:bool,maskedLabel:short,disabled:bool},['label','periodLabel','totalLabel','categories'],'finance');
}
