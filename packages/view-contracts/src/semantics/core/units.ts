/** Original conversion registry. Constants are factual unit definitions; references: docs/converters.md. */
export type UnitCategory='length'|'mass'|'temperature'|'speed'|'area'|'volume'|'time'|'pressure'|'data';
export interface Unit {id:string;symbol:string;zh:string;en:string;factor:number}
import registry from '../data/units.json';
export const UNIT_CATEGORIES:Readonly<Record<UnitCategory,{zh:string;en:string;units:readonly Unit[]}>>=Object.freeze(registry);
export function unitById(category:UnitCategory,id:string):Unit|undefined{return UNIT_CATEGORIES[category].units.find(unit=>unit.id===id);}
export function convertUnit(amount:number,category:UnitCategory,from:string,to:string,temperatureMode:'absolute'|'difference'='absolute'):number{
 const a=unitById(category,from),b=unitById(category,to);if(!a||!b)throw new Error('UNKNOWN_UNIT');if(!Number.isFinite(amount))throw new Error('NONFINITE_AMOUNT');let result:number;
 if(category==='temperature'&&temperatureMode==='absolute'){
  if((from==='K'&&amount<0)||(from==='C'&&amount<-273.15)||(from==='F'&&amount<-459.67))throw new Error('ABSOLUTE_ZERO');
  let kelvin=from==='K'?amount:from==='C'?amount+273.15:(amount-32)/1.8+273.15;
  if(kelvin<-1e-10)throw new Error('ABSOLUTE_ZERO');if(kelvin<0)kelvin=0;
  result=from===to?amount:to==='K'?kelvin:to==='C'?kelvin-273.15:(kelvin-273.15)*1.8+32;
 }else{result=from===to?amount:amount*(a.factor/b.factor);if(amount!==0&&result===0)throw new Error('NUMERIC_RANGE');}
 if(!Number.isFinite(result))throw new Error('NUMERIC_RANGE');return Object.is(result,-0)?0:result;
}
/** Multiply/divide normalized significands so a finite final value never overflows an intermediate ratio. */
function productRatio(amount:number,multiplier:number,divisor:number):number{
 if(amount===0)return 0;
 const parts=(v:number):[number,number]=>{const exponent=Math.min(1023,Math.floor(Math.log2(Math.abs(v))));return[v/2**exponent,exponent];};
 const[a,ae]=parts(amount),[b,be]=parts(multiplier),[d,de]=parts(divisor);let mantissa=a*b/d,exponent=ae+be-de;
 const shift=Math.floor(Math.log2(Math.abs(mantissa)));mantissa/=2**shift;exponent+=shift;
 const result=exponent>=-1022?mantissa*2**exponent:(mantissa*2**(exponent+1074))*Number.MIN_VALUE;
 if(!Number.isFinite(result)||result===0)throw new Error('NUMERIC_RANGE');return result;
}
export function convertCurrency(amount:number,from:string,to:string,base:string,rates:readonly{currency:string;rate:number|null}[]):number|null{
 if(!Number.isFinite(amount))throw new Error('NONFINITE_AMOUNT');if(from===to)return amount;
 const rate=(code:string)=>code===base?1:rates.find(item=>item.currency===code)?.rate??null;
 const a=rate(from),b=rate(to);if(a===null||b===null)return null;
 return productRatio(amount,b,a);
}
