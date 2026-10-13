/** Build-time migration inventory from the public MIT Inform source. No runtime iui/1 parser is shipped. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const source = process.argv[2];
if (!source) throw Error('Pass the public Inform repository root.');
const schemaText=fs.readFileSync(path.join(source,'src/schema/iui.schema.json'),'utf8');
const schema=JSON.parse(schemaText), defs=schema.$defs;
const rendererText=fs.readFileSync(path.join(source,'src/renderer/index.ts'),'utf8');
const nodes=Object.entries(defs).filter(([,v])=>v.properties?.type?.const);
if(nodes.length!==219)throw Error('Expected the frozen 219-node public baseline.');
const base={text:'Text',title:'Heading',caption:'Text',badge:'Badge',divider:'Divider',image:'Image',icon:'Icon',box:'Stack',card:'Card',row:'Row',col:'Stack',grid:'Grid',flow:'Row',callout:'Alert',slider:'Slider',toggle:'Switch',select:'Select',input:'Input',textarea:'Textarea',radio:'RadioGroup',button:'Button',table:'Table',chart:'BarChart'};
const host=new Set(['html-view','youtube','lottie','ask-user-files','ask-user-location','learning-voice-mode-launcher-card','offer-voice-conversation','speech-synthesizer','internal-partner-app','plugin-followup','onboarding-plugin-suggestions','ledger-repair-bank-connection','ledger-finance-onboarding','push-drip-series-intro','stop-push-drip-series','task-autopause-card','display-automation','list-automations','scheduled-task-suggestion','image-gen','gen-image']);
const unsafeActions={ 'form':['action'], 'pressable':['actionId'] };
const scalar={anyOf:[{type:'string',maxLength:12000},{type:'number'},{type:'boolean'},{type:'null'}]};
const nodeByType=new Map(nodes.map(([key,v])=>[v.properties.type.const,{key,schema:v}]));
const fieldUnion=(s)=>{const out={...s.properties};for(const branch of [...s.oneOf??[],...s.anyOf??[]])for(const[k,v]of Object.entries(fieldUnion(branch)))out[k]=out[k]&&JSON.stringify(out[k])!==JSON.stringify(v)?{anyOf:[out[k],v]}:v;return out};
function refNode(s){return /^#\/\$defs\/.*Node$/.test(s?.$ref??'')}
const slotsFor=(s)=>Object.fromEntries(Object.entries(fieldUnion(s)).filter(([k,v])=>k==='children'&&v.type==='array'&&refNode(v.items)).map(([k,v])=>[k,{min:v.minItems??0,max:v.maxItems??128,accepts:v.items.$ref.endsWith('/Node')?'all':[v.items.$ref.split('/').at(-1).replace(/Node$/,'View')]}]));
const warnings=[];
function transform(s, root=false, removals=new Set(), ancestry=[]) {
 if(!s||typeof s!=='object')return s;
 if(Array.isArray(s))return s.map(x=>transform(x,false,removals,ancestry));
 if(s.$ref){const key=s.$ref.split('/').at(-1);if(key==='Value')return structuredClone(scalar);if(key==='Node')throw Error('Unextracted node slot');if(!defs[key])throw Error('Missing reference '+key);if(ancestry.filter(x=>x===key).length>=(key==='LottieJSON'?8:6)){warnings.push('Bounded recursive data '+key+' at finite depth');return false;}const isNode=key.endsWith('Node');return transform(defs[key],isNode,isNode?new Set(['type','id',...Object.keys(slotsFor(defs[key])),...unsafeActions[defs[key].properties?.type?.const]??[]]):new Set(),[...ancestry,key]);}
 const out={};
 for(const[k,v]of Object.entries(s)){
  if(k==='properties')out[k]=Object.fromEntries(Object.entries(v).filter(([key])=>!(root&&removals.has(key))).map(([key,val])=>[key,transform(val,false,new Set(),ancestry)]));
  else if(k==='required')out[k]=v.filter(key=>!(root&&removals.has(key)));
  else if(['oneOf','anyOf','allOf'].includes(k))out[k]=v.map(x=>transform(x,root,removals,ancestry));
  else if(['if','then','else','not'].includes(k))out[k]=transform(v,root,removals,ancestry);
  else out[k]=transform(v,false,new Set(),ancestry);
 }
 return out;
}
function composition(type){
 if(base[type])return [base[type]];
 if(/finance|ledger|transaction|asset|currency/.test(type))return ['Card','Heading','Text','Row','Badge','Table','Select','Button'];
 if(/sports|nba|soccer|football|f1-|cricket|tennis|election/.test(type))return ['Card','Heading','Text','Row','Badge','Table','Select'];
 if(/learning|quiz|flash|vocab|word|sentence|fill-blank|homework|questionnaire|calculator/.test(type))return ['Card','Heading','Text','Stack','Input','RadioGroup','Select','Button'];
 if(/image|gallery|video|youtube|lottie/.test(type))return ['Card','Image','Text','Row','Button'];
 if(/weather/.test(type))return ['Card','Heading','Text','Row','Icon','Select','Table'];
 if(/onboarding|suggestion|capability|follow-up|task/.test(type))return ['Card','Heading','Text','Stack','Button','Icon'];
 if(/field|form|rating|segmented|checklist/.test(type))return ['Stack','Text','Input','RadioGroup','Button'];
 return ['Card','Heading','Text','Stack','Row','Button'];
}
function family(type){if(/finance|ledger|transaction|asset|currency/.test(type))return'finance';if(/sports|nba|soccer|football|f1-|cricket|tennis|election|basketball/.test(type))return'sports';if(/learning|quiz|flash|vocab|word|sentence|fill-blank|homework|questionnaire|calculator/.test(type))return'learning';if(/image|gallery|video|youtube|lottie|speech/.test(type))return'media';if(/weather/.test(type))return'weather';if(/onboarding|suggestion|capability|follow-up|task|automation|plugin/.test(type))return'assistance';if(/flight|restaurant|business|event|agenda|package|care-provider|location|places/.test(type))return'discovery';return'content';}
const entries=nodes.map(([oldDefinition,node])=>{
 const oldType=node.properties.type.const,stem=oldDefinition.replace(/Node$/,''),name=base[oldType]??stem+'View';
 const classification=oldType==='native'?'refusal':base[oldType]?'base':host.has(oldType)?'host':'view';
 const slots=slotsFor(node),remove=new Set(['type','id',...Object.keys(slots),...unsafeActions[oldType]??[],'bind']);
 let input=node;
 if(oldType==='list'){input=structuredClone(node);input.properties.items.items=scalar;slots.children={min:0,max:500,accepts:'all'};}
 const dataSchema=transform(input,true,remove,[oldDefinition]);
 if(oldType==='tab-group'){delete dataSchema.properties.initial;dataSchema.properties.initialIndex={type:'integer',minimum:0,maximum:19};}
 if(oldType==='label'){dataSchema.properties.target.description='Display-only supplied association label; does not resolve a DOM ID in the new DSL.';}
 if(oldType==='checklist'){const item=dataSchema.properties.items.items;delete item.properties.bind;item.required=item.required.filter(x=>x!=='bind');item.properties.checked={type:'boolean'};}
 const fields=fieldUnion(dataSchema),bindings=[];
 // Domain-local state stays in supplied data until an adapter implements a verified writeBinding path.
 if(oldType==='rating')bindings.push({prop:'value',dataProp:null,schema:{type:'number',minimum:0,maximum:10},optional:false});
 if(oldType==='segmented')bindings.push({prop:'value',dataProp:null,schema:scalar,optional:false});
 const actions=oldType==='pressable'?[{prop:'onPress',scope:'local',required:true}]:oldType==='form'?[{prop:'onSubmit',scope:'local',required:true}]:[];
 const cases=[...rendererText.matchAll(new RegExp("case ['\"]"+oldType+"['\"]:",'g'))];
 const line=cases[0]?rendererText.slice(0,cases[0].index).split('\n').length:null;
 return {oldType,oldDefinition,name,classification,family:family(oldType),dataName:classification==='base'||classification==='refusal'?null:stem+'Data',moduleId:classification==='base'?'base':classification==='refusal'?null:'views/'+family(oldType),...(oldType==='chart'?{baseTargets:['LineChart','BarChart','ScatterChart','AreaChart','DonutChart','PieChart'],migrationNote:'Select the new chart component by the old kind and author its native positional props; BarChart is the representative target, not a kind-compatible adapter.'}:{}),rendererKey:name,orderedProps:classification==='base'||classification==='refusal'?[]:['data',...Object.keys(slots),...bindings.map(x=>x.prop),...actions.map(x=>x.prop)],slots,bindings,actions,dataSchema,composition:{requiredPublicBases:composition(oldType),status:classification==='base'?'existing-base-contract':'not-yet-decomposed',evidence:[]},renderer:{oldSource:'src/renderer/index.ts',oldLine:line,oldDispatcherCase:cases.length>0,oldOperational:oldType!=='native'&&cases.length>0,actualAdapterBound:false,browserVerified:false,evidence:[]},limitations:[...(classification==='host'?['Host-owned capability. Contract registration does not grant permissions or execute external actions.']:[]),...(oldType==='native'?['Native runtime is refused. Select public DSL components explicitly.']:[]),'Supplied source data is not independently fetched or verified.','Legacy state references, expression objects, type/id envelope and executable action strings are not accepted.','Base composition is a target until adapter evidence confirms extraction.']};
});
// Store only public schema-derived contracts and locations, never captured runtime or private examples.
const provenance={repository:'https://github.com/micraow/Inform-UI',baseline:'219 public schema nodes',license:'MIT',schemaSha256:createHash('sha256').update(schemaText).digest('hex'),rendererSha256:createHash('sha256').update(rendererText).digest('hex'),upstreamDSLRevision:'cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7'};
fs.writeFileSync('src/specs.json',JSON.stringify({provenance,entries},null,2)+'\n');
fs.writeFileSync('generated/migration-map.json',JSON.stringify({provenance,entries},null,2)+'\n');
console.log(JSON.stringify({nodes:entries.length,classifications:entries.reduce((a,e)=>(a[e.classification]=(a[e.classification]??0)+1,a),{}),warnings:[...new Set(warnings)]}));
