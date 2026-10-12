import {readFile} from 'node:fs/promises';
import {object,short,string,array,ref,choice,integer,number,timestamp} from '../primitives.mjs';
const unitRegistry=JSON.parse(await readFile(new URL('../../../src/data/units.json',import.meta.url),'utf8'));
/** Existing authored declarations; no change to supplied-data or local interaction semantics. */
export function install({defs,node}){
// Local conversion controls use factual unit definitions and caller-supplied exchange snapshots.
const unitCode={enum:[...new Set(Object.values(unitRegistry).flatMap(category=>category.units.map(unit=>unit.id)))],description:Object.entries(unitRegistry).map(([name,category])=>name+': '+category.units.map(unit=>unit.id).join(', ')).join('; ')};
node('unit-converter',{title:short,category:choice('length','mass','temperature','speed','area','volume','time','pressure','data'),amount:number,from:unitCode,to:unitCode,precision:{...integer(1,12),description:'Maximum significant digits, default 8; raw values are retained.'},temperatureMode:{...choice('absolute','difference'),description:'Temperature only. Absolute includes scale offsets and must be >= 0 K; difference converts signed intervals without offsets.'}},['category','amount','from','to'], 'converters');
const currencyCode={type:'string',pattern:'^[A-Z]{3}$'};
node('currency-converter',{title:short,source:ref('FinanceSource'),asOf:timestamp,base:currencyCode,rates:array(object({currency:currencyCode,rate:{anyOf:[{type:'number',exclusiveMinimum:0},{type:'null'}],description:'Units of this currency per one base-currency unit; null means unavailable.'}},['currency','rate']),0,200),amount:number,from:currencyCode,to:currencyCode,precision:integer(1,12),status:choice('ready','loading','error'),message:string()},['source','asOf','base','rates','amount'], 'converters');
}
