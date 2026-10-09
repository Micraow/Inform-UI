// Copy to repository tests/ only after primitive schema and renderer integration.
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { validateDocument, mount, compileHtml } from '../dist/index.js';
const documentOf = body => ({version:'iui/1',state:{draft:'Original',tick:0},body});
const icons = ['info','check','warning','error','plus','minus','arrow-left','arrow-right','external-link','clock'];
const statuses = ['idle','busy','success','warning','error'];
const valid = node => validateDocument(documentOf([node]));
const dom = () => new JSDOM('<!doctype html><html lang="en"><body><div id="host"></div></body></html>',{pretendToBeVisual:true,url:'https://example.invalid/'});
const specimen = () => documentOf([{type:'flow',id:'flow',children:[
  {type:'icon',name:'info',label:'Original information'},
  {type:'form',label:'Local form',children:[{type:'input',kind:'text',label:'Draft',bind:'draft'}]},
  {type:'clock',timezone:'UTC',mode:'snapshot',at:'2026-10-09T12:00:00Z'},
  {type:'popover',label:'Explanation',children:[{type:'text',value:'Original details'}]},
  {type:'pulse-indicator',label:'Supplied state',status:'busy'}
]}]);

test('primitive finite options and inclusive schema bounds are accepted by generated schema', () => {
  for(const name of icons)for(const size of ['sm','md','lg'])for(const tone of ['default','muted','info','success','warning','danger'])assert.equal(valid({type:'icon',name,size,tone,label:'字'.repeat(200)}).ok,true);
  for(const status of statuses)for(const animate of [true,false])assert.equal(valid({type:'pulse-indicator',label:'👩'.repeat(200),status,animate}).ok,true);
  for(const length of [1,50])assert.equal(valid({type:'flow',children:Array.from({length},()=>({type:'icon',name:'info'}))}).ok,true);
  for(const gap of ['none','sm','md','lg'])for(const align of ['start','center','end'])for(const justify of ['start','center','end','between'])assert.equal(valid({type:'flow',gap,align,justify,children:[{type:'text',value:'Known'}]}).ok,true);
});
test('unknown fields, unknown icons and malformed primitive values reject at public validation', () => {
  const cases=[
    {type:'flow',children:[]},{type:'flow',children:Array.from({length:51},()=>({type:'text',value:'x'}))},{type:'flow',children:'text'},{type:'flow',children:[{type:'text',value:'x'}],gap:8},
    {type:'flow',children:[{type:'text',value:'x'}],align:'stretch'},{type:'flow',children:[{type:'text',value:'x'}],justify:'around'},{type:'flow',children:[{type:'html',value:'<b>x</b>'}]},
    {type:'icon',name:'download'},{type:'icon',name:'constructor'},{type:'icon',name:'info',size:20},{type:'icon',name:'info',tone:'red'},
    {type:'icon',name:'info',label:''},{type:'icon',name:'info',label:'x'.repeat(201)},{type:'icon',name:'info',label:{$:'draft'}},{type:'icon',name:'info',src:'https://example.invalid/icon.svg'},
    {type:'pulse-indicator',label:'Supplied',status:'loading'},{type:'pulse-indicator',label:'Supplied',status:{$:'draft'}},{type:'pulse-indicator',label:'Supplied',status:'busy',animate:1},
    {type:'pulse-indicator',label:'',status:'idle'},{type:'pulse-indicator',label:'x'.repeat(201),status:'idle'},
    {type:'pulse-indicator',label:'Supplied',status:'idle',progress:50},{type:'pulse-indicator',label:'Supplied'},{type:'pulse-indicator',status:'idle'}
  ];
  for(const node of cases)assert.equal(valid(node).ok,false,JSON.stringify(node));
  for(const node of [{type:'icon',name:'info'},{type:'flow',children:[{type:'text',value:'x'}]},{type:'pulse-indicator',label:'State',status:'idle'}])for(const unknown of ['onclick','style','html','url','bind'])assert.equal(valid({...node,[unknown]:'untrusted'}).ok,false);
});
test('flow recursively retains existing parent, URL, state and identifier semantic restrictions', () => {
  const cases=[
    {type:'flow',children:[{type:'grid-item',children:[{type:'text',value:'Wrong parent'}]}]},
    {type:'grid',children:[{type:'flow',children:[{type:'grid-item',children:[{type:'text',value:'Still wrong parent'}]}]}]},
    {type:'flow',children:[{type:'link',value:'Unsafe',href:'javascript:alert(1)'}]},
    {type:'flow',children:[{type:'text',value:{$:'missingState'}}]},
    {type:'flow',children:[{type:'icon',id:'same',name:'info'},{type:'pulse-indicator',id:'same',label:'Duplicate',status:'idle'}]}
  ];
  for(const node of cases)assert.equal(valid(node).ok,false,JSON.stringify(node));
  assert.equal(valid({type:'flow',children:[{type:'grid',children:[{type:'grid-item',children:[{type:'text',value:'Valid direct grid child'}]}]}]}).ok,true);
});
test('real flow preserves forms, overlay and clock nodes and input focus through setState', () => {
  const d=dom(),host=d.window.document.getElementById('host'),controller=mount(host,specimen()),flow=host.querySelector('.iui-flow'),children=[...flow.children],input=host.querySelector('input');
  assert.deepEqual(children.map(n=>n.dataset.iui),['icon','form','clock','popover','pulse-indicator']);
  input.focus();input.setSelectionRange(2,4);controller.setState({tick:1});assert.deepEqual([...flow.children],children);assert.equal(d.window.document.activeElement,input);assert.equal(input.selectionStart,2);assert.equal(input.selectionEnd,4);
  assert.equal(host.querySelector('.iui-pulse-indicator').dataset.status,'busy');controller.dispose();assert.equal(host.childElementCount,0);
});
test('public invalid updates stay atomic; supplied literal status changes only on a valid document update', () => {
  const d=dom(),host=d.window.document.getElementById('host'),controller=mount(host,specimen()),root=host.firstElementChild,input=host.querySelector('input');input.focus();
  for(const node of [{type:'icon',name:'invalid'},{type:'flow',children:[{type:'native',kind:'unknown'}]},{type:'pulse-indicator',label:'A',status:'busy',progress:1}]) {
    assert.throws(()=>controller.update(documentOf([node])));assert.equal(host.firstElementChild,root);assert.equal(d.window.document.activeElement,input);
  }
  controller.update(documentOf([{type:'pulse-indicator',label:'Known result',status:'success'}]));assert.equal(host.querySelector('.iui-pulse-indicator').textContent,'Known result Success');assert.equal(input.isConnected,false);controller.dispose();controller.dispose();
});
test('primitive names and status text honor foreign ownerDocument and independent nearest language', () => {
  const d=dom(),doc=d.window.document,a=doc.getElementById('host'),b=doc.createElement('div');b.lang='zh-Hant';doc.body.append(b);
  const nodes=[{type:'icon',name:'clock',id:'same',label:'Static symbol'},{type:'pulse-indicator',label:'Local',status:'warning'}],ca=mount(a,documentOf(nodes)),cb=mount(b,documentOf(nodes));
  assert.match(a.textContent,/Warning/);assert.match(b.textContent,/警告/);assert.notEqual(a.querySelector('svg').id,b.querySelector('svg').id);
  assert.equal(a.querySelector('svg').ownerDocument,doc);assert.equal(b.querySelector('svg').getAttribute('focusable'),'false');ca.dispose();assert.ok(b.querySelector('svg'));cb.dispose();
});
test('public renderer and compiler treat labels as data and request no arbitrary icon resource', async () => {
  const d=dom(),host=d.window.document.getElementById('host'),label='</script><img src=x onerror=alert(1)>',spec=documentOf([{type:'icon',name:'warning',label},{type:'pulse-indicator',label,status:'error'}]),controller=mount(host,spec);
  assert.equal(host.querySelector('[role=img]').getAttribute('aria-label'),label);assert.equal(host.querySelector('.iui-pulse-label').textContent,label);assert.equal(host.querySelectorAll('img,script,iframe,use,image').length,0);
  const html=await compileHtml(spec);assert.ok(html.includes('\\u003c/script\\u003e'));assert.ok(!html.includes('<img src=x'));controller.dispose();
});
