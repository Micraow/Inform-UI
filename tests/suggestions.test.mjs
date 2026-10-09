import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM, VirtualConsole} from 'jsdom';
import Ajv2020 from 'ajv/dist/2020.js';
import {mount, validateDocument, compileHtml, evaluateState} from '../dist/index.js';

const node = (count=8) => ({type:'prompt-suggestions',id:'ideas',label:'Explore a supplied topic',description:'These are authored choices.',items:Array.from({length:count},(_,i)=>({id:'choice'+i,text:'Supplied text '+i}))});
const spec = (n=node()) => ({version:'iui/1',state:{x:1,off:false},body:[n]});
function setup(input=spec(), {lang='en',wrapper='div',options,virtualConsole}={}) {
  const dom=new JSDOM(`<!doctype html><html lang="${lang}"><body><${wrapper}><div id="host"></div></${wrapper}></body></html>`,{virtualConsole});
  const host=dom.window.document.getElementById('host'),controller=mount(host,input,options);
  return {dom,host,controller,root:host.querySelector('.iui-suggestions')};
}
const choice=(root,index=0)=>root.querySelectorAll('.iui-suggestions-choice')[index];
const action=(root,name)=>root.querySelector(`[data-suggestions-action="${name}"]`);
const selected=root=>[...root.querySelectorAll('.iui-suggestions-choice[aria-pressed="true"]')].map(button=>button.dataset.suggestionId);
const status=root=>root.querySelector('[role="status"]');
const visible=root=>[...root.querySelectorAll('.iui-suggestions-list>li')].filter(row=>!row.hidden).length;
const forge=(dom,target)=>target.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));
function invalid(mutate,code='SCHEMA'){const input=spec();mutate(input.body[0],input);const result=validateDocument(input);assert.equal(result.ok,false);assert.ok(result.issues.some(issue=>issue.code===code),JSON.stringify(result));}

test('public canonical base contract accepts all finite bounds, optional descriptions and exact Unicode',async()=>{
  for(const count of [1,12])for(const initialVisible of [undefined,1,12]){
    const n=node(count);n.label='😀'.repeat(200);n.description='😀'.repeat(1000);n.items.forEach(item=>item.text='😀'.repeat(2000));
    if(initialVisible!==undefined)n.initialVisible=initialVisible;
    assert.equal(validateDocument(spec(n)).ok,true);
  }
  const n=node();delete n.description;assert.equal(validateDocument(spec(n)).ok,true);n.description='';assert.equal(validateDocument(spec(n)).ok,true);
  n.items[0].id='__proto__';n.items[1].id='constructor';n.items[1].text=n.items[0].text;assert.equal(validateDocument(spec(n)).ok,true);
  const schema=JSON.parse(await readFile('src/schema/fragments/base.schema.json','utf8'));
  assert.equal(new Ajv2020({strict:true}).compile(schema)(spec()),true);
  const index=JSON.parse(await readFile('src/schema/fragments/index.json','utf8'));assert.equal(index.nodeOwners['prompt-suggestions'],'base');
  assert.equal(validateDocument(JSON.parse(await readFile('examples/prompt-suggestions.json','utf8'))).ok,true);
});

test('strict schema rejects unsupported aliases, actions, bindings, sources and each finite boundary',()=>{
  const cases=[n=>delete n.label,n=>n.label='',n=>n.label='😀'.repeat(201),n=>n.label={},n=>n.description='😀'.repeat(1001),n=>n.description=null,n=>delete n.items,n=>n.items=[],n=>n.items=node(13).items,n=>n.items=null,n=>n.items[0].id='',n=>n.items[0].id='x'.repeat(81),n=>n.items[0].id='not an id',n=>delete n.items[0].id,n=>delete n.items[0].text,n=>n.items[0].text='',n=>n.items[0].text='😀'.repeat(2001),n=>n.items[0].text=5,n=>n.items[0].text={$:'x'},n=>n.items[0].href='https://example.com',n=>n.initialVisible=0,n=>n.initialVisible=13,n=>n.initialVisible=1.5,n=>n.initialVisible='6',n=>n.initialVisible=null,n=>n.bind='x',n=>n.action='send',n=>n.callback='send',n=>n.generate=true,n=>n.source='https://example.com',n=>n.selected='choice1',n=>n.type='conversation-suggestions',n=>n.type='onboarding-suggestions'];
  for(const mutate of cases)invalid(mutate);
  invalid(n=>n.items[1].id=n.items[0].id,'SUGGESTION_ID');
});

test('global text/depth/JSON safety budgets apply before any rendering',()=>{
  const n=node(12);n.items.forEach(item=>item.text='😀'.repeat(2000));
  const many=validateDocument({version:'iui/1',body:Array.from({length:150},()=>structuredClone(n))});assert.equal(many.ok,false);assert.ok(many.issues.some(i=>i.code==='TEXT_LIMIT'));
  let deep=node();for(let i=0;i<70;i++)deep={type:'box',children:[deep]};assert.ok(validateDocument({version:'iui/1',body:[deep]}).issues.some(i=>i.code==='DEPTH_LIMIT'));
  let called=false;const accessor=node();Object.defineProperty(accessor,'description',{enumerable:true,get(){called=true;return 'Never';}});assert.equal(validateDocument(spec(accessor)).ok,false);assert.equal(called,false);
  invalid(n=>n.callback=()=>{},'JSON_TYPE');invalid(n=>n.items[0].text=Infinity,'NON_FINITE');invalid(n=>n.items.push(n),'CYCLIC_INPUT');
});

test('mount is inert, native controls are buttons with no binding, and default visibility clamps',()=>{
  for(const [count,initial,expected]of [[8,undefined,6],[1,undefined,1],[3,12,3],[8,2,2]]){
    const n=node(count);if(initial!==undefined)n.initialVisible=initial;
    const {root,controller}=setup(spec(n));assert.equal(visible(root),expected);assert.equal(action(root,'expand').hidden,count===expected);
    assert.deepEqual(selected(root),[]);assert.equal(status(root).textContent,'');assert.equal(action(root,'clear').getAttribute('aria-disabled'),'true');assert.equal(action(root,'clear').disabled,false);
    for(const button of root.querySelectorAll('button')){assert.equal(button.type,'button');assert.equal(button.hasAttribute('name'),false);assert.equal(button.hasAttribute('data-bind'),false);}
    assert.equal(root.querySelector('form,input,a,script,img,iframe'),null);controller.dispose();
  }
});

test('explicit native/host click emits exactly once from root with frozen literal detail and no replay',()=>{
  const input=spec(),before=structuredClone(input),{root,host,controller,dom}=setup(input),events=[];
  input.body[0].items[0].text='Caller mutation after mount';
  host.addEventListener('iui:suggestion',event=>events.push(event));
  choice(root).focus();choice(root).click();assert.equal(events.length,1);const event=events[0];
  assert.equal(event.target,root);assert.equal(event.bubbles,true);assert.equal(event.cancelable,true);assert.equal(event.composed,false);assert.equal(event instanceof dom.window.CustomEvent,true);
  assert.deepEqual(event.detail,{componentId:'ideas',suggestionId:'choice0',text:before.body[0].items[0].text});assert.equal(Object.isFrozen(event.detail),true);assert.throws(()=>event.detail.text='changed',TypeError);
  assert.deepEqual(selected(root),['choice0']);assert.match(status(root).textContent,/Selected locally/);assert.match(status(root).textContent,/host app/);assert.doesNotMatch(status(root).textContent,/sent|generated|submitted/i);
  assert.equal(dom.window.document.activeElement,choice(root));choice(root).click();assert.equal(events.length,2);
  controller.setState({x:2});action(root,'expand').click();action(root,'clear').click();assert.equal(events.length,2);
  assert.deepEqual(controller.getState(),{x:2,off:false});assert.equal(evaluateState(before).ok,true);assert.deepEqual(before,spec());
  controller.dispose();
});

test('cancellation preserves prior selection and reports only local acceptance, even for repeat activation',()=>{
  const {root,host,controller}=setup();choice(root).click();let count=0;
  host.addEventListener('iui:suggestion',event=>{count++;event.preventDefault();});
  for(const index of [1,0]){choice(root,index).click();assert.deepEqual(selected(root),['choice0']);assert.match(status(root).textContent,/not accepted/);assert.match(status(root).textContent,/previous selection is unchanged/);}
  assert.equal(count,2);controller.dispose();
  const n=node();delete n.id;const a=setup(spec(n));a.host.addEventListener('iui:suggestion',event=>{assert.equal(event.detail.componentId,null);event.preventDefault();});choice(a.root).click();assert.deepEqual(selected(a.root),[]);a.controller.dispose();
});

test('show more/collapse retain every DOM node and selected hidden choice; clear/no-op retain action focus',()=>{
  const {root,controller,dom}=setup(),buttons=[...root.querySelectorAll('button')],clear=action(root,'clear'),more=action(root,'expand');
  clear.focus();clear.click();assert.equal(status(root).textContent,'');assert.equal(dom.window.document.activeElement,clear);
  assert.equal(more.getAttribute('aria-controls'),root.querySelector('ul').id);more.focus();more.click();assert.equal(visible(root),8);assert.equal(more.getAttribute('aria-expanded'),'true');
  choice(root,7).click();more.focus();more.click();assert.equal(visible(root),6);assert.equal(more.getAttribute('aria-expanded'),'false');assert.deepEqual(selected(root),['choice7']);assert.equal(dom.window.document.activeElement,more);
  assert.deepEqual([...root.querySelectorAll('button')],buttons);clear.focus();clear.click();assert.deepEqual(selected(root),[]);assert.match(status(root).textContent,/cleared/);assert.equal(dom.window.document.activeElement,clear);
  const html=root.innerHTML;clear.click();assert.equal(root.innerHTML,html);assert.equal(dom.window.document.activeElement,clear);controller.dispose();
});

test('unrelated state, hiding host and text selection preserve exact DOM, focus and local status',()=>{
  const {root,host,controller,dom}=setup();action(root,'expand').click();choice(root,7).click();choice(root,7).focus();
  const range=dom.window.document.createRange();range.selectNodeContents(root.querySelector('h2'));dom.window.getSelection().addRange(range);
  const text=dom.window.getSelection().toString(),html=root.innerHTML,focus=dom.window.document.activeElement;
  const observer=new dom.window.MutationObserver(()=>{});observer.observe(root,{attributes:true,subtree:true,childList:true,characterData:true});
  controller.setState({x:1});controller.setState({x:2});host.hidden=true;host.hidden=false;
  assert.equal(root.innerHTML,html);assert.equal(dom.window.document.activeElement,focus);assert.equal(dom.window.getSelection().toString(),text);assert.equal(observer.takeRecords().length,0);assert.deepEqual(selected(root),['choice7']);observer.disconnect();controller.dispose();
});

test('invalid updates are atomic; valid replacement starts clean and old listeners stay removed',()=>{
  const input=spec(),before=structuredClone(input),{root,host,controller}=setup(input);action(root,'expand').click();choice(root,7).click();
  const html=root.innerHTML,bad=spec();bad.body[0].items[1].id='choice0';assert.throws(()=>controller.update(bad));assert.equal(host.querySelector('.iui-suggestions'),root);assert.equal(root.innerHTML,html);
  assert.deepEqual(input,before);controller.update(spec());const replacement=host.querySelector('.iui-suggestions');assert.notEqual(replacement,root);assert.deepEqual(selected(replacement),[]);assert.equal(visible(replacement),6);assert.equal(status(replacement).textContent,'');
  for(const button of root.querySelectorAll('button'))button.click();assert.equal(root.innerHTML,html);
  let count=0;replacement.addEventListener('iui:suggestion',()=>count++);controller.dispose();for(const button of replacement.querySelectorAll('button'))button.click();assert.equal(count,0);assert.equal(host.childElementCount,0);controller.dispose();
});

test('synchronous event-consumer replacement/disposal cannot paint detached or replacement DOM',()=>{
  for(const operation of ['update','dispose']){
    const {root,host,controller}=setup();choice(root).click();const old=root.innerHTML;
    root.addEventListener('iui:suggestion',()=>{if(operation==='update')controller.update(spec());else controller.dispose();},{once:true});
    choice(root,1).click();assert.equal(root.innerHTML,old);
    if(operation==='update'){const next=host.querySelector('.iui-suggestions');assert.deepEqual(selected(next),[]);assert.equal(status(next).textContent,'');assert.equal(visible(next),6);}else assert.equal(host.childElementCount,0);
    controller.dispose();
  }
});

test('reentrant same/different activation and controls are guarded for the duration of dispatch',()=>{
  const {root,host,controller}=setup();let count=0;
  host.addEventListener('iui:suggestion',()=>{count++;if(count<3){choice(root).click();choice(root,1).click();action(root,'expand').click();action(root,'clear').click();controller.setState({x:2});}});
  choice(root).click();assert.equal(count,1);assert.deepEqual(selected(root),['choice0']);assert.equal(visible(root),6);assert.equal(controller.getState().x,2);
  choice(root,1).click();assert.equal(count,2);assert.deepEqual(selected(root),['choice1']);controller.dispose();
});

test('native and forged activation honor every inherited disabled fieldset and hidden overflow',()=>{
  const {root,controller,dom,host}=setup(spec(),{wrapper:'fieldset'});let count=0;host.addEventListener('iui:suggestion',()=>count++);
  choice(root,7).click();forge(dom,choice(root,7));assert.equal(count,0);
  choice(root).click();const html=root.innerHTML;const fieldset=dom.window.document.querySelector('fieldset');fieldset.disabled=true;
  for(const button of root.querySelectorAll('button')){button.click();forge(dom,button);}
  assert.equal(count,1);assert.equal(root.innerHTML,html);fieldset.disabled=false;choice(root,1).click();assert.equal(count,2);assert.deepEqual(selected(root),['choice1']);controller.dispose();
});

test('document forms permit suggestions but never submit, bind or include them in a busy action snapshot',async()=>{
  let resolve,values;const promise=new Promise(done=>resolve=done);
  const n=node(),input=spec({type:'form',label:'Preferences',action:'save',children:[{type:'input',kind:'text',label:'Name',bind:'name'},n]});input.state.name='Ada';
  assert.equal(validateDocument(input).ok,true);
  const {root,host,controller,dom}=setup(input,{options:{actions:{save:context=>{values=context.values;return promise;}}}});let events=0,submits=0;host.addEventListener('iui:suggestion',()=>events++);const form=host.querySelector('form');form.addEventListener('submit',()=>submits++);
  choice(root).click();action(root,'expand').click();action(root,'clear').click();assert.equal(submits,0);assert.equal(events,1);
  form.querySelector('button[type="submit"]').click();assert.equal(submits,1);assert.deepEqual(values,{name:'Ada'});assert.equal(form.getAttribute('aria-busy'),'true');
  const html=root.innerHTML;for(const button of root.querySelectorAll('button')){button.click();forge(dom,button);}assert.equal(events,1);assert.equal(root.innerHTML,html);
  resolve();await promise;await new Promise(done=>setImmediate(done));choice(root,1).click();assert.equal(events,2);controller.dispose();
  const external=setup(spec(),{wrapper:'form'});let externalSubmits=0;external.dom.window.document.querySelector('form').addEventListener('submit',event=>{event.preventDefault();externalSubmits++;});
  for(const button of external.root.querySelectorAll('button'))button.click();assert.equal(externalSubmits,0);external.controller.dispose();
});

test('schema field-disabled state preserves local selection and guards forged activation',()=>{
  const input=spec({type:'field',label:'Suggestions group',disabled:{$:'off'},children:[node()]});const {root,host,controller,dom}=setup(input);let count=0;host.addEventListener('iui:suggestion',()=>count++);choice(root).click();controller.setState({off:true});const html=root.innerHTML;
  for(const button of root.querySelectorAll('button'))forge(dom,button);assert.equal(root.innerHTML,html);assert.equal(count,1);controller.setState({off:false});choice(root,1).click();assert.equal(count,2);controller.dispose();
});

test('ownerDocument constructors and no-defaultView fallback work without ambient browser globals',()=>{
  const a=setup(),b=setup(spec(),{lang:'zh-CN'});assert.notEqual(a.root.querySelector('h2').id,b.root.querySelector('h2').id);assert.match(action(b.root,'expand').textContent,/显示更多/);
  assert.equal(globalThis.CustomEvent===a.dom.window.CustomEvent,false);let bEvent;b.host.addEventListener('iui:suggestion',event=>bEvent=event);choice(b.root).click();assert.equal(bEvent instanceof b.dom.window.CustomEvent,true);assert.deepEqual(selected(a.root),[]);assert.match(status(b.root).textContent,/宿主应用/);
  const detached=a.dom.window.document.implementation.createHTMLDocument('Detached');assert.equal(detached.defaultView,null);const host=detached.createElement('div');detached.body.append(host);const controller=mount(host,spec());let event;host.addEventListener('iui:suggestion',received=>event=received);choice(host).click();assert.equal(event.type,'iui:suggestion');assert.equal(event.composed,false);assert.equal(event.cancelable,true);assert.equal(Object.isFrozen(event.detail),true);
  controller.dispose();a.controller.dispose();b.controller.dispose();
});

test('consumer exceptions use DOM semantics; no external success is inferred and guard resets',()=>{
  const virtualConsole=new VirtualConsole(),errors=[];virtualConsole.on('jsdomError',error=>errors.push(error));const {root,controller}=setup(spec(),{virtualConsole});
  root.addEventListener('iui:suggestion',()=>{throw Error('Consumer failure');},{once:true});assert.doesNotThrow(()=>choice(root).click());assert.equal(errors.length,1);assert.deepEqual(selected(root),['choice0']);assert.doesNotMatch(status(root).textContent,/sent|success|submitted|completed/i);choice(root,1).click();assert.deepEqual(selected(root),['choice1']);controller.dispose();
});

test('literal Arabic/Unicode/CRLF and markup-looking text round-trip safely through deterministic compilation',async()=>{
  const n=node();n.label='اقتراحات أصلية';n.description='<img src=x onerror=evil()>\r\nمثال';n.items[0].text='😀 中文\r\n</script><script>evil()</script>';const input=spec(n),before=structuredClone(input),{root,host,controller}=setup(input);let detail;host.addEventListener('iui:suggestion',event=>detail=event.detail);choice(root).click();
  assert.equal(root.dir,'auto');assert.equal(root.querySelector('h2').textContent,n.label);assert.equal(root.querySelector('.iui-suggestions-description').textContent,n.description);assert.equal(choice(root).textContent,n.items[0].text);assert.equal(detail.text,n.items[0].text);assert.equal(root.querySelector('script,img,iframe,a'),null);assert.deepEqual(input,before);
  const html=await compileHtml(input,{lang:'en'});assert.equal(html,await compileHtml(input,{lang:'en'}));assert.ok(!html.includes('</script><script>evil()</script>'));assert.match(html,/prompt-suggestions/);controller.dispose();
});

test('forged integration events do not select or replay, and many update/dispose cycles stay isolated',()=>{
  const a=setup(),b=setup();a.root.dispatchEvent(new a.dom.window.CustomEvent('iui:suggestion',{detail:{suggestionId:'choice1'}}));assert.deepEqual(selected(a.root),[]);
  for(let i=0;i<8;i++){const old=a.host.querySelector('.iui-suggestions');a.controller.update(spec());let events=0;old.addEventListener('iui:suggestion',()=>events++);choice(old).click();assert.equal(events,0);choice(a.host).click();}
  assert.deepEqual(selected(b.root),[]);a.controller.dispose();choice(b.root,1).click();assert.deepEqual(selected(b.root),['choice1']);b.controller.dispose();
});
