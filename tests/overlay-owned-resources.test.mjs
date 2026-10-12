import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,popover,tooltip,parts} from './overlay-harness.mjs';
for(const action of ['update','dispose']){
 test(`overlay compensates a frame returned after ${action}`,()=>{
  const h=setup({native:true}),p=parts(h.mount(popover()));p.trigger.click();
  const canceled=[];h.win.cancelAnimationFrame=id=>canceled.push(id);
  h.win.requestAnimationFrame=()=>{action==='update'?h.update([]):h.dispose();return 909;};
  h.setState({unrelated:1});assert.deepEqual(canceled,[909]);assert.equal(p.surface.isConnected,false);h.dispose();
 });
 test(`overlay disconnects an observer returned after ${action}`,()=>{
  const h=setup({native:true});let active=0,observed=0;
  h.win.ResizeObserver=class{constructor(){active++;action==='update'?h.update([]):h.dispose();}observe(){observed++;}disconnect(){active--;}};
  const p=parts(h.mount(popover()));p.trigger.click();assert.equal(active,0);assert.equal(observed,0);assert.equal(p.surface.isConnected,false);h.dispose();
 });
}
test('tooltip compensates a leave timer returned after disposal',()=>{
 const h=setup(),p=parts(h.mount(tooltip()));h.event(p.trigger,'pointerenter',{pointerType:'mouse'});
 const cleared=[];h.win.clearTimeout=id=>cleared.push(id);h.win.setTimeout=()=>{h.dispose();return 919;};
 h.event(p.trigger,'pointerleave');assert.deepEqual(cleared,[919]);
});
test('observer observe registration completed after disposal is compensated',()=>{
 const h=setup({native:true});const targets=new Set();let calls=0;
 h.win.ResizeObserver=class{observe(target){if(!calls++)h.dispose();targets.add(target);}disconnect(){targets.clear();}};
 const p=parts(h.mount(popover()));p.trigger.click();assert.equal(calls,1);assert.equal(targets.size,0);
});
test('synchronously delivered frames are released and do not block later positioning',()=>{
 const h=setup({native:true}),p=parts(h.mount(popover()));p.trigger.click();const canceled=[];let requested=0;
 h.win.requestAnimationFrame=callback=>{requested++;callback(0);return 900+requested;};h.win.cancelAnimationFrame=id=>canceled.push(id);
 h.setState({count:1});h.setState({count:2});assert.equal(requested,2);assert.deepEqual(canceled,[901,902]);h.dispose();
});
test('repeated opening and closing releases component resource scopes',()=>{
 const h=setup({native:true}),p=parts(h.mount(popover()));const baseline=h.context.lifecycle.size;
 for(let i=0;i<20;i++){p.trigger.click();h.setState({count:i});p.close.click();assert.equal(h.context.lifecycle.size,baseline);assert.equal(h.metrics.observers,0);}
 h.dispose();
});
