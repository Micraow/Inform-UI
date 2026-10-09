import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {runInContext} from 'node:vm';import {JSDOM} from 'jsdom';
import * as esm from '../cdn/iui.min.js';
const fixtures=await Promise.all(['basketball-tournament','election-results'].map(async name=>JSON.parse(await readFile(new URL('../examples/'+name+'.json',import.meta.url)))));
for(const bundle of['esm','global'])for(const index of[0,1])test(`supplied results ${bundle} CDN ${index} validates and renders current source contract`,async()=>{
  const dom=new JSDOM('<!doctype html><main></main>',{runScripts:'outside-only',url:'https://example.org/'});let api=esm;
  if(bundle==='global'){runInContext(await readFile(new URL('../cdn/iui.global.min.js',import.meta.url),'utf8'),dom.getInternalVMContext());api=dom.window.IUI;}
  const value=spec=>bundle==='global'?dom.window.JSON.parse(JSON.stringify(spec)):spec;
  assert.equal(api.validateDocument(value(fixtures[index])).ok,true);const host=dom.window.document.querySelector('main'),controller=api.mount(host,value(fixtures[index]));
  const root=host.querySelector(index?'.iui-election-results':'.iui-basketball-tournament');assert.ok(root);assert.match(root.textContent,/No live feed, inferred winner/);
  const query=root.querySelector('input');query.value='not in fixture';query.dispatchEvent(new dom.window.Event('input'));assert.equal(root.querySelectorAll(index?'[data-contest-id=coast] tbody tr:not([hidden])':'.iui-tournament-match:not([hidden])').length,0);
  root.querySelector('.iui-results-reset').click();assert.equal(query.value,'');assert.equal(root.querySelectorAll(index?'[data-contest-id=coast] tbody tr:not([hidden])':'.iui-tournament-match:not([hidden])').length,index?4:3);
  const bad=structuredClone(fixtures[index]);bad.body[0].endpoint='https://example.org/';assert.equal(api.validateDocument(value(bad)).ok,false);controller.dispose();assert.equal(host.children.length,0);dom.window.close();
});
