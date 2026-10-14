import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import * as core from '../../dist/v2/core-node.mjs';
import {createDefaultProfile,createProfile,viewSpecs} from '../../dist/v2/node.mjs';
test('Code and CodeView share the foundation module in both profiles; CodeData is retained',()=>{
 for(const profile of [core.createBaseProfile(),createDefaultProfile()]){
  for(const name of ['Code','CodeView'])assert.equal(profile.components[name].layer,'base');
  assert.ok(profile.data.CodeData);
  const runtime=core.createRuntime(profile);
  for(const name of ['Code','CodeView'])for(const data of ['{value:"echo hello",language:"bash"}','CodeData("echo hello","bash")'])assert.equal(runtime.commit(`root = Stack([${name}(${data})])`).ok,true);
  for(const flag of ['copy','highlight','showLanguage']){const invalid=runtime.commit(`root = Stack([Code({value:"inline",inline:true,${flag}:true})])`);assert.equal(invalid.ok,false);assert.ok(invalid.issues.some(issue=>issue.code==='inline-code-controls'));}
  assert.equal(runtime.commit('root = Stack([Code({value:"inline",inline:true})])').ok,true);
  assert.equal(runtime.commit(`root = Stack([Code({value:${JSON.stringify('😀'.repeat(12000))}})])`).ok,true);
  assert.equal(runtime.commit(`root = Stack([Code({value:${JSON.stringify('😀'.repeat(12001))}})])`).ok,false);
  runtime.dispose();
 }
 assert.equal(viewSpecs.some(spec=>spec.name==='CodeView'),false);
});
test('core mount renders themed code with defaults, alias, optouts, and no domain DOM',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://example.test'}),host=dom.window.document.querySelector('main');
 const h=core.mount(host,{source:'root = Stack([Code({value:"echo hello",language:"bash"}),CodeView({value:"plain",copy:false,highlight:false,showLanguage:false}),Code({value:"inline",inline:true})])'});
 try{
  assert.equal(host.querySelectorAll('.iui-code-copy').length,1);
  assert.equal(host.querySelector('.iui-code-language').textContent,'bash');
  assert.ok(host.querySelector('.iui-code-token-built_in'));
  assert.equal(host.querySelector('[data-component=CodeView]').tagName,'PRE');
  assert.equal(host.querySelector('.iui-inline-code').textContent,'inline');
  assert.equal(host.querySelector('.if-domain-view'),null);
 }finally{h.dispose();dom.window.close();}
});
test('core bundles contain curated highlighter and no domain or full-language payload',async()=>{
 const source=await readFile('src/shared/code-highlight.ts','utf8');
 assert.match(source,/highlight\.js\/lib\/core/);assert.doesNotMatch(source,/from ['"]highlight\.js['"]/);
 const bundle=await readFile('dist/v2/inform-core.js','utf8');
 assert.doesNotMatch(bundle,/KaTeX|lottie-web|renderDomainView/);
 assert.match(core.foundationCSS,/iui-code-language/);
});

test('pre-migration CodeView selections transparently include base/code',()=>{const p=createProfile({select:['base/layout','views/content'],viewNames:['CodeView']});const r=core.createRuntime(p);assert.equal(r.commit('root=Stack([CodeView({value:"echo hello",language:"bash"})])').ok,true);r.dispose();});

test('unrelated local state preserves CodeView DOM, scroll, selection and pending controls',()=>{
 const dom=new JSDOM('<main></main>',{url:'https://example.test'}),doc=dom.window.document;
 const h=core.mount(doc.querySelector('main'),{source:'$x=""\nroot=Stack([CodeView({value:"echo hello",language:"bash"}),Input("Draft",$x)])'});
 try{
  const before=doc.querySelector('[data-component=CodeView]'),pre=before.querySelector('pre'),button=before.querySelector('button');pre.scrollLeft=30;
  const range=doc.createRange();range.selectNodeContents(pre.querySelector('code'));doc.getSelection().addRange(range);
  const input=doc.querySelector('input');input.value='typed';input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  assert.equal(doc.querySelector('[data-component=CodeView]'),before);assert.equal(pre.scrollLeft,30);assert.equal(doc.getSelection().toString(),'echo hello');assert.equal(before.querySelector('button'),button);
  h.commit('root=Stack([Code({value:"replacement"})])');assert.equal(before.isConnected,false);assert.equal(doc.querySelector('code').textContent,'replacement');
 }finally{h.dispose();dom.window.close();}
});
