/** Original numeric Sepsis-3 consensus rules. Not a sepsis diagnosis or treatment recommendation. */
export const QSOFA_VERSION='qsofa-sepsis3-2016-consensus' as const;
export type QsofaMentation={mode:'assessment';altered?:boolean|null}|{mode:'gcs';score?:number|'NT'|null};
export interface QsofaInput {version?:string|null;population?:string|null;respiratoryRate?:number|string|null;systolicMmHg?:number|string|null;mentation?:QsofaMentation|null}
export type QsofaResult={status:'invalid'|'incomplete';fields:readonly string[]}|{status:'unsupported';reason:'version'|'population'}|{status:'calculated';version:typeof QSOFA_VERSION;total:number;points:{respiratoryRate:0|1;systolicPressure:0|1;mentation:0|1};mentationMode:'assessment'|'gcs'};
function decimal(v:unknown):number|'missing'|'invalid'{if(v===undefined||v===null||v==='')return'missing';if(typeof v==='number')return Number.isFinite(v)&&v>=0?v:'invalid';if(typeof v!=='string'||!/^\+?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v))return'invalid';const n=Number(v);return Number.isFinite(n)?n:'invalid';}
export function calculateQsofa(input:QsofaInput):QsofaResult{
 if(input===null||typeof input!=='object'||Array.isArray(input))return{status:'invalid',fields:['input']};
 const invalid:string[]=[],missing:string[]=[],rr=decimal(input.respiratoryRate),sbp=decimal(input.systolicMmHg);let altered:boolean|undefined;
 for(const [key,value]of [['respiratoryRate',rr],['systolicMmHg',sbp]]as const){if(value==='invalid')invalid.push(key);if(value==='missing')missing.push(key);}
 for(const key of ['version','population']as const){const v=input[key];if(v===null||v===undefined||v==='')missing.push(key);else if(typeof v!=='string')invalid.push(key);}
 const m=input.mentation;
 if(m===null||m===undefined)missing.push('mentation');
 else if(typeof m!=='object'||Array.isArray(m))invalid.push('mentation');
 else if(m.mode==='assessment'){
  if(Object.keys(m).some(k=>k!=='mode'&&k!=='altered'))invalid.push('mentation');
  if(m.altered===null||m.altered===undefined)missing.push('mentation.altered');else if(typeof m.altered!=='boolean')invalid.push('mentation.altered');else altered=m.altered;
 }else if(m.mode==='gcs'){
  if(Object.keys(m).some(k=>k!=='mode'&&k!=='score'))invalid.push('mentation');
  if(m.score===null||m.score===undefined||m.score==='NT')missing.push('mentation.score');else if(typeof m.score!=='number'||!Number.isInteger(m.score)||m.score<3||m.score>15)invalid.push('mentation.score');else altered=m.score<15;
 }else invalid.push('mentation.mode');
 if(invalid.length)return{status:'invalid',fields:invalid};
 if(input.version&&input.version!==QSOFA_VERSION)return{status:'unsupported',reason:'version'};
 if(input.population&&input.population!=='adult')return{status:'unsupported',reason:'population'};
 if(missing.length)return{status:'incomplete',fields:missing};
 if(typeof rr!=='number'||typeof sbp!=='number'||altered===undefined||!m)return{status:'incomplete',fields:['mentation']};
 const points={respiratoryRate:(rr>=22?1:0)as 0|1,systolicPressure:(sbp<=100?1:0)as 0|1,mentation:(altered?1:0)as 0|1};
 return{status:'calculated',version:QSOFA_VERSION,total:points.respiratoryRate+points.systolicPressure+points.mentation,points,mentationMode:m.mode};
}
export interface QsofaInfoSection{id:string;label:string;body:string}
export interface QsofaNode{type:'calculator-qsofa-score';id?:string;label:string;initial?:QsofaInput;defaults?:QsofaInput;disabled?:boolean;status?:'pending'|'resolved'|'failed';fallback?:string;subtitle?:string;notes?:readonly string[];infoSections?:readonly QsofaInfoSection[];activeInfoId?:string;resetLabel?:string;copyLabel?:string;summaryPrefix?:string;fields?:Partial<Record<'version'|'population'|'respiratoryRate'|'systolicMmHg'|'mentationMode'|'altered'|'gcs',{label?:string;help?:string}>>}
export interface QsofaDetail{id:string|null;intent:'reset'|'copy-summary'|'select-info';text?:string;infoId?:string;result?:QsofaResult}
export function inspectQsofa(n:QsofaNode,path:string,add:(issue:{path:string;code:string;message:string})=>void):void{for(const key of['label','resetLabel','copyLabel']as const)if(n[key]!==undefined&&!n[key]!.trim())add({path:path+'/'+key,code:'QSOFA_TEXT',message:'Expected nonblank visible text.'});const ids=new Set<string>();for(const s of n.infoSections??[]){if(!s.id.trim()||!s.label.trim()||ids.has(s.id))add({path:path+'/infoSections',code:'QSOFA_INFO',message:'Expected unique information IDs and nonblank labels.'});ids.add(s.id);}for(const[key,f]of Object.entries(n.fields??{}))if(f.label!==undefined&&!f.label.trim())add({path:path+'/fields/'+key,code:'QSOFA_TEXT',message:'Expected nonblank field label.'});if(n.activeInfoId!==undefined&&!ids.has(n.activeInfoId))add({path:path+'/activeInfoId',code:'QSOFA_INFO',message:'Unknown information section.'});}
