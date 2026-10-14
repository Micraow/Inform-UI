import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as api from '@micraow/inform-ui';
import * as browser from '@micraow/inform-ui/browser';
import * as core from '@micraow/inform-ui/core';

const full=['createBaseProfile','createDefaultProfile','createProfile','createRuntime','mount','prompt','version'];
test('public root and browser expose only the current DSL surface',()=>{
 assert.deepEqual(Object.keys(api),full);assert.deepEqual(Object.keys(browser),full);
 assert.deepEqual(Object.keys(core),['createBaseProfile','createRuntime','mount','prompt','version']);
 for(const runtime of [api.createRuntime(api.createDefaultProfile()),core.createRuntime(core.createBaseProfile())]){
  try{assert.equal(runtime.commit('root=Stack([Text("Original public consumer")])').ok,true);assert.equal(runtime.commit({version:'iui/1',body:[]}).ok,false);}finally{runtime.dispose();}
 }
});
test('legacy JSON package entries and implementation deep imports are unavailable',async()=>{
 const pkg=JSON.parse(await readFile('package.json','utf8'));
 for(const key of ['./schema','./style.css','./next','./next/core'])assert.equal(pkg.exports[key],undefined,key);
 for(const path of ['schema','style.css','next','next/core','dist/index.js'])await assert.rejects(import('@micraow/inform-ui/'+path),{code:'ERR_PACKAGE_PATH_NOT_EXPORTED'});
 assert.equal(pkg.private,true);assert.ok(!pkg.files.includes('dist'));assert.ok(!pkg.files.some(x=>x.includes('schema')));
});
