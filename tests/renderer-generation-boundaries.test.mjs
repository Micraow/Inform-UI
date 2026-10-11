import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {mount} from '../dist/browser.js';

const compiled = await build({entryPoints:['src/renderer/generation.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {renderGeneration} = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const doc = (label,x) => ({version:'iui/1',state:{x},body:[{type:'text',value:label}]});
function setup(options={styles:false}) {
  const dom = new JSDOM('<!doctype html><div id="host"></div>',{url:'https://example.invalid/'});
  const host = dom.window.document.getElementById('host');
  const controller = mount(host,doc('Initial',0),options);
  return {dom,host,controller};
}
function newest(f,x=2) {
  assert.deepEqual(f.controller.getState(),{x});
  assert.equal(f.host.querySelectorAll('.iui-body').length,1);
  assert.equal(f.host.querySelector('.iui-body').textContent,'Newest');
}

test('resource release is idempotent and recursive disposal cannot repeat cleanup',()=>{
  const life=renderGeneration(()=>true);let first=0,second=0;
  const release=life.own(()=>{first++;life.dispose();});
  life.own(()=>second++);life.dispose();life.dispose();release();
  assert.deepEqual([first,second],[1,1]);assert.equal(life.current(),false);
});
test('resource factory retirement compensates the returned resource',()=>{
  let active=true,releases=0;const life=renderGeneration(()=>active);
  const result=life.guard(()=>life.acquire(()=>{active=false;return 'old';},x=>{assert.equal(x,'old');releases++;}))();
  assert.equal(result,undefined);assert.equal(releases,1);life.dispose();assert.equal(releases,1);
});
test('only the exact internal retirement signal is swallowed',()=>{
  for(const error of [new Error('ordinary'),Symbol('retired-render-generation')]) {
    const life=renderGeneration(()=>true);
    assert.throws(()=>life.guard(()=>{throw error;})(),x=>x===error);
  }
  const life=renderGeneration(()=>true);assert.equal(life.guard(()=>{life.dispose();return 'obsolete';})(),undefined);
});
test('cleanup errors retain identity while remaining resources are released',()=>{
  const life=renderGeneration(()=>true),error=new Error('release failure');let released=0;
  life.own(()=>{throw error;});life.own(()=>released++);
  assert.throws(()=>life.dispose(),x=>x===error);assert.equal(released,1);life.dispose();
});
test('retired child scopes unregister from the parent instead of accumulating',()=>{
  const life=renderGeneration(()=>true);let released=0;
  for(let i=0;i<1000;i++) {const child=life.fork();child.own(()=>released++);child.dispose();assert.equal(life.size,0);}
  assert.equal(released,1000);life.dispose();assert.equal(released,1000);
});
test('a child predicate cannot report live after retiring its parent',()=>{
  const parent=renderGeneration(()=>true);let armed=false;
  const child=parent.fork(()=>{if(armed)parent.dispose();return true;});
  armed=true;assert.equal(child.current(),false);assert.equal(parent.current(),false);
});
test('a guarded late promise continuation cannot mutate after retirement',async()=>{
  const life=renderGeneration(()=>true);let resolve,value='current';
  const pending=new Promise(done=>{resolve=done;});
  const delivery=pending.then(life.guard(next=>{value=next;}));
  life.dispose();resolve('stale');await delivery;assert.equal(value,'current');
});
test('failed child creation does not strand a parent registration',()=>{
  const life=renderGeneration(()=>true),error=new Error('invalid child predicate');
  assert.throws(()=>life.fork(()=>{throw error;}),x=>x===error);assert.equal(life.size,0);life.dispose();
});

for(const hook of ['actions','language','styles']) for(const action of ['update','dispose']) {
  test(`${hook} factory getter ${action} cannot publish obsolete context`,()=>{
    let armed=false,controller;
    const options={get actions(){if(armed&&hook==='actions'){armed=false;interrupt();}return {};},get styles(){if(armed&&hook==='styles'){armed=false;interrupt();}return false;}};
    const f=setup(options);controller=f.controller;
    const original=f.host.closest.bind(f.host);
    f.host.closest=(...args)=>{if(armed&&hook==='language'){armed=false;interrupt();}return original(...args);};
    function interrupt(){if(action==='update')controller.update(doc('Newest',2));else controller.dispose();}
    try {
      armed=true;controller.update(doc('Obsolete',1));assert.equal(armed,false);
      if(action==='update')newest(f);else{assert.equal(f.host.childElementCount,0);assert.throws(()=>controller.getState(),/disposed/);}
    } finally {f.host.closest=original;controller.dispose();f.dom.window.close();}
  });
}

test('nested valid factory updates preserve the deepest generation state and DOM',()=>{
  let depth=0,armed=false,controller;
  const f=setup({styles:false,get actions(){if(armed&&depth<2){depth++;controller.update(doc(depth===2?'Newest':'Middle',depth+1));}return {};}});
  controller=f.controller;
  try {armed=true;controller.update(doc('Obsolete',1));assert.equal(depth,2);newest(f,3);}
  finally {controller.dispose();f.dom.window.close();}
});

for(const action of ['update','dispose']) test(`final native replaceChildren ${action} cannot overwrite newest DOM`,()=>{
  const f=setup();const original=f.host.replaceChildren.bind(f.host);let armed=true;
  f.host.replaceChildren=(...args)=>{if(armed){armed=false;if(action==='update')f.controller.update(doc('Newest',2));else f.controller.dispose();}return original(...args);};
  try {f.controller.update(doc('Obsolete',1));assert.equal(armed,false);if(action==='update')newest(f);else assert.equal(f.host.childElementCount,0);}
  finally {f.host.replaceChildren=original;f.controller.dispose();f.dom.window.close();}
});

for(const action of ['update','dispose']) test(`listener registration ${action} releases any late old registration`,()=>{
  const f=setup();const document=f.dom.window.document,create=document.createElement.bind(document);let armed=true;const active=new Set();
  document.createElement=(...args)=>{
    const element=create(...args);
    if(args[0]==='button') {
      const add=element.addEventListener.bind(element),remove=element.removeEventListener.bind(element);
      element.addEventListener=(name,fn,...rest)=>{add(name,fn,...rest);active.add(fn);if(armed){armed=false;if(action==='update')f.controller.update(doc('Newest',2));else f.controller.dispose();}};
      element.removeEventListener=(name,fn,...rest)=>{active.delete(fn);return remove(name,fn,...rest);};
    }
    return element;
  };
  try {
    f.controller.update({version:'iui/1',state:{x:1},body:[{type:'button',label:'Old',action:{kind:'set',bind:'x',value:4}}]});
    assert.equal(armed,false);assert.equal(active.size,0);if(action==='update')newest(f);else assert.equal(f.host.childElementCount,0);
  } finally {document.createElement=create;f.controller.dispose();f.dom.window.close();}
});

for(const action of ['update','dispose']) test(`ResizeObserver constructor ${action} releases late observers`,()=>{
  const f=setup();let armed=true;const active=new Set();
  f.dom.window.ResizeObserver=class {
    constructor(){active.add(this);if(armed){armed=false;if(action==='update')f.controller.update(doc('Newest',2));else f.controller.dispose();}}
    observe(){}
    disconnect(){active.delete(this);}
  };
  try {f.controller.update(doc('Obsolete',1));assert.equal(armed,false);if(action==='update'){newest(f);assert.equal(active.size,1);}else assert.equal(f.host.childElementCount,0);}
  finally {f.controller.dispose();assert.equal(active.size,0);f.dom.window.close();}
});

test('repeated update/dispose returns listener and observer ownership to zero',()=>{
  const f=setup();const proto=f.dom.window.EventTarget.prototype,add=proto.addEventListener,remove=proto.removeEventListener;const entries=new Map(),observers=new Set();
  proto.addEventListener=function(name,fn,...rest){if(this instanceof f.dom.window.HTMLElement){let map=entries.get(this);if(!map)entries.set(this,map=new Map());let set=map.get(name);if(!set)map.set(name,set=new Set());set.add(fn);}return add.call(this,name,fn,...rest);};
  proto.removeEventListener=function(name,fn,...rest){entries.get(this)?.get(name)?.delete(fn);return remove.call(this,name,fn,...rest);};
  f.dom.window.ResizeObserver=class{constructor(){observers.add(this);}observe(){}disconnect(){observers.delete(this);}};
  try {
    for(let i=0;i<30;i++)f.controller.update({version:'iui/1',state:{x:i},body:[{type:'button',label:'Next',action:{kind:'set',bind:'x',value:3}}]});
    assert.equal(observers.size,1);f.controller.dispose();assert.equal(observers.size,0);
    assert.equal([...entries.values()].flatMap(x=>[...x.values()]).reduce((n,x)=>n+x.size,0),0);
  } finally {proto.addEventListener=add;proto.removeEventListener=remove;f.controller.dispose();f.dom.window.close();}
});
test('Forms, Label, Slider, Table and Overlay IDs stay unique across context replacement',()=>{
  const f=setup();
  const input={version:'iui/1',state:{value:'',level:1,enabled:false},body:[
    {type:'input',kind:'text',label:'Name',bind:'value'},
    {type:'slider',label:'Level',bind:'level',min:0,max:5,step:1},
    {type:'toggle',id:'authored',label:'Enabled',bind:'enabled'},
    {type:'label',text:'Extra label',target:'authored'},
    {type:'table',columns:['A'],rows:[[1]]},
    {type:'popover',label:'Details',children:[{type:'text',value:'Content'}]}
  ]};
  const internal=()=>[...f.host.querySelectorAll('[id]')].filter(e=>!e.hasAttribute('data-iui')).map(e=>e.id);
  try {
    f.controller.update(input);const first=internal(),authored=f.host.querySelector('[data-iui="toggle"]').id;
    assert.equal(new Set(first).size,first.length);assert.ok(first.length>=8);
    f.controller.update(input);const second=internal();assert.equal(new Set(second).size,second.length);
    assert.ok(second.every(id=>!first.includes(id)));assert.equal(f.host.querySelector('[data-iui="toggle"]').id,authored);
  } finally {f.controller.dispose();f.dom.window.close();}
});
