const evaluatedScalar=(value:unknown,..._context:unknown[]):Scalar=>{if(value!==null&&typeof value==='object')throw new TypeError('V2 questionnaire conditions must be evaluated scalars');return value as Scalar;};
import {isSafeURL} from './index.js';
import type {Issue, Scalar} from './index.js';
import type {Value} from '../schema/document.js';

export interface QuestionnaireSource {title:string;url?:string;version?:string}
export interface QuestionnaireField {
  id:string;label:string;type:'text'|'number'|'choice'|'boolean';description?:string;required?:boolean;
  min?:number;max?:number;step?:number;minLength?:number;maxLength?:number;placeholder?:string;
  options?:readonly {value:string;label:string}[];visibleWhen?:Value;validWhen?:Value;validationMessage?:string;
}
export interface QuestionnaireNode {
  type:'questionnaire';id?:string;questionnaireId:string;version:string;title:string;description?:string;
  hiddenValuePolicy:'retain'|'clear';fields:readonly QuestionnaireField[];computed?:Readonly<Record<string,Value>>;
  initialAnswers?:Readonly<Record<string,Scalar>>;defaults?:Readonly<Record<string,Scalar>>;
  sources?:readonly QuestionnaireSource[];disabled?:boolean;action?:string;submitLabel?:string;resetLabel?:string;
}
export type QuestionnaireDraft=Readonly<Record<string,Scalar>>;
export interface QuestionnaireFieldValidity {
  readonly visible:boolean;readonly status:'unknown'|'invalid'|'valid'|'hidden'|'pending';readonly value:Scalar;readonly message?:string;
}
export interface QuestionnaireSnapshot {
  readonly questionnaireId:string;readonly version:string;readonly status:'incomplete'|'invalid'|'ready';
  readonly answers:Readonly<Record<string,Scalar>>;readonly validity:Readonly<Record<string,QuestionnaireFieldValidity>>;
  readonly computed:Readonly<Record<string,Scalar>>;readonly sources:readonly Readonly<QuestionnaireSource>[];
}
export interface QuestionnaireEvaluation {
  readonly draft:QuestionnaireDraft;readonly snapshot:QuestionnaireSnapshot;readonly issues:readonly Readonly<Issue>[];
}
const own=(value:object,key:string)=>Object.prototype.hasOwnProperty.call(value,key);
const keyOK=(value:string)=>/^[A-Za-z_][A-Za-z0-9_.-]{0,79}$(?![\s\S])/.test(value)&&!['__proto__','constructor','prototype'].includes(value);
const ptr=(path:string,key:string|number)=>`${path}/${String(key).replace(/~/g,'~0').replace(/\//g,'~1')}`;
const isList=(value:unknown):value is readonly unknown[]=>Array.isArray(value);
const record=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const issue=(code:string,path:string,message:string):Issue=>({code,path,message});
function freeze<T>(value:T):T {if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;}
function caught(error:unknown,path:string):Issue {
  const e=error as {code?:unknown;message?:unknown};
  return issue(typeof e?.code==='string'?e.code:'QUESTIONNAIRE_EVALUATION',path,typeof e?.message==='string'?e.message:'Questionnaire evaluation failed.');
}
/** Detached JSON-only copy. Accessors, cyclic data and unsafe keys never reach evaluation. */
function copy<T>(value:T):T {
  const active=new WeakSet<object>();let count=0,text=0;
  const walk=(v:unknown,depth:number):unknown=>{
    if(++count>50000||depth>64)throw Error('Questionnaire input exceeds the data budget.');
    if(typeof v==='string'){text+=v.length;if(text>2_000_000)throw Error('Questionnaire input exceeds the text budget.');return v;}
    if(v===null||typeof v==='boolean')return v;
    if(typeof v==='number'&&Number.isFinite(v))return v;
    if(typeof v!=='object'||v===null)throw Error('Only finite JSON data is allowed.');
    const array=Array.isArray(v),proto=Object.getPrototypeOf(v);
    if(active.has(v)||Object.getOwnPropertySymbols(v).length||(array?proto!==Array.prototype:proto!==Object.prototype&&proto!==null))throw Error('Only acyclic plain JSON data is allowed.');
    const keys=Object.keys(v);if(array&&keys.length!==(v as unknown[]).length)throw Error('Sparse arrays are not allowed.');
    active.add(v);const out:Record<string,unknown>|unknown[]=array?[]:{};
    for(const k of keys){
      if(['__proto__','constructor','prototype'].includes(k))throw Error('Reserved property name.');
      const d=Object.getOwnPropertyDescriptor(v,k);if(!d||!('value'in d))throw Error('Accessors are not JSON data.');
      if(array&&!/^(0|[1-9]\d*)$/.test(k))throw Error('Arrays may contain only indexed elements.');
      text+=k.length;if(text>2_000_000)throw Error('Questionnaire input exceeds the text budget.');
      (out as Record<string,unknown>)[k]=walk(d.value,depth+1);
    }
    active.delete(v);return out;
  };
  return walk(value,0) as T;
}
const arities:Record<string,readonly [number,number]>={add:[1,12],sub:[2,2],mul:[1,12],div:[2,2],min:[1,12],max:[1,12],round:[1,2],abs:[1,1],clamp:[3,3],gt:[2,2],lt:[2,2],eq:[2,2],if:[3,3],format:[1,2]};
type Kind='string'|'number'|'boolean'|'null'|'mixed';
/** Semantic validation supplements the additive schema; no action or external resolver runs here. */
export function inspectQuestionnaire(node:QuestionnaireNode,path:string,add:(issue:Issue)=>void,safeURL:(url:string)=>boolean=isSafeURL):void {
  const fields=new Map<string,QuestionnaireField>(),indices=new Map<string,number>(),computed=node.computed??{};
  const report=(code:string,at:string,message:string)=>add(issue(code,at,message));
  const nonblank=(value:unknown,at:string,max:number)=>{if(typeof value!=='string'||!value.trim()||[...value].length>max)report('QUESTIONNAIRE_TEXT',at,`Expected nonblank text up to ${max} characters.`);};
  const keys=(value:object,allowed:readonly string[],at:string)=>{for(const key of Object.keys(value))if(!allowed.includes(key))report('QUESTIONNAIRE_PROPERTY',ptr(at,key),'Unsupported property.');};
  const optionalText=(value:unknown,at:string,max:number)=>{if(value!==undefined&&(typeof value!=='string'||[...value].length>max))report('QUESTIONNAIRE_TEXT',at,`Expected text up to ${max} characters.`);};
  keys(node,['type','id','questionnaireId','version','title','description','hiddenValuePolicy','fields','computed','initialAnswers','defaults','sources','disabled','action','submitLabel','resetLabel'],path);
  if(node.id!==undefined)nonblank(node.id,path+'/id',200);
  optionalText(node.description,path+'/description',4000);
  if(node.disabled!==undefined&&typeof node.disabled!=='boolean')report('QUESTIONNAIRE_TYPE',path+'/disabled','Expected a boolean.');
  if(node.computed!==undefined&&!record(node.computed))report('QUESTIONNAIRE_COMPUTED',path+'/computed','Expected named expression definitions.');
  if(node.type!=='questionnaire')report('QUESTIONNAIRE_TYPE',path+'/type','Expected questionnaire.');
  if(typeof node.questionnaireId!=='string'||!keyOK(node.questionnaireId))report('QUESTIONNAIRE_KEY',path+'/questionnaireId','Invalid questionnaire identifier.');
  nonblank(node.version,path+'/version',80);nonblank(node.title,path+'/title',500);
  if(node.hiddenValuePolicy!=='retain'&&node.hiddenValuePolicy!=='clear')report('QUESTIONNAIRE_HIDDEN_POLICY',path+'/hiddenValuePolicy','An explicit retain or clear policy is required.');
  if(!isList(node.fields)||node.fields.length<1||node.fields.length>40){report('QUESTIONNAIRE_FIELDS',path+'/fields','Expected between 1 and 40 fields.');return;}
  for(const k of ['submitLabel','resetLabel'] as const)if(node[k]!==undefined)nonblank(node[k],path+'/'+k,200);
  if(node.action!==undefined&&!keyOK(node.action))report('QUESTIONNAIRE_KEY',path+'/action','Invalid registered action name.');
  node.fields.forEach((field,i)=>{
    const at=path+'/fields/'+i;
    if(!record(field)){report('QUESTIONNAIRE_FIELD',at,'Expected a field object.');return;}
    if(typeof field.id!=='string'||!keyOK(field.id))report('QUESTIONNAIRE_KEY',at+'/id','Invalid field identifier.');
    else if(fields.has(field.id))report('DUPLICATE_ID',at+'/id','Field identifiers must be unique.');
    else{fields.set(field.id,field);indices.set(field.id,i);}
    const allowed=['id','label','type','description','required','visibleWhen','validWhen','validationMessage'];
    if(field.type==='text')allowed.push('placeholder','minLength','maxLength');
    if(field.type==='number')allowed.push('placeholder','min','max','step');
    if(field.type==='choice')allowed.push('options');
    keys(field,allowed,at);
    optionalText(field.description,at+'/description',2000);optionalText(field.placeholder,at+'/placeholder',500);
    if(field.required!==undefined&&typeof field.required!=='boolean')report('QUESTIONNAIRE_TYPE',at+'/required','Expected a boolean.');
    nonblank(field.label,at+'/label',200);
    if(!['text','number','choice','boolean'].includes(field.type))report('QUESTIONNAIRE_FIELD_TYPE',at+'/type','Unsupported field type.');
    for(const name of ['min','max','step'] as const)if(field[name]!==undefined&&(field.type!=='number'||typeof field[name]!=='number'||!Number.isFinite(field[name])))report('QUESTIONNAIRE_BOUNDARY',at+'/'+name,'Numeric constraints require a finite number field.');
    if(field.min!==undefined&&field.max!==undefined&&field.min>field.max)report('QUESTIONNAIRE_BOUNDARY',at+'/max','Maximum must be at least minimum.');
    if(field.step!==undefined&&field.step<=0)report('QUESTIONNAIRE_BOUNDARY',at+'/step','Step must be positive.');
    for(const name of ['minLength','maxLength'] as const)if(field[name]!==undefined&&(field.type!=='text'||!Number.isInteger(field[name])||field[name]!<0||field[name]!>12000))report('QUESTIONNAIRE_BOUNDARY',at+'/'+name,'Text lengths must be integers between 0 and 12000.');
    if(field.minLength!==undefined&&field.maxLength!==undefined&&field.minLength>field.maxLength)report('QUESTIONNAIRE_BOUNDARY',at+'/maxLength','Maximum length must be at least minimum length.');
    if(field.type==='choice'){
      if(!isList(field.options)||field.options.length<1||field.options.length>40)report('QUESTIONNAIRE_OPTIONS',at+'/options','Choice fields require between 1 and 40 options.');
      else{const seen=new Set<string>();field.options.forEach((option,j)=>{const p=at+'/options/'+j;if(!record(option)){report('QUESTIONNAIRE_OPTIONS',p,'Expected a choice object.');return;}keys(option,['value','label'],p);nonblank(option.value,p+'/value',200);nonblank(option.label,p+'/label',500);if(seen.has(option.value))report('DUPLICATE_ID',p+'/value','Choice values must be unique.');seen.add(option.value);});}
    }else if(field.options!==undefined)report('QUESTIONNAIRE_OPTIONS',at+'/options','Only choice fields accept options.');
    if(field.validationMessage!==undefined)nonblank(field.validationMessage,at+'/validationMessage',1000);
  });
  if(!record(computed)||Object.keys(computed).length>40){report('QUESTIONNAIRE_COMPUTED',path+'/computed','Expected at most 40 named computations.');return;}
  for(const name of Object.keys(computed)){
    if(!keyOK(name))report('QUESTIONNAIRE_KEY',ptr(path+'/computed',name),'Invalid computed identifier.');
    if(fields.has(name))report('NAME_COLLISION',ptr(path+'/computed',name),'Field and computed identifiers must be distinct.');
  }
  const inferred=new Map<string,Kind>(),active=new Set<string>();
  const infer=(value:unknown,at:string,mode:'computed'|'visible'|'valid',index:number,depth=0):Kind=>{
    if(depth>64)throw issue('DEPTH_LIMIT',at,'Expression nesting is too deep.');
    if(value===null)return'null';
    if(typeof value==='boolean'||typeof value==='number'||typeof value==='string'){
      if(typeof value==='number'&&!Number.isFinite(value))throw issue('NON_FINITE',at,'Numbers must be finite.');
      if(typeof value==='string'&&[...value].length>12000)throw issue('TEXT_LIMIT',at,'Expression text exceeds 12000 characters.');
      return typeof value as Kind;
    }
    if(!record(value))throw issue('EXPRESSION_SHAPE',at,'Expected a scalar or a supported expression.');
    if(own(value,'$')){
      const name=value.$;if(Object.keys(value).length!==1||typeof name!=='string'||!keyOK(name))throw issue('REFERENCE',at,'Invalid reference.');
      if(fields.has(name)){
        if(mode==='visible'&&indices.get(name)!>=index)throw issue('QUESTIONNAIRE_VISIBILITY_REFERENCE',at,'Visibility may refer only to earlier fields.');
        const type=fields.get(name)!.type;return type==='choice'||type==='text'?'string':type;
      }
      if(mode!=='computed'||!own(computed,name))throw issue('UNKNOWN_REFERENCE',at,`Unknown or disallowed reference: ${name}.`);
      if(inferred.has(name))return inferred.get(name)!;
      if(active.has(name))throw issue('COMPUTED_CYCLE',at,`Computed dependency cycle at ${name}.`);
      active.add(name);try{const type=infer(computed[name],ptr(path+'/computed',name),'computed',-1,depth+1);inferred.set(name,type);return type;}finally{active.delete(name);}
    }
    if(Object.keys(value).length!==2||typeof value.op!=='string'||!own(arities,value.op)||!isList(value.args))throw issue('EXPRESSION_SHAPE',at,'Expected a supported operator and args array.');
    const [min,max]=arities[value.op];if(value.args.length<min||value.args.length>max)throw issue('OPERATOR_ARITY',at,'Incorrect operator arity.');
    const types=value.args.map((v,i)=>infer(v,at+'/args/'+i,mode,index,depth+1));
    if(value.op==='if'){if(types[0]!=='boolean')throw issue('OPERATOR_TYPE',at+'/args/0','if requires a boolean condition.');return types[1]===types[2]?types[1]:'mixed';}
    if(value.op==='eq')return'boolean';
    const bad=types.findIndex(type=>type!=='number');if(bad!==-1)throw issue('OPERATOR_TYPE',at+'/args/'+bad,`${value.op} requires numeric operands.`);
    return value.op==='format'?'string':value.op==='gt'||value.op==='lt'?'boolean':'number';
  };
  const check=(value:Value,at:string,mode:'computed'|'visible'|'valid',index=-1)=>{
    try{const kind=infer(value,at,mode,index);if(mode!=='computed'&&kind!=='boolean')report('OPERATOR_TYPE',at,'This condition must return a boolean.');if(references(value).length===0)evaluatedScalar(value);}
    catch(error){const e=error as Issue;add(typeof e?.code==='string'&&typeof e?.path==='string'?e:caught(error,at));}
  };
  for(const [name,value]of Object.entries(computed))check(value,ptr(path+'/computed',name),'computed');
  node.fields.forEach((field,i)=>{if(!record(field))return;for(const [key,mode]of [['visibleWhen','visible'],['validWhen','valid']]as const)if(field[key]!==undefined)check(field[key],path+'/fields/'+i+'/'+key,mode,i);});
  for(const k of ['initialAnswers','defaults']as const)if(node[k]!==undefined){
    const values=node[k]!;if(!record(values)||Object.keys(values).length>40){report('QUESTIONNAIRE_DRAFT',path+'/'+k,'Expected at most 40 scalar answers.');continue;}
    for(const [name,value]of Object.entries(values)){const at=ptr(path+'/'+k,name);if(!keyOK(name)||!fields.has(name))report('UNKNOWN_REFERENCE',at,'Draft key must name an authored field.');if(value!==null&&!['string','number','boolean'].includes(typeof value)||typeof value==='number'&&!Number.isFinite(value)||typeof value==='string'&&[...value].length>12000)report('QUESTIONNAIRE_DRAFT',at,'Expected a bounded scalar answer.');}
  }
  if(node.sources!==undefined){if(!isList(node.sources)||node.sources.length>20)report('QUESTIONNAIRE_SOURCE',path+'/sources','Expected at most 20 sources.');else node.sources.forEach((source,i)=>{const at=path+'/sources/'+i;if(!record(source)){report('QUESTIONNAIRE_SOURCE',at,'Expected source metadata.');return;}keys(source,['title','url','version'],at);nonblank(source.title,at+'/title',500);if(source.version!==undefined)nonblank(source.version,at+'/version',200);if(source.url!==undefined&&(typeof source.url!=='string'||source.url.length>2048||!safeURL(source.url)))report('UNSAFE_URL',at+'/url','Source URL must be a safe link.');});}
}
function references(value:unknown):string[]{
  if(!record(value))return[];
  if(own(value,'$'))return typeof value.$==='string'?[value.$]:[];
  return isList(value.args)?value.args.flatMap(v=>references(v)):[];
}
/** Reset is explicit: defaults win only when reset=true; ordinary editing never re-merges initial values. */
export function createQuestionnaireDraft(node:QuestionnaireNode,reset=false):QuestionnaireDraft {
  const draft=copy((reset?node.defaults??node.initialAnswers:node.initialAnswers)??{});
  return freeze(draft);
}
function parse(field:QuestionnaireField,raw:Scalar|undefined):QuestionnaireFieldValidity {
  const result=(status:QuestionnaireFieldValidity['status'],value:Scalar=null,message?:string):QuestionnaireFieldValidity=>({visible:true,status,value,...message?{message}:{}});
  if(raw===undefined||raw===null||raw==='')return result('unknown');
  const invalid=(message:string)=>result('invalid',null,message);
  if(field.type==='text'){
    if(typeof raw!=='string')return invalid('Enter text.');
    if(!raw.trim())return result('unknown');
    const size=[...raw].length;
    if(size<(field.minLength??0))return invalid(`Use at least ${field.minLength} characters.`);
    if(size>(field.maxLength??12000))return invalid(`Use at most ${field.maxLength??12000} characters.`);
    return result('valid',raw);
  }
  if(field.type==='boolean')return typeof raw==='boolean'?result('valid',raw):invalid('Choose yes or no.');
  if(field.type==='choice')return typeof raw==='string'&&field.options?.some(option=>option.value===raw)?result('valid',raw):invalid('Choose one of the available options.');
  if(typeof raw!=='number'&&(typeof raw!=='string'||!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$(?![\s\S])/.test(raw)))return invalid('Enter a finite number.');
  const n=typeof raw==='number'?raw:Number(raw);if(!Number.isFinite(n)||n===0&&typeof raw==='string'&&/[1-9]/.test(raw.split(/[eE]/)[0]))return invalid('Enter a finite number without underflow.');
  if(field.min!==undefined&&n<field.min)return invalid(`Use a value of at least ${field.min}.`);
  if(field.max!==undefined&&n>field.max)return invalid(`Use a value of at most ${field.max}.`);
  if(field.step!==undefined){const steps=(n-(field.min??0))/field.step;if(!Number.isFinite(steps)||Math.abs(steps)>Number.MAX_SAFE_INTEGER||Math.abs(steps-Math.round(steps))>Math.min(1e-7,Number.EPSILON*Math.max(1,Math.abs(steps))*8))return invalid(`Use increments of ${field.step} from ${field.min??0}.`);}
  return result('valid',n);
}
/** Derive a fresh immutable view from local raw drafts. Hidden fields never enter answers or expressions. */
export function evaluateQuestionnaire(input:QuestionnaireNode,raw?:QuestionnaireDraft):QuestionnaireEvaluation {
  let node:QuestionnaireNode,draft:Record<string,Scalar>;
  const issues:Issue[]=[];
  try{node=copy(input);draft=copy(raw??createQuestionnaireDraft(node));inspectQuestionnaire(node,'',e=>{if(issues.length<40)issues.push(e);});}
  catch(error){return freeze({draft:{},snapshot:{questionnaireId:'',version:'',status:'invalid',answers:{},validity:{},computed:{},sources:[]},issues:[caught(error,'')]});}
  const validity:Record<string,QuestionnaireFieldValidity>={},answers:Record<string,Scalar>={},computed:Record<string,Scalar>={};
  const snapshot=(status:QuestionnaireSnapshot['status']):QuestionnaireEvaluation=>freeze({draft,snapshot:{questionnaireId:node.questionnaireId,version:node.version,status,answers,validity,computed,sources:copy(node.sources??[])},issues});
  if(issues.length)return snapshot('invalid');
  if(!record(draft)){issues.push(issue('QUESTIONNAIRE_DRAFT','','Expected a scalar draft object.'));draft={};return snapshot('invalid');}
  const ids=new Set(node.fields.map(f=>f.id));
  for(const [name,value]of Object.entries(draft))if(!ids.has(name)||!keyOK(name)||value!==null&&!['number','boolean','string'].includes(typeof value)||typeof value==='string'&&[...value].length>12000){issues.push(issue('QUESTIONNAIRE_DRAFT',ptr('/draft',name),'Draft entries must be bounded scalars for authored fields.'));}
  if(issues.length)return snapshot('invalid');
  const parsed:Record<string,Scalar>={};let incomplete=false,invalid=false;
  for(const field of node.fields){
    let visible=true;
    if(field.visibleWhen!==undefined){
      try{const value=evaluatedScalar(field.visibleWhen,parsed);if(typeof value!=='boolean')throw Error('Visibility must return a boolean.');visible=value;}
      catch(error){visible=false;if(references(field.visibleWhen).some(name=>parsed[name]===null))incomplete=true;else{invalid=true;issues.push(caught(error,ptr('/fields',field.id)+'/visibleWhen'));}}
    }
    if(!visible){validity[field.id]={visible:false,status:'hidden',value:null};parsed[field.id]=null;if(node.hiddenValuePolicy==='clear')delete draft[field.id];continue;}
    const state=parse(field,draft[field.id]);validity[field.id]=state;parsed[field.id]=state.value;
    if(state.status==='invalid')invalid=true;
    if(state.status==='unknown'&&field.required)incomplete=true;
  }
  // Constraints see the same parsed field values, never partially validated rule results.
  for(const field of node.fields){
    const state=validity[field.id];if(!state.visible)continue;
    if(state.status==='valid'&&field.validWhen!==undefined){
      const pending=references(field.validWhen).some(name=>validity[name].visible&&parsed[name]===null);
      if(pending){validity[field.id]={visible:true,status:'pending',value:null,message:'Waiting for the related answers.'};incomplete=true;}
      else try{
        const pass=evaluatedScalar(field.validWhen,parsed);
        if(typeof pass!=='boolean')throw Error('Validation must return a boolean.');
        if(!pass){validity[field.id]={visible:true,status:'invalid',value:null,message:field.validationMessage??'Check this answer against the related answers.'};invalid=true;}
      }catch(error){validity[field.id]={visible:true,status:'invalid',value:null,message:field.validationMessage??'This answer could not be validated.'};invalid=true;issues.push(caught(error,ptr('/fields',field.id)+'/validWhen'));}
    }
    answers[field.id]=validity[field.id].status==='valid'?validity[field.id].value:null;
  }
  if(invalid)return snapshot('invalid');
  if(incomplete)return snapshot('incomplete');
  const expressionState:Record<string,Scalar>={};for(const field of node.fields)expressionState[field.id]=own(answers,field.id)?answers[field.id]:null;
  try{const results:Record<string,Scalar>={};for(const name of Object.keys(node.computed??{}))results[name]=evaluatedScalar(node.computed![name]);Object.assign(computed,results);}
  catch(error){issues.push(caught(error,'/computed'));return snapshot('invalid');}
  return snapshot('ready');
}
