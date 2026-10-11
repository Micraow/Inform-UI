import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';

const compiled=await build({entryPoints:['src/renderer/reader-controls.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {readerBlocked}=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
function fixture(html='<button id="control">Act</button>') {
 const dom=new JSDOM(`<!doctype html><main id="root">${html}</main>`),doc=dom.window.document;
 return {dom,root:doc.getElementById('root'),control:doc.getElementById('control')};
}
test('current control aria-disabled blocks both native and custom controls and removal restores eligibility',()=>{
 for(const tag of ['button','div']){const f=fixture(`<${tag} id="control">Act</${tag}>`);try{
  assert.equal(readerBlocked(f.root,f.control,true),false);
  f.control.setAttribute('aria-disabled','true');assert.equal(readerBlocked(f.root,f.control,true),true);
  f.control.setAttribute('aria-disabled','false');assert.equal(readerBlocked(f.root,f.control,true),false);
  f.control.removeAttribute('aria-disabled');assert.equal(readerBlocked(f.root,f.control,true),false);
 }finally{f.dom.window.close();}}
});
test('ancestor aria-disabled does not invent inherited native disabling',()=>{
 const f=fixture('<section aria-disabled="true"><button id="control">Act</button></section>');
 try{assert.equal(readerBlocked(f.root,f.control,true),false);}finally{f.dom.window.close();}
});
test('native disabled remains authoritative even with aria-disabled false',()=>{
 const f=fixture('<button disabled aria-disabled="false" id="control">Act</button>');
 try{assert.equal(readerBlocked(f.root,f.control,true),true);}finally{f.dom.window.close();}
});
test('fieldset first legend exception stays native and explicit aria-disabled still blocks it',()=>{
 const f=fixture('<fieldset disabled><legend><button id="control">First</button></legend><legend><button id="second">Second</button></legend><button id="last">Last</button></fieldset>');
 try{
  assert.equal(readerBlocked(f.root,f.control,true),false);
  assert.equal(readerBlocked(f.root,f.root.querySelector('#second'),true),true);
  assert.equal(readerBlocked(f.root,f.root.querySelector('#last'),true),true);
  f.control.setAttribute('aria-disabled','true');assert.equal(readerBlocked(f.root,f.control,true),true);
 }finally{f.dom.window.close();}
});
test('nested first legends cannot escape an outer disabled fieldset',()=>{
 const f=fixture('<fieldset disabled><legend>First</legend><fieldset disabled><legend><button id="control">Nested</button></legend></fieldset></fieldset>');
 try{assert.equal(readerBlocked(f.root,f.control,true),true);}finally{f.dom.window.close();}
});
test('hidden and inert ancestry still block otherwise enabled controls',()=>{
 for(const attribute of ['hidden','inert']){const f=fixture(`<section ${attribute}><button id="control">Act</button></section>`);try{assert.equal(readerBlocked(f.root,f.control,true),true);}finally{f.dom.window.close();}}
});
test('retired, detached and foreign controls remain blocked',()=>{
 const f=fixture();try{
  assert.equal(readerBlocked(f.root,f.control,false),true);
  f.root.after(f.control);assert.equal(readerBlocked(f.root,f.control,true),true);
  f.control.remove();assert.equal(readerBlocked(f.root,f.control,true),true);
 }finally{f.dom.window.close();}
});
