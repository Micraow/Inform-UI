import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import {JSDOM} from 'jsdom';
import {mount, validateDocument, compileHtml, evaluateState} from '../dist/index.js';

const event = (extra = {}) => ({id:'one',date:'2024-02-29',title:'Reading session',...extra});
const agenda = (events = [event()], extra = {}) => ({type:'agenda',label:'Supplied agenda',events,...extra});
const spec = (node = agenda(), extra = {}) => ({version:'iui/1',state:{other:0},body:[node],...extra});
const setup = (input = spec(), options = {}, lang = 'en', shell = '<div id="host"></div><button id="outside">Outside</button>') => {
  const dom = new JSDOM(`<html lang="${lang}"><body>${shell}</body></html>`);
  const host = dom.window.document.getElementById('host');
  const controller = mount(host, input, options);
  return {dom,host,controller,select:host.querySelector('.iui-agenda-filter')};
};
const dispatch = (x, el, type) => el.dispatchEvent(new x.dom.window.Event(type,{bubbles:true,cancelable:true}));
const filter = (x, value, select=x.select) => {select.value=value;dispatch(x,select,'change');};
const groupDates = x => [...x.host.querySelectorAll('.iui-agenda-date:not([hidden])')].map(el=>el.dataset.date);
const reject = (input, code, path) => {const result=validateDocument(input);assert.equal(result.ok,false,JSON.stringify(input));if(code)assert.ok(result.issues.some(issue=>issue.code===code&&issue.path===path),JSON.stringify(result.issues));};
const multi = () => agenda([
  event({id:'late',date:'2024-03-01',start:'09:00',end:'10:00'}),
  event({id:'second',start:'09:00',description:'Keep disclosure',location:'Reading room'}),
  event({id:'noTimeB'}),
  event({id:'first',start:'08:30'}),
  event({id:'tied',start:'09:00',status:'cancelled'}),
  event({id:'noTimeA'})
]);

test('agenda full and Base generated schemas enforce fields, bounds, key IDs and literal time shape', async () => {
  for (const path of ['../src/schema/iui.schema.json','../src/schema/fragments/base.schema.json']) {
    const schema=JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
    const validate=new Ajv({strict:true,allErrors:true}).compile(schema);
    for (const node of [agenda([]),agenda([event({start:'00:00',end:'23:59'})]),agenda(Array.from({length:100},(_,i)=>event({id:'e'+i})))]) assert.equal(validate(spec(node)),true);
    const invalid = [
      agenda(undefined,{label:''}),agenda(undefined,{label:'😀'.repeat(201)}),agenda(undefined,{description:'x'.repeat(2001)}),agenda(undefined,{events:undefined}),agenda(undefined,{bind:'other'}),agenda(undefined,{timezone:'UTC'}),
      agenda(Array.from({length:101},(_,i)=>event({id:'e'+i}))),
      ...[{id:''},{id:'1bad'},{id:'a'.repeat(81)},{title:''},{title:'x'.repeat(201)},{title:{$:'other'}},{date:'2024-2-29'},{date:'0000-01-01'},{start:'24:00'},{start:'09:60'},{start:'9:00'},{start:'09:00Z'},{start:'09:00\n'},{end:'11:00'},{start:'10:00',end:'11:00:00'},{status:'complete'},{url:'x'.repeat(2049)},{description:'x'.repeat(2001)},{location:'x'.repeat(501)},{unknown:true}].map(patch=>agenda([event(patch)]))
    ];
    for (const node of invalid) {const value=spec(node);assert.equal(validate(value),false,JSON.stringify(node));reject(value);}
    assert.equal(validate(spec(agenda([event({title:'😀'.repeat(200),location:'😀'.repeat(500),description:'😀'.repeat(2000)})],{label:'😀'.repeat(200),description:'😀'.repeat(2000)}))),true);
  }
});

test('agenda public semantics reject impossible Gregorian dates with exact paths and accept endpoints', () => {
  for (const date of ['0001-01-01','0099-12-31','1900-02-28','2000-02-29','2024-02-29','9999-12-31']) assert.equal(validateDocument(spec(agenda([event({date})]))).ok,true,date);
  for (const date of ['1900-02-29','2001-02-29','2024-02-30','2024-04-31']) reject(spec(agenda([event({date})])),'AGENDA_DATE','/body/0/events/0/date');
  for (const date of ['','0000-01-01','10000-01-01','2024-01-00','2024-00-01','2024-13-01','2024-01-32','2024-01-01\n','2024-01-01T00:00:00Z',' 2024-01-01',0,null,{}]) reject(spec(agenda([event({date})])));
});

test('agenda same-day end is strictly after start; IDs are agenda-local unique keys', () => {
  for (const [start,end] of [['09:00','09:00'],['23:00','01:00'],['00:01','00:00']]) reject(spec(agenda([event({start,end})])),'AGENDA_TIME','/body/0/events/0/end');
  for (const extra of [{start:'00:00'},{start:'23:59'},{start:'00:00',end:'00:01'}]) assert.equal(validateDocument(spec(agenda([event(extra)]))).ok,true);
  reject(spec(agenda([event(),event()])),'DUPLICATE_ID','/body/0/events/1/id');
  assert.equal(validateDocument(spec(agenda(),{body:[agenda(),agenda()]})).ok,true);
  reject(spec(agenda(),{body:[{type:'section',children:[agenda([event({start:'20:00',end:'19:00'})])]}]}),'AGENDA_TIME','/body/0/children/0/events/0/end');
});

test('agenda absolute HTTP(S) URL policy shares core safety and reports the event path', () => {
  for(const url of ['https://example.com/details?event=1#notes','HTTP://example.com:8080/path']) assert.equal(validateDocument(spec(agenda([event({url})]))).ok,true);
  for(const url of ['javascript:alert(1)','//example.com','/relative','#fragment','mailto:a@example.com','tel:+123','https://u:p@example.com','https://example.com/ path','https://example.com\\escape',' https://example.com','data:text/html,x','https://example.com/\n']) reject(spec(agenda([event({url})])),'UNSAFE_URL','/body/0/events/0/url');
});

test('agenda validation and stable chronological grouping never mutate caller data or fill missing fields', () => {
  const input=spec(multi()),before=JSON.stringify(input);
  const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}};freeze(input);
  const validated=validateDocument(input);assert.equal(validated.ok,true);assert.equal(Object.isFrozen(validated.document.body[0].events),true);
  const x=setup(input);assert.equal(JSON.stringify(input),before);
  assert.deepEqual([...x.host.querySelectorAll('.iui-agenda-event')].map(el=>el.dataset.eventId),['noTimeB','noTimeA','first','second','tied','late']);
  assert.deepEqual(groupDates(x),['2024-02-29','2024-03-01']);
  assert.equal(validated.document.body[0].events[2].start,undefined);assert.equal(validated.document.body[0].events[2].status,undefined);
  assert.match(x.host.querySelector('[data-event-id=noTimeB] .iui-agenda-time').textContent,/Time not supplied/);
  x.controller.dispose();
});

test('agenda native date/time markup preserves exact supplied labels and cancellation is explicit text', () => {
  const x=setup(spec(multi()));
  assert.deepEqual([...x.host.querySelectorAll('.iui-agenda-date-heading time')].map(el=>[el.textContent,el.dateTime]),[['2024-02-29','2024-02-29'],['2024-03-01','2024-03-01']]);
  assert.deepEqual([...x.host.querySelectorAll('[data-event-id=late] time')].map(el=>[el.textContent,el.dateTime]),[['09:00','2024-03-01T09:00'],['10:00','2024-03-01T10:00']]);
  assert.equal(x.host.querySelector('[data-event-id=first] time').dateTime,'2024-02-29T08:30');
  assert.equal(x.host.querySelector('[data-event-id=noTimeA] time'),null);
  assert.equal(x.host.querySelector('[data-event-id=tied] .iui-agenda-cancelled').textContent,'Cancelled');
  assert.equal(x.host.querySelector('[data-event-id=tied]').tagName,'LI');
  assert.match(x.host.querySelector('.iui-agenda-note').textContent,/No timezone conversion/);
  x.controller.dispose();
});

test('agenda filter options are finite sorted supplied dates; repeated filtering mounts each card exactly once', () => {
  const x=setup(spec(multi()));const items=[...x.host.querySelectorAll('.iui-agenda-event')],details=x.host.querySelector('details');details.open=true;
  assert.deepEqual([...x.select.options].map(el=>el.value),['','2024-02-29','2024-03-01']);
  x.select.focus();for(let i=0;i<5;i++){filter(x,'2024-03-01');assert.deepEqual(groupDates(x),['2024-03-01']);filter(x,'2024-02-29');assert.deepEqual(groupDates(x),['2024-02-29']);}
  assert.equal(x.dom.window.document.activeElement,x.select);assert.deepEqual([...x.host.querySelectorAll('.iui-agenda-event')],items);assert.equal(x.host.querySelector('details'),details);assert.equal(details.open,true);
  filter(x,'');assert.deepEqual(groupDates(x),['2024-02-29','2024-03-01']);assert.equal(x.host.querySelectorAll('.iui-agenda-event').length,6);x.controller.dispose();
});

test('agenda unrelated host patches preserve selection, disclosure DOM and focus without claiming state values', () => {
  const x=setup(spec(multi()));const details=x.host.querySelector('details');details.open=true;filter(x,'2024-02-29');const summary=details.querySelector('summary');summary.focus();
  x.controller.setState({other:1});assert.equal(x.select.value,'2024-02-29');assert.equal(details.open,true);assert.equal(x.dom.window.document.activeElement,summary);assert.equal(x.host.querySelector('details'),details);
  const outside=x.dom.window.document.getElementById('outside');outside.focus();x.controller.setState({other:2});filter(x,'2024-03-01');assert.equal(x.dom.window.document.activeElement,outside);assert.deepEqual(x.controller.getState(),{other:2});
  assert.equal(x.select.hasAttribute('name'),false);assert.equal(x.select.hasAttribute('data-bind'),false);assert.deepEqual(evaluateState(spec(multi()),{other:3}).state,{other:3});x.controller.dispose();
});

test('agenda empty and long finite lists remain explicit with no invented current/upcoming semantics', () => {
  const empty=setup(spec(agenda([])));assert.equal(empty.host.querySelector('.iui-agenda-empty').textContent,'No events supplied.');assert.equal(empty.select.disabled,true);assert.equal(empty.host.querySelectorAll('li').length,0);empty.controller.dispose();
  const events=Array.from({length:100},(_,i)=>event({id:'e'+i,date:'0001-01-01',title:'長'.repeat(200),location:'道'.repeat(500),description:'文'.repeat(2000)}));
  const x=setup(spec(agenda(events)));assert.equal(x.host.querySelectorAll('li').length,100);assert.equal(x.select.options.length,2);assert.equal(x.host.querySelectorAll('details').length,100);assert.equal(x.host.querySelectorAll('img,iframe,script').length,0);x.controller.dispose();
});

test('agenda text including adversarial HTML is literal; safe links are disclosed without preload', () => {
  const literal='<script>alert(1)</script><img src=x onerror=alert(1)> \u202e 😀 中文 & "\n';
  const x=setup(spec(agenda([event({title:literal,description:literal,location:literal,url:'https://example.com/?q=%3Cscript%3E'})],{label:literal,description:literal})));
  for(const selector of ['.iui-agenda-label','.iui-agenda-description','.iui-agenda-event-title','.iui-agenda-event-description','.iui-agenda-location-value'])assert.equal(x.host.querySelector(selector).textContent,literal);
  assert.equal(x.host.querySelectorAll('script,img,svg,iframe,link').length,0);
  const a=x.host.querySelector('a');assert.equal(a.target,'_blank');assert.equal(a.rel,'noopener noreferrer');assert.equal(a.referrerPolicy,'no-referrer');assert.match(a.textContent,/Opens in a new tab/);assert.equal(a.getAttribute('href'),'https://example.com/?q=%3Cscript%3E');x.controller.dispose();
});

test('agenda English/Chinese labels, real first-visible Arabic RTL and reserved IDs are independent', () => {
  const input=spec(agenda([event({description:'描述',location:'地点',status:'cancelled'})]),{description:'مثال عربي أصلي لجدول المواعيد.'});
  const x=setup(input,{},'zh-CN');assert.equal(x.host.querySelector('.iui-root').dir,'auto');assert.equal(x.host.querySelector('.iui-description').textContent,input.description);
  assert.equal(x.host.querySelector('.iui-agenda-filter-label').textContent,'按日期筛选');assert.equal(x.select.options[0].textContent,'所有日期');assert.equal(x.host.querySelector('summary').textContent,'日程详情');assert.equal(x.host.querySelector('.iui-agenda-cancelled').textContent,'已取消');assert.match(x.host.querySelector('.iui-agenda-note').textContent,/不进行时区转换/);
  for(const el of x.host.querySelectorAll('.iui-agenda [id]'))assert.match(el.id,/^iui-agenda-internal-iui-\d+-\d+-/);
  const section=x.host.querySelector('.iui-agenda');for(const name of ['aria-labelledby','aria-describedby'])for(const id of section.getAttribute(name).split(' '))assert.ok(x.dom.window.document.getElementById(id));
  assert.equal(x.host.querySelector('label').htmlFor,x.select.id);x.controller.dispose();
});

test('agenda inherited disabled fieldsets reject forged filter edits and resume after enabling', () => {
  const input=spec(multi(),{state:{other:0,locked:true},body:[{type:'field',label:'Read-only controls',disabled:{$:'locked'},children:[multi()]}]});
  const x=setup(input);assert.equal(x.select.matches(':disabled'),true);filter(x,'2024-03-01');assert.equal(x.select.value,'');assert.deepEqual(groupDates(x),['2024-02-29','2024-03-01']);
  x.controller.setState({locked:false});filter(x,'2024-03-01');assert.deepEqual(groupDates(x),['2024-03-01']);x.controller.setState({locked:true});filter(x,'2024-02-29');assert.equal(x.select.value,'2024-03-01');assert.deepEqual(groupDates(x),['2024-03-01']);x.controller.dispose();
});

test('agenda enclosing forms submit no filter values; busy disables select and ignores forged events', async () => {
  let calls=0, values, resolve, signal;
  const input=spec(multi(),{body:[{type:'form',label:'Local form',action:'save',children:[multi()]}]});
  const x=setup(input,{actions:{save:args=>{calls++;({values,signal}=args);return new Promise(r=>resolve=r);}}});
  const form=x.host.querySelector('form');filter(x,'2024-02-29');x.host.querySelector('summary').click();assert.equal(calls,0);assert.deepEqual([...new x.dom.window.FormData(form).entries()],[]);
  dispatch(x,form,'submit');assert.equal(calls,1);assert.deepEqual(values,{});assert.equal(x.select.matches(':disabled'),true);
  filter(x,'2024-03-01');assert.equal(x.select.value,'2024-02-29');assert.deepEqual(groupDates(x),['2024-02-29']);
  x.controller.setState({other:1});assert.equal(x.select.value,'2024-02-29');assert.equal(x.host.querySelector('details').open,true);
  x.host.querySelector('button[type=button]').click();assert.equal(signal.aborted,true);assert.equal(x.select.matches(':disabled'),false);resolve();await Promise.resolve();await Promise.resolve();assert.equal(form.dataset.status,'cancelled');x.controller.dispose();
});

test('agenda invalid mounts and updates are atomic; replace/dispose detach old controls across ownerDocuments', () => {
  const a=setup(spec(multi())),b=setup(spec(multi()));assert.notEqual(a.select.id,b.select.id);
  for(const el of a.host.querySelectorAll('.iui-agenda *'))assert.equal(el.ownerDocument,a.dom.window.document);
  filter(a,'2024-02-29');a.host.querySelector('details').open=true;a.select.focus();const previous=a.host.innerHTML,oldSelect=a.select,oldGroups=[...a.host.querySelectorAll('.iui-agenda-date')];
  assert.throws(()=>a.controller.update(spec(agenda([event({date:'1900-02-29'})]))));assert.equal(a.host.innerHTML,previous);assert.equal(a.dom.window.document.activeElement,oldSelect);
  assert.throws(()=>mount(a.host,spec(agenda([event({url:'javascript:x'})]))));assert.equal(a.host.innerHTML,previous);
  a.controller.update(spec(multi()));filter(a,'2024-03-01',oldSelect);assert.equal(oldGroups[1].hidden,true);assert.equal(a.host.querySelector('select').value,'');
  const current=a.host.querySelector('select'),currentGroups=[...a.host.querySelectorAll('.iui-agenda-date')];a.controller.dispose();a.controller.dispose();filter(a,'2024-03-01',current);assert.equal(currentGroups[0].hidden,false);assert.equal(a.host.childElementCount,0);
  filter(b,'2024-03-01');assert.deepEqual(groupDates(b),['2024-03-01']);b.controller.dispose();
});

test('agenda actual standalone compiler runs offline and rejects unsafe data before producing HTML', async () => {
  const input=spec(agenda([event({title:'</script><script>window.pwned=1</script>',description:'Literal',url:'https://example.com/event'}),event({id:'other',date:'9999-12-31'})]));
  const html=await compileHtml(input);let fetches=0;
  const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(win){win.fetch=()=>{fetches++;throw Error('Unexpected request');};}});
  const select=dom.window.document.querySelector('select');select.value='9999-12-31';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
  assert.equal(dom.window.document.querySelectorAll('.iui-agenda-date:not([hidden])').length,1);assert.equal(dom.window.document.querySelector('.iui-agenda-event-title').textContent,input.body[0].events[0].title);assert.equal(dom.window.pwned,undefined);assert.equal(fetches,0);
  assert.equal(dom.window.document.querySelectorAll('script[src],link[href],img,iframe').length,0);
  await assert.rejects(()=>compileHtml(spec(agenda([event({date:'1900-02-29'})]))));await assert.rejects(()=>compileHtml(spec(agenda([event({start:'23:00',end:'01:00'})]))));dom.window.close();
});

test('agenda an outer native form reset preserves unbound filter and disclosure rather than desynchronizing them', () => {
  const x=setup(spec(multi()),{},'en','<form id="outer"><div id="host"></div></form>');
  filter(x,'2024-02-29');const details=x.host.querySelector('details');details.open=true;
  x.dom.window.document.getElementById('outer').reset();
  assert.equal(x.select.value,'2024-02-29');assert.deepEqual(groupDates(x),['2024-02-29']);assert.equal(details.open,true);
  assert.deepEqual([...new x.dom.window.FormData(x.dom.window.document.getElementById('outer')).entries()],[]);x.controller.dispose();
});
