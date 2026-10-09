import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import {JSDOM,VirtualConsole} from 'jsdom';
import {mount,validateDocument,compileHtml,evaluateState} from '../dist/index.js';
import {mount as browserMount,validateDocument as browserValidate} from '../dist/browser.js';

const slot=(extra={})=>({id:'one',date:'2024-02-29',time:'18:00',available:true,...extra});
const availability=(slots=[slot()],extra={})=>({type:'restaurant-availability',title:'Supplied dinner options',venue:'Example kitchen',partySize:2,timeZoneLabel:'Literal venue time',slots,...extra});
const multi=()=>availability([slot({id:'late',date:'2024-03-01',time:'19:30'}),slot({id:'full',time:'18:30',available:false}),slot(),slot({id:'two',time:'19:00'})],{id:'dinner'});
const spec=(node=multi(),extra={})=>({version:'iui/1',state:{other:0},body:[node],...extra});
const setup=(input=spec(),options={},lang='en',shell='<div id="host"></div><button id="outside">Outside</button>',mountFn=mount)=>{
  const dom=new JSDOM(`<html lang="${lang}"><body>${shell}</body></html>`),host=dom.window.document.getElementById('host'),controller=mountFn(host,input,options);
  return{dom,host,controller,root:host.querySelector('.iui-availability'),select:host.querySelector('.iui-availability-filter'),clear:host.querySelector('.iui-availability-clear'),status:host.querySelector('.iui-availability-status'),selection:host.querySelector('.iui-availability-selection'),counts:host.querySelector('.iui-availability-counts')};
};
const button=(x,id='one')=>x.host.querySelector(`[data-slot-id=${id}] button`);
const change=(x,value)=>{x.select.value=value;x.select.dispatchEvent(new x.dom.window.Event('change',{bubbles:true}));};
const click=(x,el)=>el.dispatchEvent(new x.dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));
const chosen=x=>[...x.host.querySelectorAll('.iui-availability-choice[aria-pressed=true]')].map(el=>el.parentElement.dataset.slotId);
const visible=x=>[...x.host.querySelectorAll('.iui-availability-slot:not([hidden])')].map(el=>el.dataset.slotId);
const reject=(input,code,path)=>{const r=validateDocument(input);assert.equal(r.ok,false,JSON.stringify(input));if(code)assert.ok(r.issues.some(i=>i.code===code&&i.path===path),JSON.stringify(r.issues));return r;};
const count100=()=>Array.from({length:100},(_,i)=>slot({id:`s${i}`,time:`${String(Math.floor(i/60)).padStart(2,'0')}:${String(i%60).padStart(2,'0')}`}));

test('availability full/Base document and node schemas expose exactly one canonical Base node and strict literals',async()=>{
  const full=JSON.parse(await readFile('src/schema/iui.schema.json','utf8')),index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));
  assert.equal(index.nodeOwners['restaurant-availability'],'base');assert.equal(full.$defs.Node.oneOf.filter(n=>n.$ref==='#/$defs/RestaurantAvailabilityNode').length,1);
  for(const file of ['iui.schema.json','fragments/base.schema.json','fragments/nodes/base.schema.json']){
    const schema=JSON.parse(await readFile(`src/schema/${file}`,'utf8')),validate=new Ajv({strict:true}).compile(schema),value=n=>file.includes('/nodes/')?n:spec(n);
    for(const node of [availability([]),availability(),availability(count100()),availability(undefined,{title:'😀'.repeat(200),venue:'😀'.repeat(200),timeZoneLabel:'😀'.repeat(100),description:'😀'.repeat(2000),source:{label:'😀'.repeat(200)}})])assert.equal(validate(value(node)),true,JSON.stringify(validate.errors));
    for(const patch of [{title:''},{title:'😀'.repeat(201)},{title:{$:'other'}},{venue:''},{venue:'x'.repeat(201)},{partySize:0},{partySize:21},{partySize:1.1},{partySize:'2'},{timeZoneLabel:''},{timeZoneLabel:'😀'.repeat(101)},{description:'x'.repeat(2001)},{source:{label:''}},{source:{label:'x'.repeat(201)}},{source:{label:'Source',url:''}},{source:{label:'Source',url:'x'.repeat(2049)}},{source:{label:'Source',synthetic:true}},{slots:count100().concat(slot())},{slots:null},{bind:'other'},{bookingUrl:'https://example.com'},{initial:'one'},{disabled:true}]){
      const n=availability(undefined,patch);assert.equal(validate(value(n)),false,JSON.stringify(n));reject(spec(n));
    }
    for(const patch of [{id:''},{id:'1bad'},{id:'a'.repeat(81)},{date:'0000-01-01'},{date:'2024-2-29'},{date:'2024-02-29\n'},{time:'9:00'},{time:'24:00'},{time:'09:60'},{time:'09:00\n'},{time:'09:00Z'},{time:'09:00:00'},{time:null},{available:null},{available:'true'},{available:1},{unknown:true}])assert.equal(validate(value(availability([slot(patch)]))),false,JSON.stringify(patch));
  }
});

test('availability required fields, nulls, non-JSON values and negative bounds are rejected publicly',()=>{
  for(const name of ['title','venue','partySize','timeZoneLabel','slots']){const node=availability();delete node[name];reject(spec(node));reject(spec(availability(undefined,{[name]:null})));}
  for(const name of ['id','date','time','available']){const entry=slot();delete entry[name];reject(spec(availability([entry])));}
  for(const patch of [{partySize:-1},{partySize:Infinity},{description:null},{source:null},{source:{url:'https://example.com'}},{source:{label:'x',url:null}},{title:()=>{}}])reject(spec(availability(undefined,patch)));
  assert.equal(evaluateState(spec(),{other:1}).ok,true);
});

test('availability Gregorian endpoints, leap days, strict times and exact duplicate paths',()=>{
  for(const date of ['0001-01-01','0099-12-31','1900-02-28','2000-02-29','9999-12-31'])for(const time of ['00:00','23:59'])assert.equal(validateDocument(spec(availability([slot({date,time})]))).ok,true);
  for(const date of ['1900-02-29','2001-02-29','2024-02-30','2024-04-31'])reject(spec(availability([slot({date})])),'AVAILABILITY_DATE','/body/0/slots/0/date');
  for(const date of ['','0000-01-01','10000-01-01','2024-00-01','2024-13-01','2024-01-00','2024-01-32',' 2024-02-29','2024-02-29T18:00:00Z'])reject(spec(availability([slot({date})])));
  reject(spec(availability([slot(),slot({time:'19:00'})])),'DUPLICATE_ID','/body/0/slots/1/id');
  reject(spec(availability([slot(),slot({id:'other',available:false})])),'DUPLICATE_SLOT','/body/0/slots/1/time');
  reject(spec(undefined,{body:[{type:'section',children:[availability([slot(),slot({id:'other'})])]}]}),'DUPLICATE_SLOT','/body/0/children/0/slots/1/time');
  assert.equal(validateDocument(spec(undefined,{body:[availability(),availability()]})).ok,true);
});

test('availability source reuses safe absolute HTTP(S) policy and exact error path',()=>{
  for(const url of ['https://example.com/details?q=1#dinner','HTTP://example.com:8080/path'])assert.equal(validateDocument(spec(availability(undefined,{source:{label:'Supplied source',url}}))).ok,true);
  for(const url of ['javascript:alert(1)','//example.com','/relative','#fragment','mailto:a@example.com','tel:+123','https://u:p@example.com','https://example.com/ path','https://example.com\\escape',' https://example.com','data:text/html,x','https://example.com/\n'])reject(spec(availability(undefined,{source:{label:'Source',url}})),'UNSAFE_URL','/body/0/source/url');
});

test('availability source arrays are immutable; chronology is stable and authored values remain exact',()=>{
  const input=spec(),original=JSON.stringify(input);const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}};freeze(input);
  const validated=validateDocument(input);assert.equal(validated.ok,true);assert.equal(Object.isFrozen(validated.document.body[0].slots),true);
  const x=setup(input);assert.equal(JSON.stringify(input),original);assert.deepEqual(visible(x),['one','full','two','late']);assert.deepEqual([...x.select.options].map(o=>o.value),['','2024-02-29','2024-03-01']);
  assert.equal(x.host.querySelector('.iui-availability-time-zone').textContent,'Literal venue time');assert.equal(x.host.querySelector('.iui-availability-venue').textContent,'Example kitchen');
  assert.equal(button(x).querySelector('.iui-availability-time').dateTime,'2024-02-29T18:00');assert.equal(button(x).querySelector('.iui-availability-date').dateTime,'2024-02-29');
  assert.equal(validated.document.body[0].source,undefined);assert.equal(validated.document.body[0].description,undefined);assert.equal(x.host.querySelector('.iui-availability-source'),null);x.controller.dispose();
});

test('availability mount/filter/clear/host refresh never emit; selection persists even under a different date',()=>{
  const x=setup();let calls=0;x.host.addEventListener('iui:reservation-choice',()=>calls++);const original=[...x.host.querySelectorAll('.iui-availability-slot')];
  assert.equal(x.clear.getAttribute('aria-disabled'),'true');x.clear.focus();x.clear.click();assert.equal(x.dom.window.document.activeElement,x.clear);assert.equal(calls,0);
  button(x).click();assert.equal(calls,1);assert.deepEqual(chosen(x),['one']);assert.equal(x.clear.getAttribute('aria-disabled'),'false');
  x.select.focus();change(x,'2024-03-01');assert.deepEqual(visible(x),['late']);assert.deepEqual(chosen(x),['one']);assert.match(x.selection.textContent,/2024-02-29 18:00/);assert.equal(x.counts.textContent,'Showing 1 supplied options: 1 available; 0 unavailable.');
  x.controller.setState({other:1});assert.equal(calls,1);assert.equal(x.select.value,'2024-03-01');assert.equal(x.dom.window.document.activeElement,x.select);
  for(let i=0;i<3;i++){change(x,'2024-02-29');change(x,'');}assert.deepEqual([...x.host.querySelectorAll('.iui-availability-slot')],original);
  assert.equal(x.counts.textContent,'Showing 4 supplied options: 3 available; 1 unavailable.');x.clear.focus();x.clear.click();assert.deepEqual(chosen(x),[]);assert.equal(x.status.textContent,'');assert.equal(x.dom.window.document.activeElement,x.clear);x.clear.click();assert.equal(calls,1);x.controller.dispose();
});

test('availability explicit click emits one owner-window bubbling cancelable noncomposed event with frozen primitive data',()=>{
  for(const mountFn of [mount,browserMount]){
    const x=setup(spec(),{},'en',undefined,mountFn);let received;x.host.addEventListener('iui:reservation-choice',e=>received=e);
    button(x).click();assert.ok(received instanceof x.dom.window.CustomEvent);assert.equal(received.target,x.root);assert.equal(received.bubbles,true);assert.equal(received.cancelable,true);assert.equal(received.composed,false);
    assert.deepEqual(received.detail,{componentId:'dinner',slotId:'one',date:'2024-02-29',time:'18:00',partySize:2,venue:'Example kitchen',timeZoneLabel:'Literal venue time'});assert.equal(Object.isFrozen(received.detail),true);assert.throws(()=>received.detail.slotId='other',TypeError);
    assert.equal(x.status.textContent,'Local choice selected. No reservation has been made.');assert.equal(browserValidate(spec()).ok,true);x.controller.dispose();
  }
  const x=setup(spec(availability()));x.host.addEventListener('iui:reservation-choice',e=>assert.equal(e.detail.componentId,null));button(x).click();x.controller.dispose();
});

test('availability cancelled choices preserve prior selection; explicit same-slot repeat emits exactly once per click',()=>{
  const x=setup();let events=0,cancel=false;x.host.addEventListener('iui:reservation-choice',e=>{events++;if(cancel)e.preventDefault();});
  cancel=true;button(x).click();assert.deepEqual(chosen(x),[]);assert.equal(x.status.textContent,'The local choice was not accepted.');assert.equal(x.clear.getAttribute('aria-disabled'),'true');
  cancel=false;button(x).click();button(x).click();assert.equal(events,3);assert.deepEqual(chosen(x),['one']);
  cancel=true;button(x,'two').click();assert.equal(events,4);assert.deepEqual(chosen(x),['one']);assert.equal(x.root.dataset.status,'not-accepted');
  cancel=false;button(x,'two').click();assert.equal(events,5);assert.deepEqual(chosen(x),['two']);x.controller.dispose();
});

test('availability reentrant choice/filter/clear are suppressed until native dispatch returns',()=>{
  const x=setup();button(x).click();let calls=0;
  x.host.addEventListener('iui:reservation-choice',()=>{calls++;button(x,'late').click();click(x,button(x));x.clear.click();change(x,'2024-03-01');});
  button(x,'two').click();assert.equal(calls,1);assert.equal(x.select.value,'');assert.deepEqual(chosen(x),['two']);assert.deepEqual(visible(x),['one','full','two','late']);
  button(x).click();assert.equal(calls,2);assert.deepEqual(chosen(x),['one']);x.controller.dispose();
});

test('availability hidden, unavailable and inherited disabled controls reject even forged events',()=>{
  const x=setup();let events=0;x.host.addEventListener('iui:reservation-choice',()=>events++);change(x,'2024-03-01');button(x).click();click(x,button(x));button(x,'full').click();click(x,button(x,'full'));assert.equal(events,0);
  change(x,'');button(x,'full').disabled=false;click(x,button(x,'full'));assert.equal(events,0);x.root.hidden=true;click(x,button(x));change(x,'2024-03-01');assert.equal(x.select.value,'');assert.equal(events,0);x.root.hidden=false;
  button(x).click();const selected=x.selection.textContent;const fieldset=x.dom.window.document.createElement('fieldset');x.host.replaceWith(fieldset);fieldset.append(x.host);fieldset.disabled=true;
  click(x,button(x,'two'));click(x,x.clear);change(x,'2024-03-01');assert.equal(x.select.value,'');assert.equal(x.selection.textContent,selected);assert.equal(events,1);
  fieldset.disabled=false;button(x,'two').click();assert.equal(events,2);x.controller.dispose();
});

test('availability invalid filter values are rolled back; supplied empty and maximum states are honest',()=>{
  const x=setup();change(x,'2024-03-01');change(x,'2099-01-01');assert.equal(x.select.value,'2024-03-01');assert.deepEqual(visible(x),['late']);x.controller.dispose();
  const empty=setup(spec(availability([])));assert.equal(empty.select.disabled,true);assert.equal(empty.select.options.length,1);assert.equal(empty.clear.disabled,false);assert.equal(empty.clear.getAttribute('aria-disabled'),'true');assert.equal(empty.host.querySelector('.iui-availability-empty').textContent,'No time options supplied.');assert.equal(empty.counts.textContent,'Showing 0 supplied options: 0 available; 0 unavailable.');empty.controller.dispose();
  const max=setup(spec(availability(count100())));assert.equal(max.host.querySelectorAll('.iui-availability-slot').length,100);assert.equal(max.select.options.length,2);max.controller.dispose();
});

test('availability local controls never submit or add names, bindings or form snapshot values',async()=>{
  let resolve,values,calls=0,events=0;
  const node={type:'form',label:'Local form',action:'save',children:[{type:'input',kind:'text',label:'Note',bind:'note'},multi()]};
  const x=setup(spec(node,{state:{note:'supplied',other:0}}),{actions:{save:ctx=>{calls++;values=ctx.values;return new Promise(r=>resolve=r);}}});
  x.host.addEventListener('iui:reservation-choice',()=>events++);const form=x.host.querySelector('form');let submits=0;form.addEventListener('submit',()=>submits++);
  button(x).click();change(x,'2024-03-01');x.clear.click();assert.equal(calls,0);assert.equal(submits,0);assert.equal(events,1);
  assert.equal(x.root.querySelector('[name],[data-bind]'),null);assert.ok([...x.root.querySelectorAll('button')].every(el=>el.type==='button'));
  assert.deepEqual([...new x.dom.window.FormData(form).entries()],[]);
  button(x,'late').click();form.dispatchEvent(new x.dom.window.Event('submit',{bubbles:true,cancelable:true}));assert.equal(calls,1);assert.deepEqual(values,{note:'supplied'});assert.equal(x.select.matches(':disabled'),true);
  click(x,button(x,'late'));click(x,x.clear);change(x,'2024-02-29');assert.equal(events,2);assert.equal(x.select.value,'2024-03-01');assert.deepEqual(chosen(x),['late']);
  x.controller.setState({other:1});assert.equal(x.select.value,'2024-03-01');resolve();await Promise.resolve();await Promise.resolve();assert.equal(x.select.matches(':disabled'),false);x.controller.dispose();
});

test('availability external native form reset preserves filter/selection and contributes no FormData',()=>{
  const x=setup(spec(),{},'en','<form id="outer"><div id="host"></div></form>');let calls=0;x.host.addEventListener('iui:reservation-choice',()=>calls++);
  button(x).click();change(x,'2024-03-01');x.dom.window.document.getElementById('outer').reset();assert.equal(x.select.value,'2024-03-01');assert.deepEqual(visible(x),['late']);assert.deepEqual(chosen(x),['one']);assert.match(x.selection.textContent,/2024-02-29 18:00/);assert.equal(calls,1);
  assert.deepEqual([...new x.dom.window.FormData(x.dom.window.document.getElementById('outer')).entries()],[]);x.controller.dispose();
});

test('availability invalid mount/update is atomic; valid replacement and disposal detach old listeners without painting',()=>{
  for(const action of ['update','dispose']){
    const x=setup();button(x).click();change(x,'2024-03-01');x.select.focus();const before=x.host.innerHTML;
    assert.throws(()=>x.controller.update(spec(availability([slot({date:'1900-02-29'})]))));assert.equal(x.host.innerHTML,before);assert.equal(x.dom.window.document.activeElement,x.select);assert.throws(()=>mount(x.host,spec(availability([slot({time:'24:00'})]))));assert.equal(x.host.innerHTML,before);
    const old=x.root,oldChoice=button(x,'late'),html=old.outerHTML;let calls=0;old.addEventListener('iui:reservation-choice',()=>calls++);
    if(action==='update')x.controller.update(spec());else x.controller.dispose();oldChoice.click();x.clear.click();change(x,'');assert.equal(calls,0);assert.equal(old.outerHTML,html);assert.equal(old.isConnected,false);
    if(action==='update'){assert.equal(x.host.querySelector('.iui-availability-filter').value,'');assert.equal(x.host.querySelector('[aria-pressed=true]'),null);}x.controller.dispose();x.controller.dispose();
  }
});

test('availability synchronous event-host update/dispose never paints old or replacement DOM',()=>{
  for(const action of ['update','dispose'])for(const cancel of [false,true]){
    const x=setup();button(x).click();const old=x.root,choice=button(x,'two'),before=old.outerHTML;let calls=0;
    x.host.addEventListener('iui:reservation-choice',e=>{calls++;if(cancel)e.preventDefault();if(action==='update')x.controller.update(spec());else x.controller.dispose();});
    choice.click();assert.equal(calls,1);assert.equal(old.outerHTML,before);assert.equal(old.isConnected,false);
    if(action==='update'){assert.equal(x.host.querySelector('.iui-availability-status').textContent,'');assert.equal(x.host.querySelector('[aria-pressed=true]'),null);}x.controller.dispose();
  }
});

test('availability native event listener exceptions do not become renderer errors or booking failure claims',()=>{
  const errors=[],virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM('<div id="host"></div>',{virtualConsole}),host=dom.window.document.getElementById('host'),controller=mount(host,spec());
  host.addEventListener('iui:reservation-choice',()=>{throw Error('host listener failure');});host.querySelector('[data-slot-id=one] button').click();
  assert.equal(errors.length,1);assert.equal(host.querySelector('[aria-pressed=true]').parentElement.dataset.slotId,'one');assert.equal(host.querySelector('.iui-availability-status').textContent,'Local choice selected. No reservation has been made.');controller.dispose();
});

test('availability ownerDocument event fallback, iframe ownership, multiple roots and reserved labels',()=>{
  const a=setup(),b=setup();assert.notEqual(a.select.id,b.select.id);let event;Object.defineProperty(a.dom.window,'CustomEvent',{value:undefined,configurable:true});a.host.addEventListener('iui:reservation-choice',e=>event=e);button(a).click();assert.equal(event.type,'iui:reservation-choice');assert.equal(event.composed,false);assert.equal(Object.isFrozen(event.detail),true);
  for(const x of [a,b]){const ids=[...x.host.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);for(const el of x.root.querySelectorAll('[id]'))assert.match(el.id,/^iui-availability-internal-/);for(const attr of ['aria-labelledby','aria-describedby'])for(const id of x.root.getAttribute(attr).split(' '))assert.ok(x.dom.window.document.getElementById(id));assert.equal(x.root.querySelector('label').htmlFor,x.select.id);}
  assert.deepEqual(chosen(b),[]);a.controller.dispose();b.controller.dispose();
  const dom=new JSDOM('<iframe></iframe>'),frame=dom.window.document.querySelector('iframe'),doc=frame.contentDocument,host=doc.createElement('div');doc.body.append(host);const controller=mount(host,spec());let seen;host.addEventListener('iui:reservation-choice',e=>seen=e);host.querySelector('[data-slot-id=one] button').click();assert.ok(seen instanceof frame.contentWindow.CustomEvent);assert.ok([...host.querySelectorAll('*')].every(el=>el.ownerDocument===doc));controller.dispose();
});

test('availability literal hostile text, safe disclosed source links and disabled-fieldset source reading remain ordinary',()=>{
  const literal='<script>alert(1)</script><img src=x onerror=alert(1)> 😀 中文';
  const x=setup(spec(availability(undefined,{title:literal,venue:literal,description:literal,timeZoneLabel:literal,source:{label:literal,url:'https://example.com/?q=%3Cscript%3E'}})));
  for(const cls of ['title','venue','description','time-zone'])assert.equal(x.host.querySelector('.iui-availability-'+cls).textContent,literal);assert.equal(x.host.querySelector('script,img,iframe,link,svg'),null);
  const link=x.host.querySelector('a');assert.equal(link.href,'https://example.com/?q=%3Cscript%3E');assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');assert.equal(link.referrerPolicy,'no-referrer');assert.match(link.textContent,/Opens in a new tab/);
  const fieldset=x.dom.window.document.createElement('fieldset');fieldset.disabled=true;x.host.replaceWith(fieldset);fieldset.append(x.host);let prevented;link.addEventListener('click',e=>{prevented=e.defaultPrevented;e.preventDefault();});click(x,link);assert.equal(prevented,false);x.controller.dispose();
  const y=setup(spec(availability(undefined,{source:{label:'Supplied label only'}})));assert.equal(y.host.querySelector('a'),null);assert.equal(y.host.querySelector('.iui-availability-source').textContent,'Source: Supplied label only');y.controller.dispose();
});

test('availability localized disclosure, genuine Arabic-first content and unrelated focus survive local work',()=>{
  const x=setup(spec(undefined,{description:'خيارات وقت عشاء مقدمة دون تحويل المنطقة الزمنية.'}),{},'zh-CN');assert.equal(x.host.querySelector('.iui-root').dir,'auto');assert.equal(x.host.querySelector('.iui-description').textContent,'خيارات وقت عشاء مقدمة دون تحويل المنطقة الزمنية.');assert.equal(x.clear.textContent,'清除本地选择');assert.equal(x.select.options[0].textContent,'所有日期');assert.match(x.host.querySelector('.iui-availability-note').textContent,/不会进行预订/);assert.equal(button(x,'full').disabled,true);assert.match(button(x,'full').textContent,/不可选/);
  const outside=x.dom.window.document.getElementById('outside');outside.focus();x.controller.setState({other:1});assert.equal(x.dom.window.document.activeElement,outside);button(x).click();assert.equal(x.dom.window.document.activeElement,outside);assert.equal(x.status.textContent,'已进行本地选择，尚未完成任何预订。');x.controller.dispose();
});

test('availability actual standalone compile is deterministic and local interactions require no network/storage/timers',async()=>{
  const input=spec(availability([slot(),slot({id:'other',date:'9999-12-31'})],{title:'</script><script>window.pwned=1</script>',source:{label:'Example',url:'https://example.com'}}));
  const html=await compileHtml(input);assert.equal(html,await compileHtml(input));let calls=0;
  const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(win){for(const name of ['fetch','XMLHttpRequest','WebSocket'])win[name]=()=>{calls++;throw Error('network');};for(const name of ['localStorage','sessionStorage'])Object.defineProperty(win,name,{get(){calls++;throw Error('storage');}});win.setInterval=()=>{calls++;throw Error('timer');};}});
  const doc=dom.window.document;let events=0;doc.addEventListener('iui:reservation-choice',()=>events++);doc.querySelector('[data-slot-id=one] button').click();const select=doc.querySelector('.iui-availability-filter');select.value='9999-12-31';select.dispatchEvent(new dom.window.Event('change'));doc.querySelector('.iui-availability-clear').click();
  assert.equal(events,1);assert.equal(calls,0);assert.equal(dom.window.pwned,undefined);assert.equal(doc.querySelector('.iui-availability-title').textContent,input.body[0].title);assert.equal(doc.querySelectorAll('script[src],link[href],img,iframe').length,0);assert.deepEqual(JSON.parse(doc.getElementById('iui-data').textContent),validateDocument(input).document);
  await assert.rejects(()=>compileHtml(spec(availability([slot({date:'1900-02-29'})]))));dom.window.close();
});

test('availability fallback works with a null owner window and noncomposed events stay inside a shadow root',()=>{
  const dom=new JSDOM('<div id="parent"></div>'),doc=dom.window.document.implementation.createHTMLDocument('Detached window');assert.equal(doc.defaultView,null);const host=doc.createElement('div');doc.body.append(host);const controller=mount(host,spec());let event;host.addEventListener('iui:reservation-choice',e=>event=e);host.querySelector('[data-slot-id=one] button').click();assert.equal(event.type,'iui:reservation-choice');assert.equal(event.detail.slotId,'one');assert.equal(event.composed,false);controller.dispose();
  const parent=dom.window.document.getElementById('parent'),shadow=parent.attachShadow({mode:'open'}),inner=dom.window.document.createElement('div');shadow.append(inner);const c=mount(inner,spec());let inside=0,outside=0;inner.addEventListener('iui:reservation-choice',()=>inside++);parent.addEventListener('iui:reservation-choice',()=>outside++);inner.querySelector('[data-slot-id=one] button').click();assert.equal(inside,1);assert.equal(outside,0);c.dispose();
});

test('availability host CustomEvent getter/constructor replacement prevents stale event dispatch',()=>{
  for(const hook of ['getter','constructor'])for(const action of ['update','dispose']){
    const x=setup(),Original=x.dom.window.CustomEvent,old=x.root,before=old.outerHTML,choice=button(x);let calls=0;
    old.addEventListener('iui:reservation-choice',()=>calls++);
    const replace=()=>{if(action==='update')x.controller.update(spec());else x.controller.dispose();};
    if(hook==='getter')Object.defineProperty(x.dom.window,'CustomEvent',{configurable:true,get(){replace();return Original;}});
    else Object.defineProperty(x.dom.window,'CustomEvent',{configurable:true,value:class extends Original{constructor(...args){super(...args);replace();}}});
    choice.click();assert.equal(calls,0);assert.equal(old.outerHTML,before);assert.equal(old.isConnected,false);
    if(action==='update'){assert.equal(x.host.querySelector('.iui-availability-status').textContent,'');assert.equal(x.host.querySelector('[aria-pressed=true]'),null);}x.controller.dispose();
  }
});

test('availability emits no mount/baseline/host-refresh/form-reset events before any local activation',()=>{
  const dom=new JSDOM('<form><div id="host"></div></form>'),doc=dom.window.document,host=doc.getElementById('host');let events=0;doc.addEventListener('iui:reservation-choice',()=>events++);
  const controller=mount(host,spec());controller.setState({other:1});const select=host.querySelector('select');select.value='2024-03-01';select.dispatchEvent(new dom.window.Event('change'));host.querySelector('.iui-availability-clear').click();doc.querySelector('form').reset();assert.equal(events,0);controller.dispose();assert.equal(events,0);
});
