// All WAAPI/media/clock implementations in this file are TEST DOUBLES.
// Public mount runs in jsdom; these results are not browser/visual acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv2020 from 'ajv/dist/2020.js';
import {mount, validateDocument, compileHtml} from '../dist/index.js';
import {assertClosedReferences, createSchemaSubset} from '../scripts/schema-subsets.mjs';
import {fakeClock} from './time-fake-clock.mjs';
const animate=(extra={})=>({type:'animate',label:'Persistent content',children:[{type:'text',value:'Visible at rest'}],...extra});
const celebration=(extra={})=>({type:'celebration',label:'Supplied message',message:'A literal message',...extra});
const spec=(node=animate(),state={other:0,amount:6,note:'Original'})=>({version:'iui/1',state,body:Array.isArray(node)?node:[node]});
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
function deferred(PromiseClass=Promise){let resolve,reject;const promise=new PromiseClass((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};}
function doubles(win,{reduce=false,cancelReject=true}={}) {
  const calls=[],listeners=new Set();let mediaReads=0;
  const media={matches:reduce,media:'(prefers-reduced-motion: reduce)',addEventListener(name,fn){assert.equal(name,'change');listeners.add(fn);},removeEventListener(name,fn){assert.equal(name,'change');listeners.delete(fn);}};
  win.matchMedia=function(query){assert.equal(this,win);assert.equal(query,media.media);mediaReads++;return media;};
  const factory=function(frames,options){const work=deferred(win.Promise);const animation={finished:work.promise,cancelled:0,cancel(){this.cancelled++;if(cancelReject)work.reject(new win.DOMException('Test cancellation','AbortError'));}};const call={element:this,frames,options,animation,...work};calls.push(call);return animation;};
  win.Element.prototype.animate=factory;
  return {calls,media,listeners,factory,get mediaReads(){return mediaReads;},change(reduce){media.matches=reduce;for(const fn of [...listeners])fn({matches:reduce});}};
}
function setup(input=spec(),options={}) {
  const dom=new JSDOM('<!doctype html><html><body><button id="outside">Outside</button><main></main></body></html>',{runScripts:'outside-only'});
  const win=dom.window;win.document.documentElement.lang=options.lang??'en';
  const mock=doubles(win,options),clock=options.clock?fakeClock(win):undefined;
  const host=win.document.querySelector('main'),controller=mount(host,input,{actions:options.actions??{}});
  const root=host.querySelector('.iui-motion'),preview=root.querySelector('.iui-motion-preview'),stop=root.querySelector('.iui-motion-stop'),status=root.querySelector('.iui-motion-status');
  return {dom,win,host,controller,root,preview,stop,status,mock,clock,outside:win.document.getElementById('outside')};
}
const close=s=>{s.controller.dispose();s.dom.window.close();};
const invalid=(node,code='SCHEMA',state)=>{const r=validateDocument(spec(node,state));assert.equal(r.ok,false);assert.ok(r.issues.some(i=>i.code===code),JSON.stringify(r.issues));return r;};

test('strict motion schemas, Unicode, duration/child limits, forbidden payloads and descendant semantics',()=>{
  for(const node of [animate({children:[]}),animate({label:'😀'.repeat(200),duration:100,effect:'fade',disabled:true}),animate({duration:1000,children:Array.from({length:50},()=>({type:'divider'}))}),celebration({message:'😀'.repeat(1000),duration:300}),celebration({duration:1800})])assert.equal(validateDocument(spec(node)).ok,true);
  for(const node of [animate({label:''}),animate({label:'😀'.repeat(201)}),animate({children:undefined}),animate({children:Array.from({length:51},()=>({type:'divider'}))}),celebration({message:''}),celebration({message:'😀'.repeat(1001)}),celebration({children:[]}),animate({effect:'bounce'}),animate({autoplay:true}),animate({loop:true}),animate({keyframes:[]}),celebration({audio:'sound.mp3'}),celebration({message:{$:'note'}}),...['',1,null,{$:'other'}].flatMap(disabled=>[animate({disabled}),celebration({disabled})]),...[99,1001,100.5,'300'].map(duration=>animate({duration})),...[299,1801,300.5,'900'].map(duration=>celebration({duration}))]){
    const r=validateDocument(spec(node));assert.equal(r.ok,false,JSON.stringify(node));
  }
  invalid(animate({children:[{type:'text',value:{$:'missing'}}]}),'UNKNOWN_REFERENCE');
  invalid(animate({children:[{type:'link',value:'Unsafe',href:'javascript:alert(1)'}]}),'UNSAFE_URL');
  invalid(animate({children:[{type:'native',name:'box',children:[]}]}),'UNSUPPORTED_NATIVE');
  invalid(animate({children:[{type:'tab-panel',id:'orphan',label:'Orphan',children:[]}]}),'TAB_PARENT');
  invalid(animate({children:[{type:'form',label:'Outer',children:[animate({children:[{type:'form',label:'Inner',children:[]}]})]}]}),'NESTED_FORM');
});

test('official base closure and public fixture support add exactly the two original motion types',async()=>{
  const input=JSON.parse(await readFile('examples/motion.json','utf8')),before=structuredClone(input);
  const full=JSON.parse(await readFile('src/schema/iui.schema.json','utf8')),base=JSON.parse(await readFile('src/schema/fragments/base.schema.json','utf8')),index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));
  for(const type of ['animate','celebration']){assert.equal(index.nodeOwners[type],'base');assert.equal(full.$defs.Node.oneOf.filter(ref=>full.$defs[ref.$ref.split('/').at(-1)].properties.type.const===type).length,1);}
  assertClosedReferences(base);assert.equal(new Ajv2020({strict:true}).compile(base)(input),true);assert.equal(validateDocument(input).ok,true);assert.deepEqual(input,before);
  const formSpec=spec(animate({children:[{type:'form',label:'Complete form',children:[{type:'input',kind:'number',label:'Amount',bind:'amount'}]}]}));
  assert.equal(new Ajv2020({strict:true}).compile(base)(formSpec),false,'base alone excludes form nodes');
  assert.equal(new Ajv2020({strict:true}).compile(createSchemaSubset(full,index.nodeOwners,['base','forms']))(formSpec),true);
  assert.equal(validateDocument(formSpec).ok,true);
});

for(const node of [animate(),celebration()])test(`${node.type}: TEST DOUBLE no autoplay, one native path, strict idle/playing no-ops and finite finish`,async()=>{
  const s=setup(spec(node));assert.equal(s.mock.calls.length,0);assert.equal(s.mock.mediaReads,0);assert.equal(s.status.textContent,'');
  assert.equal(s.preview.type,'button');assert.equal(s.stop.type,'button');assert.equal(s.stop.disabled,false);assert.equal(s.stop.getAttribute('aria-disabled'),'true');
  s.stop.focus();const initial=s.root.outerHTML;s.stop.click();assert.equal(s.root.outerHTML,initial);assert.equal(s.win.document.activeElement,s.stop);
  for(const key of ['Enter',' '])s.preview.dispatchEvent(new s.win.KeyboardEvent('keydown',{key,bubbles:true}));assert.equal(s.mock.calls.length,0,'no keydown synthesis');
  s.preview.focus();s.preview.click();const count=node.type==='animate'?1:6;assert.equal(s.mock.calls.length,count);assert.equal(s.root.dataset.status,'playing');
  assert.equal(s.preview.disabled,false);assert.equal(s.preview.getAttribute('aria-disabled'),'true');assert.equal(s.stop.getAttribute('aria-disabled'),'false');
  const busy=s.root.outerHTML;s.preview.click();s.preview.dispatchEvent(new s.win.MouseEvent('click',{bubbles:true}));assert.equal(s.root.outerHTML,busy);assert.equal(s.mock.calls.length,count);
  for(const call of s.mock.calls){assert.deepEqual(call.options,{duration:node.type==='animate'?300:900,iterations:1,easing:'ease-out',fill:'none'});assert.ok(call.element.ownerDocument===s.win.document);}
  s.stop.focus();for(const call of s.mock.calls.slice(0,-1))call.resolve();await flush();assert.equal(s.root.dataset.status,'playing');s.mock.calls.at(-1).resolve();await flush();
  assert.equal(s.root.dataset.status,'completed');assert.equal(s.win.document.activeElement,s.stop);assert.equal(s.mock.listeners.size,0);assert.equal(s.stop.getAttribute('aria-disabled'),'true');
  s.preview.click();assert.equal(s.mock.calls.length,count*2);s.stop.click();await flush();assert.equal(s.root.dataset.status,'stopped');assert.equal(s.mock.listeners.size,0);close(s);
});

test('TEST DOUBLE exact fade/rise group frames; literal celebration text and bounded deterministic decorations',()=>{
  for(const effect of ['fade','rise']){
    const s=setup(spec(animate({effect,duration:1000})));s.preview.click();assert.equal(s.mock.calls[0].element,s.root.querySelector('.iui-motion-content'));assert.equal(s.mock.calls[0].frames[0].opacity,.35);assert.equal(s.mock.calls[0].frames[1].opacity,1);
    if(effect==='rise')assert.deepEqual(s.mock.calls[0].frames.map(f=>f.transform),['translateY(8px)','translateY(0px)']);else assert.equal('transform' in s.mock.calls[0].frames[0],false);close(s);
  }
  const a=setup(spec(celebration({message:'<img src=x onerror=alert(1)>\n<script>literal</script>'}))),b=setup(spec(celebration()));
  assert.equal(a.root.querySelector('img,script'),null);assert.match(a.root.querySelector('.iui-celebration-message').textContent,/<script>/);assert.match(a.root.textContent,/not a verified achievement/);
  const layer=a.root.querySelector('.iui-celebration-decoration');assert.equal(layer.getAttribute('aria-hidden'),'true');assert.equal(layer.children.length,6);assert.equal(layer.querySelector('button,[tabindex]'),null);assert.equal(layer.outerHTML,b.root.querySelector('.iui-celebration-decoration').outerHTML);close(a);close(b);
});

test('empty animate has honest static text, no dead controls and no media/animation calls',()=>{
  const s=setup(spec(animate({children:[]})));assert.equal(s.preview,null);assert.equal(s.stop,null);assert.match(s.root.textContent,/No content to preview/);assert.equal(s.mock.calls.length,0);assert.equal(s.mock.mediaReads,0);close(s);
});

test('TEST DOUBLE reduced motion on activation and during playback cancels without focus or content loss',async()=>{
  for(const node of [animate(),celebration()]){
    const s=setup(spec(node),{reduce:true});assert.equal(s.status.textContent,'');s.preview.focus();s.preview.click();assert.equal(s.mock.calls.length,0);assert.equal(s.root.dataset.status,'reduced');assert.match(s.status.textContent,/Reduced motion/);assert.equal(s.mock.listeners.size,0);
    s.mock.change(false);s.preview.click();assert.equal(s.root.dataset.status,'playing');assert.equal(s.mock.listeners.size,1);s.stop.focus();s.mock.change(true);await flush();assert.ok(s.mock.calls.every(call=>call.animation.cancelled===1));assert.equal(s.root.dataset.status,'reduced');assert.equal(s.mock.listeners.size,0);assert.equal(s.win.document.activeElement,s.stop);close(s);
  }
});

test('TEST DOUBLE absent matchMedia uses ordinary bounded behavior; absent WAAPI/Promise give static honest fallback',async()=>{
  const s=setup();delete s.win.matchMedia;s.preview.click();assert.equal(s.mock.calls.length,1);assert.equal(s.root.dataset.status,'playing');s.mock.calls[0].resolve();await flush();assert.equal(s.root.dataset.status,'completed');close(s);
  for(const missing of ['animate','Promise']){
    const s=setup();if(missing==='animate')delete s.win.Element.prototype.animate;else Object.defineProperty(s.win,'Promise',{value:undefined,configurable:true});s.preview.click();assert.equal(s.mock.calls.length,0);assert.equal(s.root.dataset.status,'unavailable');assert.match(s.status.textContent,/unavailable.*static/);assert.equal(s.mock.listeners.size,0);assert.match(s.root.textContent,/Visible at rest/);close(s);
  }
});

test('TEST DOUBLE legacy media subscriptions are released, broken media APIs do not pretend success',()=>{
  const s=setup();s.mock.media.addListener=fn=>s.mock.listeners.add(fn);s.mock.media.removeListener=fn=>s.mock.listeners.delete(fn);delete s.mock.media.addEventListener;delete s.mock.media.removeEventListener;s.preview.click();assert.equal(s.mock.listeners.size,1);s.mock.change(true);assert.equal(s.root.dataset.status,'reduced');assert.equal(s.mock.listeners.size,0);close(s);
  for(const mode of ['throw','no-listener']){const s=setup();if(mode==='throw')s.win.matchMedia=()=>{throw Error('Test unavailable');};else{delete s.mock.media.addEventListener;delete s.mock.media.removeEventListener;}s.preview.click();assert.ok(['failed','unavailable'].includes(s.root.dataset.status));assert.equal(s.mock.calls.length,0);close(s);}
});

test('TEST DOUBLE disabled node/ancestor and pending form ignore forged activation without disabling nested reading',async()=>{
  for(const node of [animate({disabled:true}),celebration({disabled:true})]){const s=setup(spec(node));for(const button of [s.preview,s.stop]){assert.equal(button.disabled,true);button.click();button.dispatchEvent(new s.win.MouseEvent('click',{bubbles:true}));}assert.equal(s.mock.calls.length,0);close(s);}
  const field={type:'field',label:'Disabled field',disabled:{$:'locked'},children:[animate()]};const s=setup(spec(field,{locked:true}));s.preview.dispatchEvent(new s.win.MouseEvent('click',{bubbles:true}));assert.equal(s.mock.calls.length,0);s.controller.setState({locked:false});s.preview.click();assert.equal(s.mock.calls.length,1);s.controller.setState({locked:true});const busy=s.root.outerHTML;s.stop.dispatchEvent(new s.win.MouseEvent('click',{bubbles:true}));assert.equal(s.root.outerHTML,busy);s.mock.calls[0].resolve();await flush();assert.equal(s.root.dataset.status,'completed');close(s);
  const work=deferred();let snapshot,submits=0;const x=setup(spec({type:'form',label:'Pending form',action:'submit',children:[{type:'input',label:'Amount',kind:'number',bind:'amount'},animate(),celebration()]}),{actions:{submit:ctx=>{snapshot=ctx.values;return work.promise;}}});
  const form=x.host.querySelector('form');form.addEventListener('submit',()=>submits++);x.preview.click();x.stop.click();assert.equal(submits,0);form.querySelector('[type=submit]').click();assert.equal(submits,1);assert.equal(form.getAttribute('aria-busy'),'true');assert.deepEqual({...snapshot},{amount:6});
  const before=x.mock.calls.length;for(const button of x.host.querySelectorAll('.iui-motion-controls button')){assert.equal(button.name,'');assert.equal(button.dataset.bind,undefined);button.dispatchEvent(new x.win.MouseEvent('click',{bubbles:true}));}assert.equal(x.mock.calls.length,before);work.resolve();await flush();x.preview.click();assert.equal(x.mock.calls.length,before+1);close(x);
});

test('TEST DOUBLE unrelated setState/preview/stop retain complete forms, invalid draft, selected tab, timer and details DOM',async()=>{
  const form={type:'form',label:'Nested form',children:[{type:'input',kind:'number',label:'Amount',bind:'amount',min:0}]};
  const tabs={type:'tab-group',label:'Tabs',children:[{type:'tab-panel',id:'first',label:'First',children:[{type:'text',value:'First'}]},{type:'tab-panel',id:'second',label:'Second',children:[{type:'text',value:'Second'}]}]};
  const s=setup(spec(animate({children:[form,tabs,{type:'timer',durationMs:10000},{type:'details',summary:'Details',children:[{type:'text',value:'Keep open'}]}]})),{clock:true});
  const input=s.root.querySelector('input'),timer=s.root.querySelector('.iui-time'),details=s.root.querySelector('details'),tab=s.root.querySelectorAll('[role=tab]')[1];
  input.value='-1';input.dispatchEvent(new s.win.Event('input',{bubbles:true}));tab.click();details.open=true;timer.querySelector('[data-time-action=start]').click();s.clock.advance(100);assert.equal(s.clock.pending,1);
  const refs=[input,timer,details,tab],content=s.root.querySelector('.iui-motion-content');s.preview.click();input.focus();s.controller.setState({other:1});assert.equal(s.root.querySelector('.iui-motion-content'),content);assert.equal(s.root.dataset.status,'playing');assert.equal(s.mock.calls[0].animation.cancelled,0);assert.equal(input.value,'-1');assert.equal(s.win.document.activeElement,input);
  s.clock.advance(200);s.stop.click();await flush();assert.equal(input.value,'-1');assert.equal(details.open,true);assert.equal(tab.getAttribute('aria-selected'),'true');assert.equal(timer.dataset.status,'running');for(const ref of refs)assert.equal(ref.isConnected,true);assert.equal(s.clock.pending,1);close(s);assert.equal(s.clock.pending,0);
});

test('TEST DOUBLE invalid update is atomic while valid update/dispose clean owned motion and ignore stale branches',async()=>{
  for(const operation of ['update','dispose'])for(const branch of ['resolve','reject']){
    const s=setup(spec(celebration()),{cancelReject:false});s.preview.click();const before=s.root.outerHTML;assert.throws(()=>s.controller.update(spec(celebration({duration:1}))));assert.equal(s.root.outerHTML,before);assert.equal(s.mock.calls[0].animation.cancelled,0);
    s.outside.focus();if(operation==='update')s.controller.update(spec(celebration()));else s.controller.dispose();assert.equal(s.mock.listeners.size,0);assert.ok(s.mock.calls.every(call=>call.animation.cancelled===1));
    for(const call of s.mock.calls)call[branch](branch==='reject'?Error('Test stale rejection'):undefined);s.preview.click();s.stop.click();await flush();assert.equal(s.root.outerHTML,before);assert.equal(s.win.document.activeElement,s.outside);assert.equal(s.mock.calls.length,6);if(operation==='update'){assert.equal(s.host.querySelector('.iui-motion').dataset.status,'idle');s.controller.dispose();}s.dom.window.close();
  }
});

test('TEST DOUBLE stop/retry isolates generations from late success/rejection, including partial celebration failure',async()=>{
  for(const branch of ['resolve','reject']){
    const s=setup(spec(animate()),{cancelReject:false});s.preview.click();s.stop.click();s.preview.click();s.mock.calls[0][branch](branch==='reject'?Error('Test late rejection'):undefined);await flush();assert.equal(s.root.dataset.status,'playing');s.mock.calls[1].resolve();await flush();assert.equal(s.root.dataset.status,'completed');close(s);
  }
  const s=setup(spec(celebration()));s.preview.click();s.mock.calls[2].reject(Error('Test interruption'));await flush();assert.equal(s.root.dataset.status,'failed');assert.ok(s.mock.calls.every(call=>call.animation.cancelled===1));assert.equal(s.mock.listeners.size,0);s.preview.click();assert.equal(s.mock.calls.length,12);s.stop.click();await flush();close(s);
});

for(const operation of ['update','dispose'])for(const hook of ['getter','call','finished'])test(`TEST DOUBLE synchronous animate ${hook} ${operation} retires old DOM and observes returned rejection`,async()=>{
  const s=setup(spec(celebration()));let retiredHTML;const retire=()=>{if(operation==='update')s.controller.update(spec(celebration()));else s.controller.dispose();retiredHTML=s.root.outerHTML;};
  if(hook==='getter')Object.defineProperty(s.win.Element.prototype,'animate',{configurable:true,get(){retire();return s.mock.factory;}});
  else if(hook==='call')s.win.Element.prototype.animate=function(...args){retire();return s.mock.factory.apply(this,args);};
  else s.win.Element.prototype.animate=function(...args){const animation=s.mock.factory.apply(this,args),finished=animation.finished;Object.defineProperty(animation,'finished',{get(){retire();return finished;}});return animation;};
  s.preview.click();await flush();assert.equal(s.root.outerHTML,retiredHTML);assert.equal(s.mock.calls.length,hook==='getter'?0:1);assert.ok(s.mock.calls.every(call=>call.animation.cancelled>=1));assert.equal(s.mock.listeners.size,0);if(operation==='update'){assert.equal(s.host.querySelector('.iui-motion').dataset.status,'idle');s.controller.dispose();}s.dom.window.close();
});

test('TEST DOUBLE throwing animation APIs/completion getters and reentrant cancel/click stay static and retryable',async()=>{
  for(const hook of ['getter','call','finished','undefined-finished']){
    const s=setup();if(hook==='getter')Object.defineProperty(s.win.Element.prototype,'animate',{configurable:true,get(){throw Error('Test getter');}});
    else if(hook==='call')s.win.Element.prototype.animate=()=>{throw Error('Test call');};
    else s.win.Element.prototype.animate=function(...args){const animation=s.mock.factory.apply(this,args);animation.finished.catch(()=>{});Object.defineProperty(animation,'finished',{get(){if(hook==='finished')throw Error('Test finished');return undefined;}});return animation;};
    s.preview.click();await flush();assert.equal(s.root.dataset.status,'failed');assert.equal(s.mock.listeners.size,0);assert.match(s.status.textContent,/could not finish/);close(s);
  }
  const s=setup();s.win.Element.prototype.animate=function(...args){s.preview.click();s.stop.click();const a=s.mock.factory.apply(this,args),cancel=a.cancel;a.cancel=()=>{s.preview.click();s.stop.click();cancel.call(a);};return a;};
  s.preview.click();assert.equal(s.mock.calls.length,1);s.stop.click();await flush();assert.equal(s.mock.calls.length,1);assert.equal(s.root.dataset.status,'stopped');s.preview.click();assert.equal(s.mock.calls.length,2);close(s);
});

test('TEST DOUBLE no focus calls, focus callback update before activation, owner windows and independent mounts',async()=>{
  const a=setup(),b=setup(spec(celebration()),{reduce:true});a.preview.click();b.preview.click();assert.equal(a.mock.calls.length,1);assert.equal(b.mock.calls.length,0);assert.equal(b.root.dataset.status,'reduced');assert.equal(a.root.dataset.status,'playing');a.mock.change(true);assert.equal(a.root.dataset.status,'reduced');close(a);close(b);
  const s=setup();s.preview.addEventListener('focus',()=>s.controller.update(spec(celebration())));s.preview.focus();const old=s.root.outerHTML;s.preview.click();assert.equal(s.mock.calls.length,0);assert.equal(s.root.outerHTML,old);close(s);
  const outer=new JSDOM('<iframe></iframe>',{runScripts:'outside-only'}),win=outer.window.document.querySelector('iframe').contentWindow,mock=doubles(win),host=win.document.createElement('div');win.document.body.append(host);outer.window.matchMedia=()=>{throw Error('Wrong window');};
  const controller=mount(host,spec(animate()));host.querySelector('.iui-motion-preview').click();assert.equal(mock.calls.length,1);assert.equal(mock.calls[0].element.ownerDocument,win.document);mock.calls[0].resolve();await flush();assert.equal(host.querySelector('.iui-motion').dataset.status,'completed');controller.dispose();outer.window.close();
});

test('internal IDs stay disjoint from authored IDs and sibling mounts; localized notes remain literal',()=>{
  const input=spec([animate({id:'motion-internal-iui-1-1-label'}),celebration({label:'<b>Message</b>'})]),a=setup(input),b=setup(input,{lang:'zh-CN'});
  const ids=[...a.host.querySelectorAll('[id]'),...b.host.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
  for(const s of [a,b])for(const root of s.host.querySelectorAll('.iui-motion')){const title=root.querySelector('h2');assert.ok(title.id.startsWith('iui-motion-internal-'));assert.equal(root.getAttribute('aria-labelledby'),title.id);for(const button of root.querySelectorAll('.iui-motion-controls button'))assert.ok(s.win.document.getElementById(button.getAttribute('aria-describedby')));}
  assert.equal(b.preview.textContent,'预览动效');assert.match(b.host.querySelector('.iui-motion-note').textContent,/不代表已核实/);assert.equal(b.root.querySelector('b'),null);close(a);close(b);
});

test('compiler determinism, inert JSON, no ambient network/storage/timers or automatic motion',async()=>{
  const input=spec([animate(),celebration({message:'</script><script>bad()</script>'})]),before=structuredClone(input),html=await compileHtml(input);assert.equal(html,await compileHtml(input));assert.deepEqual(input,before);assert.doesNotMatch(html,/<script[^>]+src="https?:/);
  const dom=new JSDOM(html,{runScripts:'dangerously'});assert.equal(dom.window.document.querySelectorAll('.iui-motion').length,2);assert.ok([...dom.window.document.querySelectorAll('.iui-motion')].every(el=>el.dataset.status==='idle'));dom.window.document.querySelector('.iui-motion-preview').click();assert.equal(dom.window.document.querySelector('.iui-motion').dataset.status,'unavailable');dom.window.close();
  const s=setup(spec([animate(),celebration()]));let calls=0;for(const key of ['fetch','setTimeout','setInterval','requestAnimationFrame'])s.win[key]=()=>{calls++;throw Error(`Forbidden ${key}`);};for(const key of ['localStorage','sessionStorage','Notification','Audio'])Object.defineProperty(s.win,key,{configurable:true,get(){calls++;throw Error(`Forbidden ${key}`);}});
  for(const root of s.host.querySelectorAll('.iui-motion')){root.querySelector('.iui-motion-preview').click();root.querySelector('.iui-motion-stop').click();}await flush();assert.equal(calls,0);close(s);
});

test('TEST DOUBLE media getter/call/listener reentrancy cannot retain retired listeners or alter replacement DOM',async()=>{
  for(const operation of ['update','dispose'])for(const hook of ['getter','call','listen','change','remove']){
    const s=setup();let retiredHTML;const retire=()=>{if(operation==='update')s.controller.update(spec());else s.controller.dispose();retiredHTML=s.root.outerHTML;};
    if(hook==='getter')Object.defineProperty(s.win,'matchMedia',{configurable:true,get(){retire();return ()=>s.mock.media;}});
    if(hook==='call')s.win.matchMedia=()=>{retire();return s.mock.media;};
    if(hook==='listen')s.mock.media.addEventListener=(_name,fn)=>{retire();s.mock.listeners.add(fn);};
    if(hook==='remove')s.mock.media.removeEventListener=(_name,fn)=>{s.mock.listeners.delete(fn);retire();throw Error('Test remove after retirement');};
    s.preview.click();if(hook==='change'){Object.defineProperty(s.mock.media,'matches',{get(){retire();return true;}});for(const fn of [...s.mock.listeners])fn({matches:true});}
    if(hook==='remove')s.stop.click();await flush();assert.equal(s.root.outerHTML,retiredHTML);assert.equal(s.mock.listeners.size,0);assert.ok(s.mock.calls.every(call=>call.animation.cancelled>=1));
    if(operation==='update'){assert.equal(s.host.querySelector('.iui-motion').dataset.status,'idle');s.controller.dispose();}s.dom.window.close();
  }
});

test('TEST DOUBLE cancel getters/methods may retire the mount or throw without interrupting sibling timer cleanup',async()=>{
  for(const operation of ['update','dispose','throw'])for(const hook of ['getter','call']){
    const s=setup(spec([animate(),{type:'timer',durationMs:10000}]),{clock:true});let retiredHTML;const oldTimer=s.host.querySelector('.iui-time');oldTimer.querySelector('[data-time-action=start]').click();assert.equal(s.clock.pending,1);
    s.preview.click();const a=s.mock.calls[0].animation,original=a.cancel;const retire=()=>{if(operation==='update')s.controller.update(spec());else if(operation==='dispose')s.controller.dispose();else throw Error('Test cancel failure');retiredHTML=s.root.outerHTML;};
    if(hook==='getter')Object.defineProperty(a,'cancel',{get(){retire();return original;}});else a.cancel=function(){retire();original.call(a);};
    if(operation==='throw'){s.controller.dispose();assert.equal(s.clock.pending,0);}else{s.stop.click();assert.equal(s.root.outerHTML,retiredHTML);assert.equal(s.clock.pending,0);if(operation==='update')s.controller.dispose();}
    s.mock.calls[0].reject(Error('Test late cancellation'));await flush();assert.equal(s.mock.listeners.size,0);s.dom.window.close();
  }
});

test('TEST DOUBLE throwing preference-change reads settle honestly and never escape a media callback',async()=>{
  const s=setup(spec(celebration()));s.preview.click();Object.defineProperty(s.mock.media,'matches',{get(){throw Error('Test preference read failure');}});
  for(const changed of [...s.mock.listeners])assert.doesNotThrow(()=>changed({matches:true}));await flush();assert.equal(s.root.dataset.status,'failed');assert.equal(s.mock.listeners.size,0);assert.ok(s.mock.calls.every(call=>call.animation.cancelled===1));close(s);
});

test('TEST DOUBLE failed cancellation never reports a successful stop or blocks later disposal',async()=>{
  const s=setup();s.preview.click();s.mock.calls[0].animation.cancel=()=>{throw Error('Test failed cancellation');};s.stop.click();assert.equal(s.root.dataset.status,'failed');assert.match(s.status.textContent,/could not finish/);assert.doesNotMatch(s.status.textContent,/static|stopped/);assert.equal(s.mock.listeners.size,0);s.mock.calls[0].reject(Error('Test eventual rejection'));await flush();assert.equal(s.root.dataset.status,'failed');close(s);
});
