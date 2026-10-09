import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import {mount,validateDocument,compileHtml} from '../dist/index.js';
import {createSchemaSubset} from '../scripts/schema-subsets.mjs';
const item=(id,extra={})=>({id,label:'Item '+id,bind:id,...extra});
const node=(extra={})=>({type:'checklist',label:'Local items',items:[item('a'),item('b'),item('c',{disabled:true})],...extra});
const spec=(extra={},state={a:false,b:true,c:false,other:0,locked:false})=>({version:'iui/1',state,body:[node(extra)]});
const setup=s=>{const dom=new JSDOM('<div id="host"></div>'),host=dom.window.document.querySelector('#host'),c=mount(host,s??spec());return {dom,host,c,root:host.querySelector('.iui-checklist')};};
const fire=(x,e,type)=>e.dispatchEvent(new x.dom.window.Event(type,{bubbles:true,cancelable:true}));
const boxes=x=>[...x.root.querySelectorAll('input[type=checkbox]')];
const buttons=x=>[...x.root.querySelectorAll('button')];
const filter=(x,value)=>{const select=x.root.querySelector('select');select.value=value;fire(x,select,'change');return select;};
const rejected=s=>{const r=validateDocument(s);assert.equal(r.ok,false);return r.issues;};

test('checklist strict public schema, base subset and finite bounds share the same contract',async()=>{
 const schema=JSON.parse(await readFile('src/schema/iui.schema.json','utf8')),owners=JSON.parse(await readFile('src/schema/fragments/index.json','utf8')).nodeOwners;
 const validate=new Ajv({strict:true,allErrors:true}).compile(createSchemaSubset(schema,owners,['base']));assert.equal(validate(spec()),true);assert.equal(validateDocument(spec()).ok,true);
 for(const extra of [{items:[]},{items:Array.from({length:50},(_,i)=>item('x'+i))}]){const s=spec(extra,Object.fromEntries(extra.items.map(i=>[i.bind,false])));assert.equal(validateDocument(s).ok,true);}
 for(const extra of [{items:Array.from({length:51},(_,i)=>item('x'+i))},{filter:'all'},{bulk:1},{emptyText:'x'.repeat(1001)},{callback:'none'},{items:[item('a',{html:'unsafe'})]}]){assert.equal(validate(spec(extra)),false);rejected(spec(extra));}
});
test('duplicate identities/binds, unknown or computed-only binds and nonboolean state are rejected',()=>{
 for(const [items,state,code] of [[[item('a'),item('a')],{a:false},'CHECKLIST_ID'],[[item('a'),item('b',{bind:'a'})],{a:false},'CHECKLIST_BIND'],[[item('missing')],{},'UNKNOWN_BIND'],[[item('a')],{a:0},'INPUT_TYPE']])assert.ok(rejected(spec({items},state)).some(i=>i.code===code));
 const s=spec({items:[item('derived')]},{});s.computed={derived:true};assert.ok(rejected(s).some(i=>i.code==='UNKNOWN_BIND'));
});
test('nested disabled expressions participate in reference, type and every atomic state validation',()=>{
 for(const disabled of [{$:'missing'},'yes',0,{op:'if',args:[true,false,'no']}]){const s=spec({items:[item('a',{disabled})]});if(typeof disabled==='object'&&'op'in disabled)assert.equal(validateDocument(s).ok,true);else rejected(s);}
 const s=spec({items:[item('a',{disabled:{op:'if',args:[{$:'locked'},'bad',false]}})]});const x=setup(s);const input=boxes(x)[0];input.focus();assert.throws(()=>x.c.setState({locked:true,other:2}));assert.equal(x.c.getState().locked,false);assert.equal(x.c.getState().other,0);assert.equal(boxes(x)[0],input);assert.equal(x.dom.window.document.activeElement,input);x.c.dispose();
});
test('native checkbox fields keep exact labels, hints, state and shared count',()=>{
 const x=setup(spec({items:[item('a',{hint:'Supplied <literal>'}),item('b')]}));const [a,b]=boxes(x);assert.equal(a.checked,false);assert.equal(b.checked,true);assert.match(x.root.querySelector('output').textContent,/1 of 2/);assert.equal(x.root.querySelector('label[for="'+a.id+'"]').textContent,'Item a');assert.match(x.dom.window.document.getElementById(a.getAttribute('aria-describedby').split(' ')[0]).textContent,/Supplied <literal>/);
 a.click();assert.equal(x.c.getState().a,true);assert.match(x.root.querySelector('output').textContent,/2 of 2/);x.c.dispose();
});
test('bulk actions change every eligible item once and never disabled items; boundary no-op retains focus',()=>{
 const x=setup();const [all,clear]=buttons(x);all.focus();all.click();assert.deepEqual(x.c.getState(),{a:true,b:true,c:false,other:0,locked:false});assert.equal(all.getAttribute('aria-disabled'),'true');assert.match(x.root.querySelector('[role=status]').textContent,/1 items/);all.click();assert.equal(x.dom.window.document.activeElement,all);clear.click();assert.deepEqual(x.c.getState(),{a:false,b:false,c:false,other:0,locked:false});assert.equal(clear.getAttribute('aria-disabled'),'true');x.c.dispose();
});
test('bulk global rejection preserves the entire state and all selected DOM, with explicit failure feedback',()=>{
 const s=spec();s.body.push({type:'loading',label:'Bound',progress:{op:'if',args:[{$:'a'},101,0]}});const x=setup(s),before=x.c.getState(),[all]=buttons(x);all.focus();all.click();assert.deepEqual(x.c.getState(),before);assert.deepEqual(boxes(x).map(i=>i.checked),[false,true,false]);assert.match(x.root.querySelector('[role=status]').textContent,/rejected/);assert.equal(x.dom.window.document.activeElement,all);x.c.dispose();
});
test('bulk changes are one atomic patch even when each intermediate individual update would be invalid',()=>{
 const s=spec({items:[item('a'),item('b')]},{a:false,b:false});s.body.push({type:'loading',label:'Equality',progress:{op:'if',args:[{op:'eq',args:[{$:'a'},{$:'b'}]},0,101]}});const x=setup(s);assert.throws(()=>x.c.setState({a:true}));buttons(x)[0].click();assert.deepEqual(x.c.getState(),{a:true,b:true});assert.match(x.root.querySelector('[role=status]').textContent,/2 items/);x.c.dispose();
});
test('All/Open/Done filter keeps exact DOM; hidden focused item moves only to next available item',()=>{
 const x=setup(spec({items:[item('a'),item('b')]},{a:false,b:false,other:0}));const [a,b]=boxes(x),rows=[...x.root.querySelectorAll('li')];filter(x,'open');a.focus();a.click();assert.equal(rows[0].hidden,true);assert.equal(x.dom.window.document.activeElement,b);b.click();assert.equal(rows[1].hidden,true);assert.equal(x.dom.window.document.activeElement,x.root.querySelector('select'));assert.match(x.root.textContent,/No items match/);filter(x,'done');assert.equal(rows[0].hidden,false);assert.equal(boxes(x)[0],a);assert.equal(boxes(x)[1],b);filter(x,'all');assert.ok(rows.every(row=>!row.hidden));x.c.dispose();
});
test('unrelated host updates preserve local filter, controls, focus and outside focus',()=>{
 const x=setup();filter(x,'open');const a=boxes(x)[0];a.focus();x.c.setState({other:2});assert.equal(x.root.querySelector('select').value,'open');assert.equal(boxes(x)[0],a);assert.equal(x.dom.window.document.activeElement,a);const outside=x.dom.window.document.createElement('button');x.host.after(outside);outside.focus();x.c.setState({a:true});assert.equal(x.dom.window.document.activeElement,outside);x.c.dispose();
});
test('own and inherited disabled state guard forged input/filter/bulk events',()=>{
 const s=spec({disabled:{$:'locked'}});s.state.locked=true;const x=setup(s);const [a]=boxes(x);a.checked=true;fire(x,a,'change');assert.equal(a.checked,false);assert.equal(x.c.getState().a,false);buttons(x)[0].dispatchEvent(new x.dom.window.Event('click'));assert.equal(x.c.getState().a,false);filter(x,'done');assert.equal(x.root.querySelector('select').value,'all');x.c.setState({locked:false});assert.equal(a.matches(':disabled'),false);buttons(x)[0].click();assert.equal(x.c.getState().a,true);x.c.dispose();
});
test('enclosing form owns checklist fields for snapshot, disabled omission, submit and native cancel/reset',async()=>{
 const dom=new JSDOM('<div id="host"></div>'),host=dom.window.document.querySelector('#host');let values,calls=0;const s=spec();s.body=[{type:'form',label:'Plan',action:'save',children:s.body}];const c=mount(host,s,{actions:{save:ctx=>{calls++;values=ctx.values;}}});const x={dom,host,c,root:host.querySelector('.iui-checklist')};buttons(x)[0].click();assert.equal(calls,0);const form=host.querySelector('form');fire(x,form,'submit');await Promise.resolve();await Promise.resolve();assert.equal(calls,1);assert.deepEqual(values,{a:true,b:true});assert.equal(form.dataset.status,'success');form.reset();assert.deepEqual(c.getState(),s.state);assert.deepEqual(boxes(x).map(i=>i.checked),[false,true,false]);c.dispose();
});
test('busy form blocks checklist actions and cancel aborts/reset uses shared accepted snapshots',async()=>{
 const dom=new JSDOM('<div id="host"></div>'),host=dom.window.document.querySelector('#host');let done,signal;const pending=new Promise(resolve=>done=resolve);const s=spec();s.body=[{type:'form',label:'Plan',action:'save',children:s.body}];const c=mount(host,s,{actions:{save:ctx=>{signal=ctx.signal;return pending;}}}),x={dom,host,c,root:host.querySelector('.iui-checklist')};const form=host.querySelector('form');fire(x,form,'submit');assert.equal(boxes(x)[0].matches(':disabled'),true);buttons(x)[0].dispatchEvent(new dom.window.Event('click'));assert.equal(c.getState().a,false);host.querySelector('.iui-form-actions button[type=button]').click();assert.equal(signal.aborted,true);assert.equal(boxes(x)[0].matches(':disabled'),false);done();await Promise.resolve();await Promise.resolve();assert.equal(form.dataset.status,'cancelled');c.dispose();
});
test('empty checklist has explicit zero count, empty content and no fabricated percentage',()=>{
 const x=setup(spec({items:[],emptyText:'No supplied steps'},{}));assert.match(x.root.querySelector('output').textContent,/0 of 0/);assert.match(x.root.textContent,/No supplied steps/);assert.equal(boxes(x).length,0);assert.ok(buttons(x).every(b=>b.getAttribute('aria-disabled')==='true'));assert.doesNotMatch(x.root.textContent,/%/);x.c.dispose();
});
test('optional controls, literal rendering, foreign documents and teardown retain owner isolation',()=>{
 const s=spec({label:'<img src=x onerror=alert(1)>',bulk:false,filter:false,items:[item('a',{label:'😀'.repeat(200)})]},{a:false});const a=setup(s),b=setup(s);assert.equal(a.root.querySelector('img'),null);assert.equal(buttons(a).length,0);assert.equal(a.root.querySelector('select'),null);assert.notEqual(boxes(a)[0].id,boxes(b)[0].id);const old=boxes(a)[0];a.c.dispose();old.checked=true;fire(a,old,'change');assert.throws(()=>a.c.getState(),/disposed/);boxes(b)[0].click();assert.equal(b.c.getState().a,true);b.c.dispose();
});
test('invalid controller update and state patches are atomic; valid update resets local view only after validation',()=>{
 const x=setup();filter(x,'done');const root=x.root;assert.throws(()=>x.c.update(spec({items:[item('unknown')]})));assert.equal(x.host.querySelector('.iui-checklist'),root);assert.equal(root.querySelector('select').value,'done');assert.throws(()=>x.c.setState({a:1,other:4}));assert.equal(x.c.getState().other,0);x.c.update(spec());assert.notEqual(x.host.querySelector('.iui-checklist'),root);assert.equal(x.host.querySelector('select').value,'all');x.c.dispose();
});
test('deterministic offline compiler uses the same native checklist rendering and state',async()=>{
 const s=spec(),before=JSON.stringify(s),html=await compileHtml(s);assert.equal(await compileHtml(s),html);assert.equal(JSON.stringify(s),before);const dom=new JSDOM(html,{runScripts:'dangerously'}),root=dom.window.document.querySelector('.iui-checklist');root.querySelector('button').click();assert.deepEqual([...root.querySelectorAll('input')].map(i=>i.checked),[true,true,false]);assert.match(root.querySelector('output').textContent,/2 of 3/);dom.window.close();
});
