import test from 'node:test';
import assert from 'node:assert/strict';
import {z} from 'zod/v4';
import {createRuntime} from '../dist/index.js';
const mk=(orderedProps,schema,extra={})=>({orderedProps,...extra,validateProps(v,{isActionHandle}={}){if(extra.actionProps)for(const key of extra.actionProps)if(!isActionHandle?.(v[key]))return{ok:false,issues:[{code:'ACTION',path:`/${key}`,message:'Not issued'}]};const r=schema.safeParse(v);return r.success?{ok:true,value:r.data}:{ok:false,issues:r.error.issues.map(e=>({code:'SCHEMA',path:'/'+e.path.join('/'),message:e.message}))};}});
const rules={
 Stack:mk(['children'],z.strictObject({children:z.array(z.unknown()).max(200)}),{childSlots:['children']}),
 Text:mk(['content'],z.strictObject({content:z.string().max(1000)})),
 Metric:mk(['value'],z.strictObject({value:z.number().finite()})),
 Input:mk(['label','value'],z.strictObject({label:z.string(),value:z.string().max(100)}),{bindingProps:['value']}),
 Checkbox:mk(['label','checked'],z.strictObject({label:z.string(),checked:z.boolean()}),{bindingProps:['checked']}),
 Slider:mk(['value'],z.strictObject({value:z.number().min(0).max(10)}),{bindingProps:['value']}),
 Button:mk(['label','onPress'],z.strictObject({label:z.string(),onPress:z.unknown()}),{actionProps:['onPress']}),
 Data:mk(['value'],z.strictObject({value:z.unknown()})),
 Chart:mk(['series'],z.strictObject({series:z.array(z.strictObject({name:z.string(),values:z.array(z.number())}))})),
};
const dataShapeRules={Series:mk(['name','values'],z.strictObject({name:z.string(),values:z.array(z.number().finite())}))};
const runtime=extra=>createRuntime({root:'Stack',componentRules:rules,dataShapeRules,...extra});
const okay=(r)=>{assert.equal(r.ok,true,JSON.stringify(r));return r.snapshot;};
const bad=(r,code)=>{assert.equal(r.ok,false,JSON.stringify(r));if(code)assert.equal(r.issues[0].code,code,JSON.stringify(r));};
const children=s=>s.tree.props.children;

test('arithmetic, precedence, grouping, ternary, aggregation and pluck',()=>{
 const r=runtime();const s=okay(r.commit('root = Stack([Metric((2 + 3) * 4), Metric(7 % 3), Text(3 > 2 ? "yes" : "no"), Metric(@Sum(rows.score))])\nrows = [{score:2},{score:3}]'));
 assert.deepEqual(children(s).map(n=>Object.values(n.props)[0]),[20,1,'yes',5]);
});
test('Filter + Sort + Each compose a derived list without mutating input',()=>{
 const r=runtime();const s=okay(r.commit('rows = [{name:"B",score:2},{name:"A",score:5},{name:"C",score:1}]\nroot = Stack(@Each(@Sort(@Filter(rows,"score",">",1),"score","desc"),"item",Text(item.name)))'));
 assert.deepEqual(children(s).map(n=>n.props.content),['A','B']);
});
test('nested component arrays and null conditional branches normalize only child slots',()=>{
 const s=okay(runtime().commit('root = Stack([Text("first"), false ? Text("omit") : null, @Each([1,2], "x", Metric(x))])'));
 assert.deepEqual(children(s).map(n=>n.typeName),['Text','Metric','Metric']);
});
test('data constructors return data props, not UI nodes',()=>{
 const s=okay(runtime().commit('root = Stack([Chart([Series("Revenue",[2,3])])])'));
 assert.deepEqual(children(s)[0].props.series,[{name:'Revenue',values:[2,3]}]);
 bad(runtime().commit('root = Stack([Series("Bad",[1])])'),'CHILD_TYPE');
});
test('Input and Checkbox binding handles are explicit and revision scoped',()=>{
 const r=runtime();let s=okay(r.commit('$answer="A"\n$checked=false\nroot=Stack([Input("Answer",$answer),Checkbox("Done",$checked),Text($answer)])'));
 const old=children(s)[0].bindings.value;assert.equal(children(s)[0].props.value,'A');s=okay(r.setBinding(old,'B'));assert.equal(s.state.$answer,'B');assert.equal(children(s)[2].props.content,'B');bad(r.setBinding(old,'C'),'STALE_BINDING');s=okay(r.setBinding(children(s)[1].bindings.checked,true));assert.equal(s.state.$checked,true);
});
test('explicit assignment binding uses $value through the safe interpreter',()=>{
 const r=runtime();let s=okay(r.commit('$x=1\nroot=Stack([Slider($x = $value + 1),Metric($x)])'));
 s=okay(r.setBinding(children(s)[0].bindings.value,3));assert.equal(s.state.$x,4);
});
test('local action transaction supports sequential Set and Reset',()=>{
 const r=runtime();let s=okay(r.commit('$x=1\nroot=Stack([Metric($x),Button("Add",Action([@Set($x,$x+1),@Set($x,$x*2)])),Button("Reset",@Reset($x))])'));
 s=okay(r.dispatchLocal(children(s)[1].props.onPress));assert.equal(s.state.$x,4);s=okay(r.dispatchLocal(children(s)[2].props.onPress));assert.equal(s.state.$x,1);
});
test('Each action captures the correct item and still reads current state',()=>{
 const r=runtime();let s=okay(r.commit('$sum=0\nroot=Stack(@Each([2,5],"item",Button("Add",@Set($sum,$sum+item))))'));
 s=okay(r.dispatchLocal(children(s)[1].props.onPress));assert.equal(s.state.$sum,5);s=okay(r.dispatchLocal(children(s)[0].props.onPress));assert.equal(s.state.$sum,7);
});
test('failed state and action transactions roll back, preserving handles',()=>{
 const r=runtime();let s=okay(r.commit('$x=1\nroot=Stack([Slider($x),Button("Bad",Action([@Set($x,3),@Set($x,20)]))])'));
 const h=children(s)[1].props.onPress;bad(r.dispatchLocal(h),'SCHEMA');assert.equal(r.getSnapshot(),s);assert.equal(r.isActionHandle(h),true);bad(r.setState({$x:99}),'SCHEMA');assert.equal(r.getSnapshot(),s);
});
test('forged and copied action/binding handles cannot run',()=>{
 const r=runtime(),s=okay(r.commit('$x=1\nroot=Stack([Slider($x),Button("Add",@Set($x,2))])'));
 bad(r.dispatchLocal({...children(s)[1].props.onPress}),'STALE_ACTION');bad(r.setBinding({...children(s)[0].bindings.value},2),'STALE_BINDING');bad(r.commit('root=Stack([Button("Fake",{kind:"inform-action",id:"a1"})])'),'ACTION_TYPE');
});
test('preview is inert and cannot change committed state',()=>{
 const r=runtime(),s=okay(r.commit('$x=1\nroot=Stack([Metric($x)])'));
 const p=r.preview('$x=9\nroot=Stack([Button("Change",@Set($x,5)),Metric($x)');assert.equal(p.phase,'preview');assert.equal(p.interactive,false);assert.equal(p.tree.partial,true);assert.equal(r.getSnapshot(),s);bad(r.dispatchLocal(p.tree.props.children[0].props.onPress),'STALE_ACTION');
});
test('final incomplete rejects and retains last good snapshot',()=>{
 const r=runtime(),s=okay(r.commit('root=Stack([Text("good")])'));bad(r.commit('root=Stack([Text("incomplete")'),'INCOMPLETE');assert.equal(r.getSnapshot(),s);
});
test('strict syntax does not silently prune invalid lines, tokens or fields',()=>{
 for(const source of ['root=Stack([Text("x")])\nwindow.alert("bad")','root=Stack([Text("a" "b")])','root=Stack([Text("x")]) #','root=Stack([Text("x")]) garbage','root=Stack([Text("\\q")])','root=Stack([Text(])'])bad(runtime().commit(source));
 bad(runtime().commit('root=Stack([Text(2)])'),'SCHEMA');bad(runtime().commit('root=Stack([Text("x",1)])'),'ARITY');
});
test('data that resembles AST stays data; data cannot masquerade as child UI',()=>{
 const s=okay(runtime().commit('root=Stack([Data({k:"Comp",name:"Mutation",args:[]})])'));assert.equal(children(s)[0].props.value.k,'Comp');bad(runtime().commit('root=Stack([{type:"element",typeName:"Text",props:{content:"fake"},partial:false}])'),'CHILD_TYPE');
});
test('host calls and unsafe property traversal are rejected',()=>{
 for(const call of ['Query("read",{})','Mutation("write",{})','@Run(x)','@OpenUrl("https://example.com")','@ToAssistant("hi")'])bad(runtime().commit(`x=1\nroot=Stack([Data(${call})])`),'HOST_CAPABILITY');
 for(const access of ['a.constructor','a["__proto__"]','@Filter([a],"constructor","==",1)'])bad(runtime().commit(`a={x:1}\nroot=Stack([Data(${access})])`),'UNSAFE_KEY');
 bad(runtime().commit('root=Stack([Data({"__proto__":{x:1}})])'),'UNSAFE_KEY');
});
test('finite arithmetic and strict equality avoid upstream silent coercion',()=>{
 for(const expr of ['1 / 0','1 % 0','"bad" * 3','1e309','1e308 * 1e308'])bad(runtime().commit(`root=Stack([Data(${expr})])`));
 const s=okay(runtime().commit('root=Stack([Data(5 == "5"),Data(@Filter([5,"5"],"","==",5))])'));assert.equal(children(s)[0].props.value,false);assert.deepEqual(children(s)[1].props.value,[5]);
});
test('declared state, unresolved references and cycles reject',()=>{
 bad(runtime().commit('root=Stack([Data($missing)])'),'UNKNOWN_STATE');bad(runtime().commit('root=Stack([missing])'),'UNKNOWN_REFERENCE');bad(runtime().commit('a=b\nb=a\nroot=Stack([Data(a)])'),'REFERENCE_CYCLE');bad(runtime().commit('$x=$x+1\nroot=Stack([Metric($x)])'),'REFERENCE_CYCLE');bad(runtime().commit('root=Stack([Text("a")])\nroot=Stack([])'),'DUPLICATE_DECLARATION');
});
test('Each variable is local to inline template',()=>{
 bad(runtime().commit('item=Text(row.name)\nroot=Stack(@Each([{name:"x"}],"row",item))'),'UNKNOWN_REFERENCE');
 const s=okay(runtime().commit('root=Stack(@Each([[1,2],[3]],"outer",@Each(outer,"inner",Metric(inner))))'));assert.deepEqual(children(s).map(n=>n.props.value),[1,2,3]);
});
test('bounded operations, arrays, source, syntax depth and output occurrences',()=>{
 bad(runtime({limits:{source:10}}).commit('root=Stack([Text("large")])'),'SOURCE_LIMIT');
 bad(runtime({limits:{array:2}}).commit('root=Stack(@Each([1,2,3],"x",Metric(x)))'),'ARRAY_LIMIT');
 bad(runtime({limits:{operations:10}}).commit('root=Stack([Text("x")])'),'OPERATION_LIMIT');
 bad(runtime({limits:{outputNodes:3}}).commit('t=Text("reuse")\nroot=Stack([t,t,t,t])'),'OUTPUT_LIMIT');
 bad(runtime().commit('root=Stack([Data('+ '!'.repeat(100)+'true)])'),'DEPTH_LIMIT');
});
test('state rejects accessors, prototypes, cycles, reserved keys and wrong type',()=>{
 const r=runtime();okay(r.commit('$data={}\n$x=1\nroot=Stack([Metric($x)])'));
 const cycle={};cycle.self=cycle;for(const value of [cycle,new Date(),Object.defineProperty({},'x',{get(){throw Error('never')},enumerable:true})])bad(r.setState({$data:value}));
 bad(r.setState({$x:'wrong'}),'STATE_TYPE');bad(r.setState({$unknown:1}),'UNKNOWN_STATE');
});
test('cancellation, dispose and new commits invalidate earlier handles',()=>{
 const r=runtime();const s=okay(r.commit('$x=1\nroot=Stack([Button("Go",@Set($x,2))])'));const h=children(s)[0].props.onPress;const abort=new AbortController();abort.abort();bad(r.dispatchLocal(h,{signal:abort.signal}),'CANCELLED');assert.equal(r.getSnapshot(),s);okay(r.commit('root=Stack([Text("new")])'));bad(r.dispatchLocal(h),'STALE_ACTION');r.dispose();bad(r.commit('root=Stack([])'),'DISPOSED');
});
test('snapshots are frozen and subscribers fire only on successful commit',()=>{
 const r=runtime();let calls=0;const unsub=r.subscribe(()=>calls++);const s=okay(r.commit('$x=1\nroot=Stack([Slider($x)])'));assert.equal(Object.isFrozen(s.tree.props.children),true);bad(r.setState({$x:50}));assert.equal(calls,1);okay(r.setState({$x:2}));assert.equal(calls,2);unsub();okay(r.setState({$x:3}));assert.equal(calls,2);
});
test('unreachable declaration cycles and invalid single statement syntax reject',()=>{
 bad(runtime().commit('a=b\nb=a\nroot=Stack([])'),'REFERENCE_CYCLE');
 for(const src of ['root=Stack([Text("x")])\nnot_a_statement','root=Stack([{x 1}])','root=Stack([Data([1 2])])'])bad(runtime().commit(src));
});
test('scalar output also consumes expansion/text budgets',()=>{
 bad(runtime({limits:{text:20}}).commit('a="12345678901"\nroot=Stack([Text(a+a)])'),'TEXT_LIMIT');
 bad(runtime({limits:{operations:500}}).commit('root=Stack([Data(@Each([1,2,3,4,5,6,7,8,9,10],"x",@Each([1,2,3,4,5,6,7,8,9,10],"y",x+y)))])'),'OPERATION_LIMIT');
});
test('strict logical operators require booleans and do not accept single-character aliases',()=>{
 for(const expression of ['true && 1','false || 1','true & false','true | false'])bad(runtime().commit(`root=Stack([Data(${expression})])`));
 const s=okay(runtime().commit('root=Stack([Data(false && (1 / 0 > 1)),Data(true || (1 / 0 > 1))])'));assert.deepEqual(children(s).map(n=>n.props.value),[false,true]);
});
test('single quoted string escapes are validated consistently',()=>{
 const s=okay(runtime().commit("root=Stack([Text('Hi \\u4f60\\n')])"));assert.equal(children(s)[0].props.content,'Hi 你\n');
 for(const source of ["root=Stack([Text('bad \\q')])","root=Stack([Text('bad \\uXX')])","root=Stack([Text('bad\nline')])"])bad(runtime().commit(source),'SYNTAX');
});
test('transform argument validation applies to empty and singleton arrays',()=>{
 for(const expr of ['@Sort([true],"")','@Sort([],1)','@Filter([],1,"==",1)','@Filter([],"","contains",1)','@Filter([],"constructor","==",1)','@Filter([],"",">","5")'])bad(runtime().commit(`root=Stack([Data(${expr})])`));
 const s=okay(runtime().commit('root=Stack([Data(@Sort([{k:2,n:"A"},{k:2,n:"B"}],"k","desc"))])'));assert.deepEqual(children(s)[0].props.value.map(n=>n.n),['A','B']);
});
test('binding input name is reserved and reentrant subscribers never receive stale revisions',()=>{
 bad(runtime().commit('$value=1\nroot=Stack([])'),'RESERVED_NAME');
 const r=runtime(),seen=[];r.subscribe(s=>{if(s.revision===1)okay(r.setState({$x:2}));});r.subscribe(s=>seen.push(s.revision));const first=okay(r.commit('$x=1\nroot=Stack([Slider($x)])'));assert.equal(first.revision,1);assert.equal(r.getSnapshot().revision,2);assert.deepEqual(seen,[2]);
});
