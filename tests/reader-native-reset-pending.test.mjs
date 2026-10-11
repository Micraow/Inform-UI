import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {JSDOM} from 'jsdom';
const bundle=path=>import('data:text/javascript;base64,'+Buffer.from(buildSync({entryPoints:[new URL(path,import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'}).outputFiles[0].text).toString('base64'));
const {readerNativeReset}=await bundle('../src/renderer/reader-controls.ts');
const {renderGeneration}=await bundle('../src/renderer/generation.ts');
function setup({shadow=false,reset=()=>{},restore=()=>{}}={}){
 const dom=new JSDOM('<div></div><form id="other"></form>'),doc=dom.window.document,target=shadow?doc.querySelector('div').attachShadow({mode:'open'}):doc.querySelector('div');
 target.innerHTML='<form><section><input></section></form>';
 const form=target.querySelector('form'),root=form.querySelector('section'),input=root.querySelector('input');let revision=0;
 const life=renderGeneration(()=>true),context={doc,lifecycle:life,bind(fn){fn();return()=>{};}};
 const pending=readerNativeReset(context,root,[input],()=>revision,restore,reset);
 return{dom,doc,form,root,input,life,pending,edit(){revision++;},close(){life.dispose();dom.window.close();}};
}
function tasks(work){const original=globalThis.queueMicrotask,queue=[];globalThis.queueMicrotask=fn=>queue.push(fn);try{return work(queue);}finally{globalThis.queueMicrotask=original;}}
for(const shadow of [false,true])test(`pending query covers matching ${shadow?'shadow':'document'} reset propagation and reconciliation`,()=>tasks(queue=>{
 let applied=0;const x=setup({shadow,reset(){assert.equal(x.pending(),true);applied++;}});try{
  assert.equal(typeof x.pending,'function');assert.equal(x.pending(),false);
  x.form.addEventListener('reset',()=>assert.equal(x.pending(),true));x.form.reset();assert.equal(x.pending(),true);assert.equal(queue.length,1);
  queue.shift()();assert.equal(applied,1);assert.equal(x.pending(),false);
 }finally{x.close();}
}));
for(const kind of ['canceled','newer-input'])test(`pending ${kind} reset restores rather than confirming stale state`,()=>tasks(queue=>{
 let applied=0,restored=0;const x=setup({reset(){applied++;},restore(){assert.equal(x.pending(),true);restored++;}});try{
  assert.equal(typeof x.pending,'function');x.form.addEventListener('reset',e=>kind==='canceled'?e.preventDefault():x.edit());x.form.reset();assert.equal(x.pending(),true);
  queue.shift()();assert.equal(applied,0);assert.equal(restored,1);assert.equal(x.pending(),false);
 }finally{x.close();}
}));
test('unrelated form reset does not block local review',()=>tasks(queue=>{
 const x=setup();try{assert.equal(typeof x.pending,'function');x.doc.querySelector('#other').reset();assert.equal(queue.length,0);assert.equal(x.pending(),false);}finally{x.close();}
}));
test('two queued resets remain pending until each matching job settles',()=>tasks(queue=>{
 let applied=0;const x=setup({reset(){applied++;}});try{
  assert.equal(typeof x.pending,'function');x.form.reset();x.form.reset();assert.equal(queue.length,2);queue.shift()();assert.equal(x.pending(),true);queue.shift()();assert.equal(x.pending(),false);assert.equal(applied,2);
 }finally{x.close();}
}));
test('retirement cancels pending status immediately and later queued jobs stay inert',()=>tasks(queue=>{
 let callbacks=0;const x=setup({reset(){callbacks++;},restore(){callbacks++;}});try{
  assert.equal(typeof x.pending,'function');x.form.reset();assert.equal(x.pending(),true);x.life.dispose();assert.equal(x.pending(),false);
  queue.shift()();assert.equal(x.pending(),false);assert.equal(callbacks,0);assert.equal(x.life.size,0);
 }finally{x.close();}
}));
test('ordinary reconciliation errors propagate and always clear pending status',()=>tasks(queue=>{
 const failure=new Error('ordinary reset failure'),x=setup({reset(){throw failure;}});try{
  assert.equal(typeof x.pending,'function');x.form.reset();assert.throws(()=>queue.shift()(),e=>e===failure);assert.equal(x.pending(),false);
 }finally{x.close();}
}));
test('a reset queued during reconciliation remains pending after the older job finishes',()=>tasks(queue=>{
 let applied=0;const x=setup({reset(){if(++applied===1)x.form.reset();}});try{
  assert.equal(typeof x.pending,'function');x.form.reset();queue.shift()();assert.equal(x.pending(),true);assert.equal(queue.length,1);queue.shift()();assert.equal(x.pending(),false);assert.equal(applied,2);
 }finally{x.close();}
}));
test('completed reset jobs release their generation registrations rather than accumulating',()=>tasks(queue=>{
 const dom=new JSDOM('<form><section><input></section></form>'),doc=dom.window.document,root=doc.querySelector('section'),form=doc.querySelector('form'),life=renderGeneration(()=>true),fork=life.fork;let child;
 life.fork=(...args)=>(child=fork(...args));const context={doc,lifecycle:life,bind(fn){fn();return()=>{};}},pending=readerNativeReset(context,root,[root.querySelector('input')],()=>0,()=>{},()=>{});
 try{assert.equal(typeof pending,'function');const baseline=child.size;for(let i=0;i<100;i++){form.reset();assert.equal(pending(),true);queue.shift()();assert.equal(pending(),false);assert.equal(child.size,baseline);}life.dispose();assert.equal(child.size,0);}finally{life.dispose();dom.window.close();}
}));
