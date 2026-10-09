// PREPARED, NOT RUN: copy to repository tests/ only after canonical integration.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {validateDocument,mount,compileHtml} from '../dist/index.js';
const fixture=JSON.parse(await readFile(new URL('../examples/code.json',import.meta.url),'utf8'));
const doc=body=>({version:'iui/1',body});
const code=changes=>({type:'code',value:'literal',...changes});
const host=()=>new JSDOM('<div id="host"></div>',{pretendToBeVisual:true}).window.document.getElementById('host');
test('existing code flags validate only literal optional booleans; inline cannot enable them',()=>{
 for(const inline of [undefined,false,true])for(const copy of [undefined,false,true])for(const highlight of [undefined,false,true]){
  const n=code({...(inline===undefined?{}:{inline}),...(copy===undefined?{}:{copy}),...(highlight===undefined?{}:{highlight})});
  assert.equal(validateDocument(doc([n])).ok,!(inline===true&&(copy===true||highlight===true)),JSON.stringify(n));
 }
 for(const key of ['copy','highlight'])for(const value of ['true',1,null,{$:'count'}])assert.equal(validateDocument(doc([code({[key]:value})])).ok,false);
 assert.equal(validateDocument(fixture).ok,true);
});
test('literal value/string and original language/code bounds stay unchanged',()=>{
 for(const value of ['', 'a'.repeat(12000),'😀'.repeat(12000),'\r\n\t\u202e<script>'])assert.equal(validateDocument(doc([code({value,copy:true,highlight:true})])).ok,true);
 for(const value of ['a'.repeat(12001),'😀'.repeat(12001),{$:'count'},42])assert.equal(validateDocument(doc([code({value})])).ok,false);
 for(const language of ['','a'.repeat(201),true])assert.equal(validateDocument(doc([code({language})])).ok,false);
 assert.equal(validateDocument(doc([code({language:'x'.repeat(200)})])).ok,true);
 for(const field of ['execute','theme','clipboard','html','lexer'])assert.equal(validateDocument(doc([code({[field]:true})])).ok,false);
});
test('public mount preserves exact code and selector contract; state updates keep DOM/focus',()=>{
 const el=host(),c=mount(el,fixture),node=fixture.body.find(n=>n.id==='main-code'),out=el.querySelector('[id$="-main-code"]'),pre=out.querySelector('pre'),b=out.querySelector('button');
 assert.equal(out.dataset.iui,'code');assert.equal(out.className,'iui-code-block');assert.equal(pre.className,'iui-code');assert.equal(pre.querySelector('code').textContent,node.value);
 b.focus();c.setState({count:1});assert.equal(out.querySelector('pre'),pre);assert.equal(el.ownerDocument.activeElement,b);
 assert.equal(out.querySelector('[role=status]').textContent,'');assert.equal(el.querySelectorAll('script,img').length,0);c.dispose();
});
test('invalid public update is atomic; valid update/dispose retire the old DOM',()=>{
 const el=host(),c=mount(el,fixture),old=el.firstElementChild,b=el.querySelector('button');b.focus();
 assert.throws(()=>c.update(doc([code({inline:true,copy:true})])));assert.equal(el.firstElementChild,old);assert.equal(el.ownerDocument.activeElement,b);
 c.update(doc([code({value:'replacement',copy:true})]));assert.equal(old.isConnected,false);assert.equal(el.querySelector('code').textContent,'replacement');
 c.dispose();c.dispose();assert.equal(el.childElementCount,0);
});
test('public compiler emits self-contained escaped literal script-looking code',async()=>{
 const value='</script><img src="https://evil.invalid/pixel" onerror="bad()">\r\n\t😀',spec=doc([code({value,language:'<script>',copy:true,highlight:true})]);
 const html=await compileHtml(spec);assert.ok(html.includes('\\u003c/script\\u003e'));assert.ok(!html.includes('<img src="https://evil.invalid/pixel"'));
});
