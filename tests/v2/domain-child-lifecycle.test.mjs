import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';

// Run from the repository root, or set INFORM_SOURCE to that root.
// Compile only this renderer in memory; no generated artifact is overwritten.
const source=path.resolve(process.env.INFORM_SOURCE??process.cwd());
const require=createRequire(path.join(source,'package.json'));
const {build}=require('esbuild');
const {JSDOM}=require('jsdom');
const built=await build({entryPoints:[path.join(source,'packages/domain-view-renderer/src/runtime.ts')],bundle:true,write:false,platform:'node',format:'esm',loader:{'.css':'text'},logLevel:'error'});
const {renderDomainView}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));

function harness({retain=false,onCreate}={}){
 const dom=new JSDOM('<main></main>');
 const controller=new dom.window.AbortController();
 const handles=[];let writes=0,calls=0;
 const context={document:dom.window.document,signal:controller.signal,budget:{consume(){}},renderChild(){
  calls++;
  if(retain&&handles.length)return handles[0];
  const element=dom.window.document.createElement('div'),input=dom.window.document.createElement('input');element.append(input);
  const listener=()=>writes++;input.addEventListener('input',listener);
  const handle={element,input,disposed:0,dispose(){this.disposed++;input.removeEventListener('input',listener);element.remove();}};
  handles.push(handle);onCreate?.({calls,controller,handle});return handle;
 }};
 const props=summary=>({data:{summary},children:[]});
 const view=renderDomainView({name:'DetailsView',oldType:'details'},props('Initial'),context,{});
 dom.window.document.querySelector('main').append(view.element);
 return {dom,controller,handles,view,props,get writes(){return writes;},get calls(){return calls;},close(){view.dispose();dom.window.close();}};
}

test('replacing a child retires its listener immediately and keeps only the live handle',()=>{
 const h=harness();try{
  const old=h.handles[0];old.input.dispatchEvent(new h.dom.window.Event('input'));assert.equal(h.writes,1);
  h.view.update(h.props('Second'));assert.equal(old.disposed,1);assert.equal(old.element.isConnected,false);
  old.input.dispatchEvent(new h.dom.window.Event('input'));assert.equal(h.writes,1);
  h.handles[1].input.dispatchEvent(new h.dom.window.Event('input'));assert.equal(h.writes,2);
  h.view.update(h.props('Third'));assert.deepEqual(h.handles.map(x=>x.disposed),[1,1,0]);
  h.view.dispose();h.view.dispose();assert.deepEqual(h.handles.map(x=>x.disposed),[1,1,1]);
 }finally{h.close();}
});

test('a retained child is not disposed while Details DOM and native open state survive updates',()=>{
 const h=harness({retain:true});try{
  const details=h.view.element.querySelector('details'),child=h.handles[0];details.open=true;
  h.view.update(h.props('Second'));h.view.update(h.props('Third'));
  assert.equal(h.view.element.querySelector('details'),details);assert.equal(details.open,true);assert.equal(details.querySelector('summary').textContent,'Third');
  assert.equal(h.handles.length,1);assert.equal(child.disposed,0);assert.equal(child.element.isConnected,true);
  h.view.dispose();assert.equal(child.disposed,1);
 }finally{h.close();}
});

for(const retirement of ['dispose','abort'])test(retirement+' makes later update inert',()=>{
 const h=harness();try{
  if(retirement==='dispose')h.view.dispose();else h.controller.abort();
  const calls=h.calls;h.view.update(h.props('Ignored'));
  assert.equal(h.calls,calls);assert.deepEqual(h.handles.map(x=>x.disposed),[1]);assert.equal(h.view.element.isConnected,false);
 }finally{h.close();}
});

test('a child factory that synchronously retires its owner cannot leak its returned child',()=>{
 const h=harness({onCreate:({calls,controller})=>{if(calls===2)controller.abort();}});try{
  // A retirement sentinel may propagate through the update; the host catches it.
  try{h.view.update(h.props('Retired'));}catch(error){if(typeof error!=='symbol')throw error;}
  assert.equal(h.calls,2);assert.deepEqual(h.handles.map(x=>x.disposed),[1,1]);assert.equal(h.view.element.isConnected,false);
 }finally{h.close();}
});
