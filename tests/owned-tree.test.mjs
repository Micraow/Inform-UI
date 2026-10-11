import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSync} from 'esbuild';
import {JSDOM} from 'jsdom';
const bundle=path=>import('data:text/javascript;base64,'+Buffer.from(buildSync({entryPoints:[new URL(path,import.meta.url).pathname],bundle:true,write:false,format:'esm',platform:'node',target:'es2022'}).outputFiles[0].text).toString('base64'));
const {ownedTree}=await bundle('../src/renderer/owned-tree.ts');
const {renderGeneration}=await bundle('../src/renderer/generation.ts');
function fixture(shadow=false){
 const dom=new JSDOM('<main></main>'),doc=dom.window.document,host=doc.querySelector('main');let target=host;
 if(shadow){const first=host.attachShadow({mode:'open'}),nested=doc.createElement('div');first.append(nested);target=nested.attachShadow({mode:'open'});}
 const root=doc.createElement('section');target.append(root);const bindings=new Set(),parent=renderGeneration(()=>true);
 const context={doc,lifecycle:parent,bind(fn){bindings.add(fn);return()=>bindings.delete(fn);}};
 return {dom,doc,host,target,root,parent,context,bindings,close(){parent.dispose();dom.window.close();}};
}
function watch(x,hook=()=>{}){
 const Native=x.dom.window.MutationObserver,active=new Set(),callbacks=[];let additions=0,removals=0;
 x.dom.window.MutationObserver=class extends Native{
  constructor(callback){super(callback);active.add(this);additions++;callbacks.push(callback);hook('construct',this);}
  observe(...args){const result=super.observe(...args);hook('observe',this);return result;}
  takeRecords(){const records=super.takeRecords();hook('records',this);return records;}
  disconnect(){if(active.delete(this))removals++;super.disconnect();hook('disconnect',this);}
 };
 return {active,callbacks,get additions(){return additions},get removals(){return removals}};
}
for(const shadow of [false,true])test(`owned tree ${shadow?'nested shadow':'document'} acquires once and releases repeated scopes without growth`,()=>{
 const x=fixture(shadow),w=watch(x);try{for(let i=0;i<30;i++){const life=ownedTree(x.context,x.root);assert.equal(life.current(),true);assert.equal(w.active.size,shadow?3:1);assert.equal(x.bindings.size,1);life.dispose();assert.equal(w.active.size,0);assert.equal(x.bindings.size,0);}assert.equal(w.additions,w.removals);}finally{x.close();}
});
for(const site of ['construct','observe','records'])test(`owner ${site} reentry disposing the generation compensates every observer`,()=>{
 const x=fixture(true);let once=false;const w=watch(x,step=>{if(step===site&&!once){once=true;x.parent.dispose();}});
 try{x.parent.guard(()=>{const life=ownedTree(x.context,x.root);life.current();})();assert.equal(once,true);assert.equal(w.active.size,0);assert.equal(x.bindings.size,0);assert.equal(w.additions,w.removals);}finally{x.close();}
});
test('observer getter replacing its generation cannot construct an old observer',()=>{
 const x=fixture(),Native=x.dom.window.MutationObserver;let created=0;
 Object.defineProperty(x.dom.window,'MutationObserver',{configurable:true,get(){x.parent.dispose();return class extends Native{constructor(...args){super(...args);created++;}};}});
 try{x.parent.guard(()=>ownedTree(x.context,x.root))();assert.equal(created,0);assert.equal(x.bindings.size,0);}finally{x.close();}
});
test('register-then-throw observe cleans known observer and preserves ordinary error',()=>{
 const x=fixture(),w=watch(x,site=>{if(site==='observe')throw new Error('host observe failed');});
 try{assert.throws(()=>ownedTree(x.context,x.root),/host observe failed/);assert.equal(w.active.size,0);assert.equal(w.additions,w.removals);}finally{x.close();}
});
test('late callbacks cannot retire a fresh replacement owner',()=>{
 const x=fixture(),w=watch(x);try{const old=ownedTree(x.context,x.root);assert.equal(old.current(),true);const callback=w.callbacks.at(-1);old.dispose();const fresh=ownedTree(x.context,x.root);callback([{removedNodes:[x.root]}]);assert.equal(fresh.current(),true);assert.equal(w.active.size,1);}finally{x.close();}
});
test('unrelated child list changes do not retire the component',()=>{
 const x=fixture();try{const life=ownedTree(x.context,x.root),sibling=x.doc.createElement('aside'),child=x.doc.createElement('span');x.host.append(sibling);sibling.append(child);child.remove();x.root.append(child);child.remove();assert.equal(life.current(),true);}finally{x.close();}
});
test('detached host can connect once before ownership is fixed',()=>{
 const x=fixture();x.host.remove();try{const life=ownedTree(x.context,x.root);assert.equal(life.current(),true);x.doc.body.append(x.host);assert.equal(life.current(),true);x.host.remove();x.doc.body.append(x.host);assert.equal(life.current(),false);}finally{x.close();}
});
test('reentrant disconnect cannot release a newer sibling scope',()=>{
 const x=fixture();let fresh,once=false;const w=watch(x,site=>{if(site==='disconnect'&&!once){once=true;fresh=ownedTree(x.context,x.root);}});
 try{const old=ownedTree(x.context,x.root);old.dispose();assert.equal(fresh.current(),true);assert.equal(w.active.size,1);fresh.dispose();assert.equal(w.active.size,0);}finally{x.close();}
});
test('ownership records created inside an ancestry getter are consumed before current returns',()=>{
 const x=fixture();try{const life=ownedTree(x.context,x.root);assert.equal(life.current(),true);const descriptor=Object.getOwnPropertyDescriptor(x.dom.window.Node.prototype,'parentNode'),parent=x.root.parentNode;let once=false;
  Object.defineProperty(x.root,'parentNode',{configurable:true,get(){if(!once){once=true;parent.removeChild(this);parent.appendChild(this);}return descriptor.get.call(this);}});
  assert.equal(life.current(),false);assert.equal(once,true);
 }finally{x.close();}
});
