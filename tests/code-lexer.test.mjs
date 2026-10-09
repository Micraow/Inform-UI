import test from 'node:test';
import assert from 'node:assert/strict';
import {scanCode} from './code-harness.mjs';
const aliases=['js','javascript','JS','ts','typescript','TypeScript','json','JSON','py','python','PYTHON'];
const adversarial=['','\r\n\t \n','😀中\ud800\udfff\u0000\u202e<script>','</code></pre><script>alert(1)</script>','// line\r\n/* block */ / unfinished','/* unterminated','"\\\"quoted" false 1.2e-3','"unterminated\r\nnext','`template ${1 + `nested`} tail`',"'''triple\n\\'quotes''' x",'"'.repeat(12000),'\\'.repeat(12000),'x'.repeat(12000),'😀'.repeat(12000),' '.repeat(12000)];
for(const language of aliases)test(`exact roundtrip and linear cursor count: ${language}`,()=>{for(const value of adversarial){const{tokens,steps}=scanCode(value,language);assert.equal(tokens.map(t=>t.text).join(''),value);assert.equal(steps,value.length);assert.ok(tokens.length<=value.length);}});
test('only exact aliases; missing/unknown/non-trimmed remain raw',()=>{for(const language of [undefined,'','javascriptreact',' jsx ',' js','ruby','<script>']){const value='const x = "hi";';assert.deepEqual(scanCode(value,language),{tokens:[{kind:'text',text:value}],steps:0});}});
test('over-bound input remains exact raw without scanning',()=>{const value='x'.repeat(24001);assert.deepEqual(scanCode(value,'js'),{tokens:[{kind:'text',text:value}],steps:0});});
test('finite distinctions, comments and escapes',()=>{
 assert.deepEqual(scanCode('const x="a\\\"b"; // ok\r\n','js').tokens.map(t=>[t.kind,t.text]),[['keyword','const'],['text',' x='],['string','"a\\\"b"'],['text','; '],['comment','// ok'],['text','\r\n']]);
 assert.equal(scanCode('`a ${x}`','ts').tokens[0].kind,'string');
 assert.equal(scanCode("'''a\n b'''",'py').tokens[0].text,"'''a\n b'''");
 assert.equal(scanCode('# comment\nTrue','py').tokens.at(-1).kind,'keyword');
 assert.equal(scanCode('// no comments','json').tokens.some(t=>t.kind==='comment'),false);
});
test('deterministic adversarial fuzz has exact bounded work',()=>{let seed=7;const chars=['a','0','"',"'",'`','/','*','\\','\n','\r','\t','中','😀','\u202e','{','}','#'];for(let trial=0;trial<300;trial++){let value='';for(let i=0;i<400;i++){seed=(seed*1664525+1013904223)>>>0;value+=chars[seed%chars.length];}const {tokens,steps}=scanCode(value,aliases[trial%aliases.length]);assert.equal(tokens.map(t=>t.text).join(''),value);assert.equal(steps,value.length);}});
