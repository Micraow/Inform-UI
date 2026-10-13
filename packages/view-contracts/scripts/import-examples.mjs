/** Migrate public synthetic examples into new-DSL contract fixtures, not a runtime compatibility layer. */
import fs from 'node:fs';import path from 'node:path';
import {viewSpecs,validateDataSchema} from '../dist/index.mjs';
const source=process.argv[2];if(!source)throw Error('Pass the public source root.');
const candidates=new Map(),notes=[];
function scalar(value,state,computed){
 if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.hasOwn(value,'$'))return state[value.$]??computed[value.$]??null;
 if(value&&typeof value==='object'&&typeof value.op==='string'&&Array.isArray(value.args)){
  const a=value.args.map(x=>scalar(x,state,computed));switch(value.op){case'add':return a.reduce((x,y)=>x+y,0);case'sub':return a[0]-a[1];case'mul':return a.reduce((x,y)=>x*y,1);case'div':return a[1]?a[0]/a[1]:0;case'max':return Math.max(...a);case'min':return Math.min(...a);case'round':return Math.round(a[0]);case'abs':return Math.abs(a[0]);case'clamp':return Math.min(a[2],Math.max(a[1],a[0]));case'gt':return a[0]>a[1];case'lt':return a[0]<a[1];case'eq':return a[0]===a[1];case'if':return a[0]?a[1]:a[2];case'format':return String(a[0]);default:throw Error('Unsupported fixture expression');}
 }
 return value;
}
function values(value,state,computed){const evaluated=scalar(value,state,computed);if(evaluated!==value)return values(evaluated,state,computed);if(Array.isArray(value))return value.map(x=>values(x,state,computed));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,values(v,state,computed)]));return value;}
function scan(value,file,state,computed){if(!value||typeof value!=='object')return;if(value.type&&typeof value.type==='string')candidates.set(value.type,[...candidates.get(value.type)??[],{node:value,file,state,computed}]);for(const v of Object.values(value))scan(v,file,state,computed);}
function files(root,prefix=''){return fs.readdirSync(root,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(root,e.name),prefix+e.name+'/'):e.name.endsWith('.json')?[prefix+e.name]:[]);}
for(const filename of files(path.join(source,'examples')).sort()){
 const doc=JSON.parse(fs.readFileSync(path.join(source,'examples',filename),'utf8')),state=doc.state??{},computed={};
 for(const[key,value]of Object.entries(doc.computed??{}))computed[key]=values(value,state,computed);
 scan(doc,filename,state,computed);
}
function clean(node,spec,state,computed){
 const data=values(structuredClone(node),state,computed);delete data.type;delete data.id;delete data.bind;for(const key of Object.keys(spec.slots))delete data[key];
 if(spec.oldType==='tab-group'){if(node.initial!==undefined)data.initialIndex=Math.max(0,(node.children??[]).findIndex(x=>x.id===node.initial));delete data.initial;}
 if(spec.oldType==='form')delete data.action;if(spec.oldType==='pressable')delete data.actionId;
 if(spec.oldType==='checklist')for(const item of data.items??[]){item.checked=state[item.bind]===true;delete item.bind;}
 if(spec.oldType==='list')data.items=(node.items??[]).filter(x=>!x||typeof x!=='object'||!x.type).map(x=>values(x,state,computed));
 const strip=(x)=>{if(!x||typeof x!=='object')return;if(x.type&&viewSpecs.some(s=>s.oldType===x.type)){delete x.type;delete x.id;}for(const value of Object.values(x))strip(value);};strip(data);
 return data;
}
function minimal(s){
 if(s===false)return undefined;if(s.const!==undefined)return s.const;if(s.enum)return s.enum[0];if(s.oneOf||s.anyOf)return minimal((s.oneOf??s.anyOf)[0]);if(Array.isArray(s.type))return minimal({...s,type:s.type[0]});
 if(s.type==='object')return Object.fromEntries((s.required??[]).filter(k=>s.properties?.[k]).map(k=>[k,minimal(s.properties[k])]));
 if(s.type==='array')return Array.from({length:s.minItems??0},()=>minimal(s.items));if(s.type==='boolean')return false;if(s.type==='number'||s.type==='integer')return Math.max(s.minimum??0,s.exclusiveMinimum!==undefined?s.exclusiveMinimum+1:0);if(s.type==='null')return null;
 if(s.type==='string'){if(s.pattern?.includes('A-Z'))return 'USD';if(s.pattern?.includes('\\d{4}'))return s.maxLength===40?'2026-01-01T00:00:00Z':'2026-01-01';return 'Sample'.padEnd(s.minLength??0,'x').slice(0,s.maxLength??100);}
 return null;
}
const examples={};
for(const spec of viewSpecs){
 let matched;for(const candidate of candidates.get(spec.oldType)??[]){const data=clean(candidate.node,spec,candidate.state,candidate.computed);if(!validateDataSchema(spec.dataSchema,data).length){matched={data,provenance:'Public synthetic example: examples/'+candidate.file};break;}}
 if(!matched){const data=minimal(spec.dataSchema);if(validateDataSchema(spec.dataSchema,data).length===0)matched={data,provenance:'Generated minimal synthetic data'};else notes.push({name:spec.name,candidateCount:(candidates.get(spec.oldType)??[]).length,issues:validateDataSchema(spec.dataSchema,data).slice(0,3)});}
 if(matched){
  // Gallery examples illustrate ordinary use. Adversarial fixtures belong in tests.
  if(spec.oldType==='html-view')matched={data:{title:'Host-managed HTML boundary',height:180,width:'100%',html:'<h2>Supplied document preview</h2><p>Host approval and isolation are required before rendering active HTML.</p>'},provenance:'Original non-executable HTML sample'};
  if(spec.oldType==='youtube')matched={data:{label:'Introducing GPT-4o · OpenAI',videoId:'DQacCB9tDaw',loadMode:'on-demand'},provenance:'Verified public source: https://www.youtube.com/watch?v=DQacCB9tDaw'};
  if(spec.oldType==='sidebar-people-also-ask'){matched.data.items=matched.data.items.map(x=>x.id==='literal'?{...x,question:'Where do these answers come from?',answer:'The author supplies the answers and optional source links.'}:x);}
  examples[spec.name]=matched;
 }
}
fs.writeFileSync('src/examples.json',JSON.stringify(examples,null,2)+'\n');fs.writeFileSync('generated/example-gaps.json',JSON.stringify(notes,null,2)+'\n');
console.log(JSON.stringify({validExamples:Object.keys(examples).length,total:viewSpecs.length,gaps:notes}));
