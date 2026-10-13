import test from 'node:test';
import assert from 'node:assert/strict';
import {createRuntime} from '../dist/index.js';
import {createCatalog,resources,buildProfile} from '../../component-contract/dist/index.mjs';
const catalog=createCatalog({adapters:{},iconNames:['TestOnly']});
// Language/contract integration intentionally does not exercise any renderer.
const adapters=Object.fromEntries(catalog.flatMap(m=>m.components.map(c=>[c.name,{kind:'dom',key:c.name,create(){throw Error('Not a renderer test')}}])));
const modules=createCatalog({adapters,iconNames:['TestOnly']});
const profile=buildProfile({id:'parser/contract-integration',root:'Stack',modules,select:['base/layout','base/controls','base/charts','domain/weather'],resources});
const ok=r=>{assert.equal(r.ok,true,JSON.stringify(r));return r.snapshot;};
test('real generated contract binds text, range and chart data to one transaction store',()=>{
 const runtime=createRuntime(profile);let s=ok(runtime.commit('$answer="Ada"\n$x=2\nroot=Stack([Input("Name",$answer),Text("Hello "+$answer),Slider("Gain",$x,0,10),Button("Add",@Set($x,$x+1)),BarChart("Amounts",["A","B"],[Series("Amount",[$x,3])])])'));
 s=ok(runtime.setBinding(s.tree.props.children[0].bindings.value,'Grace'));assert.equal(s.tree.props.children[1].props.content,'Hello Grace');s=ok(runtime.dispatchLocal(s.tree.props.children[3].props.onPress));assert.equal(s.state.$x,3);assert.deepEqual(s.tree.props.children[4].props.series[0].values,[3,3]);
 const before=s;const invalid=runtime.setBinding(s.tree.props.children[2].bindings.value,30);assert.equal(invalid.ok,false);assert.equal(invalid.issues[0].code,'invalid-range');assert.equal(runtime.getSnapshot(),before);
});
test('real profile semantic chart length validation rejects, instead of clipping data',()=>{
 const result=createRuntime(profile).commit('root=Stack([BarChart("Bad",["A","B"],[Series("S",[1])])])');assert.equal(result.ok,false);assert.equal(result.issues[0].code,'chart-length');
});
test('optional positional null skips omitted field without dropping later args',()=>{
 const s=ok(createRuntime(profile).commit('$answer="x"\nroot=Stack([Input("Name",$answer,null,true)])'));assert.equal(s.tree.props.children[0].props.disabled,true);assert.equal('placeholder' in s.tree.props.children[0].props,false);
});
test('profile validates finite domain supplied data and cannot execute host action',()=>{
 const r=createRuntime(profile);ok(r.commit('root=Stack([WeatherCard("City",22,"Clear")])'));const result=r.commit('root=Stack([Button("External",@ToAssistant("send"))])');assert.equal(result.ok,false);assert.equal(result.issues[0].code,'HOST_CAPABILITY');
});
test('shipped form and derived-chart examples commit and interact with real schemas',async()=>{
 const {readFile}=await import('node:fs/promises');
 const form=createRuntime(profile);let s=ok(form.commit(await readFile(new URL('../examples/local-form.openui',import.meta.url),'utf8')));
 s=ok(form.setBinding(s.tree.props.children[1].bindings.value,'Grace'));assert.equal(s.tree.props.children[3].props.content,'Hello Grace');
 s=ok(form.dispatchLocal(s.tree.props.children[4].props.children[0].props.onPress));assert.equal(s.state.$count,1);
 s=ok(form.dispatchLocal(s.tree.props.children[4].props.children[1].props.onPress));assert.equal(s.state.$name,'Ada');assert.equal(s.state.$count,0);
 const chart=createRuntime(profile);s=ok(chart.commit(await readFile(new URL('../examples/derived-chart.openui',import.meta.url),'utf8')));
 assert.deepEqual(s.tree.props.children[4].props.labels,['Alpha','Gamma','Beta']);
 s=ok(chart.setState({$direction:'asc'}));assert.deepEqual(s.tree.props.children[4].props.labels,['Beta','Gamma','Alpha']);
 s=ok(chart.setState({$minimum:10}));assert.equal(s.tree.props.children[4].props.content,'No matching items');
});
