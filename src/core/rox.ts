/** Original ROX arithmetic with explicit units; no outcome or treatment inference. */
export const ROX_VERSION='rox-roca-2016-arithmetic' as const;
export interface RoxInput { version?:string|null; spo2Percent?:number|string|null; fio2?:number|string|null; fio2Unit?:'fraction'|'percent'|null; respiratoryRate?:number|string|null; measuredHours?:number|string|null; comparisonVersion?:string|null; studyContextConfirmed?:boolean|null }
export type RoxComparison={status:'unavailable';reason:'not-requested'|'version'|'context-unconfirmed'|'unsupported-time'}|{status:'compared';version:'roca-2019-pneumonia-hfnc';hours:2|6|12;lower:number;upper:4.88;band:'below-study-lower'|'between-study-boundaries'|'at-or-above-study-upper'};
export type RoxResult={status:'invalid';fields:readonly string[]}|{status:'incomplete';fields:readonly string[]}|{status:'unsupported';reason:'version'}|{status:'uncomputable';reason:'nonfinite-arithmetic'}|{status:'calculated';version:typeof ROX_VERSION;value:number;display:string;spo2Percent:number;fio2Fraction:number;respiratoryRate:number;measuredHours:number|null;comparison:RoxComparison};
type Parsed={kind:'missing'}|{kind:'invalid'}|{kind:'number';value:number};
function parse(value:unknown):Parsed {if(value===undefined||value===null||value==='')return{kind:'missing'};if(typeof value==='number')return Number.isFinite(value)?{kind:'number',value}:{kind:'invalid'};if(typeof value!=='string'||!/^\+?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value))return{kind:'invalid'};const n=Number(value);return Number.isFinite(n)?{kind:'number',value:n}:{kind:'invalid'};}
export function calculateRox(input:RoxInput):RoxResult {
 if(input===null||typeof input!=='object'||Array.isArray(input))return{status:'invalid',fields:['input']};
 const spo2=parse(input.spo2Percent),fio2=parse(input.fio2),rr=parse(input.respiratoryRate),hours=parse(input.measuredHours),fields:string[]=[];
 for(const[key,p]of [['spo2Percent',spo2],['fio2',fio2],['respiratoryRate',rr],['measuredHours',hours]] as const)if(p.kind==='invalid')fields.push(key);
 if(spo2.kind==='number'&&(spo2.value<0||spo2.value>100))fields.push('spo2Percent');
 if(rr.kind==='number'&&rr.value<=0)fields.push('respiratoryRate');
 if(hours.kind==='number'&&hours.value<0)fields.push('measuredHours');
 if(input.fio2Unit!==undefined&&input.fio2Unit!==null&&input.fio2Unit!=='fraction'&&input.fio2Unit!=='percent')fields.push('fio2Unit');
 if(fio2.kind==='number'&&(fio2.value<=0||input.fio2Unit==='fraction'&&fio2.value>1||input.fio2Unit==='percent'&&fio2.value>100))fields.push('fio2');
 if(input.version!==undefined&&input.version!==null&&typeof input.version!=='string')fields.push('version');
 if(input.studyContextConfirmed!==undefined&&input.studyContextConfirmed!==null&&typeof input.studyContextConfirmed!=='boolean')fields.push('studyContextConfirmed');
 if(input.comparisonVersion!==undefined&&input.comparisonVersion!==null&&typeof input.comparisonVersion!=='string')fields.push('comparisonVersion');
 if(fields.length)return{status:'invalid',fields};
 if(input.version&&input.version!==ROX_VERSION)return{status:'unsupported',reason:'version'};
 const missing:string[]=[];if(!input.version)missing.push('version');if(!input.fio2Unit)missing.push('fio2Unit');for(const[k,p]of [['spo2Percent',spo2],['fio2',fio2],['respiratoryRate',rr]] as const)if(p.kind==='missing')missing.push(k);
 if(missing.length)return{status:'incomplete',fields:missing};
 // Narrowed explicitly: no undefined/blank value is converted into a physiological zero.
 if(spo2.kind!=='number'||fio2.kind!=='number'||rr.kind!=='number')return{status:'uncomputable',reason:'nonfinite-arithmetic'};
 const fraction=input.fio2Unit==='percent'?fio2.value/100:fio2.value,value=spo2.value/fraction/rr.value;
 if(!(fraction>0)||!Number.isFinite(value))return{status:'uncomputable',reason:'nonfinite-arithmetic'};
 let comparison:RoxComparison;
 const time=hours.kind==='number'?hours.value:null;
 if(!input.comparisonVersion)comparison={status:'unavailable',reason:'not-requested'};else if(input.comparisonVersion!=='roca-2019-pneumonia-hfnc')comparison={status:'unavailable',reason:'version'};else if(input.studyContextConfirmed!==true)comparison={status:'unavailable',reason:'context-unconfirmed'};else if(time!==2&&time!==6&&time!==12)comparison={status:'unavailable',reason:'unsupported-time'};else{const lower=time===2?2.85:time===6?3.47:3.85;comparison={status:'compared',version:'roca-2019-pneumonia-hfnc',hours:time,lower,upper:4.88,band:value>=4.88?'at-or-above-study-upper':value<lower?'below-study-lower':'between-study-boundaries'};}
 return{status:'calculated',version:ROX_VERSION,value,display:value>=1e21?value.toExponential(1):value.toFixed(1),spo2Percent:spo2.value,fio2Fraction:fraction,respiratoryRate:rr.value,measuredHours:time,comparison};
}
export interface RoxInfoSection {id:string;label:string;body:string}
export interface RoxNode {type:'calculator-rox-index-for-high-flow-nasal-cannula';id?:string;label:string;initial?:RoxInput;defaults?:RoxInput;disabled?:boolean;status?:'pending'|'resolved'|'failed';fallback?:string;subtitle?:string;notes?:readonly string[];infoSections?:readonly RoxInfoSection[];activeInfoId?:string;resetLabel?:string;copyLabel?:string;summaryPrefix?:string;fields?:Partial<Record<keyof RoxInput,{label?:string;help?:string}>>}
export interface RoxDetail {id:string|null;intent:'reset'|'copy-summary'|'select-info';text?:string;infoId?:string;result?:RoxResult}
export function inspectRox(node:RoxNode,path:string,add:(issue:{path:string;message:string;code:string})=>void):void {for(const k of['label','resetLabel','copyLabel']as const)if(node[k]!==undefined&&!node[k]!.trim())add({path:path+'/'+k,message:'Expected nonblank visible text.',code:'ROX_TEXT'});const ids=new Set<string>();for(const info of node.infoSections??[]){if(!info.id.trim()||!info.label.trim()||ids.has(info.id))add({path:path+'/infoSections',message:'Expected unique information IDs and nonblank labels.',code:'ROX_INFO'});ids.add(info.id);}if(node.activeInfoId!==undefined&&!ids.has(node.activeInfoId))add({path:path+'/activeInfoId',message:'Unknown information section.',code:'ROX_INFO'});for(const[k,f]of Object.entries(node.fields??{}))if(f.label!==undefined&&!f.label.trim())add({path:path+'/fields/'+k,message:'Expected nonblank field label.',code:'ROX_TEXT'});}
