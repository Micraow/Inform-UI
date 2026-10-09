import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv2020 from 'ajv/dist/2020.js';
import {mount,validateDocument,evaluateState,compileHtml} from '../dist/index.js';

const hostButton=(extra={})=>({type:'button',id:'send',label:'Run action',action:{kind:'host',name:'run'},...extra});
const spec=(button=hostButton(),state={count:1,locked:false,note:'original'})=>({version:'iui/1',state,body:[button]});
function setup(document=spec(),actions={},lang='en') {
  const dom=new JSDOM(`<!doctype html><html lang="${lang}"><body><button id="outside">Outside</button><div id="host"></div></body></html>`);
  const host=dom.window.document.getElementById('host'),controller=mount(host,document,{actions});
  const root=host.querySelector('[data-iui=button]'),main=root.matches('button')?root:root.querySelector('.iui-button');
  return {dom,host,controller,root,main,cancel:root.querySelector('.iui-button-cancel'),status:root.querySelector('[role=status]'),outside:dom.window.document.getElementById('outside')};
}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
const status=s=>s.root.dataset.status;
function invalid(document,code='SCHEMA') {const r=validateDocument(document);assert.equal(r.ok,false);assert.ok(r.issues.some(i=>i.code===code),JSON.stringify(r.issues));return r;}

test('button fixture validates through public API and base fragment without adding a canonical type',async()=>{
  const fixture=JSON.parse(await readFile('examples/button-actions.json','utf8'));
  const before=structuredClone(fixture);assert.equal(validateDocument(fixture).ok,true);assert.deepEqual(fixture,before);
  const schema=JSON.parse(await readFile('src/schema/fragments/base.schema.json','utf8'));
  const validate=new Ajv2020({strict:true}).compile(schema);assert.equal(validate(fixture),true);
  const index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));assert.equal(index.nodeOwners.button,'base');
  const all=JSON.parse(await readFile('src/schema/iui.schema.json','utf8'));assert.equal(all.$defs.Node.oneOf.filter(node=>node.$ref==='#/$defs/ButtonNode').length,1);
  assert.deepEqual(all.$defs.ButtonAction.oneOf.map(branch=>branch.properties.kind.const),['reset','set','host']);
});

test('action branches reject missing fields, mixed branches, code and URL payloads structurally',()=>{
  for(const action of [
    {kind:'host'},{kind:'host',name:''},{kind:'host',name:'a'.repeat(81)},{kind:'host',name:'https://example.com'},
    {kind:'host',name:'run',bind:'count'},{kind:'host',name:'run',value:1},{kind:'host',name:'run',code:'alert(1)'},
    {kind:'host',name:'run',url:'https://example.com'},{kind:'set'},{kind:'set',bind:'count'},
    {kind:'set',bind:'count',value:1,name:'run'},{kind:'reset',bind:'count'},{kind:'reset',value:1},{kind:'reset',name:'run'},
    {kind:'unknown'}
  ]) invalid(spec(hostButton({action})));
  invalid(spec(hostButton({action:{kind:'set',bind:'count',value:'wrong'}})),'INPUT_TYPE');
  invalid(spec(hostButton({action:{kind:'set',bind:'unknown',value:1}})),'BUTTON_ACTION');
  invalid(spec(hostButton({action:{kind:'host',name:'run',callback:()=>{}}})),'JSON_TYPE');
  assert.equal(validateDocument(spec(hostButton({action:{kind:'host',name:'a'.repeat(80)}}))).ok,true);
});

test('disabled strictly resolves to boolean and rejected dependent state changes roll back atomically',()=>{
  for(const disabled of [0,1,'false',null,{$:'count'}])invalid(spec(hostButton({disabled})),'INPUT_TYPE');
  const document=spec(hostButton({disabled:{op:'if',args:[{$:'locked'},true,{$:'count'}]}}));document.state.locked=true;
  const s=setup(document);assert.equal(s.main.disabled,true);const before=s.host.innerHTML;
  assert.throws(()=>s.controller.setState({locked:false}));assert.equal(s.controller.getState().locked,true);assert.equal(s.host.innerHTML,before);
  assert.equal(evaluateState(document,{locked:false}).ok,false);s.controller.dispose();
});

test('label/name/hint/tone are bounded literal data and hostile markup remains inert',()=>{
  const safe=spec(hostButton({label:'😀'.repeat(200),hint:'😀'.repeat(1000),tone:'danger'}));assert.equal(validateDocument(safe).ok,true);
  for(const change of [{label:'a'.repeat(201)},{hint:'a'.repeat(1001)},{tone:'success'},{hint:{$:'note'}}])invalid(spec(hostButton(change)));
  const s=setup(spec(hostButton({label:'<img src=x>',hint:'<script>bad()</script>'})));assert.equal(s.host.querySelector('img,script'),null);assert.match(s.host.textContent,/<script>/);s.controller.dispose();
});

test('set/reset retain direct native DOM, ids, .click and exact same-value numeric draft behavior',()=>{
  const document={version:'iui/1',state:{amount:6,other:4,locked:false},body:[
    {type:'form',label:'Numbers',children:[{type:'input',kind:'number',bind:'amount',label:'Amount',min:0},{type:'input',kind:'number',bind:'other',label:'Other',min:0}]},
    {type:'button',id:'set',label:'Set',hint:'Keep the other draft',tone:'primary',disabled:{$:'locked'},action:{kind:'set',bind:'amount',value:6}},
    {type:'button',id:'reset',label:'Reset',action:{kind:'reset'}}]};
  const s=setup(document),set=s.host.querySelector('[id$="-set"]'),reset=s.host.querySelector('[id$="-reset"]');
  assert.equal(set.tagName,'BUTTON');assert.equal(reset.tagName,'BUTTON');assert.equal(set.dataset.iui,'button');assert.equal(set.type,'button');
  assert.equal(set.getAttribute('aria-label'),'Set');assert.equal(set.getAttribute('aria-describedby'),set.querySelector('span').id);
  const amount=s.host.querySelector('[data-bind=amount]'),other=s.host.querySelector('[data-bind=other]');
  const draft=(el,value)=>{el.value=value;el.dispatchEvent(new s.dom.window.Event('input',{bubbles:true}));};
  draft(amount,'-1');draft(other,'-2');set.click();assert.equal(amount.value,'6');assert.equal(other.value,'-2');
  draft(amount,'-1');s.controller.setState({locked:true});set.dispatchEvent(new s.dom.window.MouseEvent('click',{bubbles:true}));assert.equal(amount.value,'-1');
  reset.click();assert.equal(amount.value,'6');assert.equal(other.value,'4');assert.equal(set.disabled,false);s.controller.dispose();
  set.click();assert.equal(amount.value,'6');
});

test('own host adapters are called only on activation, with frozen whole-state snapshot and owner signal',async()=>{
  let calls=0,context;const work=deferred();const document=spec();document.computed={double:{op:'mul',args:[{$:'count'},2]}};
  const s=setup(document,{run:arg=>{calls++;context=arg;return work.promise;}});
  assert.equal(calls,0);s.controller.setState({count:2});assert.equal(calls,0);s.main.focus();s.main.click();
  assert.equal(calls,1);assert.equal(status(s),'busy');assert.equal(s.main.disabled,false);assert.equal(s.main.getAttribute('aria-disabled'),'true');
  assert.equal(s.main.getAttribute('aria-busy'),'true');assert.equal(s.cancel.hidden,false);assert.equal(s.dom.window.document.activeElement,s.main);
  assert.ok(context.signal instanceof s.dom.window.AbortSignal);assert.ok(Object.isFrozen(context.values));assert.ok(Object.isFrozen(context));
  assert.deepEqual(context.values,{count:2,locked:false,note:'original'});assert.equal('double' in context.values,false);
  assert.throws(()=>{context.values.count=99;},TypeError);s.controller.setState({count:3});assert.equal(context.values.count,2);
  work.resolve();await flush();assert.equal(status(s),'idle','completion must not claim current changed values');assert.equal(s.status.textContent,'');s.controller.dispose();
});

test('native click path guards repeated click/keyboard intent during pending without adding keyboard dispatch',async()=>{
  let calls=0;const work=deferred(),s=setup(spec(),{run:()=>{calls++;return work.promise;}});
  s.main.click();for(let i=0;i<5;i++){s.main.click();s.main.dispatchEvent(new s.dom.window.MouseEvent('click',{bubbles:true}));}
  for(const key of ['Enter',' ']){s.main.dispatchEvent(new s.dom.window.KeyboardEvent('keydown',{key,repeat:true,bubbles:true}));s.main.dispatchEvent(new s.dom.window.KeyboardEvent('keyup',{key,bubbles:true}));s.main.click();}
  assert.equal(calls,1);work.resolve();await flush();assert.equal(status(s),'success');assert.equal(s.cancel.hidden,true);assert.equal(s.main.getAttribute('aria-disabled'),'false');
  s.main.click();assert.equal(calls,2);await flush();s.controller.dispose();
});

test('synchronous void succeeds immediately and synchronous throw permits a fresh explicit retry',()=>{
  let calls=0;const s=setup(spec(),{run:()=>{if(++calls===1)throw Error('private error details');}});
  s.main.click();assert.equal(status(s),'error');assert.doesNotMatch(s.host.textContent,/private error details/);assert.equal(s.cancel.hidden,true);
  s.main.click();assert.equal(status(s),'success');assert.equal(calls,2);s.controller.setState({count:2});assert.equal(status(s),'idle');s.controller.dispose();
});

test('async rejection, resolving/rejecting thenables and throwing then getters settle safely',async()=>{
  for(const [returnValue,expected] of [
    [()=>Promise.resolve(),'success'],[()=>Promise.reject(Error('secret')),'error'],
    [()=>({then(resolve){resolve();}}),'success'],[()=>({then(_resolve,reject){reject(Error());}}),'error'],
    [()=>Object.defineProperty({},'then',{get(){throw Error('private getter');}}),'error'],
    [()=>({then(resolve,reject){resolve();reject(Error());throw Error();}}),'success']
  ]){const s=setup(spec(),{run:returnValue});s.main.click();await flush();assert.equal(status(s),expected);assert.equal(s.cancel.hidden,true);assert.doesNotMatch(s.host.textContent,/secret|private getter/);s.controller.dispose();}
});

test('missing, inherited and non-function adapters never report success or invoke a prototype action',()=>{
  let calls=0;for(const actions of [{},Object.create({run:()=>{calls++;}}),{run:'not callable'}]){
    const s=setup(spec(),actions);assert.equal(s.status.textContent,'');s.main.click();assert.equal(status(s),'unavailable');assert.match(s.status.textContent,/unavailable/);assert.equal(s.cancel.hidden,true);s.controller.dispose();
  }assert.equal(calls,0);
  const actions={};Object.defineProperty(actions,'run',{get(){throw Error('private configuration');}});const s=setup(spec(),actions);s.main.click();assert.equal(status(s),'error');s.controller.dispose();
});

test('disabled guards normal and synthetic activation; disabling pending work leaves Cancel usable',async()=>{
  let calls=0,signal;const work=deferred(),s=setup(spec(hostButton({disabled:{$:'locked'}})),{run:ctx=>{calls++;signal=ctx.signal;return work.promise;}});
  s.controller.setState({locked:true});s.main.click();s.main.dispatchEvent(new s.dom.window.MouseEvent('click',{bubbles:true}));assert.equal(calls,0);
  s.controller.setState({locked:false});s.main.click();s.controller.setState({locked:true});assert.equal(s.main.disabled,true);assert.equal(s.cancel.disabled,false);
  s.cancel.focus();s.cancel.click();assert.equal(signal.aborted,true);assert.equal(status(s),'cancelled');assert.equal(s.dom.window.document.activeElement,s.status);
  assert.equal(s.controller.getState().locked,true);assert.match(s.status.textContent,/may not be undone/);work.resolve();await flush();assert.equal(status(s),'cancelled');s.controller.dispose();
});

test('cancel/restart rejects stale resolution and rejection without touching the newer request',async()=>{
  for(const late of ['resolve','reject']){
    const first=deferred(),second=deferred(),contexts=[];let calls=0;
    const s=setup(spec(),{run:ctx=>{contexts.push(ctx);return ++calls===1?first.promise:second.promise;}});
    s.main.click();s.controller.setState({note:'changed after start'});s.cancel.focus();s.cancel.click();
    assert.equal(contexts[0].signal.aborted,true);assert.equal(s.dom.window.document.activeElement,s.main);assert.equal(s.controller.getState().note,'changed after start');
    s.main.click();assert.equal(calls,2);first[late](late==='reject'?Error('late'):undefined);await flush();assert.equal(status(s),'busy');assert.equal(contexts[1].signal.aborted,false);
    second.resolve();await flush();assert.equal(status(s),'success');assert.equal(calls,2);s.controller.dispose();
  }
});

test('settlement only returns disappearing Cancel focus, including disabled fallback, never outside focus',async()=>{
  for(const target of ['cancel','outside','main'])for(const result of ['resolve','reject']){
    const work=deferred(),s=setup(spec(),{run:()=>work.promise});s.main.click();s[target].focus();work[result](result==='reject'?Error():undefined);await flush();
    assert.equal(s.dom.window.document.activeElement,target==='cancel'?s.main:s[target]);s.controller.dispose();
  }
  const work=deferred(),s=setup(spec(hostButton({disabled:{$:'locked'}})),{run:()=>work.promise});s.main.click();s.controller.setState({locked:true});s.cancel.focus();work.resolve();await flush();assert.equal(s.dom.window.document.activeElement,s.status);s.controller.dispose();
  const x=setup(spec(),{run:()=>new Promise(()=>{})});x.main.click();x.outside.focus();x.cancel.click();assert.equal(x.dom.window.document.activeElement,x.outside);x.controller.dispose();
});

test('invalid document update preserves pending identity, signal, state and DOM atomically',async()=>{
  let signal;const work=deferred(),s=setup(spec(),{run:c=>{signal=c.signal;return work.promise;}});s.main.click();const before=s.host.innerHTML;
  assert.throws(()=>s.controller.update(spec(hostButton({disabled:'invalid'}))));assert.equal(s.host.innerHTML,before);assert.equal(signal.aborted,false);assert.equal(s.host.querySelector('.iui-button'),s.main);
  work.resolve();await flush();assert.equal(status(s),'success');s.controller.dispose();
});

test('successful update/dispose abort, remove old listeners and suppress both stale promise branches',async()=>{
  for(const action of ['update','dispose'])for(const result of ['resolve','reject']){
    const work=deferred();let calls=0,signal;const s=setup(spec(),{run:c=>{calls++;signal=c.signal;return work.promise;}});s.main.click();s.outside.focus();const old=s.root.outerHTML;
    if(action==='update')s.controller.update(spec());else s.controller.dispose();assert.equal(signal.aborted,true);assert.equal(s.root.isConnected,false);
    s.main.click();s.cancel.click();work[result](result==='reject'?Error('late'):undefined);await flush();assert.equal(calls,1);assert.equal(s.root.outerHTML,old);assert.equal(s.dom.window.document.activeElement,s.outside);
    if(action==='update'){assert.equal(s.host.querySelector('.iui-button-host').dataset.status,'idle');s.controller.dispose();}
  }
});

test('synchronous adapter and abort-listener update/dispose cannot write to a replacement',async()=>{
  for(const action of ['update','dispose']){
    const work=deferred();let s,signal;s=setup(spec(),{run:c=>{signal=c.signal;if(action==='update')s.controller.update(spec());else s.controller.dispose();return work.promise;}});
    s.main.click();assert.equal(signal.aborted,true);work.reject(Error('late'));await flush();if(action==='update'){assert.equal(s.host.querySelector('.iui-button-host').dataset.status,'idle');s.controller.dispose();}
    const wait=deferred();let x;x=setup(spec(),{run:({signal})=>{signal.addEventListener('abort',()=>{if(action==='update')x.controller.update(spec());else x.controller.dispose();});return wait.promise;}});
    x.main.click();x.cancel.click();wait.resolve();await flush();if(action==='update'){assert.equal(x.host.querySelector('.iui-button-host').dataset.status,'idle');x.controller.dispose();}
  }
});

test('pending buttons are independent and neither submit nor cancel an enclosing form',async()=>{
  const document=spec();document.body=[{type:'form',label:'Container',action:'formRun',children:[{type:'input',kind:'text',label:'Note',bind:'note'},hostButton(),hostButton({id:'other'})]}];
  const works=[deferred(),deferred()],signals=[];let calls=0,forms=0,submits=0,resets=0;
  const s=setup(document,{run:({signal})=>{signals.push(signal);return works[calls++].promise;},formRun:()=>{forms++;}}),form=s.host.querySelector('form');
  form.addEventListener('submit',()=>submits++);form.addEventListener('reset',()=>resets++);
  const mains=[...s.host.querySelectorAll('.iui-button')];mains[0].click();mains[1].click();assert.equal(calls,2);assert.equal(form.getAttribute('aria-busy'),'false');
  s.controller.setState({note:'keep this'});s.cancel.click();assert.equal(signals[0].aborted,true);assert.equal(signals[1].aborted,false);assert.equal(s.controller.getState().note,'keep this');
  works.forEach(w=>w.resolve());await flush();assert.equal(forms,0);assert.equal(submits,0);assert.equal(resets,0);assert.equal(form.dataset.status,'idle');s.controller.dispose();
});

test('disabled enclosing fieldset is respected even for synthetic clicks',()=>{
  let calls=0;const document=spec();document.body=[{type:'field',label:'Disabled',disabled:true,children:[hostButton(),{type:'button',label:'Set',action:{kind:'set',bind:'count',value:2}}]}];
  const s=setup(document,{run:()=>{calls++;}});for(const button of s.host.querySelectorAll('button'))button.dispatchEvent(new s.dom.window.MouseEvent('click',{bubbles:true}));assert.equal(calls,0);assert.equal(s.controller.getState().count,1);s.controller.dispose();
});

test('ids stay disjoint from authored ids, sibling mounts and actual owner documents',async()=>{
  const document=spec(hostButton({hint:'Help'}));document.body.push({type:'text',id:'button-internal-iui-1-1-main',value:'Authored namespace'});
  const a=setup(document),b=setup(document);for(const s of [a,b]){
    const ids=[...s.host.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);assert.equal(s.root.ownerDocument,s.dom.window.document);assert.match(s.root.id,/-send$/);
    assert.ok(s.main.id.startsWith('iui-button-internal-'));for(const id of s.main.getAttribute('aria-describedby').split(' '))assert.ok(s.dom.window.document.getElementById(id));
  }assert.notEqual(a.main.id,b.main.id);a.controller.dispose();b.controller.dispose();
  const outer=new JSDOM('<iframe></iframe>'),frame=outer.window.document.querySelector('iframe'),doc=frame.contentDocument,host=doc.createElement('div');doc.body.append(host);let signal;
  const controller=mount(host,spec(),{actions:{run:ctx=>{signal=ctx.signal;}}});host.querySelector('.iui-button').click();assert.ok(signal instanceof frame.contentWindow.AbortSignal);assert.equal(host.querySelector('[role=status]').textContent,'Action completed.');controller.dispose();
});

test('Chinese labels, whole-state privacy boundaries and no implicit network/storage access',()=>{
  const s=setup(spec(),{},'zh-CN');let calls=0;s.dom.window.fetch=()=>{calls++;throw Error('network');};for(const key of ['localStorage','sessionStorage'])Object.defineProperty(s.dom.window,key,{get(){calls++;throw Error('storage');}});
  assert.equal(s.cancel.textContent,'取消操作');s.main.click();assert.equal(s.status.textContent,'此操作不可用。');assert.equal(calls,0);s.controller.dispose();
});

test('public compiler is deterministic, carries only JSON and hydrates to honest unavailable action',async()=>{
  const document=spec(hostButton({hint:'<script>literal</script>'})),html=await compileHtml(document);assert.equal(html,await compileHtml(document));
  const dom=new JSDOM(html,{runScripts:'dangerously'}),button=dom.window.document.querySelector('.iui-button');assert.ok(button);assert.equal(dom.window.document.querySelector('.iui-button-host').dataset.status,'idle');
  button.click();assert.equal(dom.window.document.querySelector('.iui-button-host').dataset.status,'unavailable');assert.deepEqual(JSON.parse(dom.window.document.getElementById('iui-data').textContent),validateDocument(document).document);dom.window.close();
});

test('branch rejection identifies the required or forbidden action field precisely',()=>{
  for(const [action,field,message] of [
    [{kind:'host'},'name',/required property/],
    [{kind:'set'},'bind',/required property/],
    [{kind:'set',bind:'count'},'value',/required property/],
    [{kind:'reset',bind:'count'},'bind',/additional properties/],
    [{kind:'host',name:'run',value:1},'value',/additional properties/],
    [{kind:'set',bind:'count',value:1,name:'run'},'name',/additional properties/]
  ]){const result=invalid(spec(hostButton({action})));assert.ok(result.issues.some(issue=>issue.path===`/body/0/action/${field}`&&message.test(issue.message)),JSON.stringify(result.issues));}
});

test('reentrant callback/abort clicks cannot start work; a later explicit retry can',()=>{
  let calls=0,s;s=setup(spec(),{run:({signal})=>{calls++;s.main.click();signal.addEventListener('abort',()=>s.main.click());return new Promise(()=>{});}});
  s.main.click();assert.equal(calls,1);s.cancel.click();assert.equal(calls,1);assert.equal(status(s),'cancelled');s.main.click();assert.equal(calls,2);s.controller.dispose();assert.equal(calls,2);
});

test('owner-window AbortController is required; no silent global controller fallback',()=>{
  let calls=0;const s=setup(spec(),{run:()=>{calls++;}});Object.defineProperty(s.dom.window,'AbortController',{value:undefined,configurable:true});s.main.click();assert.equal(status(s),'unavailable');assert.equal(calls,0);s.controller.dispose();
});
