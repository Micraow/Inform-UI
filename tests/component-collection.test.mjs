import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{JSDOM}from'jsdom';import{validateDocument,mount,compileHtml}from'../dist/index.js';
const input=JSON.parse(await readFile(new URL('../examples/component-collection.json',import.meta.url),'utf8'));
test('original thirty-component collection validates, compiles deterministically and preserves unrelated drafts',async()=>{
 const before=JSON.stringify(input);assert.equal(validateDocument(input).ok,true);assert.equal(input.body.filter(n=>n.type==='details').length,30);
 const html=await compileHtml(input,{lang:'zh-CN'});assert.equal(await compileHtml(input,{lang:'zh-CN'}),html);assert.equal(JSON.stringify(input),before);
 const dom=new JSDOM('<html lang="zh-CN"><body><main></main></body></html>',{pretendToBeVisual:true});const host=dom.window.document.querySelector('main');const controller=mount(host,input);const section=n=>host.querySelector(`details[id$="demo-section-${n}"]`);
 assert.equal(host.querySelectorAll('details[id*="demo-section-"]').length,30);for(let n=1;n<=30;n++)section(n).open=true;
 const checkbox=section(4).querySelector('input[type=checkbox]'),prior=checkbox.checked;checkbox.click();assert.equal(checkbox.checked,!prior);
 const draft=section(27).querySelector('textarea');draft.value='本页保留的原创邮件草稿。';draft.dispatchEvent(new dom.window.Event('input',{bubbles:true}));section(15).querySelector('button').click();assert.equal(section(15).querySelector('.iui-metric-value').textContent,'1');assert.equal(draft.value,'本页保留的原创邮件草稿。');section(27).open=false;section(27).open=true;assert.equal(section(27).querySelector('textarea'),draft);
 assert.ok(section(30).querySelectorAll('figcaption').length>0);assert.equal(section(30).querySelectorAll('img[src^="http"]').length,0);controller.dispose();assert.equal(host.childElementCount,0);dom.window.close();
});
