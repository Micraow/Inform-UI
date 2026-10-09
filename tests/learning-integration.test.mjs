import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mount,validateDocument} from '../dist/index.js';
const fill={type:'fill-blank',title:'Fill',parts:[{blank:'word'}],blanks:[{id:'word',label:'Word',answers:['yes']}]};
const sentence={type:'sentence-builder',title:'Sentence',tokens:[{id:'one',text:'One'}],answer:['one']};
test('new learning internal IDs cannot collide with authored node IDs or one another',()=>{
 const dom=new JSDOM('<div id="host"></div>'),host=dom.window.document.querySelector('#host');
 const c=mount(host,{version:'iui/1',body:[{type:'text',id:'fill-blank-1-title',value:'Authored A'},{type:'text',id:'sentence-builder-1-title',value:'Authored B'},fill,sentence]});
 const ids=[...host.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
 for(const root of host.querySelectorAll('.iui-fill-blank,.iui-sentence-builder')){const title=dom.window.document.getElementById(root.getAttribute('aria-labelledby'));assert.ok(root.contains(title));assert.match(title.tagName,/^H/);}
 c.dispose();
});
test('both local practice types reject recursively owned forms and retain state across tab changes',()=>{
 for(const node of [fill,sentence]){const s={version:'iui/1',body:[{type:'form',label:'Outer',children:[{type:'list',items:[{type:'box',children:[node]}]}]}]};const result=validateDocument(s);assert.equal(result.ok,false);assert.ok(result.issues.some(e=>e.code==='LEARNING_FORM'));}
 const dom=new JSDOM('<div id="host"></div>'),host=dom.window.document.querySelector('#host');const c=mount(host,{version:'iui/1',state:{n:0},body:[{type:'tab-group',label:'Study',children:[{type:'tab-panel',id:'work',label:'Practice',children:[fill,sentence]},{type:'tab-panel',id:'rest',label:'Other',children:[{type:'text',value:'Other'}]}]}]});
 const input=host.querySelector('.iui-fill-blank input');input.value='local draft';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));const add=host.querySelector('[data-sentence-action=add]');add.click();const chosen=host.querySelector('.iui-sentence-builder-item');const tabs=host.querySelectorAll('[role=tab]');tabs[1].click();c.setState({n:1});tabs[0].click();assert.equal(host.querySelector('.iui-fill-blank input'),input);assert.equal(input.value,'local draft');assert.equal(host.querySelector('.iui-sentence-builder-item'),chosen);assert.equal(dom.window.document.activeElement,tabs[0]);c.dispose();
});
