import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import {JSDOM} from 'jsdom';
import {validateDocument,evaluateValue,evaluateState,mount,compileHtml} from '../dist/index.js';
const schema=new Ajv2020({strict:true}).compile(JSON.parse(await readFile('src/schema/iui.schema.json','utf8')));
const doc=value=>({version:'iui/1',body:[{type:'code',value,copy:true,highlight:true,language:'js'}]});
const setup=d=>{const dom=new JSDOM('<div id="host"></div>',{pretendToBeVisual:true}),host=dom.window.document.getElementById('host');return {dom,host,c:mount(host,d)};};
const accepted=['a'.repeat(12000),'😀'.repeat(12000),'😀a'.repeat(6000),'a\u0301'.repeat(6000),'\ud800'.repeat(12000),'\udfff'.repeat(12000)];
const rejected=['a'.repeat(12001),'😀'.repeat(12001),'😀'.repeat(12000)+'a','a\u0301'.repeat(6000)+'a','\ud800'.repeat(12001)];

test('public schema, validator, evaluator and rendered code agree at Unicode code-point maxima',()=>{
 for(const value of accepted){const d=doc(value);assert.equal(schema(d),true);const checked=validateDocument(d);assert.equal(checked.ok,true,JSON.stringify(checked.issues));assert.equal(evaluateValue(value),value);const {host,c}=setup(d);assert.equal(host.querySelector('pre code').textContent,value);c.dispose();}
 for(const value of rejected){const d=doc(value);assert.equal(schema(d),false);assert.equal(validateDocument(d).ok,false);assert.throws(()=>evaluateValue(value),error=>error.code==='TEXT_LIMIT');assert.throws(()=>setup(d));}
});

test('literal, referenced, computed, rich-text and table Value strings share the same code-point contract',()=>{
 const value='😀'.repeat(12000),d={version:'iui/1',state:{sample:value},computed:{echo:{$:'sample'}},body:[{type:'text',value},{type:'text',value:{$:'sample'}},{type:'text',runs:[{value:{$:'echo'},code:true}]},{type:'table',columns:['Value'],rows:[[{value:{$:'echo'}}]]}]};
 assert.equal(validateDocument(d).ok,true);assert.equal(evaluateState(d).ok,true);const {host,c}=setup(d);assert.equal(host.querySelector('td').textContent,value);assert.ok(host.textContent.includes(value));c.dispose();
 const next={...d,state:{sample:value+'a'}};assert.equal(schema(next),false);assert.equal(validateDocument(next).ok,false);
});

test('host state Unicode boundary is consistent and rejection preserves state, DOM, focus and selection',()=>{
 const d={version:'iui/1',state:{sample:'start'},computed:{echo:{$:'sample'}},body:[{type:'input',kind:'text',label:'Text',bind:'sample'},{type:'text',value:{$:'echo'}}]},value='😀'.repeat(12000);
 assert.equal(evaluateState(d,{sample:value}).ok,true);assert.equal(evaluateState(d,{sample:value+'a'}).ok,false);
 const {dom,host,c}=setup(d),input=host.querySelector('input'),root=host.firstElementChild;input.focus();c.setState({sample:value});input.setSelectionRange(2,6);const before=host.innerHTML;
 assert.throws(()=>c.setState({sample:value+'a'}));assert.equal(c.getState().sample,value);assert.equal(host.firstElementChild,root);assert.equal(host.innerHTML,before);assert.equal(dom.window.document.activeElement,input);assert.equal(input.selectionStart,2);assert.equal(input.selectionEnd,6);c.dispose();
});

test('all literal descriptive and short-label schema lengths remain code-point based',()=>{
 const value='😀'.repeat(12000),d={version:'iui/1',title:value,description:value,body:[{type:'caption',value},{type:'loading-block',label:'😀'.repeat(200),animate:false}]};
 assert.equal(schema(d),true);assert.equal(validateDocument(d).ok,true);const {host,c}=setup(d);assert.equal(host.querySelector('.iui-description').textContent,value);assert.equal(host.querySelector('.iui-loading-block-label').textContent,'😀'.repeat(200));c.dispose();
});

test('native form maxlength remains its explicit UTF-16 field constraint, separate from valid host state',()=>{
 const d={version:'iui/1',state:{sample:'😀😀'},body:[{type:'form',label:'Native field',children:[{type:'input',kind:'text',label:'Text',bind:'sample',maxLength:4}]}]};
 const {dom,host,c}=setup(d),input=host.querySelector('input'),form=host.querySelector('form');c.setState({sample:'😀😀😀'});assert.equal(c.getState().sample,'😀😀😀');form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(input.getAttribute('aria-invalid'),'true');assert.equal(form.dataset.status,'invalid');c.dispose();
});

test('whole-document storage budget stays two million UTF-16 units and merged patches cannot bypass it',()=>{
 const large={version:'iui/1',body:[{type:'col',children:Array.from({length:90},()=>({type:'text',value:'😀'.repeat(12000)}))}]};
 assert.equal(schema(large),true);let checked=validateDocument(large);assert.equal(checked.ok,false);assert.equal(checked.issues[0].code,'TEXT_LIMIT');
 const d={version:'iui/1',state:{a:'',b:''},body:[{type:'col',children:Array.from({length:164},()=>({type:'text',value:'a'.repeat(12000)}))},{type:'text',value:{$:'a'}},{type:'text',value:{$:'b'}}]};
 checked=validateDocument(d);assert.equal(checked.ok,true,JSON.stringify(checked.issues));
 const first=evaluateState(checked.document,{a:'😀'.repeat(12000)});assert.equal(first.ok,true);
 const second=evaluateState(checked.document,{a:'😀'.repeat(12000),b:'😀'.repeat(12000)});assert.equal(second.ok,false);assert.equal(second.issues[0].code,'TEXT_LIMIT');assert.equal(second.issues[0].path,'/state');
});

test('maximum Unicode code compiles deterministically through the public compiler',async()=>{
 const d=doc('😀'.repeat(12000)),before=structuredClone(d),first=await compileHtml(d);assert.equal(await compileHtml(d),first);assert.deepEqual(d,before);assert.ok(first.includes('😀'.repeat(100)));
});

test('resolved state/computed text budget rejects before mount and remains atomic on updates',()=>{
 const make=count=>({version:'iui/1',state:Object.fromEntries(Array.from({length:count},(_,i)=>['s'+i,'😀'.repeat(12000)])),computed:Object.fromEntries(Array.from({length:count},(_,i)=>['c'+i,{$:'s'+i}])),body:[{type:'text',value:{$:'c0'}}]});
 const within=make(40);assert.equal(schema(within),true);assert.equal(validateDocument(within).ok,true);const small=setup(within);assert.equal(small.host.querySelector('.iui-text').textContent,'😀'.repeat(12000));small.c.dispose();
 const beyond=make(80);assert.equal(schema(beyond),true);const check=validateDocument(beyond);assert.equal(check.ok,false);assert.ok(check.issues.some(i=>i.code==='TEXT_LIMIT'&&i.path==='/computed'));assert.throws(()=>setup(beyond),error=>error.name==='InvalidDocumentError');
 const initial={...beyond,state:Object.fromEntries(Object.keys(beyond.state).map(k=>[k,'start']))},kept=setup(initial),root=kept.host.firstElementChild,before=kept.host.innerHTML;
 assert.throws(()=>kept.c.setState(beyond.state),error=>error.name==='InvalidDocumentError');assert.deepEqual(kept.c.getState(),initial.state);assert.equal(kept.host.firstElementChild,root);assert.equal(kept.host.innerHTML,before);kept.c.dispose();
});
