import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import Ajv from 'ajv/dist/2020.js';
import {mount, validateDocument, compileHtml, InvalidDocumentError} from '../dist/index.js';

const label = (target='target', text='Additional label', extra={}) => ({type:'label',text,target,...extra});
const field = (extra={}) => ({type:'input',kind:'text',id:'target',label:'Original label',bind:'value',...extra});
const spec = (body=[label(),field()], state={value:'Initial',other:0}) => ({version:'iui/1',state,body});
function setup(s=spec(), options={}) {
  const dom=new JSDOM('<div id="host"></div>');
  const host=dom.window.document.querySelector('#host'), controller=mount(host,s,options);
  return {dom,host,controller,control:host.querySelector('input,textarea,select'),extra:host.querySelector('[data-iui=label]')};
}
const event=(x,node,type)=>node.dispatchEvent(new x.dom.window.Event(type,{bubbles:true,cancelable:true}));
const settle=async()=>{await Promise.resolve();await Promise.resolve();};
const cases=[
  ['text',field(),'Initial'], ['number',field({kind:'number',min:0,max:10}),3],
  ['email',field({kind:'email'}),'a@example.test'], ['checkbox',field({kind:'checkbox'}),false],
  ['date',field({kind:'date'}),'2026-10-09'],
  ['textarea',{type:'textarea',id:'target',label:'Original label',bind:'value'},'Initial'],
  ['slider',{type:'slider',id:'target',label:'Original label',bind:'value',min:0,max:10,step:1},3],
  ['toggle',{type:'toggle',id:'target',label:'Original label',bind:'value'},false],
  ['select',{type:'select',id:'target',label:'Original label',bind:'value',options:[{label:'One',value:'one'},{label:'Two',value:'two'}]},'one']
];

for(const [kind,node,value] of cases) test(`native ${kind} resolves forward/backward references and preserves its own label`,()=>{
  for(const forward of [true,false]) {
    const x=setup(spec(forward?[label(),node]:[node,label()],{value}));
    const wrapper=x.host.querySelector(`[data-iui="${node.type}"]`);
    assert.equal(x.extra.tagName,'LABEL'); assert.equal(x.extra.htmlFor,x.control.id);
    assert.equal(x.extra.control,x.control); assert.notEqual(wrapper.id,x.control.id);
    assert.match(wrapper.id,/-target$/); assert.equal(x.control.labels.length,2);
    const own=[...x.control.labels].filter(n=>n!==x.extra)[0];assert.equal(kind==='select'?own.querySelector('span').textContent:own.textContent,'Original label');
    assert.equal(x.extra.tabIndex,-1); assert.equal(x.extra.getAttribute('role'),null);
    if(['toggle','select'].includes(kind))assert.match(x.control.id,/^iui-label-target-internal-/);
    if(['checkbox','toggle'].includes(kind)) {x.extra.click();assert.equal(x.control.checked,true);assert.equal(x.controller.getState().value,true);}
    x.controller.dispose();x.dom.window.close();
  }
});

test('multiple additional labels retain author order around their native control',()=>{
  const x=setup(spec([label('target','First'),{type:'col',children:[label('target','Second'),field()]},label('target','Third')]));
  assert.deepEqual([...x.control.labels].map(n=>n.textContent),['First','Second','Original label','Third']);
  for(const n of x.host.querySelectorAll('[data-iui=label]'))assert.equal(n.control,x.control);
  x.controller.dispose();
});

test('structural validation is literal and bounded by 200 Unicode code points in every generated subset',async()=>{
  const full=JSON.parse(await readFile(new URL('../src/schema/iui.schema.json',import.meta.url)));
  const base=JSON.parse(await readFile(new URL('../src/schema/fragments/base.schema.json',import.meta.url)));
  const forms=JSON.parse(await readFile(new URL('../src/schema/fragments/forms.schema.json',import.meta.url)));
  const strict=new Ajv({strict:true}).compile(full), baseCheck=new Ajv({strict:true}).compile(base), formsCheck=new Ajv({strict:true}).compile(forms);
  const unicode='🪷'.repeat(200), good=spec([label(unicode,unicode),field({id:unicode})]);
  assert.equal(strict(good),true);assert.equal(formsCheck(good),true);assert.equal(validateDocument(good).ok,true);
  const baseDoc=spec([label(),{type:'toggle',id:'target',label:'Original',bind:'value'}],{value:false});assert.equal(baseCheck(baseDoc),true);
  for(const extra of [{text:''},{target:''},{text:unicode+'a'},{target:unicode+'a'},{text:{$:'value'}},{target:{$:'value'}},{html:'<b>x</b>'},{children:[]},{bind:'value'},{onClick:'run'},{value:'wrong'}]) {
    const invalid=spec([label('target','Extra',extra),field()]);
    assert.equal(strict(invalid),false,JSON.stringify(extra)); assert.equal(formsCheck(invalid),false);assert.equal(validateDocument(invalid).ok,false);
  }
  for(const property of ['text','target']) {const invalid=spec();delete invalid.body[0][property];assert.equal(validateDocument(invalid).ok,false);}
  const noOwnLabel=spec();delete noOwnLabel.body[1].label;assert.equal(validateDocument(noOwnLabel).ok,false);
});

test('semantic references reject missing, non-exact, non-field, grouped and duplicate targets before mount',()=>{
  for(const target of ['missing','#target','TARGET','value']) {
    const result=validateDocument(spec([label(target),field()]));assert.equal(result.ok,false);assert.ok(result.issues.some(i=>i.code==='LABEL_TARGET'&&i.path==='/body/0/target'));
  }
  const wrong=[{type:'text',value:'text'},{type:'label',text:'Other',target:'real'},{type:'field',label:'Group',children:[{type:'text',value:'Content'}]},{type:'form',label:'Form',children:[{type:'text',value:'Content'}]},...['radio','segmented'].map(type=>({type,label:'Choices',bind:'value',options:[{label:'One',value:'Initial'}]})),{type:'col',children:[field({id:'inner'})]},{type:'native',name:'box',children:[]}];
  for(const n of wrong) {const result=validateDocument(spec([label(),{...n,id:'target'},field({id:'real'})]));assert.equal(result.ok,false);assert.ok(result.issues.some(i=>i.code==='LABEL_TARGET_TYPE'),n.type);}
  for(const body of [[label(),field(),field()],[label('target','Extra',{id:'target'}),field()]]) {const result=validateDocument(spec(body));assert.equal(result.ok,false);assert.ok(result.issues.some(i=>i.code==='DUPLICATE_ID'));}
  for(const id of ['', '🪷'.repeat(201)])assert.equal(validateDocument(spec([label(),field({id})])).ok,false);
  const dom=new JSDOM('<div id="host"><p>Keep me</p></div>'), host=dom.window.document.querySelector('#host'), original=host.firstChild;
  assert.throws(()=>mount(host,spec([label('outside'),field()])),InvalidDocumentError);assert.equal(host.firstChild,original);
});

test('authored IDs remain exact inert strings, and extra text cannot introduce markup',()=>{
  const id='["怪/# .🪷 ]', text='<img src=x onerror=alert(1)> & </label><script>bad()</script>\nSecond line';
  const x=setup(spec([label(id,text),field({id})]));assert.equal(x.extra.textContent,text);assert.equal(x.extra.children.length,0);assert.equal(x.extra.control,x.control);assert.equal(x.host.querySelector('img,script'),null);x.controller.dispose();
});

test('slider internal control identities cannot collide with authored wrappers or labels',()=>{
  const own=setup(spec([{...cases.find(x=>x[0]==='slider')[1],id:'control-0'}],{value:3}));
  assert.equal(own.host.querySelector('label').control,own.control);assert.notEqual(own.host.querySelector('[data-iui=slider]').id,own.control.id);own.controller.dispose();
  const x=setup(spec([label('target','Extra',{id:'control-0'}),cases.find(x=>x[0]==='slider')[1],{type:'text',id:'control-1',value:'Still content'}],{value:3}));
  assert.equal(x.extra.control,x.control);assert.equal([...x.control.labels].find(n=>n!==x.extra).control,x.control);assert.match(x.control.id,/^iui-control-internal-/);const ids=[...x.host.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);x.controller.dispose();
});

test('native checkbox label.click publishes once and respects direct or inherited disabled state',()=>{
  for(const inherited of [false,true]) {
    const checkbox=field({kind:'checkbox',...(inherited?{}:{disabled:{$:'locked'}})});
    const x=setup(spec([label(),inherited?{type:'field',label:'Group',disabled:{$:'locked'},children:[checkbox]}:checkbox],{value:false,locked:true}));
    let changes=0;x.control.addEventListener('change',()=>changes++);x.extra.click();assert.equal(changes,0);assert.equal(x.control.checked,false);assert.equal(x.controller.getState().value,false);
    x.controller.setState({locked:false});x.extra.click();assert.equal(changes,1);assert.equal(x.control.checked,true);assert.equal(x.controller.getState().value,true);x.controller.dispose();
  }
});

test('additional labels preserve rejected numeric drafts, association identity and existing control focus',()=>{
  const x=setup(spec([label(),field({kind:'number',min:0,max:10}),{type:'toggle',label:'Other',bind:'other'}],{value:3,other:false}));
  x.control.focus();x.control.value='20';event(x,x.control,'input');assert.equal(x.controller.getState().value,3);
  x.extra.click();x.controller.setState({other:true});assert.equal(x.control.value,'20');assert.equal(x.extra.control,x.control);assert.equal(x.dom.window.document.activeElement,x.control);
  assert.throws(()=>x.controller.update(spec([label('missing'),field({kind:'number'})],{value:3})),InvalidDocumentError);
  assert.equal(x.host.querySelector('input'),x.control);assert.equal(x.control.value,'20');assert.equal(x.extra.control,x.control);assert.equal(x.dom.window.document.activeElement,x.control);x.controller.dispose();
});

test('invalid document updates keep old native associations live; replacement/disposal release old labels',()=>{
  const checkbox=field({kind:'checkbox'}), valid=spec([label(),checkbox],{value:false});const x=setup(valid), oldLabel=x.extra, oldControl=x.control;
  assert.throws(()=>x.controller.update(spec([label(),field(),field()])),InvalidDocumentError);oldLabel.click();assert.equal(x.controller.getState().value,true);
  x.controller.update(valid);const nextLabel=x.host.querySelector('[data-iui=label]'),nextControl=x.host.querySelector('input');
  assert.notEqual(nextControl,oldControl);assert.equal(oldLabel.hasAttribute('for'),false);assert.equal(oldLabel.control,null);assert.equal(nextLabel.control,nextControl);
  // Retained detached labels must not attach to reused IDs if a host re-inserts them.
  x.host.append(oldLabel);oldLabel.click();assert.equal(nextControl.checked,false);nextLabel.click();assert.equal(nextControl.checked,true);assert.equal(x.controller.getState().value,true);
  x.controller.dispose();assert.equal(nextLabel.hasAttribute('for'),false);assert.equal(nextLabel.control,null);assert.throws(()=>x.controller.getState(),/disposed/);oldControl.click();nextLabel.click();
});

test('generated IDs for previously ID-less native controls are released on replacement and dispose',()=>{
  const valid=spec([label(),{type:'toggle',id:'target',label:'Original',bind:'value'}],{value:false});const x=setup(valid),old=x.control,id=old.id;
  x.controller.update(valid);assert.equal(old.id,'');const next=x.host.querySelector('input');assert.notEqual(next.id,id);assert.equal(x.host.querySelector('[data-iui=label]').control,next);x.controller.dispose();assert.equal(next.id,'');
});

test('separate roots and ownerDocuments cannot bind matching authored IDs or missing targets',()=>{
  const s=spec([label(),field({kind:'checkbox'})],{value:false}), a=setup(s), b=setup(s);
  const second=a.dom.window.document.createElement('div');a.dom.window.document.body.append(second);const c=mount(second,s), secondLabel=second.querySelector('[data-iui=label]'),secondInput=second.querySelector('input');
  assert.notEqual(a.control.id,secondInput.id);assert.notEqual(a.control.id,b.control.id);a.extra.click();assert.equal(a.controller.getState().value,true);assert.equal(c.getState().value,false);assert.equal(b.controller.getState().value,false);
  assert.throws(()=>c.update(spec([label()],{value:false})),InvalidDocumentError);secondLabel.click();assert.equal(c.getState().value,true);
  a.controller.dispose();b.extra.click();assert.equal(b.controller.getState().value,true);assert.equal(secondLabel.control,secondInput);c.dispose();b.controller.dispose();
});

test('cross-form labels never add fields to another form snapshot or submit by native activation',async()=>{
  const calls=[];
  const s=spec([{type:'form',label:'First',action:'first',children:[label('target','External field label'),field({id:'inside',bind:'inside'})]},label('inside','Outside form label'),field({kind:'checkbox'})],{value:false,inside:'Initial'});
  const x=setup(s,{actions:{first:args=>calls.push(args.values)}}), form=x.host.querySelector('form'), checkbox=x.host.querySelector('input[type=checkbox]');
  x.extra.click();assert.equal(checkbox.checked,true);assert.equal(calls.length,0);assert.equal(checkbox.form,null);
  event(x,form,'submit');await settle();assert.deepEqual(calls,[{inside:'Initial'}]);assert.equal(form.dataset.status,'success');x.controller.dispose();
});

test('association never opens hidden tabs or details',()=>{
  const x=setup(spec([label(),{type:'tab-group',label:'Panels',children:[{type:'tab-panel',id:'one',label:'Visible',children:[{type:'text',value:'Content'}]},{type:'tab-panel',id:'two',label:'Hidden',children:[{type:'details',summary:'Closed',children:[field()]}]}]}]));
  assert.equal(x.extra.control,x.control);x.extra.click();assert.equal(x.host.querySelector('[data-iui=tab-group]').dataset.active,'one');assert.equal(x.control.closest('[role=tabpanel]').hidden,true);assert.equal(x.host.querySelector('details').open,false);x.controller.dispose();
});

test('portable compiler uses the native label association and rejects invalid targets',async()=>{
  const html=await compileHtml(spec([label(),field({kind:'checkbox'})],{value:false})),dom=new JSDOM(html,{runScripts:'dangerously'});
  const input=dom.window.document.querySelector('input'),extra=dom.window.document.querySelector('[data-iui=label]');assert.equal(extra.control,input);extra.click();assert.equal(input.checked,true);dom.window.close();
  await assert.rejects(()=>compileHtml(spec([label('missing'),field()])),InvalidDocumentError);
});
