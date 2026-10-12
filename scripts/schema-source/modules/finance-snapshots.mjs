import {object,short,string,ref,choice,integer,array,key,timestamp,nullableNumber} from '../primitives.mjs';
/** Existing authored declarations; preserve their historical wire values. */
export function install({defs,node}) {
const price={anyOf:[{type:'number',minimum:0},{type:'null'}]};
defs.FinanceInstrument=object({id:key,symbol:short,name:short,currency:{type:'string',pattern:'^[A-Z]{3}$'},exchange:short,timezone:short,asOf:timestamp,marketStatus:choice('open','closed','pre','post','halted','unknown'),delayMinutes:integer(0,10080),price,previousClose:price,history:array(object({time:timestamp,price},['time','price']),0,500)},['id','symbol','name','currency','timezone','asOf','marketStatus','delayMinutes','price','previousClose','history']);
defs.FinanceRange=object({id:key,label:short,from:timestamp,to:timestamp},['id','label','from','to']);
const financeCommon={title:short,source:ref('FinanceSource'),status:choice('ready','loading','error'),message:string()};
node('finance-quote',{...financeCommon,instrument:ref('FinanceInstrument')},['source','instrument'], 'finance');
node('finance-chart',{...financeCommon,instrument:ref('FinanceInstrument'),ranges:array(ref('FinanceRange'),0,12),initialRange:key},['source','instrument','ranges'], 'finance');
node('finance-comparison',{...financeCommon,instruments:array(ref('FinanceInstrument'),2,6),baselineAt:timestamp,timezone:short,ranges:array(ref('FinanceRange'),0,12),initialRange:key},['source','instruments','baselineAt','ranges'], 'finance');
node('finance-heatmap',{title:short,source:ref('FinanceSource'),asOf:timestamp,timezone:short,weightLabel:short,changeBasis:short,cells:array(object({id:key,symbol:short,name:short,sector:short,weight:price,price,currency:{type:'string',pattern:'^[A-Z]{3}$'},changePercent:nullableNumber,asOf:timestamp,marketStatus:choice('open','closed','pre','post','halted','unknown'),delayMinutes:integer(0,10080)},['id','symbol','name','sector','weight','price','currency','changePercent','asOf','marketStatus','delayMinutes']),0,200),initialSector:short,status:choice('ready','loading','error'),message:string()},['source','asOf','timezone','weightLabel','changeBasis','cells'], 'finance');
}
