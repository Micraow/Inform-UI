import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv2020 from 'ajv/dist/2020.js';
import {createSchemaSubset} from '../scripts/schema-subsets.mjs';
import {mount,validateDocument,compileHtml} from '../dist/index.js';
const fixture=JSON.parse(await readFile('examples/carousel.json','utf8'));
const invalid=JSON.parse(await readFile('tests/fixtures/invalid-carousel.json','utf8'));
const doc=body=>({version:'iui/1',state:{count:0},body});
function setup(input=fixture){const dom=new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>',{pretendToBeVisual:true}),host=dom.window.document.getElementById('host');return{dom,host,c:mount(host,input)};}
test('public finite schema preserves empty/single/500 legacy children and Unicode label limits',()=>{
 assert.equal(validateDocument(fixture).ok,true);
 for(const count of [0,1,500])assert.equal(validateDocument(doc([{type:'carousel',children:Array.from({length:count},()=>({type:'text',value:'x'}))}])).ok,true);
 assert.equal(validateDocument(doc([{type:'carousel',label:'😀'.repeat(200),controls:false,children:[]}])).ok,true);
 for(const node of [...invalid,{type:'carousel',label:'😀'.repeat(201),children:[]},{type:'carousel',children:Array.from({length:501},()=>({type:'text',value:'x'}))}])assert.equal(validateDocument(doc([node])).ok,false);
});
test('ordinary child semantic checks cannot be bypassed by carousel parenting',()=>{
 for(const child of [{type:'grid-item',children:[]},{type:'image',src:'javascript:bad()',alt:'x'},{type:'text',value:'a',id:'duplicate'}]){const input=doc([{type:'text',id:'duplicate',value:'x'},{type:'carousel',children:[child]}]);assert.equal(validateDocument(input).ok,false,JSON.stringify(child));}
});
test('public mount preserves identity, draft, timer and scroll on unrelated state, atomically rejects invalid update',()=>{
 const {host,dom,c}=setup(),rail=host.querySelector('.iui-carousel'),input=rail.querySelector('input'),timer=rail.querySelector('[data-iui=timer]');input.value='9';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));input.focus();rail.scrollLeft=43;
 for(let count=1;count<=8;count++)c.setState({count});assert.equal(host.querySelector('.iui-carousel'),rail);assert.equal(rail.querySelector('input'),input);assert.equal(rail.querySelector('[data-iui=timer]'),timer);assert.equal(input.value,'9');assert.equal(dom.window.document.activeElement,input);assert.equal(rail.scrollLeft,43);
 const before=host.innerHTML,state=c.getState();for(const node of invalid){assert.throws(()=>c.update(doc([node])));assert.equal(host.innerHTML,before);assert.deepEqual(c.getState(),state);assert.equal(dom.window.document.activeElement,input);}
 c.update(doc([{type:'carousel',children:[]}]));assert.equal(input.isConnected,false);c.dispose();c.dispose();assert.equal(host.childElementCount,0);
});
test('native surface semantics, empty/single controls, literal label, local language and foreign documents',()=>{
 const a=setup(doc([{type:'carousel',label:'<img src=x>',children:[]}])),b=setup();assert.equal(a.host.querySelector('img'),null);assert.equal(a.host.querySelector('.iui-carousel').getAttribute('role'),'region');assert.equal(a.host.querySelectorAll('button,[tabindex]').length,0);
 b.host.lang='zh-CN';b.c.update(doc([{type:'carousel',children:[{type:'text',value:'一'},{type:'text',value:'二'}]}]));assert.equal(b.host.querySelector('.iui-carousel-previous').textContent,'上一组内容');for(const node of b.host.querySelectorAll('*'))assert.equal(node.ownerDocument,b.dom.window.document);a.c.dispose();assert.equal(b.host.childElementCount>0,true);b.c.dispose();
});
test('public compile is deterministic and self-contained',async()=>{const html=await compileHtml(fixture);assert.equal(await compileHtml(fixture),html);assert.ok(html.includes('connect-src'));assert.ok(html.includes('Original finite collection'));});

test('base subset rejects nested foreign domains and full domain union admits complete examples',async()=>{
 const full=JSON.parse(await readFile('src/schema/iui.schema.json','utf8')),index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));
 const check=groups=>new Ajv2020({strict:true}).compile(createSchemaSubset(full,index.nodeOwners,groups));
 assert.equal(check(['base'])(doc([{type:'carousel',children:[{type:'timer',durationMs:1000}]}])),false);
 assert.equal(check(['base','time'])(doc([{type:'carousel',children:[{type:'timer',durationMs:1000}]}])),true);
 assert.equal(check(['base','forms','time'])(fixture),true);
 const contained=JSON.parse(await readFile('examples/carousel-contained.json','utf8'));assert.equal(validateDocument(contained).ok,true);assert.equal(check(['base','weather','finance','converters'])(contained),true);
});

test('RTL carousel fixture begins with actual Arabic description before its body',async()=>{
 const input=JSON.parse(await readFile('tests/fixtures/carousel-rtl.json','utf8'));
 assert.equal(validateDocument(input).ok,true);const {host,c}=setup(input),root=host.querySelector('.iui-root');
 assert.equal(root.dir,'auto');assert.equal(root.querySelector('.iui-description').textContent,input.description);assert.match(input.description,/^\p{Script=Arabic}/u);c.dispose();
});
