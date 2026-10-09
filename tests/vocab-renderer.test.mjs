import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mount} from '../dist/index.js';
import {vocab,documentOf,setup,action,region} from './vocab-harness.mjs';

test('vocab: initially closed, supplied structured reference and honest local note',()=>{
  const {root,controller}=setup();
  assert.equal(root.firstElementChild.tagName,'H2');assert.equal(root.firstElementChild.textContent,'resolve');
  const reveal=action(root,'reveal'),details=region(root);
  assert.equal(reveal.textContent,'Show meaning');assert.equal(reveal.getAttribute('aria-expanded'),'false');
  assert.equal(reveal.getAttribute('aria-controls'),details.id);assert.equal(details.hidden,true);
  assert.equal(root.querySelectorAll('.iui-vocab-senses>li').length,2);
  assert.deepEqual([...root.querySelectorAll('.iui-vocab-examples>li')].map(el=>el.textContent),['We resolved the issue together.','A clear test can resolve uncertainty.','They resolved to return.']);
  assert.match(root.querySelector('.iui-vocab-note').textContent,/supplied.*self-assessments.*not verified mastery.*not saved/);
  for(const button of root.querySelectorAll('button'))assert.equal(button.type,'button');
  assert.equal(root.querySelectorAll('input,textarea,select,a,img,audio,video,script,iframe').length,0);
  assert.equal(root.querySelector('[role=status]').textContent,'');
  action(root,'again').click();action(root,'familiar').click();assert.equal(action(root,'again').getAttribute('aria-pressed'),'false');assert.equal(action(root,'familiar').getAttribute('aria-pressed'),'false');
  controller.dispose();
});

test('vocab: all independent metadata combinations and empty optional translation are omitted',()=>{
  const fields=['languageLabel','pronunciation','partOfSpeech'];
  for(let mask=0;mask<8;mask++){
    const node=vocab({senses:[{id:'s',meaning:'Meaning',translation:'',examples:[]}]});
    fields.forEach((field,i)=>{if(!(mask&(1<<i)))delete node[field];});
    const {root,controller}=setup(documentOf(node));
    assert.equal(root.querySelectorAll('.iui-vocab-meta').length,fields.filter((_,i)=>mask&(1<<i)).length);
    fields.forEach(field=>assert.equal(root.querySelector(`[data-vocab-metadata="${field}"]`)?.textContent,node[field]));
    assert.equal(root.querySelectorAll('.iui-vocab-metadata').length,mask?1:0);
    assert.equal(root.querySelectorAll('.iui-vocab-translation,.iui-vocab-examples,.iui-vocab-examples-title').length,0);
    controller.dispose();
  }
});

test('vocab: reveal/toggle and repeated self-rating retain every existing DOM node',()=>{
  const {root,dom,controller}=setup(),details=region(root),buttons=[...root.querySelectorAll('button')],senses=[...details.querySelectorAll('li')],reveal=action(root,'reveal');
  reveal.focus();reveal.click();assert.equal(dom.window.document.activeElement,reveal);
  assert.equal(details.hidden,false);assert.equal(reveal.getAttribute('aria-expanded'),'true');
  assert.equal(root.querySelector('[role=status]').textContent,'');
  action(root,'again').click();assert.equal(action(root,'again').getAttribute('aria-pressed'),'true');assert.equal(action(root,'familiar').getAttribute('aria-pressed'),'false');
  for(let i=0;i<10;i++)action(root,'familiar').click();
  assert.equal(action(root,'again').getAttribute('aria-pressed'),'false');assert.equal(action(root,'familiar').getAttribute('aria-pressed'),'true');
  assert.equal(root.querySelector('[role=status]').textContent,'Self-assessment: Familiar.');
  reveal.click();assert.equal(details.hidden,true);action(root,'again').click();assert.equal(action(root,'familiar').getAttribute('aria-pressed'),'true');
  reveal.click();action(root,'again').click();assert.equal(action(root,'again').getAttribute('aria-pressed'),'true');
  assert.deepEqual([...root.querySelectorAll('button')],buttons);assert.deepEqual([...details.querySelectorAll('li')],senses);
  controller.dispose();
});

test('vocab: hide moves only hidden focus to reveal; reset keeps its persistent action',()=>{
  const {root,dom,controller}=setup(),reveal=action(root,'reveal'),reset=action(root,'reset'),again=action(root,'again'),details=region(root);
  reveal.click();again.focus();again.click();reveal.click();assert.equal(dom.window.document.activeElement,reveal);assert.equal(details.hidden,true);
  reveal.click();again.focus();reset.click();assert.equal(dom.window.document.activeElement,reset);assert.equal(details.hidden,true);
  assert.equal(again.getAttribute('aria-pressed'),'false');assert.equal(action(root,'familiar').getAttribute('aria-pressed'),'false');
  reset.click();assert.equal(dom.window.document.activeElement,reset);assert.equal(root.querySelector('[role=status]').textContent,'Review reset. Meanings are hidden and your self-assessment is cleared.');
  assert.equal(region(root),details);assert.equal(action(root,'reset'),reset);
  controller.dispose();
});

test('vocab: unrelated changes and another card preserve local DOM, rating and focus',()=>{
  const input=documentOf();input.body.push(vocab({term:'second'}),{type:'button',label:'Change shared state',action:{kind:'set',bind:'unrelated',value:2}});
  const before=structuredClone(input),{root,host,dom,controller}=setup(input),second=host.querySelectorAll('.iui-vocab-card')[1],details=region(root);
  action(root,'reveal').click();action(root,'familiar').focus();action(root,'familiar').click();
  const html=root.outerHTML,focus=dom.window.document.activeElement;
  action(second,'reveal').click();action(second,'again').click();action(second,'reset').click();
  action(root,'familiar').focus();const observer=new dom.window.MutationObserver(()=>{});observer.observe(root,{subtree:true,attributes:true,childList:true,characterData:true});controller.setState({unrelated:4});
  assert.equal(root.outerHTML,html);assert.equal(dom.window.document.activeElement,focus);assert.equal(region(root),details);
  host.querySelector('[data-iui=button]').click();assert.equal(root.outerHTML,html);assert.equal(dom.window.document.activeElement,focus);
  assert.deepEqual(observer.takeRecords(),[]);observer.disconnect();assert.deepEqual(controller.getState(),{unrelated:2});assert.deepEqual(input,before);controller.dispose();
});

test('vocab: invalid updates are atomic, valid replacement resets and stale controls are inert',()=>{
  const {root,host,dom,controller}=setup(),oldReveal=action(root,'reveal'),oldRating=action(root,'again');
  oldReveal.click();oldRating.focus();oldRating.click();const html=root.outerHTML;
  assert.throws(()=>controller.update(documentOf(vocab({senses:[{id:'x',meaning:'a'},{id:'x',meaning:'b'}]}))));
  assert.equal(host.querySelector('.iui-vocab-card'),root);assert.equal(root.outerHTML,html);assert.equal(dom.window.document.activeElement,oldRating);
  controller.update(documentOf(vocab({term:'replacement'})));const replacement=host.querySelector('.iui-vocab-card');
  assert.notEqual(replacement,root);assert.equal(region(replacement).hidden,true);assert.equal(action(replacement,'again').getAttribute('aria-pressed'),'false');
  const replacementHTML=replacement.outerHTML;oldReveal.click();oldRating.click();action(root,'reset').click();
  assert.equal(root.outerHTML,html);assert.equal(replacement.outerHTML,replacementHTML);
  const currentReveal=action(replacement,'reveal');controller.dispose();currentReveal.click();assert.equal(replacement.outerHTML,replacementHTML);assert.equal(host.childElementCount,0);
  controller.dispose();
});

test('vocab: separate owners use ownerDocument; ids and disposal remain independent',()=>{
  const first=setup(),secondDom=new JSDOM('<!doctype html><html lang="zh-CN"><body><div id="host"></div></body></html>'),second=setup(documentOf(), 'zh-CN',secondDom);
  assert.notEqual(region(first.root).id,region(second.root).id);
  for(const el of second.root.querySelectorAll('*'))assert.equal(el.ownerDocument,secondDom.window.document);
  assert.equal(action(second.root,'reveal').textContent,'显示释义');assert.equal(action(second.root,'again').textContent,'再练一次');assert.equal(action(second.root,'familiar').textContent,'熟悉');
  action(second.root,'reveal').click();action(second.root,'familiar').focus();action(second.root,'reveal').click();
  assert.equal(secondDom.window.document.activeElement,action(second.root,'reveal'));
  first.controller.dispose();action(second.root,'reveal').click();assert.equal(region(second.root).hidden,false);second.controller.dispose();
});

test('vocab: enclosing renderer form never submits or collects a hidden learning value',async()=>{
  const dom=new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>'),host=dom.window.document.getElementById('host');let calls=0,submits=0;
  const controller=mount(host,{version:'iui/1',body:[{type:'form',label:'Study form',action:'save',children:[vocab()]}]},{actions:{save:()=>{calls++;}}});
  const root=host.querySelector('.iui-vocab-card');host.querySelector('form').addEventListener('submit',()=>submits++);
  for(let repeat=0;repeat<3;repeat++)for(const name of ['reveal','again','familiar','reveal','reset'])action(root,name).click();
  await Promise.resolve();assert.equal(calls,0);assert.equal(submits,0);assert.deepEqual(controller.getState(),{});assert.equal(root.querySelectorAll('[name],input').length,0);controller.dispose();
});

test('vocab: supplied HTML-looking text, Unicode, examples and sense order stay literal',()=>{
  const literal='<script>globalThis.executed=1</script><img src="bad" onerror="x()"> e\u0301\r\n\u2028العربية';
  const node=vocab({term:literal,languageLabel:literal,pronunciation:literal,partOfSpeech:literal,senses:[{id:'second',meaning:literal,translation:literal,examples:[literal,'second']},{id:'first',meaning:'last'}]});
  const {root,controller}=setup(documentOf(node));assert.equal(root.querySelector('.iui-vocab-term').textContent,literal);
  for(const el of root.querySelectorAll('[data-vocab-metadata]'))assert.equal(el.textContent,literal);
  assert.equal(root.querySelector('.iui-vocab-meaning').textContent,literal);assert.equal(root.querySelector('.iui-vocab-translation bdi').textContent,literal);
  assert.deepEqual([...root.querySelectorAll('.iui-vocab-sense')].map(el=>el.dataset.vocabSense),['second','first']);
  assert.deepEqual([...root.querySelectorAll('.iui-vocab-examples li')].map(el=>el.textContent),[literal,'second']);
  assert.equal(root.querySelectorAll('script,img').length,0);controller.dispose();
});

test('vocab: no network, media or storage API is accessed during local review',()=>{
  const dom=new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>',{url:'https://local.invalid/'});
  for(const name of ['fetch','XMLHttpRequest','WebSocket','Audio','speechSynthesis','localStorage','sessionStorage','indexedDB'])Object.defineProperty(dom.window,name,{configurable:true,get(){throw Error('Unexpected capability: '+name);}});
  const {root,controller}=setup(documentOf(),'en',dom);
  for(const name of ['reveal','again','familiar','reveal','reveal','reset'])action(root,name).click();controller.setState({unrelated:2});controller.update(documentOf());controller.dispose();
});

test('vocab: internal accessible ids cannot collide with authored node ids',()=>{
  // Cover the historical generated-id shape for every prior card in this file.
  const authored=Array.from({length:100},(_,index)=>['term','details','meanings','assessment'].map(suffix=>({type:'text',id:`vocab-${index+1}-${suffix}`,value:'Authored content'}))).flat();
  const {root,host,controller}=setup({version:'iui/1',body:[vocab(),{type:'box',children:authored}]});
  const ids=[...host.querySelectorAll('[id]')].map(el=>el.id);assert.equal(new Set(ids).size,ids.length);
  const details=region(root);assert.match(details.id,/^iui-vocab-internal-iui-\d+-\d+-details$/);
  assert.equal(host.ownerDocument.getElementById(action(root,'reveal').getAttribute('aria-controls')),details);
  assert.equal(host.ownerDocument.getElementById(root.getAttribute('aria-labelledby')),root.querySelector('.iui-vocab-term'));
  assert.equal(host.ownerDocument.getElementById(details.getAttribute('aria-labelledby')),details.querySelector('h3'));
  controller.dispose();
});

test('vocab: own/inherited disabled controls and async form busy state reject forged clicks',async()=>{
  const dom=new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>'),host=dom.window.document.getElementById('host');
  let finish,calls=0;const pending=new Promise(resolve=>finish=resolve);
  const controller=mount(host,{version:'iui/1',state:{locked:false},body:[{type:'form',label:'Review',action:'save',disabled:{$:'locked'},children:[vocab()]}]},{actions:{save:()=>{calls++;return pending;}}});
  const root=host.querySelector('.iui-vocab-card'),buttons=[...root.querySelectorAll('button')];
  const forge=()=>buttons.forEach(button=>button.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,cancelable:true})));
  action(root,'reveal').click();action(root,'again').click();const before=root.outerHTML;
  controller.setState({locked:true});assert.ok(buttons.every(button=>button.matches(':disabled')));forge();assert.equal(root.outerHTML,before);assert.equal(calls,0);
  controller.setState({locked:false});assert.ok(buttons.every(button=>!button.matches(':disabled')));
  for(const button of buttons)button.disabled=true;const ownDisabled=root.outerHTML;forge();assert.equal(root.outerHTML,ownDisabled);
  for(const button of buttons)button.disabled=false;
  host.querySelector('button[type=submit]').click();assert.equal(calls,1);assert.ok(buttons.every(button=>button.matches(':disabled')));
  forge();assert.equal(root.outerHTML,before);assert.equal(calls,1);
  finish();await pending;await Promise.resolve();assert.ok(buttons.every(button=>!button.matches(':disabled')));
  action(root,'familiar').click();assert.equal(action(root,'familiar').getAttribute('aria-pressed'),'true');
  action(root,'reset').click();assert.equal(region(root).hidden,true);assert.equal(dom.window.document.activeElement,action(root,'reset'));
  controller.dispose();
});
