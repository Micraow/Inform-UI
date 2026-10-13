import type {UnitConverterNode,CurrencyConverterNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {timestamp} from './extensions.js';
import {unitById,convertUnit,convertCurrency} from './units.js';
export function inspectConverters(n:UnitConverterNode|CurrencyConverterNode,path:string,add:(issue:Issue)=>void,safeURL:(value:string)=>boolean){
 const error=(code:string,p:string,message:string)=>add({code,path:path+p,message});
 if(n.type==='unit-converter'){
  const from=unitById(n.category,n.from),to=unitById(n.category,n.to);
  if(!from)error('UNIT_ID','/from','Choose a unit in the supplied category.');
  if(!to)error('UNIT_ID','/to','Choose a unit in the supplied category.');
  if(n.temperatureMode!==undefined&&n.category!=='temperature')error('UNIT_MODE','/temperatureMode','Temperature mode applies only to the temperature category.');
  if(from&&to)try{convertUnit(n.amount,n.category,n.from,n.to,n.temperatureMode);}catch(e){error('UNIT_RANGE','/amount',e instanceof Error&&e.message==='ABSOLUTE_ZERO'?'Absolute temperatures cannot be below absolute zero.':'Initial conversion exceeds the representable numeric range.');}
  return;
 }
 if(!Number.isFinite(timestamp(n.asOf)))error('CURRENCY_DATE','/asOf','Use a valid snapshot timestamp with explicit offset.');
 if(n.source.url&&!safeURL(n.source.url))error('UNSAFE_URL','/source/url','Source URL is outside the allowed policy.');
 const ids=new Set<string>();let valid=true;
 n.rates.forEach((item,i)=>{if(ids.has(item.currency)){error('CURRENCY_ID',`/rates/${i}/currency`,'Each currency may appear only once.');valid=false;}ids.add(item.currency);if(item.currency===n.base&&item.rate!==1){error('CURRENCY_RATE',`/rates/${i}/rate`,'An explicit base-currency rate must equal one.');valid=false;}});
 ids.add(n.base);
 for(const field of ['from','to'] as const)if(n[field]!==undefined&&!ids.has(n[field]!)){error('CURRENCY_ID','/'+field,'Choose the base currency or a supplied currency.');valid=false;}
 const from=n.from??n.base,to=n.to??[...ids].find(code=>code!==from)??from;
 if(valid)try{convertCurrency(n.amount,from,to,n.base,n.rates);}catch{error('CURRENCY_RANGE','/amount','Initial conversion exceeds the representable numeric range.');}
}
