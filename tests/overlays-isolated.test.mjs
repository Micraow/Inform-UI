import test from 'node:test'; import assert from 'node:assert/strict';
import {setup,tooltip,popover,parts,pause} from './overlay-harness.mjs';

test('tooltip is inert text, has a native visible trigger and stable description relationship',()=>{
  const h=setup(), node=tooltip('<img src=x onerror=bad()>','<script>bad()</script> & original'), original=structuredClone(node), p=parts(h.mount(node));
  assert.equal(p.trigger.tagName,'BUTTON'); assert.equal(p.trigger.type,'button'); assert.equal(p.trigger.textContent,node.label);
  assert.equal(p.trigger.getAttribute('aria-describedby'),p.surface.id); assert.equal(p.surface.getAttribute('role'),'tooltip');
  assert.equal(p.surface.textContent,node.value); assert.equal(p.surface.hidden,true); assert.equal(p.surface.hasAttribute('inert'),true);
  assert.equal(h.root.querySelector('script,img,a,input'),null); assert.equal(p.surface.tabIndex,-1); assert.deepEqual(node,original); h.dispose();
});
test('unsupported native API uses explicit in-flow fallback with the same dismissal semantics',()=>{
  const h=setup(),p=parts(h.mount(popover())); assert.equal(p.surface.dataset.positioning,'inline'); assert.equal(p.surface.hasAttribute('popover'),false);
  p.trigger.click(); assert.equal(p.surface.hidden,false); assert.equal(h.doc.activeElement,p.close); assert.equal(p.surface.style.position,'');
  p.close.click(); assert.equal(p.surface.hidden,true); assert.equal(h.doc.activeElement,p.trigger); h.dispose();
});
test('tooltip focus and Escape preserve trigger focus without immediate re-opening',async()=>{
  const h=setup(),p=parts(h.mount(tooltip())); p.trigger.focus(); assert.equal(p.surface.hidden,false); assert.equal(h.doc.activeElement,p.trigger);
  const escaped=h.event(p.trigger,'keydown',{key:'Escape'});assert.equal(escaped.defaultPrevented,true);assert.equal(p.surface.hidden,true);
  h.setState({unrelated:1});assert.equal(p.surface.hidden,true);p.trigger.blur();await pause(130);p.trigger.focus();assert.equal(p.surface.hidden,false);
  p.trigger.blur();await pause(140);assert.equal(p.surface.hidden,true);h.dispose();
});
test('tooltip pointer may cross the gap and remain over its content before leaving',async()=>{
  const h=setup(),p=parts(h.mount(tooltip()));h.event(p.trigger,'pointerenter',{pointerType:'mouse'});assert.equal(p.surface.hidden,false);
  h.event(p.trigger,'pointerleave');await pause(25);h.event(p.surface,'pointerenter');await pause(130);assert.equal(p.surface.hidden,false);
  h.event(p.surface,'pointerleave');await pause(140);assert.equal(p.surface.hidden,true);h.dispose();
});
test('touch pointer focus click sequence opens exactly once, second activation closes',()=>{
  const h=setup(),p=parts(h.mount(tooltip()));h.event(p.trigger,'pointerenter',{pointerType:'touch'});assert.equal(p.surface.hidden,true);
  h.event(p.trigger,'pointerdown',{pointerType:'touch',pointerId:1});p.trigger.focus();assert.equal(p.surface.hidden,false);h.event(p.trigger,'pointerup',{pointerType:'touch',pointerId:1});h.event(p.trigger,'click',{pointerType:'touch',pointerId:1,detail:1});assert.equal(p.surface.hidden,false);
  h.event(p.trigger,'pointerdown',{pointerType:'touch',pointerId:2});h.event(p.trigger,'pointerup',{pointerType:'touch',pointerId:2});h.event(p.trigger,'click',{pointerType:'touch',pointerId:2,detail:1});assert.equal(p.surface.hidden,true);h.dispose();
});
test('tooltip native keyboard click activation toggles without a custom keydown handler',()=>{
  const h=setup(),p=parts(h.mount(tooltip()));p.trigger.focus();p.trigger.click();assert.equal(p.surface.hidden,true);p.trigger.click();assert.equal(p.surface.hidden,false);h.dispose();
});
test('popover dialog is nonmodal, labeled, controls/expanded link is stable, Close restores focus',()=>{
  const h=setup(),p=parts(h.mount({...popover(),title:'Details title'}));
  assert.equal(p.trigger.getAttribute('aria-controls'),p.surface.id);assert.equal(p.trigger.getAttribute('aria-haspopup'),'dialog');assert.equal(p.trigger.getAttribute('aria-expanded'),'false');
  assert.equal(p.surface.getAttribute('role'),'dialog');assert.equal(p.surface.hasAttribute('aria-modal'),false);assert.equal(h.doc.getElementById(p.surface.getAttribute('aria-labelledby')).textContent,'Details title');
  p.trigger.click();assert.equal(p.trigger.getAttribute('aria-expanded'),'true');assert.equal(h.doc.activeElement,p.close);
  p.close.click();assert.equal(p.trigger.getAttribute('aria-expanded'),'false');assert.equal(p.surface.hidden,true);assert.equal(h.doc.activeElement,p.trigger);h.dispose();
});
test('Chinese close labels are explicit and unnamed-title dialog uses its trigger label',()=>{
  const h=setup({lang:'zh-CN'}),p=parts(h.mount(popover('展开说明')));assert.equal(p.close.textContent,'关闭');assert.equal(p.surface.getAttribute('aria-labelledby'),p.trigger.id);h.dispose();
});
test('outside pointer dismissal never restores focus instead of the clicked external control',()=>{
  const h=setup(),p=parts(h.mount(popover()));const outside=h.doc.createElement('button');outside.textContent='Outside';h.doc.body.append(outside);
  p.trigger.click();h.event(outside,'pointerdown');outside.focus();outside.click();assert.equal(p.surface.hidden,true);assert.equal(h.doc.activeElement,outside);h.dispose();
});
test('focus can leave a nonmodal branch, closes without trapping or restoring focus',()=>{
  const h=setup(),p=parts(h.mount(popover()));const outside=h.doc.createElement('button');h.doc.body.append(outside);p.trigger.click();outside.focus();assert.equal(p.surface.hidden,true);assert.equal(h.doc.activeElement,outside);h.dispose();
});
test('rapid repeated toggles do not duplicate surfaces or stale open state',()=>{
  const h=setup({native:true}),p=parts(h.mount(popover()));for(let i=0;i<100;i++)p.trigger.click();assert.equal(p.surface.hidden,true);assert.equal(h.root.querySelectorAll('.iui-overlay-surface').length,1);assert.equal(h.metrics.observers,0);assert.equal(h.metrics.shows,50);h.dispose();
});
test('sibling popovers close the previous branch; unrelated state keeps open children and focus',()=>{
  const h=setup({native:true}),a=parts(h.mount(popover('A'))),b=parts(h.mount(popover('B',[{type:'input',bind:'text',label:'Draft'},{type:'text',value:{$:'count'}}])));
  a.trigger.click();b.trigger.click();assert.equal(a.surface.hidden,true);assert.equal(b.surface.hidden,false);
  const input=b.surface.querySelector('input');input.focus();input.setSelectionRange(1,3);h.setState({unrelated:99,count:7});
  assert.equal(b.surface.querySelector('input'),input);assert.equal(h.doc.activeElement,input);assert.equal(input.selectionStart,1);assert.equal(input.selectionEnd,3);assert.equal(b.surface.querySelector('.iui-popover-body p').textContent,'7');assert.equal(b.surface.hidden,false);h.dispose();
});
test('nested popover Escape dismisses inner only, next Escape dismisses ancestor',()=>{
  const h=setup({native:true}),outer=h.mount(popover('Outer',[popover('Inner')])),a=parts(outer),b=parts(outer.querySelector('.iui-popover-body > .iui-overlay'));
  a.trigger.click();b.trigger.click();assert.equal(a.surface.hidden,false);assert.equal(b.surface.hidden,false);assert.equal(h.doc.activeElement,b.close);
  h.event(b.close,'keydown',{key:'Escape'});assert.equal(a.surface.hidden,false);assert.equal(b.surface.hidden,true);assert.equal(h.doc.activeElement,b.trigger);
  h.event(b.trigger,'keydown',{key:'Escape'});assert.equal(a.surface.hidden,true);assert.equal(h.doc.activeElement,a.trigger);assert.equal(h.metrics.observers,0);h.dispose();
});
test('ancestor close recursively removes child surface state without restoring hidden-child focus',()=>{
  const h=setup({native:true}),outer=h.mount(popover('Outer',[popover('Inner')])),a=parts(outer),b=parts(outer.querySelector('.iui-popover-body > .iui-overlay'));
  a.trigger.click();b.trigger.click();a.close.click();assert.equal(a.surface.hidden,true);assert.equal(b.surface.hidden,true);assert.equal(h.doc.activeElement,a.trigger);
  a.trigger.click();assert.equal(b.surface.hidden,true);h.dispose();
});
test('pointer inside an ancestor dismisses its descendant and preserves the ancestor',()=>{
  const h=setup(),outer=h.mount(popover('Outer',[popover('Inner')])),a=parts(outer),b=parts(outer.querySelector('.iui-popover-body > .iui-overlay'));
  a.trigger.click();b.trigger.click();h.event(a.surface,'pointerdown');assert.equal(a.surface.hidden,false);assert.equal(b.surface.hidden,true);h.dispose();
});
test('nested tooltip Escape closes tooltip first without closing enclosing dialog',()=>{
  const h=setup(),outer=h.mount(popover('Outer',[tooltip('Nested help')])),a=parts(outer),b=parts(outer.querySelector('.iui-popover-body > .iui-overlay'));
  a.trigger.click();b.trigger.focus();assert.equal(b.surface.hidden,false);h.event(b.trigger,'keydown',{key:'Escape'});assert.equal(a.surface.hidden,false);assert.equal(b.surface.hidden,true);h.dispose();
});
test('multiple mounts share document coordination but retain host ownership, and separate documents are independent',()=>{
  const a=setup(),b=setup({dom:a.dom,prefix:'iui-test-2-',theme:'dark',lang:'zh'}),c=setup({prefix:'iui-otherdoc-'});
  const pa=parts(a.mount(popover('A'))),pb=parts(b.mount(popover('B'))),pc=parts(c.mount(popover('C')));pa.trigger.click();pb.trigger.click();pc.trigger.click();
  assert.equal(pa.surface.hidden,true);assert.equal(pb.surface.hidden,false);assert.equal(pc.surface.hidden,false);assert.equal(pb.surface.closest('.iui-root'),b.root);assert.equal(pb.close.textContent,'关闭');
  b.event(pb.close,'keydown',{key:'Escape'});assert.equal(pb.surface.hidden,true);assert.equal(pc.surface.hidden,false);a.dispose();b.dispose();c.dispose();
});
test('update/dispose closes open native surfaces and cleans old controls, observers and global listeners',()=>{
  const h=setup({native:true}),counts=new Map();const originalAdd=h.doc.addEventListener.bind(h.doc),originalRemove=h.doc.removeEventListener.bind(h.doc);
  h.doc.addEventListener=(name,fn,opts)=>{if(['keydown','pointerdown','scroll'].includes(name))counts.set(name,(counts.get(name)??0)+1);originalAdd(name,fn,opts);};
  h.doc.removeEventListener=(name,fn,opts)=>{if(['keydown','pointerdown','scroll'].includes(name))counts.set(name,(counts.get(name)??0)-1);originalRemove(name,fn,opts);};
  const p=parts(h.mount(popover()));p.trigger.click();assert.equal(h.metrics.observers,1);const id=p.surface.id;h.update([popover('Replacement')]);
  assert.equal(p.surface.hidden,true);assert.equal(p.surface.isConnected,false);assert.equal(h.metrics.observers,0);p.trigger.click();assert.equal(p.surface.hidden,true);
  const q=parts(h.root.firstElementChild);assert.notEqual(q.surface.id,id);q.trigger.click();h.dispose();h.dispose();assert.equal(q.surface.isConnected,false);assert.equal(h.metrics.observers,0);assert.equal(counts.get('keydown'),0);assert.equal(counts.get('pointerdown'),0);assert.equal(counts.get('scroll'),0);
});
test('detached or hidden anchors clean top-layer content rather than leave orphaned surfaces',async()=>{
  const h=setup({native:true}),el=h.mount(popover()),p=parts(el);p.trigger.click();el.remove();await pause();assert.equal(p.surface.hidden,true);assert.equal(h.metrics.observers,0);
  h.root.append(el);p.trigger.click();h.host.hidden=true;await pause();assert.equal(p.surface.hidden,true);h.dispose();
});
test('native canceled/failed show stays closed and safe',()=>{
  const h=setup({native:true}),p=parts(h.mount(popover()));p.surface.showPopover=()=>{};p.trigger.click();assert.equal(p.surface.hidden,true);assert.equal(p.trigger.getAttribute('aria-expanded'),'false');
  p.surface.showPopover=()=>{throw new Error('platform blocked');};p.trigger.click();assert.equal(p.surface.hidden,true);assert.equal(h.metrics.observers,0);h.dispose();
});
test('native external hide synchronizes state and cleanup',()=>{
  const h=setup({native:true}),p=parts(h.mount(popover()));p.trigger.click();p.surface.hidePopover();assert.equal(p.surface.hidden,true);assert.equal(p.trigger.getAttribute('aria-expanded'),'false');assert.equal(h.metrics.observers,0);h.dispose();
});
test('IDs avoid arbitrary user IDs and stay unique across nested nodes, mounts and updates',()=>{
  const h=setup(),items=[tooltip('A'),{...popover('B'),id:'overlay-1-surface'},{...popover('C'),id:'overlay-internal-iui-test-1-1-surface'}];items.forEach(n=>h.mount(n));
  const ids=[...h.root.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);assert.ok(parts(h.root.firstElementChild).surface.id.startsWith('iui-overlay-internal-'));
  const first=ids[0];h.update(items);assert.notEqual(h.root.querySelector('[id]').id,first);h.dispose();
});
test('prevented Escape and composing keyboard input are not intercepted',()=>{
  const h=setup(),p=parts(h.mount(popover()));p.trigger.click();h.event(p.close,'keydown',{key:'Escape',isComposing:true});assert.equal(p.surface.hidden,false);
  p.close.addEventListener('keydown',e=>e.preventDefault());h.event(p.close,'keydown',{key:'Escape'});assert.equal(p.surface.hidden,false);h.dispose();
});
test('Escape on a hover-only tooltip does not steal focus from an unrelated control',()=>{
  const h=setup(),p=parts(h.mount(tooltip())),outside=h.doc.createElement('input');h.doc.body.append(outside);outside.focus();h.event(p.trigger,'pointerenter',{pointerType:'mouse'});assert.equal(p.surface.hidden,false);
  h.event(outside,'keydown',{key:'Escape'});assert.equal(p.surface.hidden,true);assert.equal(h.doc.activeElement,outside);h.dispose();
});
test('tooltip caps native width for readability and scroll/resize retain or deliberately close positioning',async()=>{
  const h=setup({native:true}),p=parts(h.mount(tooltip()));p.trigger.focus();assert.equal(p.surface.style.maxWidth,'320px');assert.equal(p.surface.dataset.placement,'bottom');
  h.event(h.win,'resize');await pause(30);assert.equal(p.surface.hidden,false);assert.equal(p.surface.style.maxWidth,'320px');
  p.trigger.getBoundingClientRect=()=>({left:0,right:100,top:-100,bottom:-56,width:100,height:44});h.event(h.doc,'scroll');await pause(30);assert.equal(p.surface.hidden,true);h.dispose();
});
test('native anchor losing its layout box via ancestor CSS dismisses the top-layer surface',async()=>{
  const h=setup({native:true}),p=parts(h.mount(popover()));p.trigger.click();p.trigger.getClientRects=()=>[];h.host.style.display='none';await pause();assert.equal(p.surface.hidden,true);assert.equal(h.metrics.observers,0);h.dispose();
});
test('pointer released away from tooltip trigger does not poison the next keyboard activation',async()=>{
  const h=setup(),p=parts(h.mount(tooltip()));h.event(p.trigger,'pointerdown',{pointerType:'mouse',pointerId:1});p.trigger.focus();
  h.event(h.doc.body,'pointerup',{pointerType:'mouse',pointerId:1});await pause();p.trigger.click();assert.equal(p.surface.hidden,true);h.dispose();
});
test('tooltip interrupted-pointer watchers are temporary, pointer-specific and cleaned on blur/dispose',async()=>{
  const h=setup(),counts=new Map(),add=h.doc.addEventListener.bind(h.doc),remove=h.doc.removeEventListener.bind(h.doc);
  h.doc.addEventListener=(name,fn,options)=>{if(['pointerup','pointercancel'].includes(name))counts.set(name,(counts.get(name)??0)+1);add(name,fn,options);};
  h.doc.removeEventListener=(name,fn,options)=>{if(['pointerup','pointercancel'].includes(name))counts.set(name,(counts.get(name)??0)-1);remove(name,fn,options);};
  const p=parts(h.mount(tooltip()));h.event(p.trigger,'pointerdown',{pointerId:1});p.trigger.focus();h.event(h.doc.body,'pointercancel',{pointerId:2});assert.equal(counts.get('pointercancel'),1);
  h.event(h.doc.body,'pointercancel',{pointerId:1});assert.equal(counts.get('pointercancel'),0);p.trigger.click();assert.equal(p.surface.hidden,true);
  h.event(p.trigger,'pointerdown',{pointerId:3});p.trigger.blur();assert.equal(counts.get('pointerup'),0);
  h.event(p.trigger,'pointerdown',{pointerId:4});h.event(h.win,'blur');assert.equal(counts.get('pointerup'),0);
  h.event(p.trigger,'pointerdown',{pointerId:5});h.dispose();assert.equal(counts.get('pointerup'),0);assert.equal(counts.get('pointercancel'),0);await pause();
});
test('returning focus to a nonmodal trigger keeps its branch open until focus leaves the root',()=>{
  const h=setup(),p=parts(h.mount(popover())),outside=h.doc.createElement('button');h.doc.body.append(outside);
  p.trigger.click();p.trigger.focus();assert.equal(p.surface.hidden,false);outside.focus();assert.equal(p.surface.hidden,true);assert.equal(h.doc.activeElement,outside);h.dispose();
});
for(const native of [false,true])test(`hover-only Escape allows a later fresh focus without a prior tooltip blur (${native?'native shim':'inline'})`,()=>{
  const h=setup({native}),p=parts(h.mount(tooltip())),outside=h.doc.createElement('button');h.doc.body.append(outside);outside.focus();
  h.event(p.trigger,'pointerenter',{pointerType:'mouse'});assert.equal(p.surface.hidden,false);
  h.event(outside,'keydown',{key:'Escape'});assert.equal(p.surface.hidden,true);assert.equal(h.doc.activeElement,outside);
  h.event(p.trigger,'pointerleave',{pointerType:'mouse'});p.trigger.focus();assert.equal(p.surface.hidden,false);
  h.event(p.trigger,'keydown',{key:'Escape'});assert.equal(p.surface.hidden,true);p.trigger.focus();h.setState({unrelated:7});
  assert.equal(p.surface.hidden,true,'retaining the same actual focus must not reopen an Escape-dismissed tooltip');
  outside.focus();p.trigger.focus();assert.equal(p.surface.hidden,false);h.dispose();
});
for(const native of [false,true])for(const focusBeforeRelease of [false,true])test(`touch release and compatibility click may be separate tasks (${native?'native shim':'inline'}, focus ${focusBeforeRelease?'before':'after'} release)`,()=>{
  const h=setup({native}),p=parts(h.mount(tooltip())),scheduled=[];
  h.win.setTimeout=fn=>{scheduled.push(fn);return scheduled.length;};h.win.clearTimeout=()=>{};
  const pointer={pointerType:'touch',pointerId:9},activate=()=>h.event(p.trigger,'click',{...pointer,detail:1});
  h.event(p.trigger,'pointerdown',pointer);if(focusBeforeRelease)p.trigger.focus();h.event(p.trigger,'pointerup',pointer);
  for(const fn of scheduled.splice(0))fn();if(!focusBeforeRelease)p.trigger.focus();activate();assert.equal(p.surface.hidden,false);
  h.event(p.trigger,'pointerdown',pointer);h.event(p.trigger,'pointerup',pointer);for(const fn of scheduled.splice(0))fn();activate();assert.equal(p.surface.hidden,true);
  h.dispose();
});
for(const native of [false,true])test(`cancelled/dragged gestures cannot poison pointer or keyboard toggles (${native?'native shim':'inline'})`,()=>{
  const h=setup({native}),p=parts(h.mount(tooltip())),outside=h.doc.createElement('button');h.doc.body.append(outside);
  const pointer={pointerId:4,pointerType:'touch'},click=()=>h.event(p.trigger,'click',{...pointer,detail:1});
  h.event(p.trigger,'pointerdown',pointer);p.trigger.focus();h.event(outside,'pointerup',pointer);click();assert.equal(p.surface.hidden,false,'cancelled release must not toggle the focused tooltip');
  h.event(p.trigger,'keydown',{key:'Escape'});assert.equal(p.surface.hidden,true);
  h.event(p.trigger,'pointerdown',pointer);h.event(p.trigger,'pointercancel',pointer);click();assert.equal(p.surface.hidden,true);
  h.event(p.trigger,'pointerdown',pointer);h.event(p.trigger,'pointerup',pointer);click();assert.equal(p.surface.hidden,false);
  // No click arrived after this release. A keyboard/programmatic activation is
  // identified by its own zero-detail event and must use current open state.
  h.event(p.trigger,'keydown',{key:'Escape'});outside.focus();h.event(p.trigger,'pointerdown',pointer);p.trigger.focus();h.event(p.trigger,'pointerup',pointer);p.trigger.click();assert.equal(p.surface.hidden,true);
  h.dispose();
});
test('secondary pointers cannot overwrite a primary tooltip activation',()=>{
  const h=setup(),p=parts(h.mount(tooltip()));
  h.event(p.trigger,'pointerdown',{pointerId:1,pointerType:'touch',isPrimary:true});p.trigger.focus();
  h.event(p.trigger,'pointerdown',{pointerId:2,pointerType:'touch',isPrimary:false});
  h.event(p.trigger,'pointerup',{pointerId:1,pointerType:'touch'});h.event(p.trigger,'click',{pointerId:1,pointerType:'touch',detail:1});assert.equal(p.surface.hidden,false);h.dispose();
});
