import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mount} from '../dist/index.js';
import {setup as travelSetup,click} from './travel-events-harness.mjs';
const card=patch=>({type:'onboarding-selection',label:'Original choices',options:[{id:'alpha',label:'Alpha'},{id:'beta',label:'Beta'},{id:'gamma',label:'Gamma'}],...patch});
function boardSetup(node){const dom=new JSDOM('<main></main>'),host=dom.window.document.querySelector('main'),controller=mount(host,{version:'iui/1',body:[node]}),root=host.querySelector('.iui-onboarding');return{dom,controller,root,inputs:[...root.querySelectorAll('input')],proceed:root.querySelector('.iui-onboarding-continue'),reset:root.querySelector('.iui-onboarding-reset'),end(){controller.dispose();dom.window.close();}};}


test('retained flight buttons detached or moved outside their owning root cannot dispatch or commit',()=>{
 for(const mode of ['detached','outside'])for(const action of ['select','clear']){
  const x=travelSetup();if(action==='clear')x.select.click();let calls=0;x.flight.addEventListener('iui:flight-choice',()=>calls++);const button=x[action],parent=button.parentElement,before=x.flight.dataset.selected;
  if(mode==='detached')button.remove();else x.doc.body.append(button);click(x,button);assert.equal(calls,0);assert.equal(x.flight.dataset.selected,before);
  parent.append(button);button.click();assert.equal(calls,1);assert.notEqual(x.flight.dataset.selected,before);x.controller.dispose();x.dom.window.close();
 }
});
test('flight dispatch cannot commit when its active button is removed synchronously by the host',()=>{
 const x=travelSetup();x.flight.addEventListener('iui:flight-choice',()=>x.select.remove(),{once:true});x.select.click();assert.equal(x.flight.dataset.selected,'false');assert.equal(x.flight.querySelector('.iui-flight-status').textContent,'');x.controller.dispose();x.dom.window.close();
});


test('retained onboarding controls detached or moved outside their owner cannot submit or reset the draft',()=>{
 for(const mode of ['detached','outside'])for(const action of ['proceed','reset']){
  const f=boardSetup(card({initial:['alpha']}));f.inputs[1].click();let calls=0;f.root.addEventListener('iui:onboarding-choice',()=>calls++);const button=f[action],parent=button.parentElement;
  if(mode==='detached')button.remove();else f.dom.window.document.body.append(button);button.dispatchEvent(new f.dom.window.MouseEvent('click',{bubbles:true}));assert.equal(calls,0);assert.deepEqual(f.inputs.map(x=>x.checked),[false,true,false]);
  parent.append(button);button.click();if(action==='proceed')assert.equal(calls,1);else assert.deepEqual(f.inputs.map(x=>x.checked),[true,false,false]);f.end();
 }
});
test('onboarding confirmation cannot paint accepted status after its button is synchronously reparented',()=>{
 const f=boardSetup(card({initial:['alpha']}));f.root.addEventListener('iui:onboarding-choice',()=>f.dom.window.document.body.append(f.proceed),{once:true});f.proceed.click();assert.equal(f.root.dataset.status,'idle');assert.equal(f.root.querySelector('.iui-onboarding-status').textContent,'');f.end();
});
