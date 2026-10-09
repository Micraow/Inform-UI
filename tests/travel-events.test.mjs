import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
import {mount,compileHtml,validateDocument} from '../dist/index.js';
import {mount as browserMount} from '../dist/browser.js';
import {leg,flight,event,events,spec,setup,change,click,visible} from './travel-events-harness.mjs';

test('public Node/browser renderers retain supplied timestamps, offsets, price codes, order and native reading details',()=>{
  for(const mountFn of [mount,browserMount]){
    const input=spec([flight({price:{amount:123.4567,currency:'ZZZ'},note:'Supplied fare notes',source:{label:'Source',url:'https://example.com'}}),events()]);const original=JSON.stringify(input),x=setup(input,{},undefined,'en',mountFn);
    assert.equal(x.select.type,'button');assert.equal(x.clear.type,'button');assert.deepEqual([...x.flight.querySelectorAll('time')].map(e=>e.textContent),['2028-02-29T09:00Z','2028-02-29T07:00-05:00']);assert.equal(x.host.querySelector('.iui-flight-duration').textContent,'Duration: 180 minutes');assert.equal(x.host.querySelector('.iui-flight-price bdi').textContent,'123.4567 ZZZ');
    assert.deepEqual(visible(x),['march','event1','repeat']);assert.deepEqual([...x.filter.options].map(e=>e.value),['','2028-03','2028-02']);assert.equal(x.events.querySelector('.iui-events-time-zone').textContent,'Supplied time zone: Literal venue time');assert.equal(x.events.querySelector('time').dateTime,'2028-03-10');assert.equal(x.events.querySelector('.iui-events-time').dateTime,'19:30');
    const details=x.flight.querySelector('details');assert.equal(details.open,false);details.open=true;x.controller.setState({other:1});assert.equal(x.flight.querySelector('details'),details);assert.equal(details.open,true);assert.equal(JSON.stringify(input),original);x.controller.dispose();
  }
});

test('select and clear emit frozen primitive cancelable owner-window events only on nonredundant explicit action',()=>{
  const x=setup();const received=[];x.host.addEventListener('iui:flight-choice',e=>received.push(e));
  x.clear.focus();x.clear.click();click(x,x.clear);assert.equal(received.length,0);assert.equal(x.doc.activeElement,x.clear);
  x.select.focus();x.select.click();assert.equal(received.length,1);const e=received[0];assert.ok(e instanceof x.dom.window.CustomEvent);assert.equal(e.target,x.flight);assert.equal(e.bubbles,true);assert.equal(e.cancelable,true);assert.equal(e.composed,false);assert.deepEqual(e.detail,{id:'flight',optionId:'flight1'});assert.ok(Object.isFrozen(e.detail));assert.throws(()=>e.detail.optionId='x',TypeError);
  assert.equal(x.select.getAttribute('aria-pressed'),'true');assert.equal(x.select.getAttribute('aria-disabled'),'true');x.select.click();click(x,x.select);assert.equal(received.length,1);assert.equal(x.doc.activeElement,x.select);
  x.controller.setState({other:2});assert.equal(received.length,1);assert.equal(x.doc.activeElement,x.select);assert.equal(x.select.getAttribute('aria-pressed'),'true');
  x.clear.focus();x.clear.click();assert.equal(received.length,2);assert.deepEqual(received[1].detail,{id:'flight',optionId:null});assert.equal(x.select.getAttribute('aria-pressed'),'false');assert.equal(x.doc.activeElement,x.clear);x.clear.click();assert.equal(received.length,2);x.controller.dispose();
  const y=setup(spec(flight()));y.host.addEventListener('iui:flight-choice',e=>assert.equal(e.detail.id,null));y.select.click();y.controller.dispose();
});

test('cancelled selection/clear preserve prior state and recursive activation cannot enter another dispatch',()=>{
  const x=setup();let count=0,cancel=true;x.host.addEventListener('iui:flight-choice',e=>{count++;x.clear.click();x.select.click();if(cancel)e.preventDefault();});
  x.select.click();assert.equal(count,1);assert.equal(x.select.getAttribute('aria-pressed'),'false');assert.match(x.flight.querySelector('.iui-flight-status').textContent,/not accepted/);
  cancel=false;x.select.click();assert.equal(count,2);assert.equal(x.select.getAttribute('aria-pressed'),'true');cancel=true;x.clear.click();assert.equal(count,3);assert.equal(x.select.getAttribute('aria-pressed'),'true');cancel=false;x.clear.click();assert.equal(count,4);assert.equal(x.select.getAttribute('aria-pressed'),'false');x.controller.dispose();
});

test('month filter preserves exact order, mounted details, focus and unrelated state without events',()=>{
  const x=setup(),rows=[...x.events.querySelectorAll('li')],details=rows[1].querySelector('details');let calls=0;x.host.addEventListener('iui:flight-choice',()=>calls++);details.open=true;
  x.filter.focus();change(x,'2028-03');assert.deepEqual(visible(x),['march']);assert.equal(x.events.querySelector('.iui-events-count').textContent,'Showing 1 of 3 supplied events.');assert.equal(x.doc.activeElement,x.filter);assert.equal(details.open,true);
  x.controller.setState({other:1});assert.equal(x.filter.value,'2028-03');assert.equal(x.doc.activeElement,x.filter);change(x,'invalid');assert.equal(x.filter.value,'2028-03');change(x,'');assert.deepEqual([...x.events.querySelectorAll('li')],rows);assert.deepEqual(visible(x),['march','event1','repeat']);assert.equal(details.open,true);assert.equal(calls,0);
  x.events.hidden=true;change(x,'2028-03');assert.equal(x.filter.value,'');assert.deepEqual(visible(x),['march','event1','repeat']);x.events.hidden=false;x.controller.dispose();
});

test('empty, one-month, maximum, historical and distant event collections never infer current availability',()=>{
  for(const list of [[],[event({date:'1000-01-01'})],Array.from({length:40},(_,i)=>event({id:`e${i}`,date:'9999-12-31'}))]){
    const x=setup(spec(events({events:list})));assert.equal(x.filter,null);assert.equal(x.events.querySelectorAll('li').length,list.length);assert.equal(x.events.querySelector('.iui-events-empty').hidden,list.length>0);if(!list.length)assert.equal(x.events.querySelector('.iui-events-empty').textContent,'No events supplied.');assert.match(x.events.querySelector('.iui-travel-disclosure').textContent,/without conversion or current-date filtering/);x.controller.dispose();
  }
});

test('inherited disabled and hidden controls block forged choices/filter changes but ordinary source reading remains',()=>{
  const n=spec({type:'field',label:'Ancestor',disabled:{$:'locked'},children:[flight({source:{label:'Read source',url:'https://example.com'}}),events()]},{state:{locked:true,other:0}}),x=setup(n);let calls=0;x.host.addEventListener('iui:flight-choice',()=>calls++);
  assert.equal(x.select.matches(':disabled'),true);click(x,x.select);click(x,x.clear);change(x,'2028-02');assert.equal(calls,0);assert.equal(x.filter.value,'');
  const a=x.flight.querySelector('a');let blocked;a.addEventListener('click',e=>{blocked=e.defaultPrevented;e.preventDefault();});click(x,a);assert.equal(blocked,false);
  x.controller.setState({locked:false});x.select.click();change(x,'2028-02');assert.equal(calls,1);x.controller.setState({locked:true});click(x,x.clear);change(x,'2028-03');assert.equal(calls,1);assert.equal(x.select.getAttribute('aria-pressed'),'true');assert.equal(x.filter.value,'2028-02');
  x.controller.setState({locked:false});x.flight.hidden=true;click(x,x.clear);assert.equal(calls,1);x.flight.hidden=false;x.clear.click();assert.equal(calls,2);x.controller.dispose();
});

test('local controls never submit, enter FormData or action snapshots; pending own Forms block forged controls',async()=>{
  let resolve,snapshot,calls=0;const x=setup(spec({type:'form',label:'Example form',action:'save',children:[{type:'input',kind:'text',label:'Note',bind:'note'},flight(),events()]},{state:{note:'Supplied',other:0}}),{actions:{save:context=>{calls++;snapshot=context.values;return new Promise(r=>resolve=r);}}});
  const form=x.host.querySelector('form');let submits=0,choices=0;form.addEventListener('submit',()=>submits++);x.host.addEventListener('iui:flight-choice',()=>choices++);
  x.select.click();change(x,'2028-02');assert.equal(calls,0);assert.equal(submits,0);assert.equal(choices,1);for(const root of [x.flight,x.events])assert.equal(root.querySelector('[name],[data-bind]'),null);assert.deepEqual([...new x.dom.window.FormData(form).entries()],[]);
  form.dispatchEvent(new x.dom.window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(calls,1);assert.deepEqual(snapshot,{note:'Supplied'});assert.equal(x.select.matches(':disabled'),true);assert.equal(x.filter.matches(':disabled'),true);click(x,x.clear);change(x,'2028-03');assert.equal(choices,1);assert.equal(x.filter.value,'2028-02');assert.equal(x.select.getAttribute('aria-pressed'),'true');
  x.controller.setState({other:2});resolve();await Promise.resolve();await Promise.resolve();assert.equal(x.select.matches(':disabled'),false);assert.equal(x.filter.value,'2028-02');assert.equal(x.select.getAttribute('aria-pressed'),'true');x.controller.dispose();
});

test('external native form reset returns All after default action, retains details, and canceled resets retain filter',async()=>{
  for(const disabled of [false,true]){
    const x=setup(spec(),{},'<form id="outer"><fieldset><div id="host"></div></fieldset></form>');let calls=0;x.host.addEventListener('iui:flight-choice',()=>calls++);x.select.click();change(x,'2028-03');const details=x.events.querySelectorAll('details')[1];details.open=true;x.doc.querySelector('fieldset').disabled=disabled;
    x.doc.querySelector('form').reset();await Promise.resolve();assert.equal(x.filter.value,disabled?'2028-03':'');assert.deepEqual(visible(x),disabled?['march']:['march','event1','repeat']);assert.equal(details.open,true);assert.equal(x.select.getAttribute('aria-pressed'),'true');assert.equal(calls,1);assert.deepEqual([...new x.dom.window.FormData(x.doc.querySelector('form')).entries()],[]);x.controller.dispose();
  }
  const x=setup(spec(),{},'<form id="outer"><div id="host"></div></form>');change(x,'2028-03');x.doc.addEventListener('reset',e=>e.preventDefault());x.doc.querySelector('form').reset();await Promise.resolve();assert.equal(x.filter.value,'2028-03');assert.deepEqual(visible(x),['march']);x.controller.dispose();
});

test('invalid replacement is atomic; update/dispose retires old controls and reset callbacks without stale painting',async()=>{
  for(const action of ['update','dispose']){
    const x=setup(spec(),{},'<form><div id="host"></div></form>');x.select.click();change(x,'2028-03');x.filter.focus();const before=x.host.innerHTML;assert.throws(()=>x.controller.update(spec(flight({legs:[]}))));assert.equal(x.host.innerHTML,before);assert.equal(x.doc.activeElement,x.filter);
    x.doc.querySelector('form').reset();const oldFlight=x.flight,oldEvents=x.events;const a=oldFlight.outerHTML,b=oldEvents.outerHTML;let calls=0;oldFlight.addEventListener('iui:flight-choice',()=>calls++);
    if(action==='update')x.controller.update(spec());else x.controller.dispose();click(x,x.clear);click(x,x.select);const oldValue=x.filter.value;x.filter.dispatchEvent(new x.dom.window.Event('change'));await Promise.resolve();assert.equal(calls,0);assert.equal(oldFlight.outerHTML,a);assert.equal(oldEvents.outerHTML,b);assert.equal(x.filter.value,oldValue);assert.equal(oldFlight.isConnected,false);
    if(action==='update'){assert.equal(x.host.querySelector('.iui-events-filter').value,'');assert.equal(x.host.querySelector('.iui-flight-select').getAttribute('aria-pressed'),'false');}x.controller.dispose();x.controller.dispose();
  }
});

test('flight event getters, constructors and handlers retiring the renderer cannot dispatch or paint stale DOM',()=>{
  for(const hook of ['getter','constructor','handler'])for(const action of ['update','dispose'])for(const clear of [false,true]){
    const x=setup();if(clear)x.select.click();const Original=x.dom.window.CustomEvent,old=x.flight,before=old.outerHTML;let calls=0;const retire=()=>action==='update'?x.controller.update(spec()):x.controller.dispose();
    old.addEventListener('iui:flight-choice',()=>{calls++;if(hook==='handler')retire();});
    if(hook==='getter')Object.defineProperty(x.dom.window,'CustomEvent',{configurable:true,get(){retire();return Original;}});
    if(hook==='constructor')Object.defineProperty(x.dom.window,'CustomEvent',{configurable:true,value:class extends Original{constructor(...args){super(...args);retire();}}});
    (clear?x.clear:x.select).click();assert.equal(calls,hook==='handler'?1:0);assert.equal(old.outerHTML,before);assert.equal(old.isConnected,false);if(action==='update')assert.equal(x.host.querySelector('.iui-flight-select').getAttribute('aria-pressed'),'false');x.controller.dispose();
  }
});

test('synchronous disabled-state changes during dispatch suppress selection commit',()=>{
  const x=setup(spec({type:'field',label:'Guard',disabled:{$:'locked'},children:[flight()]},{state:{locked:false}}));const before=x.flight.outerHTML;x.host.addEventListener('iui:flight-choice',()=>x.controller.setState({locked:true}));x.select.click();assert.equal(x.select.matches(':disabled'),true);assert.equal(x.flight.outerHTML,before);x.controller.dispose();
});

test('consumer listener exceptions follow native semantics and do not create provider-success claims',()=>{
  const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e));const dom=new JSDOM('<div id="host"></div>',{virtualConsole}),host=dom.window.document.getElementById('host'),controller=mount(host,spec());
  host.addEventListener('iui:flight-choice',()=>{throw Error('Host failure');});host.querySelector('.iui-flight-select').click();assert.equal(errors.length,1);assert.equal(host.querySelector('.iui-flight-select').getAttribute('aria-pressed'),'true');assert.equal(host.querySelector('.iui-flight-status').textContent,'Selected locally. No flight has been reserved.');controller.dispose();
});

test('ownerDocument fallback and iframe ownership; noncomposed flight events and reset in a shadow form',async()=>{
  for(const fallback of ['missing','null']){
    const dom=new JSDOM('<iframe></iframe>'),doc=fallback==='null'?dom.window.document.implementation.createHTMLDocument('No window'):dom.window.document.querySelector('iframe').contentDocument;
    if(fallback==='missing')Object.defineProperty(doc.defaultView,'CustomEvent',{value:undefined,configurable:true});const host=doc.createElement('div');doc.body.append(host);const controller=mount(host,spec());let received;host.addEventListener('iui:flight-choice',e=>received=e);host.querySelector('.iui-flight-select').click();assert.deepEqual(received.detail,{id:'flight',optionId:'flight1'});assert.equal(received.composed,false);assert.ok([...host.querySelectorAll('*')].every(e=>e.ownerDocument===doc));controller.dispose();
  }
  const dom=new JSDOM('<div id="parent"></div>'),parent=dom.window.document.getElementById('parent'),shadow=parent.attachShadow({mode:'open'}),form=dom.window.document.createElement('form'),host=dom.window.document.createElement('div');shadow.append(form);form.append(host);let inside=0,outside=0;host.addEventListener('iui:flight-choice',()=>inside++);parent.addEventListener('iui:flight-choice',()=>outside++);const c=mount(host,spec());host.querySelector('.iui-flight-select').click();assert.equal(inside,1);assert.equal(outside,0);const filter=host.querySelector('select');filter.value='2028-03';filter.dispatchEvent(new dom.window.Event('change'));form.reset();await Promise.resolve();assert.equal(filter.value,'');assert.equal(host.querySelectorAll('.iui-events-item:not([hidden])').length,3);c.dispose();
});

test('reserved internal IDs, exact ARIA references, literal hostile content and safe disclosed links',()=>{
  const literal='<script>alert(1)</script><img src=x onerror=alert(1)> 😀 中文';const n=spec([flight({label:literal,description:literal,note:literal,source:{label:literal,url:'https://example.com/?q=%3Cscript%3E'}}),events({artist:literal,description:literal,events:[event({title:literal,venue:literal,timeZoneLabel:literal,description:literal,url:'https://example.com'})]})]);const x=setup(n),y=setup(n);
  assert.equal(x.flight.querySelector('.iui-flight-title').textContent,literal);assert.equal(x.events.querySelector('.iui-events-artist').textContent,literal);assert.equal(x.host.querySelector('script,img,iframe,link,svg'),null);
  const all=[...x.host.querySelectorAll('[id]'),...y.host.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(all).size,all.length);for(const root of [x.flight,x.events])for(const el of [root,...root.querySelectorAll('*')]){for(const attr of ['aria-labelledby','aria-describedby'])for(const id of (el.getAttribute(attr)??'').split(' ').filter(Boolean))assert.ok(x.doc.getElementById(id));for(const el of root.querySelectorAll('[id]'))assert.match(el.id,/^iui-(flight|events)-internal-/);}
  for(const a of x.host.querySelectorAll('a')){assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');assert.equal(a.referrerPolicy,'no-referrer');assert.match(a.textContent,/Opens in a new tab/);}x.controller.dispose();y.controller.dispose();
});

test('Chinese labels, Arabic-first content, outside focus and concurrent roots remain independent',()=>{
  const x=setup(spec([flight({label:'رحلة مقدمة'}),events({artist:'فنان تجريبي'})]),{},undefined,'zh-CN'),y=setup();assert.equal(x.flight.dir,'auto');assert.equal(x.events.dir,'auto');assert.equal(x.select.textContent,'在本地选择');assert.equal(x.filter.options[0].textContent,'所有月份');assert.match(x.events.querySelector('.iui-travel-disclosure').textContent,/不进行转换/);const outside=x.doc.getElementById('outside');outside.focus();x.controller.setState({other:1});x.select.click();assert.equal(x.doc.activeElement,outside);assert.equal(y.select.getAttribute('aria-pressed'),'false');x.controller.dispose();y.controller.dispose();
});

test('standalone compile is deterministic and interactions perform no network/storage/timer or hidden image requests',async()=>{
  const input=spec([flight({label:'</script><script>window.pwned=1</script>',source:{label:'Source',url:'https://example.com'}}),events({source:{label:'Source',url:'https://example.com'}})]),html=await compileHtml(input);assert.equal(html,await compileHtml(input));let forbidden=0;
  const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(win){for(const key of ['fetch','XMLHttpRequest','WebSocket'])win[key]=()=>{forbidden++;throw Error('network');};for(const key of ['localStorage','sessionStorage'])Object.defineProperty(win,key,{get(){forbidden++;throw Error('storage');}});for(const key of ['setTimeout','setInterval'])win[key]=()=>{forbidden++;throw Error('timer');};}});
  const doc=dom.window.document;let calls=0;doc.addEventListener('iui:flight-choice',()=>calls++);doc.querySelector('.iui-flight-select').click();doc.querySelector('.iui-flight-clear').click();const select=doc.querySelector('select');select.value='2028-03';select.dispatchEvent(new dom.window.Event('change'));assert.equal(calls,2);assert.equal(doc.querySelectorAll('.iui-events-item:not([hidden])').length,1);assert.equal(forbidden,0);assert.equal(dom.window.pwned,undefined);assert.equal(doc.querySelectorAll('script[src],link[href],img,iframe').length,0);assert.deepEqual(JSON.parse(doc.getElementById('iui-data').textContent),validateDocument(input).document);dom.window.close();
  await assert.rejects(()=>compileHtml(spec(flight({legs:[leg({arrival:{airport:'JFK',at:'2028-02-29T09:00Z'}})]}))));
});

test('new examples validate through public APIs and styles remain root-scoped without remote assets',async()=>{
  for(const name of ['flight-option','artist-upcoming-events']){const input=JSON.parse(await readFile(`examples/${name}.json`,'utf8'));assert.equal(validateDocument(input).ok,true);const x=setup(input);x.controller.dispose();}
  const css=await readFile('src/renderer/style.css','utf8'),own=css.slice(css.indexOf('/* Original finite supplied travel/events'));
  assert.doesNotMatch(own,/@import|https?:|url\(/);assert.match(own,/\.iui-root \.iui-events-item\[hidden\]\{display:none\}/);assert.match(own,/min-block-size:44px/);assert.match(own,/forced-colors:active/);assert.match(own,/focus-visible/);
});

test('native reset reparenting and later host disable stay consistent with the final native control value',async()=>{
  const x=setup();const outer=x.doc.createElement('form');x.host.replaceWith(outer);outer.append(x.host);change(x,'2028-02');outer.reset();await Promise.resolve();assert.equal(x.filter.value,'');assert.equal(visible(x).length,3);
  change(x,'2028-03');x.doc.addEventListener('reset',()=>{const field=x.doc.createElement('fieldset');field.disabled=true;x.host.replaceWith(field);field.append(x.host);},{once:true});outer.reset();await Promise.resolve();assert.equal(x.filter.value,'2028-03');assert.equal(visible(x).length,1);assert.equal(x.filter.matches(':disabled'),true);x.controller.dispose();
});

test('a queued native reset cannot overwrite a newer explicit local filter change',async()=>{
  const x=setup(spec(),{},'<form><div id="host"></div></form>');change(x,'2028-03');x.doc.querySelector('form').reset();change(x,'2028-02');await Promise.resolve();assert.equal(x.filter.value,'2028-02');assert.deepEqual(visible(x),['event1','repeat']);x.controller.dispose();
});

 test('inert ancestors reject forged flight choice and event filters',()=>{const x=setup();let calls=0;x.host.addEventListener('iui:flight-choice',()=>calls++);x.host.setAttribute('inert','');click(x,x.select);change(x,'2028-03');assert.equal(calls,0);assert.equal(x.filter.value,'');x.host.removeAttribute('inert');x.select.click();assert.equal(calls,1);x.controller.dispose();});

test('hidden/inert event filter ancestry rejects forged changes and queued outer resets',async()=>{for(const flag of ['hidden','inert']){const x=setup(spec(),{},'<form><div id="host"></div></form>'),wrapper=x.filter.parentElement;change(x,'2028-03');wrapper.setAttribute(flag,'');change(x,'2028-02');assert.equal(x.filter.value,'2028-03');assert.deepEqual(visible(x),['march']);x.doc.querySelector('form').reset();await Promise.resolve();assert.equal(x.filter.value,'2028-03');assert.deepEqual(visible(x),['march']);wrapper.removeAttribute(flag);change(x,'2028-02');assert.equal(x.filter.value,'2028-02');x.controller.dispose();}});

test('independently detached or reparented event filters cannot alter mounted event visibility',()=>{for(const reparent of [false,true]){const x=setup();change(x,'2028-03');if(reparent)x.doc.body.append(x.filter);else x.filter.remove();change(x,'2028-02');assert.equal(x.filter.value,'2028-03');assert.deepEqual(visible(x),['march']);x.controller.dispose();}});
