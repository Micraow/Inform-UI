import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,group} from './carousel-harness.mjs';
for(const action of ['update','dispose'])test('late RAF registration ID is compensated after synchronous '+action,()=>{
 const h=setup(),canceled=[];h.win.cancelAnimationFrame=id=>canceled.push(id);h.win.requestAnimationFrame=()=>{action==='update'?h.update([group(0)]):h.dispose();return 909;};
 try{h.c.lifecycle.guard(()=>h.mount(group()))();assert.deepEqual(canceled,[909]);assert.equal(h.c.lifecycle.size,0);}finally{h.dispose();h.dom.window.close();}
});
test('queued frame is coalesced, replacement cancels once, and late callback is inert',()=>{
 const h=setup(),callbacks=new Map(),canceled=[];let next=0;h.win.requestAnimationFrame=fn=>{callbacks.set(++next,fn);return next;};h.win.cancelAnimationFrame=id=>{canceled.push(id);callbacks.delete(id);};
 try{const out=h.mount(group()),rail=out.querySelector('.iui-carousel');for(let i=0;i<5;i++)rail.dispatchEvent(new h.win.Event('scroll'));assert.equal(callbacks.size,1);const late=callbacks.values().next().value;h.update([group(0)]);assert.deepEqual(canceled,[1]);let reads=0;rail.getBoundingClientRect=()=>{reads++;throw Error('retired frame read');};late();assert.equal(reads,0);assert.equal(callbacks.size,0);}finally{h.dispose();h.dom.window.close();}
});
test('completed frames release their child scope instead of accumulating through scroll',()=>{
 const h=setup();try{const out=h.mount(group()),rail=out.querySelector('.iui-carousel');h.flush();const baseline=h.c.lifecycle.size;for(let i=0;i<50;i++){rail.dispatchEvent(new h.win.Event('scroll'));h.flush();assert.equal(h.c.lifecycle.size,baseline);}h.dispose();assert.equal(h.frames.size,0);}finally{h.dispose();h.dom.window.close();}
});
test('RAF registration and callback errors stay observable, release scope, and allow subsequent scheduling',()=>{
 const h=setup(),boom=Error('ordinary RAF registration');const original=h.win.requestAnimationFrame;h.win.requestAnimationFrame=()=>{throw boom;};try{assert.throws(()=>h.c.lifecycle.guard(()=>h.mount(group()))(),e=>e===boom);assert.equal(h.c.lifecycle.size,0);h.update([group(0)]);h.win.requestAnimationFrame=original;const out=h.mount(group()),rail=out.querySelector('.iui-carousel'),rect=rail.getBoundingClientRect;const callbackError=Error('ordinary measurement');rail.getBoundingClientRect=()=>{throw callbackError;};assert.throws(()=>h.flush(),e=>e===callbackError);assert.equal(h.c.lifecycle.size,0);rail.getBoundingClientRect=rect;rail.dispatchEvent(new h.win.Event('scroll'));assert.equal(h.frames.size,1);h.flush();assert.equal(h.c.lifecycle.size,0);}finally{h.dispose();h.dom.window.close();}
});
test('a synchronous host RAF delivery still renders and balances the returned ID',()=>{
 const h=setup(),canceled=[];h.win.requestAnimationFrame=fn=>{fn(0);return 77;};h.win.cancelAnimationFrame=id=>canceled.push(id);try{const out=h.c.lifecycle.guard(()=>h.mount(group()))();assert.ok(out);assert.equal(out.isConnected,true);assert.deepEqual(canceled,[77]);assert.equal(h.c.lifecycle.size,0);}finally{h.dispose();h.dom.window.close();}
});
