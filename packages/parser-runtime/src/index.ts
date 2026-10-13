import {tokenize} from '../vendor/openui/parser/lexer';
import {parseExpression} from '../vendor/openui/parser/expressions';
import {autoClose, split} from '../vendor/openui/parser/statements';
import {T} from '../vendor/openui/parser/tokens';
import type {ASTNode as Ast} from '../vendor/openui/parser/ast';
import type {ActionHandle, BindingHandle, Budget, ElementNode, Issue, Limits, OperationOptions, Preview, Result, Rule, Runtime, RuntimeOptions, Snapshot} from './types';
export type * from './types';

export const DEFAULT_LIMITS: Readonly<Limits> = Object.freeze({source:200_000,tokens:40_000,statements:1000,astNodes:20_000,depth:64,operations:200_000,array:5000,outputNodes:2000,dataValues:50_000,text:2_000_000,actionSteps:64});
const badKeys = new Set(['__proto__','prototype','constructor']);
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value,key);
const pure = new Set(['Count','First','Last','Sum','Avg','Min','Max','Sort','Filter','Round','Abs','Floor','Ceil','Each']);
const local = new Set(['Action','Set','Reset']);
const host = new Set(['Query','Mutation','Run','OpenUrl','ToAssistant']);
const arity: Record<string, readonly [number,number]> = {Count:[1,1],First:[1,1],Last:[1,1],Sum:[1,1],Avg:[1,1],Min:[1,1],Max:[1,1],Sort:[2,3],Filter:[4,4],Round:[1,2],Abs:[1,1],Floor:[1,1],Ceil:[1,1],Each:[3,3],Action:[1,1],Set:[2,2],Reset:[1,64]};
const pointer = (p:string,k:string|number) => `${p}/${String(k).replace(/~/g,'~0').replace(/\//g,'~1')}`;
class Fault extends Error { constructor(readonly code:string,readonly path:string,message:string){super(message);} }
const fail=(code:string,path:string,message:string):never=>{throw new Fault(code,path,message);};
const issue=(error:unknown):Issue=>error instanceof Fault?{code:error.code,path:error.path,message:error.message}:{code:error instanceof RangeError?'DEPTH_LIMIT':'SYNTAX',path:'',message:error instanceof Error?error.message:'Invalid input'};
const key=(name:string,path:string)=>{if(badKeys.has(name)||badKeys.has(name.replace(/^\$/,'')))fail('UNSAFE_KEY',path,'Unsafe property or identifier');};
const finite=(value:unknown,path:string):number=>{if(typeof value!=='number'||!Number.isFinite(value))fail('NUMBER_TYPE',path,'Expected a finite number');return value as number;};
const bool=(value:unknown,path:string):boolean=>{if(typeof value!=='boolean')fail('BOOLEAN_TYPE',path,'Expected a boolean');return value as boolean;};
const scalar=(x:unknown)=>x===null||['number','string','boolean'].includes(typeof x);
const freeze=<T>(v:T):T=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};

interface Program { entries: Map<string,Ast>; states: Set<string>; source:string; incomplete:boolean }
interface Captured { ast:Ast; scope:ReadonlyMap<string,unknown>; revision:number }
interface BindingCaptured extends Captured { name:string }
class Counter implements Budget {
  private used=0; private values=0; private text=0; nodes=0;
  constructor(readonly limits:Limits,readonly signal?:AbortSignal){}
  consume(n=1){if(this.signal?.aborted)fail('CANCELLED','','Operation cancelled');this.used+=n;if(this.used>this.limits.operations)fail('OPERATION_LIMIT','','Evaluation budget exceeded');}
  get remaining(){return Math.max(0,this.limits.operations-this.used);}
  data(value:unknown,path='',depth=0,seen=new WeakSet<object>()):unknown {
    this.consume(); if(++this.values>this.limits.dataValues)fail('DATA_LIMIT',path,'Data budget exceeded');
    if(depth>this.limits.depth)fail('DEPTH_LIMIT',path,'Data nesting too deep');
    if(value===null||typeof value==='boolean')return value;
    if(typeof value==='number')return finite(value,path);
    if(typeof value==='string'){this.text+=value.length;if(this.text>this.limits.text)fail('TEXT_LIMIT',path,'Text budget exceeded');return value;}
    if(!value||typeof value!=='object')fail('DATA_TYPE',path,'Only JSON data is accepted');
    const obj=value as object; const proto=Object.getPrototypeOf(obj),arr=Array.isArray(obj);
    if((!arr&&proto!==Object.prototype&&proto!==null)||(arr&&proto!==Array.prototype)||Object.getOwnPropertySymbols(obj).length)fail('DATA_TYPE',path,'Expected plain JSON data');
    if(seen.has(obj))fail('DATA_CYCLE',path,'Cyclic data is not accepted'); seen.add(obj);
    const keys=Object.keys(obj); if(keys.length>this.limits.dataValues)fail('DATA_LIMIT',path,'Too many data keys');
    if(arr&&((value as unknown[]).length>this.limits.array||keys.length!==(value as unknown[]).length))fail('ARRAY_LIMIT',path,'Oversized or sparse array');
    const out:Record<string,unknown>|unknown[]=arr?[]:{};
    for(const k of keys){key(k,pointer(path,k));this.text+=k.length;if(this.text>this.limits.text)fail('TEXT_LIMIT',path,'Text budget exceeded');const d=Object.getOwnPropertyDescriptor(obj,k);if(!d||!('value'in d))fail('DATA_TYPE',pointer(path,k),'Accessors are not allowed');if(arr&&!/^(0|[1-9]\d*)$/.test(k))fail('DATA_TYPE',path,'Array properties are not allowed');(out as Record<string,unknown>)[k]=this.data(d!.value,pointer(path,k),depth+1,seen);}
    seen.delete(obj);return out;
  }
  array(value:unknown,path:string):unknown[]{this.consume();if(!Array.isArray(value))fail('ARRAY_TYPE',path,'Expected an array');if((value as unknown[]).length>this.limits.array)fail('ARRAY_LIMIT',path,'Array too large');return value as unknown[];}
}

/** Strip comments without interpreting literals; mismatched delimiters always reject. */
function preprocess(source:string,preview:boolean,limits:Limits):{source:string;incomplete:boolean}{
  if(typeof source!=='string')fail('SOURCE_TYPE','','DSL must be a string');if(source.length>limits.source)fail('SOURCE_LIMIT','','DSL source too large');
  let out='',quote='',escape=false;const stack:string[]=[];
  for(let i=0;i<source.length;i++){const c=source[i]!;if(quote){out+=c;if(escape){escape=false;continue;}if(c==='\\'){escape=true;continue;}if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"){quote=c;out+=c;continue;}
    if(c==='/'&&source[i+1]==='/'){while(i<source.length&&source[i]!=='\n')i++;out+='\n';continue;}
    if('([{'.includes(c)){stack.push(c);if(stack.length>limits.depth)fail('DEPTH_LIMIT','','Source nesting too deep');}
    if(')]}'.includes(c)){const expected=')]}'.indexOf(c),opening='([{'[expected];if(stack.pop()!==opening)fail('SYNTAX','','Mismatched closing delimiter');}
    out+=c;
  }
  const incomplete=!!quote||stack.length>0;
  if(incomplete&&!preview)fail('INCOMPLETE','','Program is incomplete');
  if(preview)out=autoClose(out).text;
  return{source:out,incomplete};
}

export function createRuntime(options:RuntimeOptions):Runtime {
  const limits={...DEFAULT_LIMITS,...options.limits};
  for(const [k,v]of Object.entries(limits))if(!Number.isSafeInteger(v)||v<1)throw new TypeError(`Invalid ${k} budget`);
  const components=new Map(Object.entries(options.componentRules));const dataShapes=new Map(Object.entries(options.dataShapeRules??{}));
  if(!components.has(options.root))throw new TypeError('Root component is not registered');
  const orders=new Map<string,readonly string[]>();
  for(const[name,rule]of[...components,...dataShapes]){
    if(!/^[A-Z][A-Za-z0-9_]*$/.test(name)||pure.has(name)||local.has(name)||host.has(name)||badKeys.has(name)||orders.has(name))throw new TypeError(`Invalid or duplicate component/data name ${name}`);
    if(typeof rule.validateProps!=='function')throw new TypeError(`Strict props validator is required for ${name}`);
    const order=rule.orderedProps??Object.keys(options.schema?.$defs?.[name]?.properties??{});
    if(new Set(order).size!==order.length||order.some(x=>badKeys.has(x)))throw new TypeError(`Invalid ordered props for ${name}`);
    for(const field of [...rule.bindingProps??[],...rule.actionProps??[],...rule.childSlots??[]])if(!order.includes(field))throw new TypeError(`Unknown metadata prop ${name}.${field}`);
    orders.set(name,[...order]);
  }
  let revision=0,serial=0,disposed=false,program:Program|null=null,snapshot:Snapshot|null=null,defaults:Record<string,unknown>={};
  const actions=new WeakMap<object,Captured>(),bindings=new WeakMap<object,BindingCaptured>();
  const listeners=new Set<(s:Snapshot)=>void>();
  const live=()=>{if(disposed)fail('DISPOSED','','Runtime has been disposed');};
  function parse(source:string,preview:boolean,budget:Counter):Program{
    budget.consume();const prepared=preprocess(source,preview,limits),tokens=tokenize(prepared.source);
    if(tokens.length>limits.tokens)fail('TOKEN_LIMIT','','Too many tokens');
    const raws=split(tokens);if(raws.length>limits.statements)fail('STATEMENT_LIMIT','','Too many declarations');
    const entries=new Map<string,Ast>(),states=new Set<string>();let nodes=0;
    for(const raw of raws){key(raw.id,'');if(raw.id==='$value')fail('RESERVED_NAME',raw.id,'$value is reserved for binding input');if(entries.has(raw.id))fail('DUPLICATE_DECLARATION',raw.id,'Duplicate declaration');entries.set(raw.id,parseExpression(raw.tokens));if(raw.idTokenType===T.StateVar)states.add(raw.id);}
    if(!entries.has('root')&&!preview)fail('NO_ROOT','','Declare root');
    function walk(ast:Ast,scope:Set<string>,depth:number,path:string){budget.consume();if(++nodes>limits.astNodes)fail('AST_LIMIT',path,'AST budget exceeded');if(depth>limits.depth)fail('DEPTH_LIMIT',path,'AST nesting too deep');const visit=(n:Ast,p=path,s=scope)=>walk(n,s,depth+1,p);
      switch(ast.k){
        case'Num':finite(ast.v,path);break;
        case'Ref':key(ast.n,path);if(!entries.has(ast.n)&&!scope.has(ast.n)&&!preview)fail('UNKNOWN_REFERENCE',path,`Unknown declaration ${ast.n}`);break;
        case'StateRef':key(ast.n,path);if(ast.n!=='$value'&&!states.has(ast.n)&&!preview)fail('UNKNOWN_STATE',path,`Undeclared state ${ast.n}`);break;
        case'Obj':{const seen=new Set<string>();for(const[k,v]of ast.entries){key(k,path);if(seen.has(k))fail('DUPLICATE_KEY',path,`Duplicate key ${k}`);seen.add(k);visit(v,pointer(path,k));}break;}
        case'Arr':if(ast.els.length>limits.array)fail('ARRAY_LIMIT',path,'Array too large');ast.els.forEach((v,i)=>visit(v,pointer(path,i)));break;
        case'Comp':{
          if(host.has(ast.name))fail('HOST_CAPABILITY',path,`${ast.name} is not available in this local profile`);
          const rule=components.get(ast.name)??dataShapes.get(ast.name);
          if(!rule&&!pure.has(ast.name)&&!local.has(ast.name))fail('UNKNOWN_CALL',path,`Unknown function/component ${ast.name}`);
          if(ast.fn&&rule)fail('UNKNOWN_CALL',path,'Components do not use @');
          const [min,max]=arity[ast.name]??[0,orders.get(ast.name)!.length];if(ast.args.length<min||ast.args.length>max)fail('ARITY',path,`Wrong argument count for ${ast.name}`);
          if(ast.name==='Each'){
            visit(ast.args[0]!,path);const v=ast.args[1]!;const name=v.k==='Str'?v.v:v.k==='Ref'?v.n:null;
            if(!name||!/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(name))fail('EACH_SCOPE',path,'Each variable must be a simple name');key(name!,path);const nested=new Set(scope);nested.add(name!);visit(ast.args[2]!,path,nested);
          }else ast.args.forEach((v,i)=>visit(v,pointer(path,i)));
          break;}
        case'Member':key(ast.field,path);visit(ast.obj);break;
        case'Index':visit(ast.obj);visit(ast.index);break;
        case'BinOp':visit(ast.left);visit(ast.right);break;
        case'UnaryOp':visit(ast.operand);break;
        case'Ternary':visit(ast.cond);visit(ast.then);visit(ast.else);break;
        case'Assign':if(!states.has(ast.target))fail('UNKNOWN_STATE',path,'Assignment target is not declared');visit(ast.value);break;
        case'RuntimeRef':fail('HOST_CAPABILITY',path,'Runtime tool references are unavailable');
        case'Ph':if(!preview)fail('UNKNOWN_REFERENCE',path,'Unresolved placeholder');break;
      }
    }
    for(const[name,ast]of entries)walk(ast,new Set(),0,name);
    // Cycles are rejected even when a declaration is not currently visible.
    const graph=new Map<string,Set<string>>();
    for(const[name,ast]of entries){const dependencies=new Set<string>();const visit=(node:Ast,scope:Set<string>)=>{budget.consume();if(node.k==='Ref'){if(!scope.has(node.n)&&entries.has(node.n))dependencies.add(node.n);return;}if(node.k==='StateRef'){if(entries.has(node.n))dependencies.add(node.n);return;}if(node.k==='Comp'&&node.name==='Each'){visit(node.args[0]!,scope);const v=node.args[1]!,nested=new Set(scope);nested.add(v.k==='Str'?v.v:(v as Extract<Ast,{k:'Ref'}>).n);visit(node.args[2]!,nested);return;}switch(node.k){case'Comp':node.args.forEach(n=>visit(n,scope));break;case'Arr':node.els.forEach(n=>visit(n,scope));break;case'Obj':node.entries.forEach(([,n])=>visit(n,scope));break;case'Member':visit(node.obj,scope);break;case'Index':visit(node.obj,scope);visit(node.index,scope);break;case'BinOp':visit(node.left,scope);visit(node.right,scope);break;case'UnaryOp':visit(node.operand,scope);break;case'Ternary':visit(node.cond,scope);visit(node.then,scope);visit(node.else,scope);break;case'Assign':visit(node.value,scope);break;}};visit(ast,new Set());graph.set(name,dependencies);}
    const seen=new Set<string>(),active=new Set<string>();const check=(name:string,depth:number)=>{budget.consume();if(depth>limits.depth)fail('DEPTH_LIMIT',name,'Declaration dependency depth too large');if(active.has(name))fail('REFERENCE_CYCLE',name,'Declaration dependency cycle');if(seen.has(name))return;active.add(name);for(const dep of graph.get(name)??[])check(dep,depth+1);active.delete(name);seen.add(name);};for(const name of entries.keys())check(name,0);
    return {entries,states,source,incomplete:prepared.incomplete};
  }

  function evaluate(p:Program,state:Record<string,unknown>,initial:Record<string,unknown>,budget:Counter,preview:boolean,targetRevision:number){
    const active=new Set<string>(),cache=new Map<string,unknown>(),elementObjects=new WeakSet<object>();
    const emptyScope:ReadonlyMap<string,unknown>=new Map();
    const readState=(name:string,path:string):unknown=>{
      if(own(state,name))return state[name];
      if(!p.states.has(name)){if(preview)return null;return fail('UNKNOWN_STATE',path,`Undeclared state ${name}`);}
      if(active.has(name))return fail('REFERENCE_CYCLE',path,'State initializer cycle');active.add(name);
      try {const value=run(p.entries.get(name)!,emptyScope,0,path);const cloned=budget.data(value,path);state[name]=cloned;initial[name]=cloned;return cloned;}finally{active.delete(name);}
    };
    const reference=(name:string,scope:ReadonlyMap<string,unknown>,depth:number,path:string):unknown=>{
      if(scope.has(name))return scope.get(name);
      if(p.states.has(name))return readState(name,path);
      if(cache.has(name))return cache.get(name);
      const ast=p.entries.get(name);if(!ast){if(preview)return null;return fail('UNKNOWN_REFERENCE',path,`Unknown declaration ${name}`);}
      if(active.has(name))return fail('REFERENCE_CYCLE',path,`Cycle at ${name}`);active.add(name);
      try{const value=run(ast,emptyScope,depth+1,name);cache.set(name,value);return value;}finally{active.delete(name);}
    };
    const resolveAst=(ast:Ast,scope:ReadonlyMap<string,unknown>,path:string,seen=new Set<string>()):Ast=>{
      if(ast.k!=='Ref'||scope.has(ast.n))return ast;
      if(seen.has(ast.n))return fail('REFERENCE_CYCLE',path,'Action/binding reference cycle');seen.add(ast.n);
      const target=p.entries.get(ast.n);if(!target) return fail('UNKNOWN_REFERENCE',path,`Unknown declaration ${ast.n}`);return resolveAst(target,scope,path,seen);
    };
    const makeAction=(ast:Ast,scope:ReadonlyMap<string,unknown>,path:string):ActionHandle=>{
      const actual=resolveAst(ast,scope,path);let count=0;
      function check(a:Ast){budget.consume();if(++count>limits.actionSteps)fail('ACTION_LIMIT',path,'Too many action steps');const v=resolveAst(a,scope,path);
        if(v.k!=='Comp'||!local.has(v.name))fail('ACTION_TYPE',path,'Expected a local Action, @Set or @Reset');
        const call=v as Extract<Ast,{k:'Comp'}>;
        if(call.name==='Action'){const arg=call.args[0]!;if(arg.k!=='Arr')fail('ACTION_TYPE',path,'Action requires a literal step array');(arg as Extract<Ast,{k:'Arr'}>).els.forEach(check);}
        else if(call.name==='Set'){const target=call.args[0]!;if(target.k!=='StateRef'||!p.states.has(target.n))fail('ACTION_TARGET',path,'Set requires declared $state');}
        else for(const target of call.args)if(target.k!=='StateRef'||!p.states.has(target.n))fail('ACTION_TARGET',path,'Reset requires declared $state');
      }check(actual);
      const handle=Object.freeze({kind:'inform-action' as const,id:`a${++serial}`});if(!preview)actions.set(handle,{ast:actual,scope:new Map(scope),revision:targetRevision});return handle;
    };
    function access(value:unknown,field:string,path:string):unknown {budget.consume();key(field,path);if(value==null)return null;if(Array.isArray(value)){if(field==='length')return value.length;if(/^(0|[1-9]\d*)$/.test(field))return own(value,field)?value[Number(field)]:null;return value.map((v,i)=>access(v,field,pointer(path,i)));}if(typeof value!=='object')return null;return own(value,field)?(value as Record<string,unknown>)[field]:null;}
    function field(value:unknown,pathValue:unknown,path:string){if(typeof pathValue!=='string')fail('FIELD_TYPE',path,'Field must be a string');if(!pathValue)return value;const parts=(pathValue as string).split('.');if(parts.length>limits.depth)fail('DEPTH_LIMIT',path,'Field path too long');let out=value;for(const part of parts)out=access(out,part,path);return out;}
    function builtin(name:string,args:unknown[],path:string):unknown {
      budget.consume();const arr=(i=0)=>budget.array(args[i],path);
      if(name==='Count')return arr().length;if(name==='First')return arr()[0]??null;if(name==='Last')return arr().at(-1)??null;
      if(['Sum','Avg','Min','Max'].includes(name)){const a=arr();let result=0;for(let i=0;i<a.length;i++){budget.consume();const n=finite(a[i],path);if(name==='Sum'||name==='Avg')result=finite(result+n,path);else result=i===0?n:name==='Min'?Math.min(result,n):Math.max(result,n);}return name==='Avg'&&a.length?result/a.length:result;}
      if(['Abs','Floor','Ceil','Round'].includes(name)){const n=finite(args[0],path);if(name==='Abs')return Math.abs(n);if(name==='Floor')return Math.floor(n);if(name==='Ceil')return Math.ceil(n);const decimals=args[1]===undefined?0:finite(args[1],path);if(!Number.isInteger(decimals)||Math.abs(decimals)>12)fail('ROUND_RANGE',path,'Round decimals must be an integer from -12 to 12');const factor=10**decimals;return finite(Math.round(n*factor)/factor,path);}
      if(name==='Filter'){const a=arr(),operator=args[2],expected=args[3];if(typeof args[1]!=='string')fail('FIELD_TYPE',path,'Field must be a string');for(const part of (args[1] as string).split('.'))key(part,path);if(operator==='contains'&&typeof expected!=='string')fail('STRING_TYPE',path,'contains requires strings');if(['>','<','>=','<='].includes(operator as string))finite(expected,path);if(['==','!='].includes(operator as string)&&!scalar(expected))fail('SCALAR_TYPE',path,'Equality requires scalar values');if(!['==','!=','>','<','>=','<=','contains'].includes(operator as string))fail('FILTER_OPERATOR',path,'Unsupported filter operator');budget.consume(a.length);return a.filter(item=>{budget.consume();const v=field(item,args[1],path);if(operator==='contains'){if(typeof v!=='string'||typeof expected!=='string')fail('STRING_TYPE',path,'contains requires strings');return(v as string).includes(expected as string);}if(operator==='=='||operator==='!='){if(!scalar(v)||!scalar(expected))fail('SCALAR_TYPE',path,'Equality requires scalar values');return operator==='=='?Object.is(v,expected):!Object.is(v,expected);}const x=finite(v,path),y=finite(expected,path);return operator==='>'?x>y:operator==='<'?x<y:operator==='>='?x>=y:x<=y;});}
      if(name==='Sort'){const a=arr(),direction=args[2]??'asc';if(direction!=='asc'&&direction!=='desc')fail('SORT_DIRECTION',path,'Sort direction must be asc or desc');if(typeof args[1]!=='string')fail('FIELD_TYPE',path,'Field must be a string');for(const part of (args[1] as string).split('.'))key(part,path);budget.consume(a.length);let keyType:string|undefined;const entries=a.map((value,index)=>{const sortKey=field(value,args[1],path),type=typeof sortKey;if(type!=='number'&&type!=='string'||keyType&&type!==keyType)fail('SORT_TYPE',path,'Sort keys must be consistently numbers or strings');if(type==='number')finite(sortKey,path);keyType=type;return{value,key:sortKey as number|string,index};});entries.sort((a,b)=>{budget.consume();const cmp=a.key<b.key?-1:a.key>b.key?1:0;return (direction==='desc'?-cmp:cmp)||a.index-b.index;});return entries.map(entry=>entry.value);}
      return fail('UNKNOWN_CALL',path,`Unsupported builtin ${name}`);
    }
    function component(ast:Extract<Ast,{k:'Comp'}>,scope:ReadonlyMap<string,unknown>,depth:number,path:string):unknown {
      const rule=components.get(ast.name)??dataShapes.get(ast.name)!;const isData=dataShapes.has(ast.name);const names=orders.get(ast.name)!;
      const props:Record<string,unknown>={},nodeBindings:Record<string,BindingHandle>={};
      for(let i=0;i<ast.args.length;i++){const name=names[i]!;const arg=ast.args[i]!;const at=pointer(path,name);
        const definition=options.schema?.$defs?.[ast.name],property=definition?.properties?.[name];
        const nullable=(s:unknown):boolean=>{if(!s||typeof s!=='object')return false;const o=s as Record<string,unknown>;return o.type==='null'||Array.isArray(o.type)&&o.type.includes('null')||o.const===null||Array.isArray(o.enum)&&o.enum.includes(null)||(['anyOf','oneOf'] as const).some(k=>Array.isArray(o[k])&&(o[k] as unknown[]).some(nullable));};
        // Positional null skips an optional non-nullable field, matching prompt syntax.
        if(arg.k==='Null'&&property&&!definition?.required?.includes(name)&&!nullable(property))continue;
        if(rule.actionProps?.includes(name)){if(arg.k==='Null')props[name]=null;else props[name]=makeAction(arg,scope,at);continue;}
        const actual=resolveAst(arg,scope,at);
        if(rule.bindingProps?.includes(name)&&(actual.k==='StateRef'||actual.k==='Assign')){
          const target=actual.k==='StateRef'?actual.n:actual.target;props[name]=readState(target,at);
          const h=Object.freeze({kind:'inform-binding' as const,id:`b${++serial}`,name:target});nodeBindings[name]=h;
          if(!preview)bindings.set(h,{name:target,ast:actual,scope:new Map(scope),revision:targetRevision});
        }else props[name]=run(arg,scope,depth+1,at);
      }
      for(const slot of rule.childSlots??[])if(own(props,slot)){
        const flat:ElementNode[]=[];
        const append=(value:unknown,level:number)=>{budget.consume();if(level>limits.depth)fail('DEPTH_LIMIT',path,'Child slots too deeply nested');if(value===null)return;if(Array.isArray(value)){budget.array(value,path);for(const child of value)append(child,level+1);return;}if(!value||typeof value!=='object'||!elementObjects.has(value as object))fail('CHILD_TYPE',pointer(path,slot),'Child must be a component expression, not a data object');flat.push(value as ElementNode);if(flat.length>limits.array)fail('ARRAY_LIMIT',path,'Too many children');};
        if(!Array.isArray(props[slot]))fail('CHILD_TYPE',pointer(path,slot),'Child slot must be an array');append(props[slot],0);props[slot]=flat;
      }
      let normalized=props;
      if(!preview){const checked=rule.validateProps(props,{phase:'evaluated',budget,isActionHandle:(x:unknown)=>!!x&&typeof x==='object'&&actions.get(x as object)?.revision===targetRevision});if(!checked.ok){const e=checked.issues[0]??{code:'PROPS',path:'',message:'Invalid component props'};fail(e.code,path+e.path,e.message);}normalized=(checked as {ok:true;value:Record<string,unknown>}).value;}
      if(isData)return budget.data(normalized,path);
      if(++budget.nodes>limits.outputNodes)fail('OUTPUT_LIMIT',path,'Too many rendered components');
      const out:ElementNode={type:'element',typeName:ast.name,props:normalized,partial:preview,...(Object.keys(nodeBindings).length?{bindings:nodeBindings}:{})};elementObjects.add(out);return out;
    }
    function run(ast:Ast,scope:ReadonlyMap<string,unknown>,depth:number,path:string):unknown {
      budget.consume();if(depth>limits.depth)fail('DEPTH_LIMIT',path,'Evaluation nesting too deep');
      const ev=(a:Ast)=>run(a,scope,depth+1,path);
      switch(ast.k){
        case'Str':return ast.v;case'Num':return finite(ast.v,path);case'Bool':return ast.v;case'Null':return null;case'Ph':return preview?null:fail('UNKNOWN_REFERENCE',path,'Unresolved placeholder');
        case'Ref':return reference(ast.n,scope,depth,path);case'StateRef':return ast.n==='$value'&&scope.has('$value')?scope.get('$value'):readState(ast.n,path);
        case'Arr':budget.array(ast.els,path);return ast.els.map((a,i)=>run(a,scope,depth+1,pointer(path,i)));
        case'Obj':{const out:Record<string,unknown>={};for(const[k,v]of ast.entries){key(k,path);out[k]=run(v,scope,depth+1,pointer(path,k));}return out;}
        case'Comp':{
          if(local.has(ast.name))return makeAction(ast,scope,path);
          if(ast.name==='Each'){const array=budget.array(ev(ast.args[0]!),path);const v=ast.args[1]!;const name=v.k==='Str'?v.v:(v as Extract<Ast,{k:'Ref'}>).n;budget.consume(array.length);return array.map((item,i)=>{const nested=new Map(scope);nested.set(name,item);return run(ast.args[2]!,nested,depth+1,pointer(path,i));});}
          if(pure.has(ast.name))return builtin(ast.name,ast.args.map(ev),path);
          return component(ast,scope,depth,path);
        }
        case'Member':return access(ev(ast.obj),ast.field,path);
        case'Index':{const object=ev(ast.obj),index=ev(ast.index);if(Array.isArray(object)){if(typeof index!=='number'||!Number.isSafeInteger(index)||index<0)fail('INDEX_TYPE',path,'Array index must be a nonnegative integer');return access(object,String(index),path);}if(typeof index!=='string')fail('INDEX_TYPE',path,'Object index must be a string');return access(object,index as string,path);}
        case'UnaryOp':return ast.op==='!'?!bool(ev(ast.operand),path):-finite(ev(ast.operand),path);
        case'Ternary':return bool(ev(ast.cond),path)?ev(ast.then):ev(ast.else);
        case'BinOp':{const a=ev(ast.left);if(ast.op==='&&')return bool(a,path)?bool(ev(ast.right),path):false;if(ast.op==='||')return bool(a,path)?true:bool(ev(ast.right),path);const b=ev(ast.right);
          if(ast.op==='=='||ast.op==='!='){if(!scalar(a)||!scalar(b))fail('SCALAR_TYPE',path,'Equality requires scalar values');return ast.op==='=='?Object.is(a,b):!Object.is(a,b);}
          if(ast.op==='+'&&(typeof a==='string'||typeof b==='string')){if(!scalar(a)||!scalar(b))fail('SCALAR_TYPE',path,'Text concatenation requires scalar values');const left=String(a??''),right=String(b??'');if(left.length+right.length>limits.text)fail('TEXT_LIMIT',path,'Concatenated text is too large');return left+right;}
          const x=finite(a,path),y=finite(b,path);if(['/', '%'].includes(ast.op)&&y===0)fail('DIVIDE_BY_ZERO',path,'Division by zero');
          switch(ast.op){case'+':return finite(x+y,path);case'-':return finite(x-y,path);case'*':return finite(x*y,path);case'/':return finite(x/y,path);case'%':return finite(x%y,path);case'>':return x>y;case'<':return x<y;case'>=':return x>=y;case'<=':return x<=y;default:return fail('OPERATOR',path,'Unknown operator');}}
        case'Assign':return fail('ASSIGNMENT_CONTEXT',path,'Assignments are only allowed in declared binding props');
        case'RuntimeRef':return fail('HOST_CAPABILITY',path,'Host runtime reference is disabled');
      }
    }
    for(const name of p.states)readState(name,name);
    return {run,reference,scope:emptyScope,makeAction,elementObjects,root:()=>reference('root',emptyScope,0,'root')};
  }

  function build(p:Program,state:Record<string,unknown>,initial:Record<string,unknown>,budget:Counter,preview:boolean,nextRevision:number){
    const evaluator=evaluate(p,state,initial,budget,preview,nextRevision),root=evaluator.root();
    if(!root||typeof root!=='object'||!evaluator.elementObjects.has(root as object))fail('ROOT_TYPE','root','Root must resolve to a registered component');
    if((root as ElementNode).typeName!==options.root)fail('ROOT_TYPE','root',`Root must be ${options.root}`);
    // Count every rendered occurrence, including repeated references, not only constructors.
    let occurrenceCount=0;const count=(node:ElementNode,depth:number)=>{budget.consume();if(depth>limits.depth)fail('DEPTH_LIMIT','root','Rendered tree nesting too deep');if(++occurrenceCount>limits.outputNodes)fail('OUTPUT_LIMIT','root','Too many rendered component occurrences');for(const field of components.get(node.typeName)?.childSlots??[])for(const child of (node.props[field] as ElementNode[]??[]))count(child,depth+1);};count(root as ElementNode,0);
    budget.data(root,'root');return root as ElementNode;
  }
  function finish(p:Program,state:Record<string,unknown>,initial:Record<string,unknown>,tree:ElementNode,ticket:number):Result{
    live();if(ticket!==revision)fail('SUPERSEDED','','A newer transaction replaced this one');
    revision++;program=p;defaults=freeze(initial);snapshot=freeze({revision,tree,state,phase:'ready' as const});
    // Observer failures must not convert a committed update into a false rollback.
    const committed=snapshot;for(const fn of [...listeners]){if(revision!==committed.revision)break;try{fn(committed);}catch{}}
    return {ok:true,snapshot:committed};
  }
  const failure=(e:unknown):Result=>({ok:false,issues:freeze([issue(e)])});
  function transaction(mutator:(p:Program,state:Record<string,unknown>,budget:Counter)=>void,op:OperationOptions={}):Result{
    try{live();if(!program||!snapshot)fail('NO_PROGRAM','','Commit a valid program first');const p=program!,ticket=revision,budget=new Counter(limits,op.signal),state=budget.data(snapshot!.state) as Record<string,unknown>;mutator(p,state,budget);const tree=build(p,state,{...defaults},budget,false,ticket+1);return finish(p,state,{...defaults},tree,ticket);}catch(e){return failure(e);}
  }
  function put(p:Program,state:Record<string,unknown>,name:string,value:unknown,budget:Counter){key(name,name);if(!p.states.has(name))fail('UNKNOWN_STATE',name,'State must be declared');const cloned=budget.data(value,name),initial=defaults[name];if(initial!==null&&((Array.isArray(initial)?'array':typeof initial)!==(cloned===null?'null':Array.isArray(cloned)?'array':typeof cloned)))fail('STATE_TYPE',name,'State type must match its default');state[name]=cloned;}
  function validAction(x:unknown):x is ActionHandle {return !disposed&&!!x&&typeof x==='object'&&actions.get(x as object)?.revision===revision;}
  function validBinding(x:unknown):x is BindingHandle{return !disposed&&!!x&&typeof x==='object'&&bindings.get(x as object)?.revision===revision;}
  return {
    preview(source,op={}){try{live();const budget=new Counter(limits,op.signal),p=parse(source,true,budget),state:Record<string,unknown>={},initial:Record<string,unknown>={};const tree=build(p,state,initial,budget,true,revision);return freeze({phase:'preview' as const,tree,issues:[],interactive:false as const,incomplete:p.incomplete});}catch(e){return freeze({phase:'preview' as const,tree:null,issues:[issue(e)],interactive:false as const,incomplete:true});}},
    commit(source,op={}){try{live();const ticket=revision,budget=new Counter(limits,op.signal),p=parse(source,false,budget),state:Record<string,unknown>={},initial:Record<string,unknown>={};const tree=build(p,state,initial,budget,false,ticket+1);return finish(p,state,initial,tree,ticket);}catch(e){return failure(e);}},
    setState(patch,op={}){return transaction((p,state,budget)=>{const data=budget.data(patch);if(!data||typeof data!=='object'||Array.isArray(data))fail('STATE_TYPE','','State patch must be a plain object');for(const[name,value]of Object.entries(data as Record<string,unknown>))put(p,state,name,value,budget);},op);},
    setBinding(handle,value,op={}){if(!validBinding(handle))return failure(new Fault('STALE_BINDING','','Binding is forged, stale, or disposed'));const capture=bindings.get(handle)!;return transaction((p,state,budget)=>{let next=value;if(capture.ast.k==='Assign'){const env=new Map(capture.scope);env.set('$value',budget.data(value));const ev=evaluate(p,state,{...defaults},budget,false,revision+1);next=ev.run(capture.ast.value,env,0,capture.name);}put(p,state,capture.name,next,budget);},op);},
    dispatchLocal(handle,op={}){if(!validAction(handle))return failure(new Fault('STALE_ACTION','','Action is forged, stale, or disposed'));const captured=actions.get(handle)!;return transaction((p,state,budget)=>{let steps=0;
      const execute=(ast:Ast,scope:ReadonlyMap<string,unknown>,seen=new Set<string>())=>{budget.consume();if(++steps>limits.actionSteps)fail('ACTION_LIMIT','','Too many action steps');if(ast.k==='Ref'){if(seen.has(ast.n))fail('REFERENCE_CYCLE','','Action cycle');seen.add(ast.n);const next=p.entries.get(ast.n);if(!next)fail('UNKNOWN_REFERENCE','','Unknown action');execute(next!,scope,seen);return;}if(ast.k!=='Comp'||!local.has(ast.name))fail('ACTION_TYPE','','Expected local action');const call=ast as Extract<Ast,{k:'Comp'}>;
        if(call.name==='Action'){for(const item of (call.args[0] as Extract<Ast,{k:'Arr'}>).els)execute(item,scope,new Set(seen));}
        else if(call.name==='Reset'){for(const item of call.args){const name=(item as Extract<Ast,{k:'StateRef'}>).n;put(p,state,name,defaults[name],budget);}}
        else {const name=(call.args[0] as Extract<Ast,{k:'StateRef'}>).n;const ev=evaluate(p,state,{...defaults},budget,false,revision+1);put(p,state,name,ev.run(call.args[1]!,scope,0,name),budget);}
      };execute(captured.ast,captured.scope);},op);},
    isActionHandle:validAction,isBindingHandle:validBinding,
    getSnapshot(){return snapshot;},
    subscribe(listener){live();listeners.add(listener);return()=>listeners.delete(listener);},
    dispose(){if(disposed)return;disposed=true;revision++;program=null;listeners.clear();}
  };
}
