import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{inspectOwnedQueues}from'../scripts/check-owned-queues.mjs';
const path='src/renderer/queue-gate-fixture.ts';
test('AST follows direct, computed, destructured, bound and transitive queue aliases, and rejects wrapper escape',()=>{
 const text=`import type {RendererContext} from './context.js';
 declare const c:RendererContext;
 const q=queueMicrotask; q(()=>{});
 const again=q; again(()=>{});
 const {queueMicrotask:schedule}=globalThis; schedule(()=>{});
 const bound=globalThis.queueMicrotask.bind(globalThis); bound(()=>{});
 globalThis['queueMicrotask'](()=>{});
 queueMicrotask.call(globalThis,()=>{});
 queueMicrotask.apply(globalThis,[()=>{}]);
 const wrapper=(callback:()=>void)=>queueMicrotask(callback);
 queueMicrotask(c.lifecycle.guard(()=>{}));
 const guarded=c.lifecycle.guard; queueMicrotask(guarded(()=>{}));
 const fake={guard:(callback:()=>void)=>callback};queueMicrotask(fake.guard(()=>{}));
 function ordinary(queueMicrotask:(callback:()=>void)=>void){queueMicrotask(()=>{});}
 `;
 const result=inspectOwnedQueues({files:[path],overrides:{[path]:text}});assert.equal(result.sites.length,11);assert.equal(result.findings.length,9);assert.deepEqual(result.findings.map(x=>x.line),[3,4,5,6,7,8,9,10,13]);assert.ok(result.findings.every(x=>x.path===path&&x.column>0));
});
test('exact documented exception accepts only its canonical syntax and stale entries fail',()=>{
 const text='queueMicrotask(()=>{try{reconcile();}finally{settled();}});',options={files:[path],overrides:{[path]:text}};
 const before=inspectOwnedQueues(options);assert.equal(before.findings.length,1);const exception={path,fingerprint:before.sites[0].fingerprint,reason:'Fixture: explicit reviewed outer cleanup.'};assert.equal(inspectOwnedQueues({...options,exceptions:[exception]}).findings.length,0);
 const changed=inspectOwnedQueues({...options,overrides:{[path]:text.replace('reconcile()','other()')},exceptions:[exception]});assert.equal(changed.findings.length,2);assert.ok(changed.findings.some(x=>x.message.startsWith('Unused')));
});
test('non-renderer tools are excluded rather than accidentally policed by the component rule',()=>{const file='scripts/ordinary-tool.ts';const result=inspectOwnedQueues({files:[file],overrides:{[file]:'queueMicrotask(()=>{});'}});assert.equal(result.files,0);assert.equal(result.findings.length,0);});
test('all renderer entry points satisfy the gate with exactly the shared reset exception',()=>{const exceptions=JSON.parse(readFileSync(new URL('../scripts/owned-queue-exceptions.json',import.meta.url),'utf8'));assert.equal(exceptions.length,1);assert.equal(exceptions[0].path,'src/renderer/reader-controls.ts');const result=inspectOwnedQueues({exceptions});assert.deepEqual(result.findings,[]);assert.ok(result.sites.length>=13);});
