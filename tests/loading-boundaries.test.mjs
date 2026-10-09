import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mount,validateDocument} from '../dist/index.js';
const spec={version:'iui/1',state:{amount:25,factor:2},computed:{progress:{op:'mul',args:[{$:'amount'},{$:'factor'}]}},body:[{type:'input',kind:'number',label:'Supplied amount',bind:'amount',min:0,max:100,step:1},{type:'loading',label:'Supplied progress',progress:{$:'progress'}}]};
test('numeric drafts and globally invalid progress preserve accepted state and allow recovery without replacing focused controls',()=>{
 const dom=new JSDOM('<div id="host"></div>',{pretendToBeVisual:true}),host=dom.window.document.getElementById('host'),c=mount(host,spec);
 try{
  const input=host.querySelector('input'),bar=host.querySelector('[role=progressbar]');input.focus();
  const type=value=>{input.value=value;input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));};
  type('30');assert.equal(c.getState().amount,30);assert.equal(bar.getAttribute('aria-valuenow'),'60');
  for(const draft of ['101','-1','0.5','']){type(draft);assert.equal(c.getState().amount,30);assert.equal(bar.getAttribute('aria-valuenow'),'60');assert.equal(dom.window.document.activeElement,input);}
  type('75');assert.equal(input.value,'75');assert.equal(c.getState().amount,30);assert.equal(bar.getAttribute('aria-valuenow'),'60');
  assert.throws(()=>c.setState({amount:75}));assert.equal(input.value,'75');assert.equal(c.getState().amount,30);
  type('50');assert.equal(c.getState().amount,50);assert.equal(bar.getAttribute('aria-valuenow'),'100');assert.equal(dom.window.document.activeElement,input);assert.equal(host.querySelector('input'),input);
 }finally{c.dispose();dom.window.close();}
});
test('loading reference failures retain exact nested progress issue pointers',()=>{
 const bad={version:'iui/1',body:[{type:'flow',children:[{type:'loading',label:'Supplied',progress:{$:'absent'}}]}]};
 const r=validateDocument(bad);assert.equal(r.ok,false);assert.ok(r.issues.some(x=>x.path==='/body/0/children/0/progress/$'));
});
