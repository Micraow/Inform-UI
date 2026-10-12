import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mount} from '../dist/index.js';
const input=(bind,label=bind,extra={})=>({type:'input',kind:'text',bind,label,required:true,...extra});
const details=(summary,children)=>({type:'details',summary,children});
const spec=(children,state={first:'',second:''})=>({version:'iui/1',state,body:[{type:'form',label:'Original form',submitLabel:'Save original',children}]});
function setup(document,outerDetails=false){const dom=new JSDOM(outerDetails?'<details id=host-details><summary>Host</summary><main></main></details>':'<main></main>',{pretendToBeVisual:true}),host=dom.window.document.querySelector('main'),ctl=mount(host,document);return{dom,host,ctl,submit(){host.querySelector('button[type=submit]').click()},close(){ctl.dispose();dom.window.close()}};}
test('invalid input reveals exactly its nested disclosure path and receives focus',()=>{
 const h=setup(spec([details('Outer',[details('Inner',[input('first')])]),details('Unrelated',[input('second')])]));
 try{let submitted=0;h.host.addEventListener('iui:submit',()=>submitted++);h.submit();const ds=h.host.querySelectorAll('details');assert.deepEqual([...ds].map(d=>d.open),[true,true,false]);assert.equal(h.dom.window.document.activeElement,h.host.querySelector('[data-bind=first]'));assert.equal(h.host.querySelector('form').dataset.status,'invalid');assert.equal(submitted,0);}finally{h.close()}
});
test('disabled invalid controls do not expand their section or displace the next invalid field',()=>{
 const h=setup(spec([details('Disabled',[input('first','First',{disabled:true})]),input('second')]));
 try{h.submit();assert.equal(h.host.querySelector('details').open,false);assert.equal(h.dom.window.document.activeElement,h.host.querySelector('[data-bind=second]'));}finally{h.close()}
});
test('valid closed sections remain closed on successful local submit',async()=>{
 const h=setup(spec([details('Valid',[input('first')])],{first:'Supplied'}));
 try{h.submit();await Promise.resolve();assert.equal(h.host.querySelector('details').open,false);assert.equal(h.host.querySelector('form').dataset.status,'success');}finally{h.close()}
});
test('host disclosure ancestors outside the form are not changed',()=>{
 const h=setup(spec([details('Owned',[input('first')])]),true);
 try{const wrapper=h.dom.window.document.querySelector('#host-details');h.submit();assert.equal(wrapper.open,false);assert.equal(h.host.querySelector('details').open,true);}finally{h.close()}
});
for(const action of ['update','dispose'])test(`disclosure opening reentering ${action} cannot focus an old field`,()=>{
 const h=setup(spec([details('Owned',[input('first')])]));
 try{const d=h.host.querySelector('details'),old=h.host.querySelector('input');let focused=0;old.focus=()=>focused++;Object.defineProperty(d,'open',{configurable:true,get:()=>false,set(){action==='update'?h.ctl.update({version:'iui/1',body:[{type:'text',value:'Replacement'}]}):h.ctl.dispose()}});h.submit();assert.equal(focused,0);assert.equal(old.isConnected,false);}finally{h.close()}
});
