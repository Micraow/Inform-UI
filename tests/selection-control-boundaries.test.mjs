import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mount} from '../dist/v2/node.mjs';

// Original synthetic fixtures. DOM/CSS contracts do not claim browser pixel QA.
const controls='Checkbox("Enabled",$enabled),Switch("Updates",$updates),RadioGroup("Mode",$mode,[{label:"Alpha",value:"a"},{label:"Beta",value:"b"}]),Select("Filter",$mode,[{label:"Alpha",value:"a"},{label:"Beta",value:"b"}])';
function setup(body,extra=''){
 const dom=new JSDOM('<main></main>',{pretendToBeVisual:true});
 const errors=[];
 const app=mount(dom.window.document.querySelector('main'),{source:'$enabled=false\n$updates=false\n$mode="a"\n$count=0\n'+extra+'\nroot=Stack(['+body+'])',onError:issues=>errors.push(...issues)});
 assert.deepEqual(errors,[]);
 return{dom,app,root:app.element,style:element=>dom.window.getComputedStyle(element),close(){app.dispose();dom.window.close();}};
}
for(const nested of [false,true])test(`foundation choices keep one owner ${nested?'inside FormView':'standalone'}`,()=>{
 const h=setup(nested?`FormView({label:"Preferences"},[${controls}],@Set($count,$count+1))`:controls);
 try{
  const checkbox=h.root.querySelector('[data-component=Checkbox]'),input=checkbox.querySelector('input');
  const toggle=h.root.querySelector('[data-component=Switch]'),switchInput=toggle.querySelector('input');
  assert.equal(checkbox.querySelectorAll('svg[data-iui-icon=Check]').length,1);
  assert.equal(checkbox.querySelector('.if-domain-choice-check'),null);
  assert.equal(toggle.querySelector('svg'),null);
  assert.equal(switchInput.getAttribute('role'),'switch');
  for(const checked of [false,true]){
   if(checked){input.focus();input.click();switchInput.click();}
   assert.equal(input.checked,checked);assert.equal(switchInput.checked,checked);
   assert.equal(h.style(input).width,'20px');assert.equal(h.style(input).height,'20px');
   assert.equal(h.style(switchInput).width,'36px');assert.equal(h.style(switchInput).height,'22px');
  }
  assert.equal(h.dom.window.document.activeElement,input);
  assert.equal(input.labels[0],checkbox);
  assert.equal(h.app.getSnapshot().state.$enabled,true);
  assert.equal(h.app.getSnapshot().state.$updates,true);
  const radios=[...h.root.querySelectorAll('input[type=radio]')];radios[1].click();
  assert.deepEqual(radios.map(input=>input.checked),[false,true]);
  for(const radio of radios){assert.equal(h.style(radio).width,'20px');assert.equal(h.style(radio).height,'20px');}
  assert.equal(h.app.getSnapshot().state.$mode,'b');
  const select=h.root.querySelector('select');assert.equal(h.style(select).appearance,'none');
  assert.equal(select.parentElement.querySelectorAll('.if-select-icon').length,1);
 }finally{h.close();}
});

test('nested disabled foundation controls stay disabled without extra glyphs',()=>{
 const h=setup('FormView({label:"Preferences"},[Checkbox("Locked",$enabled,true),Switch("Locked updates",$updates,true)],@Set($count,$count+1))');
 try{for(const input of h.root.querySelectorAll('input')){assert.equal(input.disabled,true);input.click();assert.equal(input.checked,false);}assert.equal(h.root.querySelectorAll('svg[data-iui-icon=Check]').length,1);assert.equal(h.root.querySelectorAll('.if-domain-choice-check').length,0);}finally{h.close();}
});

test('migrated Checklist owns its checks and native select arrow while preserving labels and filtering',()=>{
 const h=setup('ChecklistView({label:"Tasks",items:[{id:"one",label:"First",hint:"A hint"},{id:"two",label:"Second",disabled:true}]})');
 try{
  const inputs=[...h.root.querySelectorAll('input[type=checkbox]')],select=h.root.querySelector('select');
  assert.equal(inputs.length,2);
  for(const input of inputs){assert.ok(input.classList.contains('if-control'));assert.equal(input.nextElementSibling.classList.contains('if-domain-choice-check'),true);assert.equal(input.nextElementSibling.getAttribute('aria-hidden'),'true');assert.equal(input.parentElement.querySelectorAll('svg[data-iui-icon=Check]').length,1);assert.equal(input.labels.length,1);assert.equal(h.style(input.parentElement).display,'grid');assert.equal(h.style(input.nextElementSibling).position,'static');}
  assert.equal(h.style(select).appearance,'auto');assert.equal(select.parentElement.querySelector('.if-select-icon'),null);
  inputs[0].focus();inputs[0].click();assert.equal(inputs[0].checked,true);assert.equal(h.dom.window.document.activeElement,inputs[0]);
  assert.equal(inputs[1].disabled,true);inputs[1].click();assert.equal(inputs[1].checked,false);
  select.value='done';select.dispatchEvent(new h.dom.window.Event('change',{bubbles:true}));
  assert.deepEqual([...h.root.querySelectorAll('.iui-checklist-item')].map(row=>row.hidden),[false,true]);
 }finally{h.close();}
});
