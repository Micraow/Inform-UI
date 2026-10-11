import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
const {mount}=await import(process.env.QA_RUNTIME?pathToFileURL(process.env.QA_RUNTIME):new URL('../dist/browser.js',import.meta.url));
const fixture=async name=>JSON.parse(await readFile(new URL(`../examples/${name}.json`,import.meta.url)));
function setup(spec){const dom=new JSDOM('<main></main>'),host=dom.window.document.querySelector('main'),ctl=mount(host,spec,{styles:false});return{dom,host,ctl,close(){ctl.dispose();dom.window.close();}};}
const visible=element=>!element.closest('[hidden]');
test('finance browser disclosure identifies one authored account instead of all USD disclosures',async()=>{
 const x=setup(await fixture('finance-lists'));try{const asset=x.host.querySelector('.iui-asset-distribution');assert.equal(asset.querySelectorAll('[data-currency=USD] details').length,2);const target=asset.querySelectorAll('tbody tr[data-account-id=cash] details');assert.equal(target.length,1);assert.match(target[0].textContent,/Synthetic amount/);}finally{x.close();}
});
test('finance reset preserves the actual visible credit disclosure instead of a hidden debit row',async()=>{
 const x=setup(await fixture('finance-lists'));try{const transactions=x.host.querySelector('.iui-transaction-list'),direction=transactions.querySelector('select');direction.value='credit';direction.dispatchEvent(new x.dom.window.Event('change',{bubbles:true}));assert.equal(visible(transactions.querySelector('summary')),false);const kept=transactions.querySelector('[data-transaction-id=sep-credit] details');assert.equal(visible(kept),true);kept.open=true;transactions.querySelector('button').click();assert.equal(kept.open,true);assert.equal(direction.value,'');}finally{x.close();}
});
test('mail full-message assertion excludes the separate quoted-body disclosure',async()=>{
 const spec=await fixture('mail-files');spec.body[0].body='Original long supplied message. '.repeat(30);const x=setup(spec);try{const root=x.host.querySelector('.iui-email-preview');assert.equal(root.querySelectorAll('.iui-email-body:not(.iui-email-excerpt)').length,2);const full=root.querySelectorAll(':scope > .iui-email-body:not(.iui-email-excerpt)');assert.equal(full.length,1);root.querySelector('.iui-email-expand').click();assert.equal(full[0].hidden,false);assert.equal(root.querySelector('.iui-email-quoted').open,false);}finally{x.close();}
});
test('unavailable product remains explicitly ARIA-disabled and rejects activation',async()=>{
 const x=setup(await fixture('decision-cards'));try{const root=x.host.querySelector('.iui-product-card'),select=root.querySelector('select'),review=root.querySelector('.iui-product-review');let count=0;root.addEventListener('iui:product-review',()=>count++);select.value='unavailable';select.dispatchEvent(new x.dom.window.Event('change',{bubbles:true}));assert.equal(review.getAttribute('aria-disabled'),'true');review.focus();review.click();assert.equal(count,0);assert.equal(x.dom.window.document.activeElement,review);}finally{x.close();}
});
test('first supplied page boundary remains focusable and rejects moving before authored pages',async()=>{
 const x=setup(await fixture('source-citations'));try{const root=x.host.querySelector('.iui-file-cite'),select=root.querySelector('select'),previous=root.querySelector('.iui-cite-previous');select.value='2';select.dispatchEvent(new x.dom.window.Event('change',{bubbles:true}));assert.equal(previous.getAttribute('aria-disabled'),'true');previous.focus();previous.click();assert.equal(select.value,'2');assert.equal(x.dom.window.document.activeElement,previous);}finally{x.close();}
});
test('tracker dimensions are constrained only for rendered controls; hidden rows remain hidden',async()=>{
 const x=setup(await fixture('supplied-trackers'));try{const flight=x.host.querySelector('.iui-flight-tracker'),filter=flight.querySelector('select');filter.value='disruption';filter.dispatchEvent(new x.dom.window.Event('change',{bubbles:true}));const all=[...flight.querySelectorAll('select,button,summary')];assert.ok(all.some(el=>!visible(el)));assert.ok(all.some(visible));assert.equal([...flight.querySelectorAll('.iui-tracker-record')].filter(visible).length,1);}finally{x.close();}
});
// A fixed matcher inventory records the original business expectations from the
// first real CI run. Locator and native-input fixes must not remove any of them.
const ts=(await import('typescript')).default;
const baseline=JSON.parse(await readFile(new URL('./fixtures/native124-browser-matchers.json',import.meta.url)));
function matchers(content){const ast=ts.createSourceFile('browser.mjs',content,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),out={};function visit(node){if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)){let root=node.expression;const names=[];while(ts.isPropertyAccessExpression(root)){names.unshift(root.name.text);root=root.expression;}if(ts.isCallExpression(root)&&ts.isIdentifier(root.expression)&&root.expression.text==='expect'){const key=names.join('.')+'('+node.arguments.map(arg=>arg.getText(ast)).join(',')+')';out[key]=(out[key]??0)+1;}}ts.forEachChild(node,visit);}visit(ast);return out;}
for(const[path,expected]of Object.entries(baseline))test(`browser repair preserves every original matcher in ${path}`,async()=>{const actual=matchers(await readFile(new URL('../'+path,import.meta.url),'utf8'));for(const[key,count]of Object.entries(expected))assert.ok(actual[key]>=count,`${key} lost an original expectation`);});
