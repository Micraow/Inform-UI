import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';import Ajv from 'ajv/dist/2020.js';
import {validateDocument,mount,compileHtml} from '../dist/index.js';
const doc=body=>({version:'iui/1',body});
const names=['info','check','warning','error','plus','minus','arrow-left','arrow-right','external-link','clock'];

test('finite primitive fields and unknown input boundaries use the sole public validator',()=>{
  assert.equal(validateDocument(doc([{type:'flow',children:names.map(name=>({type:'icon',name}))},{type:'pulse-indicator',label:'Local synthetic status',status:'busy'}])).ok,true);
  for(const node of [
    {type:'flow',children:[]},{type:'flow',children:Array.from({length:51},()=>({type:'text',value:'x'}))},{type:'flow',gap:7,children:[{type:'text',value:'x'}]},
    {type:'flow',order:'dense',children:[{type:'text',value:'x'}]},{type:'icon',name:'arbitrary-pack'},{type:'icon',name:'check',label:''},{type:'icon',name:'check',label:'x'.repeat(201)},
    {type:'icon',name:'check',src:'https://example.com/icon.svg'},{type:'icon',name:'check',path:'M0 0h10'},{type:'icon',name:'check',size:42},
    {type:'pulse-indicator',label:'Local'},{type:'pulse-indicator',label:'',status:'idle'},{type:'pulse-indicator',label:'Local',status:'online'},
    {type:'pulse-indicator',label:'Local',status:'busy',animate:'true'},{type:'pulse-indicator',label:'Local',status:'busy',url:'https://example.com/status'}
  ])assert.equal(validateDocument(doc([node])).ok,false,JSON.stringify(node));
});

test('flow preserves recursive semantic checks and cannot bypass parent/domain boundaries',async()=>{
  for(const child of [{type:'grid-item',children:[{type:'text',value:'x'}]},{type:'link',value:'Unsafe',href:'javascript:alert(1)'},{type:'text',value:{$:'undeclared'}}])assert.equal(validateDocument(doc([{type:'flow',children:[child]}])).ok,false);
  assert.equal(validateDocument(doc([{type:'flow',id:'same',children:[{type:'icon',name:'info',id:'same'}]}])).ok,false);
  const schema=JSON.parse(await readFile('src/schema/fragments/base.schema.json','utf8')),validate=new Ajv({strict:false}).compile(schema);
  assert.equal(validate(doc([{type:'flow',children:[{type:'icon',name:'check'},{type:'pulse-indicator',label:'Local',status:'success'}]}])),true);
  assert.equal(validate(doc([{type:'flow',children:[{type:'timer',durationMs:10}]}])),false);
  assert.equal(validate(doc([{type:'flow',children:[{type:'input',label:'Input',kind:'number',bind:'x'}]}])),false);
});

test('public primitive DOM is inert, accessible and stable around existing numeric form state',()=>{
  const dom=new JSDOM('<!doctype html><html lang="en"><body><main lang="zh-CN"></main></body></html>',{pretendToBeVisual:true}),host=dom.window.document.querySelector('main');
  const input={version:'iui/1',state:{count:6,unrelated:0},body:[{type:'flow',children:[{type:'icon',name:'info'},{type:'icon',name:'warning',label:'<img src=x onerror=bad()>',tone:'warning',size:'lg'},{type:'pulse-indicator',label:'<script>bad()</script>',status:'busy'},{type:'form',label:'Local form',children:[{type:'input',label:'Even count',kind:'number',bind:'count',step:2,min:0,max:20}]}]}]};
  const controller=mount(host,input),flow=host.querySelector('.iui-flow'),pulse=host.querySelector('.iui-pulse-indicator'),icons=host.querySelectorAll('.iui-icon'),field=host.querySelector('input');
  assert.equal(icons[0].getAttribute('aria-hidden'),'true');assert.equal(icons[0].hasAttribute('role'),false);assert.equal(icons[1].getAttribute('role'),'img');assert.equal(icons[1].getAttribute('aria-label'),'<img src=x onerror=bad()>');
  assert.equal(icons[1].getAttribute('focusable'),'false');assert.equal(icons[1].hasAttribute('tabindex'),false);assert.equal(icons[1].namespaceURI,'http://www.w3.org/2000/svg');
  assert.match(pulse.textContent,/<script>bad\(\)<\/script> 忙碌/);assert.equal(pulse.hasAttribute('aria-live'),false);assert.equal(pulse.hasAttribute('role'),false);assert.equal(host.querySelectorAll('script,img').length,0);
  field.focus();field.value='3';field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(controller.getState().count,6);
  controller.setState({unrelated:1});assert.equal(host.querySelector('.iui-flow'),flow);assert.equal(host.querySelector('input'),field);assert.equal(dom.window.document.activeElement,field);assert.equal(field.value,'3');
  controller.dispose();assert.equal(host.childElementCount,0);dom.window.close();
});

test('primitive status remains caller-supplied literal and compilation stays deterministic',async()=>{
  const input=doc([{type:'flow',justify:'between',align:'end',gap:'lg',children:[{type:'icon',name:'clock',label:'Static clock symbol'},{type:'pulse-indicator',label:'Local demonstration',status:'idle',animate:false}]}]);
  input.state={unrelated:0};
  const a=await compileHtml(input,{lang:'zh-CN'}),b=await compileHtml(input,{lang:'zh-CN'});assert.equal(a,b);
  const dom=new JSDOM('<main></main>'),host=dom.window.document.querySelector('main'),controller=mount(host,input),pulse=host.querySelector('.iui-pulse-indicator');
  controller.setState({unrelated:5});assert.equal(host.querySelector('.iui-pulse-indicator'),pulse);assert.equal(pulse.dataset.status,'idle');assert.throws(()=>controller.setState({missing:5}),/UNKNOWN_BIND/);
  controller.update(doc([{type:'pulse-indicator',label:'Local demonstration',status:'success'}]));assert.equal(host.querySelector('.iui-pulse-indicator').dataset.status,'success');
  controller.dispose();dom.window.close();
});
