import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv from 'ajv/dist/2020.js';
import {mount,validateDocument,evaluateState,compileHtml} from '../dist/index.js';
const rating=(extra={})=>({type:'rating',label:'Clarity',bind:'score',...extra});
const spec=(extra={},state={score:0,other:0},body=[rating(extra)])=>({version:'iui/1',state,body});
const setup=(input=spec(),html='<main></main>')=>{
 const dom=new JSDOM(html,{pretendToBeVisual:true}),host=dom.window.document.querySelector('main'),c=mount(host,input);
 return{dom,host,c,group:host.querySelector('.iui-rating'),inputs:[...host.querySelectorAll('input[type=radio]')],output:host.querySelector('.iui-rating-output'),clear:host.querySelector('.iui-rating-clear'),feedback:host.querySelector('.iui-rating-feedback')};
};
const change=(x,index,checked=true)=>{const input=x.inputs[index];input.checked=checked;input.dispatchEvent(new x.dom.window.Event('change',{bubbles:true}));};
const selected=x=>x.inputs.filter(input=>input.checked).map(input=>Number(input.value));
const invalid=(s,code)=>{const r=validateDocument(s);assert.equal(r.ok,false);if(code)assert.ok(r.issues.some(i=>i.code===code),JSON.stringify(r.issues));return r;};

test('rating strictly bounds fields and rejects every unsupported alternate protocol',async()=>{
 const schema=JSON.parse(await readFile(new URL('../src/schema/iui.schema.json',import.meta.url)));const check=new Ajv({strict:true,allErrors:true}).compile(schema);
 for(const extra of [{},{max:2},{max:10},{hint:''},{hint:'x'.repeat(1000)},{label:'😀'.repeat(200)},{disabled:true},{disabled:{$:'locked'}},{clearable:false}])assert.equal(validateDocument(spec(extra,{score:0,locked:false})).ok,true);
 for(const extra of [{max:1},{max:11},{max:2.5},{max:'5'},{label:''},{label:'😀'.repeat(201)},{hint:'x'.repeat(1001)},{clearable:'true'},{initial:1},{value:2},{readOnly:true},{step:.5},{glyph:'x'},{required:true},{options:[]},{onChange:'run()'},{bind:'bad key'}]){const s=spec(extra);assert.equal(check(s),false,JSON.stringify(extra));invalid(s);}
 for(const key of ['bind','label']){const s=spec();delete s.body[0][key];invalid(s);}
});
test('declared state type and integer range apply at document validation and every host patch',()=>{
 for(const max of [2,5,10])for(const score of [0,1,max])assert.equal(validateDocument(spec({max},{score})).ok,true);
 for(const score of ['3',true,false,null,[],{},NaN,Infinity,-Infinity,-1,.5,5.1,6])invalid(spec({}, {score}));
 invalid({...spec(),state:{}},'UNKNOWN_BIND');invalid({...spec(),computed:{score:1},state:{}},'UNKNOWN_BIND');
 const x=setup(spec({max:3},{score:1,other:0}));
 for(const score of [-1,.1,4,'2',false,null,Infinity]){assert.throws(()=>x.c.setState({score,other:99}));assert.deepEqual(x.c.getState(),{score:1,other:0});assert.deepEqual(selected(x),[1]);}
 x.c.setState({score:3});assert.deepEqual(selected(x),[3]);x.c.setState({score:0});assert.deepEqual(selected(x),[]);x.c.dispose();
});
test('declared button set actions satisfy every rating maximum and zero remains valid without Clear',()=>{
 const button=value=>({type:'button',label:'Set',action:{kind:'set',bind:'score',value}});
 for(const value of [-1,2.5,6,'2'])invalid(spec({}, {score:0},[rating(),button(value)]));
 assert.equal(validateDocument(spec({clearable:false},{score:0},[rating({clearable:false}),button(0)])).ok,true);
 const s=spec({}, {score:2},[rating({max:10}),rating({label:'Smaller',max:3})]);assert.equal(validateDocument(s).ok,true);
 invalid({...s,state:{score:4}},'RATING_VALUE');invalid({...s,body:[...s.body,button(4)]},'RATING_VALUE');
 const x=setup(s);assert.throws(()=>x.c.setState({score:4}));assert.deepEqual(selected(x),[2,2]);x.c.dispose();
});
test('rating is rejected beneath forms through arbitrary containers, list nodes, and hidden panels',()=>{
 const wrappers=[node=>node,node=>({type:'col',children:[{type:'box',children:[node]}]}),node=>({type:'list',items:['Literal',node]}),node=>({type:'details',summary:'Open',children:[node]}),node=>({type:'tab-group',label:'Tabs',children:[{type:'tab-panel',id:'tab',label:'Tab',children:[node]}]})];
 for(const wrap of wrappers)invalid(spec({}, {score:0},[{type:'form',label:'Outer',children:[wrap(rating())]}]),'RATING_FORM');
 assert.equal(validateDocument(spec({}, {score:0},[{type:'field',label:'Standalone group',children:[rating()]}])).ok,true);
});
test('native radios expose unique name, label/legend, described output, and genuine unrated zero',()=>{
 const x=setup(spec({hint:'Local only'}));assert.equal(x.group.tagName,'FIELDSET');assert.equal(x.group.querySelector('legend').textContent,'Clarity');assert.equal(x.inputs.length,5);assert.deepEqual(selected(x),[]);assert.equal(x.output.value,'Unrated');
 assert.equal(new Set(x.inputs.map(i=>i.name)).size,1);assert.equal(new Set(x.inputs.map(i=>i.id)).size,5);
 x.inputs.forEach((input,i)=>{assert.equal(input.type,'radio');assert.equal(input.value,String(i+1));assert.equal(input.getAttribute('aria-label'),`${i+1} of 5`);assert.equal(input.parentElement.htmlFor,input.id);assert.equal(input.parentElement.querySelector('.iui-rating-star').getAttribute('aria-hidden'),'true');for(const id of input.getAttribute('aria-describedby').split(' '))assert.ok(x.dom.window.document.getElementById(id));});
 assert.equal(x.clear.type,'button');assert.equal(x.clear.getAttribute('aria-disabled'),'true');assert.equal(x.clear.disabled,false);x.c.dispose();
});
test('JSDOM activation, explicit change, repeat, unchecked events, and Clear preserve numeric state',()=>{
 const x=setup();x.inputs[2].click();assert.equal(x.c.getState().score,3);assert.deepEqual(selected(x),[3]);assert.equal(x.output.value,'3 of 5');
 change(x,2);change(x,2);assert.equal(x.c.getState().score,3);change(x,2,false);assert.deepEqual(selected(x),[3]);
 x.inputs[4].parentElement.click();assert.equal(x.c.getState().score,5);assert.equal(x.group.querySelectorAll('[data-filled=true]').length,5);
 x.clear.focus();x.clear.click();assert.equal(x.c.getState().score,0);assert.deepEqual(selected(x),[]);assert.equal(x.dom.window.document.activeElement,x.clear);assert.equal(x.clear.getAttribute('aria-disabled'),'true');x.clear.click();assert.equal(x.c.getState().score,0);assert.equal(x.dom.window.document.activeElement,x.clear);x.c.dispose();
});
test('clearable false omits Clear while host and declared reset still set unrated zero',()=>{
 const s=spec({clearable:false},{score:0},[rating({clearable:false}),{type:'button',label:'Reset',action:{kind:'reset'}}]),x=setup(s);assert.equal(x.clear,null);change(x,1);assert.equal(x.c.getState().score,2);x.host.querySelector('[data-iui=button]').click();assert.equal(x.c.getState().score,0);assert.deepEqual(selected(x),[]);x.c.dispose();
});
test('bound disabled must be boolean both initially and after derived evaluation',()=>{
 invalid(spec({disabled:'yes'}),'INPUT_TYPE');invalid(spec({disabled:{$:'missing'}}));invalid(spec({disabled:{op:'add',args:[1,2]}}),'INPUT_TYPE');
 const s=spec({disabled:{$:'lock'}},{score:0,other:0});s.computed={lock:{op:'if',args:[{op:'gt',args:[{$:'other'},0]},'wrong',false]}};
 const x=setup(s);assert.throws(()=>x.c.setState({other:1}));assert.equal(x.c.getState().other,0);assert.equal(x.group.disabled,false);x.c.dispose();
});
test('disabled native fieldset and forged dispatch are nonmutating; host remains authoritative',()=>{
 const x=setup(spec({disabled:{$:'locked'}},{score:2,locked:true}));assert.equal(x.group.disabled,true);assert.equal(x.inputs[0].matches(':disabled'),true);change(x,0);assert.equal(x.c.getState().score,2);assert.deepEqual(selected(x),[2]);x.clear.dispatchEvent(new x.dom.window.Event('click'));assert.equal(x.c.getState().score,2);
 x.c.setState({score:4});assert.deepEqual(selected(x),[4]);x.c.setState({locked:false});change(x,0);assert.equal(x.c.getState().score,1);x.c.dispose();
});
test('inherited disabled host and standalone field groups guard every mutation path',()=>{
 for(const html of ['<fieldset disabled><main></main></fieldset>','<main></main>']){
 const body=html.startsWith('<main')?[{type:'field',label:'Disabled group',disabled:true,children:[rating()]}]:[rating()];const x=setup(spec({}, {score:2},body),html);assert.equal(x.inputs[0].matches(':disabled'),true);change(x,0);x.clear.dispatchEvent(new x.dom.window.Event('click'));assert.equal(x.c.getState().score,2);assert.deepEqual(selected(x),[2]);x.c.dispose();}
});
test('global rejection rolls radios/output back with localized feedback and preserves focus/unrelated state',()=>{
 const s=spec({}, {score:2,other:1});s.body.push({type:'loading',label:'Guard',progress:{op:'mul',args:[{$:'score'},30]}});const x=setup(s);x.inputs[3].focus();change(x,3);assert.deepEqual(x.c.getState(),{score:2,other:1});assert.deepEqual(selected(x),[2]);assert.equal(x.output.value,'2 of 5');assert.equal(x.dom.window.document.activeElement,x.inputs[3]);assert.match(x.feedback.textContent,/could not be applied/);assert.equal(x.feedback.hidden,false);
 x.c.setState({other:2});assert.deepEqual(selected(x),[2]);assert.equal(x.dom.window.document.activeElement,x.inputs[3]);change(x,2);assert.equal(x.c.getState().score,3);assert.equal(x.feedback.hidden,true);x.c.dispose();
});
test('rejected Clear retains accepted value and focused Clear, then an allowed reset succeeds',()=>{
 const s=spec({}, {score:2});s.body.push({type:'loading',label:'Guard',progress:{op:'div',args:[100,{$:'score'}]}},{type:'button',label:'Reset',action:{kind:'reset'}});const x=setup(s);x.clear.focus();x.clear.click();assert.equal(x.c.getState().score,2);assert.equal(x.output.value,'2 of 5');assert.equal(x.dom.window.document.activeElement,x.clear);assert.match(x.feedback.textContent,/unchanged/);change(x,4);assert.equal(x.c.getState().score,5);x.host.querySelector('[data-iui=button]').click();assert.equal(x.c.getState().score,2);assert.equal(x.feedback.hidden,true);x.c.dispose();
});
test('unrelated and same-value host writes retain all DOM, focused option, and accepted state',()=>{
 const x=setup();change(x,3);x.inputs[3].focus();const group=x.group,output=x.output,inputs=[...x.inputs];for(const patch of [{other:1},{score:4},{score:2}]){x.c.setState(patch);assert.equal(x.host.querySelector('.iui-rating'),group);assert.equal(x.host.querySelector('output'),output);assert.deepEqual([...x.host.querySelectorAll('input')],inputs);assert.equal(x.dom.window.document.activeElement,x.inputs[3]);}assert.deepEqual(selected(x),[2]);x.c.dispose();
});
test('separate radios for shared and independent bindings never uncheck sibling widgets',()=>{
 const x=setup(spec({}, {score:0,second:1},[rating(),rating({label:'Same state'}),rating({label:'Independent',bind:'second'})]));const groups=[...x.host.querySelectorAll('.iui-rating')];assert.equal(new Set(groups.map(g=>g.querySelector('input').name)).size,3);
 groups[0].querySelector('[value="3"]').click();assert.equal(x.c.getState().score,3);assert.equal(groups[0].querySelector(':checked').value,'3');assert.equal(groups[1].querySelector(':checked').value,'3');assert.equal(groups[2].querySelector(':checked').value,'1');groups[2].querySelector('[value="5"]').click();assert.equal(x.c.getState().score,3);assert.equal(x.c.getState().second,5);x.c.dispose();
});
test('same Document mounts, separate ownerDocuments, atomic update, and stale controls obey lifecycle',()=>{
 const a=setup(),b=setup(),extra=a.dom.window.document.createElement('div');a.dom.window.document.body.append(extra);const other=mount(extra,spec());assert.notEqual(a.inputs[0].name,extra.querySelector('input').name);assert.notEqual(a.inputs[0].id,b.inputs[0].id);assert.equal(a.inputs[0].ownerDocument,a.dom.window.document);
 change(a,2);a.inputs[2].focus();const before=a.host.innerHTML,root=a.host.firstChild;assert.throws(()=>a.c.update(spec({max:1})));assert.equal(a.host.firstChild,root);assert.equal(a.host.innerHTML,before);assert.equal(a.dom.window.document.activeElement,a.inputs[2]);
 a.c.update(spec({}, {score:1}));assert.equal(root.isConnected,false);change(a,4);a.clear.click();assert.equal(a.c.getState().score,1);a.c.dispose();change(a,4);assert.equal(a.host.childElementCount,0);assert.throws(()=>a.c.setState({score:0}),/disposed/);change(b,1);assert.equal(b.c.getState().score,2);b.c.dispose();other.dispose();
});
test('Chinese labels and script-looking literal authored text stay inert',()=>{
 const x=setup(spec({label:'<script>globalThis.bad=1</script>',hint:'<img src=x onerror=alert(1)>'}),'<html lang="zh-CN"><main></main></html>');assert.equal(x.output.value,'尚未评分');assert.equal(x.inputs[2].getAttribute('aria-label'),'3 分，满分 5 分');assert.equal(x.clear.textContent,'清除评分');assert.equal(x.group.querySelectorAll('script,img').length,0);assert.match(x.group.querySelector('legend').textContent,/<script>/);x.c.dispose();
});
test('public evaluateState applies controlled constraints without a DOM',()=>{
 const s=spec({max:3},{score:1,other:0});assert.equal(evaluateState(s,{score:3}).ok,true);for(const score of [-1,3.5,4,false])assert.equal(evaluateState(s,{score,other:2}).ok,false);assert.equal(s.state.other,0);
});
test('offline compiler is deterministic, immutable and executes the real rating controller',async()=>{
 const s=spec(),before=structuredClone(s),html=await compileHtml(s);assert.equal(await compileHtml(s),html);assert.deepEqual(s,before);const dom=new JSDOM(html,{runScripts:'dangerously'});assert.equal(dom.window.document.querySelector('output').value,'Unrated');dom.window.document.querySelector('input[value="4"]').click();assert.equal(dom.window.document.querySelector('output').value,'4 of 5');dom.window.document.querySelector('.iui-rating-clear').click();assert.equal(dom.window.document.querySelector('output').value,'Unrated');assert.equal(dom.window.document.querySelectorAll('script[src],img,iframe').length,0);dom.window.close();await assert.rejects(()=>compileHtml(spec({}, {score:6})));
});
test('all dedicated invalid fixtures fail the public validator',async()=>{
 const cases=JSON.parse(await readFile(new URL('./fixtures/rating-invalid.json',import.meta.url)));for(const item of cases)invalid(item.document,item.code);
});

test('authored IDs cannot alias rating option, output, feedback, or radio namespaces',()=>{
 const fake=['rating-1','rating-1-output','rating-1-feedback','rating-internal-1-1'],s=spec({}, {score:0},[rating(),...fake.map(id=>({type:'text',id,value:id}))]);const x=setup(s);const ids=[...x.host.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);for(const input of x.inputs){assert.ok(input.id.startsWith('iui-rating-internal-'));assert.ok(input.name.startsWith('iui-rating-internal-'));assert.equal(x.dom.window.document.getElementById(input.id),input);}x.c.dispose();
});

test('one accepted change refreshes shared consumers once; repeated selected dispatch never republishes',async()=>{
 const x=setup(spec({}, {score:0},[rating(),{type:'metric',label:'Consumer',value:{$:'score'}}]));const target=x.host.querySelector('.iui-metric-value span');let changes=0;const observer=new x.dom.window.MutationObserver(records=>{changes+=records.length;});observer.observe(target,{childList:true});
 x.inputs[2].click();await Promise.resolve();assert.equal(changes,1);changes=0;x.inputs[2].click();change(x,2);await Promise.resolve();assert.equal(changes,0);x.clear.click();await Promise.resolve();assert.equal(changes,1);changes=0;x.clear.click();await Promise.resolve();assert.equal(changes,0);observer.disconnect();x.c.dispose();
});
