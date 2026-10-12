import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateQuestionnaire as run,createQuestionnaireDraft as makeDraft,validateDocument} from '../dist/index.js';
const ref=$=>({$}),op=(op,...args)=>({op,args});
const number=(id,extra={})=>({id,type:'number',label:id,required:true,...extra});
const fixture=(extra={})=>({type:'questionnaire',questionnaireId:'packing',version:'v1',title:'Packing plan',hiddenValuePolicy:'retain',fields:[number('participants',{min:1,max:20,step:1}),number('packsEach',{min:0,step:1}),{id:'mode',type:'choice',label:'Mode',required:true,options:[{value:'onsite',label:'On site'},{value:'travel',label:'Travel'}]},number('seats',{min:0,step:1,visibleWhen:op('eq',ref('mode'),'travel'),validWhen:op('if',op('lt',ref('seats'),ref('participants')),false,true),validationMessage:'Need one seat for each participant.'})],initialAnswers:{participants:null,packsEach:3,mode:'onsite',seats:8},computed:{totalPackets:op('mul',ref('participants'),ref('packsEach')),spareSeats:op('if',op('eq',ref('mode'),'travel'),op('sub',ref('seats'),ref('participants')),null)},sources:[{title:'Original supplied plan',version:'1',url:'https://example.org/plan'}],...extra});
const issues=node=>{const r=validateDocument({version:'iui/1',body:[node]});return r.ok?[]:r.issues;};
const ready={participants:4,packsEach:3,mode:'onsite',seats:8};
function frozen(value){if(value&&typeof value==='object'){assert.ok(Object.isFrozen(value));for(const item of Object.values(value))frozen(item);}}

test('required unknown is explicit null and never exposes stale computation',()=>{
  const first=run(fixture());assert.equal(first.snapshot.status,'incomplete');assert.equal(first.snapshot.answers.participants,null);assert.deepEqual(first.snapshot.computed,{});assert.equal(first.snapshot.validity.participants.status,'unknown');
  const next=run(fixture(),ready);assert.equal(next.snapshot.status,'ready');assert.equal(next.snapshot.computed.totalPackets,12);assert.equal(next.snapshot.computed.spareSeats,null);
  for(const participants of [null,'','-','bad','1e','1e999','1e-999',' 4','4\n',true,2.1]){const result=run(fixture(),{...ready,participants});assert.notEqual(result.snapshot.status,'ready');assert.deepEqual(result.snapshot.computed,{});assert.equal(result.snapshot.answers.participants,null);}
});
test('retain excludes hidden draft from answers, validation and expression inputs',()=>{
  const node=fixture({computed:{seesHidden:op('eq',ref('seats'),null)}}),raw={...ready,seats:'bad'};
  const result=run(node,raw);assert.equal(result.snapshot.status,'ready');assert.equal(result.draft.seats,'bad');assert.equal(result.snapshot.validity.seats.status,'hidden');assert.ok(!Object.hasOwn(result.snapshot.answers,'seats'));assert.equal(result.snapshot.computed.seesHidden,true);assert.deepEqual(raw,{...ready,seats:'bad'});
  const shown=run(node,{...result.draft,mode:'travel'});assert.equal(shown.snapshot.status,'invalid');assert.equal(shown.snapshot.answers.seats,null);
});
test('clear permanently drops hidden raw value without merging initial state again',()=>{
  const node=fixture({hiddenValuePolicy:'clear'}),hidden=run(node,ready);assert.ok(!Object.hasOwn(hidden.draft,'seats'));const shown=run(node,{...hidden.draft,mode:'travel'});assert.equal(shown.snapshot.status,'incomplete');assert.equal(shown.snapshot.answers.seats,null);
});
test('cross-field rules fail, defer and recover without order dependence',()=>{
  const node=fixture();let result=run(node,{...ready,mode:'travel',seats:3});assert.equal(result.snapshot.status,'invalid');assert.equal(result.snapshot.validity.seats.message,'Need one seat for each participant.');
  result=run(node,{...ready,mode:'travel',participants:null});assert.equal(result.snapshot.status,'incomplete');assert.equal(result.snapshot.validity.seats.status,'pending');assert.equal(result.snapshot.answers.seats,null);
  result=run(node,{...ready,mode:'travel'});assert.equal(result.snapshot.status,'ready');assert.equal(result.snapshot.computed.spareSeats,4);
  const fields=[number('a',{validWhen:op('gt',ref('b'),0)}),number('b',{validWhen:op('gt',ref('a'),0)})];
  for(const order of [fields,[...fields].reverse()]){const res=run(fixture({fields:order,computed:{},initialAnswers:{}}),{a:-1,b:1});assert.equal(res.snapshot.status,'invalid');assert.equal(res.snapshot.validity.a.status,'valid');assert.equal(res.snapshot.validity.b.status,'invalid');}
});
test('false, zero, decimal steps and Unicode text remain real values',()=>{
  const node=fixture({fields:[number('quantity',{min:0,step:0.1}),{id:'approved',type:'boolean',label:'Approved',required:true},{id:'name',type:'text',label:'Name',required:true,minLength:2,maxLength:2}],initialAnswers:{},computed:{}});
  const result=run(node,{quantity:'0.3',approved:false,name:'😀a'});assert.equal(result.snapshot.status,'ready');assert.deepEqual(result.snapshot.answers,{quantity:0.3,approved:false,name:'😀a'});
  assert.equal(run(node,{quantity:0,approved:false,name:'😀a'}).snapshot.status,'ready');
  assert.equal(run(node,{quantity:'0.31',approved:false,name:'😀a'}).snapshot.status,'invalid');
  assert.equal(run(node,{quantity:0,approved:'false',name:'😀a'}).snapshot.status,'invalid');
  assert.equal(run(node,{quantity:0,approved:false,name:' '}).snapshot.status,'incomplete');
});
test('scientific notation permits finite values but rejects nonzero underflow',()=>{
  const node=fixture({fields:[number('value')],initialAnswers:{},computed:{copy:ref('value')}});
  for(const[value,expected]of [['1e3',1000],['-1.2e-2',-0.012],['0e-999',0],['0.',0]])assert.equal(run(node,{value}).snapshot.computed.copy,expected);
  for(const value of ['1e-999','-1e-999','1e999','0x20','Infinity','NaN','1\n',' 1','1 '])assert.equal(run(node,{value}).snapshot.status,'invalid');
});
test('huge quotients cannot loosen numeric step matching',()=>{
  const node=fixture({fields:[number('value',{step:1})],initialAnswers:{},computed:{}});
  assert.equal(run(node,{value:1_000_000_000_000.25}).snapshot.status,'invalid');assert.equal(run(node,{value:1_000_000_000_000}).snapshot.status,'ready');
});
test('results are detached and deeply frozen including sources and validity',()=>{
  const node=fixture(),raw={...ready},result=run(node,raw);frozen(result);node.sources[0].title='Changed';raw.participants=8;assert.equal(result.snapshot.sources[0].title,'Original supplied plan');assert.equal(result.snapshot.answers.participants,4);assert.throws(()=>{result.snapshot.answers.participants=99;},TypeError);
});
test('reset defaults are independent of initial answers and raw edits',()=>{
  const node=fixture({defaults:{participants:2,packsEach:1,mode:'travel',seats:2}});assert.equal(makeDraft(node).participants,null);assert.equal(makeDraft(node,true).participants,2);frozen(makeDraft(node,true));assert.equal(run(node,makeDraft(node,true)).snapshot.computed.totalPackets,2);
});
test('unknown, forward visibility and cyclic computed references fail closed',()=>{
  for(const node of [fixture({fields:[number('value',{visibleWhen:op('gt',ref('later'),0)}),number('later')],initialAnswers:{},computed:{}}),fixture({computed:{oops:ref('missing')}}),fixture({computed:{a:ref('b'),b:ref('a')}}),fixture({computed:{participants:1}})]){assert.ok(issues(node).length);assert.equal(run(node,{}).snapshot.status,'invalid');}
});
test('visibility with numeric unknown waits without coercing null to zero',()=>{
  const node=fixture({fields:[number('earlier',{required:false}),number('later',{visibleWhen:op('gt',ref('earlier'),0)})],initialAnswers:{},computed:{}});const result=run(node,{});assert.equal(result.snapshot.status,'incomplete');assert.equal(result.snapshot.validity.later.status,'hidden');
});
test('hidden refs remain null and unguarded arithmetic fails',()=>{
  const node=fixture({computed:{bad:op('add',ref('seats'),1)}});const result=run(node,ready);assert.equal(result.snapshot.status,'invalid');assert.deepEqual(result.snapshot.computed,{});assert.ok(result.issues.some(e=>e.code==='OPERATOR_TYPE'));
});
test('division by zero and computed error discard every computed result',()=>{
  const node=fixture({computed:{safe:123,bad:op('div',ref('participants'),ref('packsEach'))}});const result=run(node,{...ready,packsEach:0});assert.equal(result.snapshot.status,'invalid');assert.deepEqual(result.snapshot.computed,{});assert.ok(result.issues.some(e=>e.code==='DIVISION_BY_ZERO'));
});
test('computed lazy if is safe while type errors in authored branches are rejected',()=>{
  const node=fixture({computed:{guarded:op('if',false,op('div',ref('participants'),0),5)}});assert.equal(run(node,ready).snapshot.computed.guarded,5);
  const bad=fixture({computed:{bad:op('if',false,op('add',true,1),5)}});assert.ok(issues(bad).some(e=>e.code==='OPERATOR_TYPE'));
});
test('reserved keys, unexpected properties, hostile input and unsafe sources fail closed',()=>{
  for(const node of [fixture({hiddenValuePolicy:undefined}),fixture({computed:{'bad\n':1}}),fixture({extra:'no'}),fixture({fields:[number('constructor')],initialAnswers:{},computed:{}}),fixture({sources:[{title:'Unsafe',url:'javascript:alert(1)'}]})])assert.equal(run(node,{}).snapshot.status,'invalid');
  const getter=fixture();let invoked=false;Object.defineProperty(getter,'title',{enumerable:true,get(){invoked=true;return'Bad';}});assert.equal(run(getter,{}).snapshot.status,'invalid');assert.equal(invoked,false);
  const cyclic=fixture();cyclic.self=cyclic;assert.equal(run(cyclic,{}).snapshot.status,'invalid');
  assert.equal(run(fixture(),JSON.parse('{"__proto__":1}')).snapshot.status,'invalid');
});
test('bounds, field count, duplicate options and known draft names are semantic',()=>{
  const nodes=[fixture({fields:[number('value',{min:4,max:2})],initialAnswers:{},computed:{}}),fixture({fields:[number('value',{step:0})],initialAnswers:{},computed:{}}),fixture({fields:Array.from({length:41},(_,i)=>number('f'+i)),initialAnswers:{},computed:{}}),fixture({defaults:{missing:1}}),fixture({fields:[{id:'choice',type:'choice',label:'Choice',options:[{value:'a',label:'A'},{value:'a',label:'Again'}]}],initialAnswers:{},computed:{}})];
  for(const node of nodes){assert.ok(issues(node).length);assert.equal(run(node,{}).snapshot.status,'invalid');}
});
