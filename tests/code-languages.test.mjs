import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {highlightCode,setup,tick} from './code-harness.mjs';
const samples=JSON.parse(await readFile(new URL('./fixtures/code-language-samples.json',import.meta.url),'utf8'));
const styled=new Set(['comment','meta','keyword','name','selector-tag','variable','meta-keyword','string','regexp','meta-string','addition','number','literal','attr','title-class_','type','symbol','built_in','title','title-function_','section','deletion']);
for(const {language,aliases,value} of samples)test(`bundled language ${language}: real tokens, exact aliases and literal source`,()=>{
 const canonical=highlightCode(value,language);
 assert.ok(canonical.some(t=>styled.has(t.kind)),`${language} must produce a styled token, not silently fall back`);
 assert.equal(canonical.map(t=>t.text).join(''),value);
 for(const alias of [language,...aliases])for(const name of [alias,alias.toUpperCase()])assert.deepEqual(highlightCode(value,name),canonical,name);
 for(const unsafe of ['</code><img src="https://example.invalid/pixel" onerror="bad()">','\r\n\t中😀\u0000\ud800\udfff\u202e','&lt;script&gt;'])assert.equal(highlightCode(unsafe,language).map(t=>t.text).join(''),unsafe);
});
for(const {language,value} of samples)test(`render and copy ${language} preserve original text without HTML execution`,async()=>{
 const h=setup(),writes=[];h.clipboard(text=>{writes.push(text);return Promise.resolve();});
 try{
  const input=value+'\r\n\t</code><img src="https://example.invalid/pixel" onerror="bad()">';
  const out=h.mount({type:'code',value:input,language});
  assert.equal(out.querySelector('code').textContent,input);assert.equal(out.querySelector('img,script,iframe'),null);
  h.trustedActivation(out.querySelector('.iui-code-copy'));await tick();assert.deepEqual(writes,[input]);
  const plain=h.update({type:'code',value,language,highlight:false});assert.equal(plain.querySelector('code span'),null);assert.equal(plain.querySelector('code').textContent,value);
 }finally{h.dispose();}
});
test('unbundled, missing and non-exact language labels remain safe plain text',()=>{
 const value='<img src=x onerror=bad()>; const count = 7;';
 for(const language of [undefined,'','not-a-language','lua','scala',' c++','c++ ','<script>'])assert.deepEqual(highlightCode(value,language),[{kind:'text',text:value}]);
});
test('C-family types and diff additions/deletions have explicit shared palette rules',async()=>{
 const css=await readFile(new URL('../src/renderer/code-block.css',import.meta.url),'utf8');
 for(const scope of ['type','title','symbol','addition','deletion','meta-keyword','meta-string'])assert.ok(css.includes('.iui-code-token-'+scope),scope);
 assert.equal(samples.length,26);assert.equal(new Set(samples.flatMap(x=>[x.language,...x.aliases])).size,samples.flatMap(x=>[x.language,...x.aliases]).length);
});
