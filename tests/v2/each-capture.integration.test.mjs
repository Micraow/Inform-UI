import test from 'node:test';
import assert from 'node:assert/strict';
import {createRuntime,createCatalog,resources,buildProfile} from '../../dist/v2/core-node.mjs';
const descriptors=createCatalog({adapters:{}});
const adapters=Object.fromEntries(descriptors.flatMap(m=>m.components.map(c=>[c.name,{kind:'dom',key:c.name,create(){throw Error('This is not a renderer test')}}])));
const modules=createCatalog({adapters});
const profile=buildProfile({id:'each-capture-integration',root:'Stack',modules,select:['base/layout','base/controls'],resources});
const ok=result=>{assert.equal(result.ok,true,JSON.stringify(result));return result.snapshot;};
const choose=card=>card.props.children[1].props.onPress;
test('real Card/Button schema captures selected trip after Each sort/filter and revisions',()=>{
 const r=createRuntime(profile);let s=ok(r.commit(`
 $chosen=""
 $minimum=0
 $direction="desc"
 trips=[{name:"Alpha",price:2},{name:"Beta",price:5},{name:"Gamma",price:1}]
 filtered=@Sort(@Filter(trips,"price",">=",$minimum),"price",$direction)
 root=Stack([Text($chosen),@Each(filtered,"trip",Card([Text(trip.name),Button("Choose",@Set($chosen,trip.name))],trip.name))])
 `));
 assert.deepEqual(s.tree.props.children.slice(1).map(c=>c.props.title),['Beta','Alpha','Gamma']);
 const oldBeta=choose(s.tree.props.children[1]);
 s=ok(r.dispatchLocal(oldBeta));assert.equal(s.state.$chosen,'Beta');assert.equal(s.tree.props.children[0].props.content,'Beta');
 s=ok(r.setState({$direction:'asc'}));assert.equal(r.dispatchLocal(oldBeta).issues[0].code,'STALE_ACTION');
 assert.deepEqual(s.tree.props.children.slice(1).map(c=>c.props.title),['Gamma','Alpha','Beta']);
 s=ok(r.dispatchLocal(choose(s.tree.props.children[1])));assert.equal(s.state.$chosen,'Gamma');
 s=ok(r.setState({$minimum:3}));assert.deepEqual(s.tree.props.children.slice(1).map(c=>c.props.title),['Beta']);
 s=ok(r.dispatchLocal(choose(s.tree.props.children[1])));assert.equal(s.state.$chosen,'Beta');
});
test('nested Each action captures both outer and inner lexical scopes',()=>{
 const r=createRuntime(profile);let s=ok(r.commit(`
 $chosen=""
 trips=[{name:"Alpha",options:["Window","Aisle"]},{name:"Beta",options:["Standard","Flex"]}]
 root=Stack(@Each(trips,"trip",Card(@Each(trip.options,"option",Button(option,@Set($chosen,trip.name+":"+option))),trip.name)))
 `));
 s=ok(r.dispatchLocal(s.tree.props.children[1].props.children[1].props.onPress));assert.equal(s.state.$chosen,'Beta:Flex');
 s=ok(r.dispatchLocal(s.tree.props.children[0].props.children[0].props.onPress));assert.equal(s.state.$chosen,'Alpha:Window');
});
test('nested Each same variable name shadows locally without leaking to later outer expressions',()=>{
 const r=createRuntime(profile);let s=ok(r.commit(`
 $chosen=""
 trips=[{name:"Outer",options:[{name:"Inner"}]}]
 root=Stack(@Each(trips,"trip",Card([@Each(trip.options,"trip",Button("Inner",@Set($chosen,trip.name))),Button("Outer",@Set($chosen,trip.name))])))
 `));
 s=ok(r.dispatchLocal(s.tree.props.children[0].props.children[0].props.onPress));assert.equal(s.state.$chosen,'Inner');
 s=ok(r.dispatchLocal(s.tree.props.children[0].props.children[1].props.onPress));assert.equal(s.state.$chosen,'Outer');
});
