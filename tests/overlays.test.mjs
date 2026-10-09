// Copy to Inform-UI/tests/overlays.test.mjs only after schema/renderer integration.
import test from 'node:test'; import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mount, validateDocument, compileHtml } from '../dist/index.js';
const tip={type:'tooltip',label:'Help',value:'Original inert explanation'};
const pop={type:'popover',label:'Details',children:[{type:'input',kind:'text',label:'Draft',bind:'note'},{type:'text',value:{$:'count'}}]};
const spec=(body=[tip,pop])=>({version:'iui/1',state:{note:'Draft',count:0,unrelated:0},body});
const setup=(input=spec())=>{const dom=new JSDOM('<html lang="en"><body><div lang="zh-CN" id="host"></div></body></html>',{pretendToBeVisual:true});const host=dom.window.document.getElementById('host');return{dom,host,controller:mount(host,input)};};
test('overlay schema and rendering agree on bounded plain-text tooltip and ordinary popover children',()=>{
  for(const node of [tip,pop,{...tip,placement:'bottom'},{...pop,title:'Title',placement:'top'}])assert.equal(validateDocument(spec([node])).ok,true);
  for(const node of [
    {...tip,label:''},{...tip,label:'x'.repeat(201)},{...tip,value:'x'.repeat(2001)},{...tip,value:{$:'count'}},{...tip,children:[]},{...tip,html:'<b>bad</b>'},{...tip,placement:'left'},
    {...pop,children:[]},{...pop,children:Array.from({length:21},()=>({type:'text',value:'x'}))},{...pop,title:''},{...pop,title:'x'.repeat(201)},{...pop,placement:'right'},{...pop,remote:'https://example.invalid/'}
  ])assert.equal(validateDocument(spec([node])).ok,false,JSON.stringify(node));
  assert.equal(validateDocument(spec([{...pop,children:[{type:'text',value:{$:'missing'}}]}])).ok,false);
});
test('actual mounted overlays preserve reactive children/open/focus across setState and reject invalid update atomically',()=>{
  const {dom,host,controller}=setup();const node=host.querySelector('[data-iui="popover"]'),trigger=node.querySelector('.iui-overlay-trigger'),surface=node.querySelector('.iui-overlay-surface');
  trigger.click();assert.equal(surface.hidden,false);assert.equal(node.querySelector('.iui-overlay-close').textContent,'关闭');
  const input=surface.querySelector('input');input.focus();input.setSelectionRange(1,3);controller.setState({unrelated:1,count:5});
  assert.equal(dom.window.document.activeElement,input);assert.equal(surface.querySelector('input'),input);assert.equal(input.selectionStart,1);assert.equal(surface.hidden,false);assert.equal(surface.querySelector('.iui-popover-body > [data-iui="text"]').textContent,'5');
  assert.throws(()=>controller.update(spec([{...tip,placement:'bad'}])));assert.equal(surface.hidden,false);assert.equal(dom.window.document.activeElement,input);
  controller.update(spec());assert.equal(surface.hidden,true);assert.equal(surface.isConnected,false);trigger.click();assert.equal(surface.hidden,true);controller.dispose();assert.equal(host.childElementCount,0);
});
test('actual overlay output keeps hostile plain text inert and remains deterministically compilable',async()=>{
  const input=spec([{...tip,label:'<img src=x>',value:'<script>bad()</script>'},{...pop,title:'<b>Title</b>'}]);
  const {host,controller}=setup(input);assert.equal(host.querySelector('img,script,b'),null);assert.equal(host.querySelector('[role=tooltip]').textContent,'<script>bad()</script>');controller.dispose();
  assert.equal(await compileHtml(input),await compileHtml(input));
});
