import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {JSDOM,VirtualConsole} from 'jsdom';
const {mount}=await import(process.env.QA_RUNTIME?pathToFileURL(process.env.QA_RUNTIME):new URL('../dist/index.js',import.meta.url));
const load=async name=>JSON.parse(await readFile(new URL(`../examples/${name}.json`,import.meta.url)));
const definitions=[
 ['cards',await load('follow-up-card-group'),'.iui-follow-up-card-group','iui:follow-up-card'],
 ['detail',await load('transaction-detail'),'.iui-transaction-detail','iui:transaction-detail'],
 ['recommendation',await load('recommendation-card'),'.iui-recommendation-card','iui:recommendation-card'],
 ...((await load('ledger-records')).body.map((node,i)=>['ledger'+i,{version:'iui/1',body:[node]},i?'.iui-ledger-recurring':'.iui-ledger-accounts',null])),
 ...((await load('player-summaries')).body.map((node,i)=>['player'+i,{version:'iui/1',body:[node]},i?'.iui-tennis-player':'.iui-nba-player',null])),
];
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
function setup(input,selector,topology){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM('<div id="outer"><div id="branch"><main></main></div></div>',{virtualConsole:vc});const doc=dom.window.document,outer=doc.querySelector('#outer');let host=doc.querySelector('main'),moved=doc.querySelector('#branch');
 if(topology==='shadow'){
  outer.innerHTML='';const first=outer.attachShadow({mode:'open'}),inner=doc.createElement('div');first.append(inner);const second=inner.attachShadow({mode:'open'});host=doc.createElement('main');second.append(host);moved=inner;
 }
 const ctl=mount(host,input,{styles:false}),root=host.querySelector(selector);assert.ok(root,selector);if(topology==='component')moved=root;
 return {dom,doc,host,root,ctl,moved,close(){ctl.dispose();dom.window.close();assert.deepEqual(errors,[]);}};
}
for(const [name,input,selector,eventName]of definitions)for(const topology of ['component','ancestor','shadow'])for(const delivery of ['synchronous','observer'])test(`${name}: ${topology} remove/restore permanently retires before ${delivery} action`,async()=>{
 const x=setup(input,selector,topology);try{
  let emitted=0;x.root.addEventListener(eventName??'unused',()=>emitted++);
  const parent=x.moved.parentNode,next=x.moved.nextSibling;x.moved.remove();parent.insertBefore(x.moved,next);
  if(delivery==='observer')await tick();
  const before=x.root.innerHTML;
  if(eventName)x.root.querySelector('button:not(:disabled)').click();
  else {const query=x.root.querySelector('input');query.value='no-matching-record';query.dispatchEvent(new x.dom.window.Event('input',{bubbles:true}));}
  assert.equal(emitted,0,'retired intent cannot escape');assert.equal(x.root.innerHTML,before,'old reader cannot repaint after restored ownership');
  x.ctl.update(input);const fresh=x.host.querySelector(selector);assert.notEqual(fresh,x.root,'explicit update creates a fresh owner');
  if(eventName){fresh.addEventListener(eventName,()=>emitted++);fresh.querySelector('button:not(:disabled)').click();assert.equal(emitted,1);}
  else{const before=fresh.innerHTML,query=fresh.querySelector('input');query.value='no-matching-record';query.dispatchEvent(new x.dom.window.Event('input',{bubbles:true}));assert.notEqual(fresh.innerHTML,before);}
 }finally{x.close();}
});
for(const [name,input,selector]of definitions)test(`${name}: observed ownership loss releases its listeners and image sources`,async()=>{
 const dom=new JSDOM('<main></main>'),doc=dom.window.document,host=doc.querySelector('main'),proto=dom.window.EventTarget.prototype,add=proto.addEventListener,remove=proto.removeEventListener,live=new Set();
 const track=(target,event)=>target===doc?event==='reset':target.nodeType===1&&['click','input','change','error','load'].includes(event);
 proto.addEventListener=function(event,fn,...args){const result=add.call(this,event,fn,...args);if(track(this,event))live.add(fn);return result;};
 proto.removeEventListener=function(event,fn,...args){if(track(this,event))live.delete(fn);return remove.call(this,event,fn,...args);};
 let ctl;try{ctl=mount(host,input,{styles:false});const root=host.querySelector(selector),images=[...root.querySelectorAll('img')];assert.ok(live.size>0);const parent=root.parentNode;root.remove();parent.append(root);await tick();assert.equal(live.size,0);for(const image of images)assert.equal(image.hasAttribute('src'),false);}
 finally{ctl?.dispose();proto.addEventListener=add;proto.removeEventListener=remove;dom.window.close();}
});
