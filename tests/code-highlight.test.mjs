import test from 'node:test';
import assert from 'node:assert/strict';
import {highlightCode} from './code-harness.mjs';
const aliases=['js','javascript','JS','ts','typescript','TypeScript','json','JSON','py','python','PYTHON','bash','sh','Bash','html','css','sql','yaml','md'];
const adversarial=['','\r\n\t \n','😀中\ud800\udfff\u0000\u202e<script>','</code></pre><script>alert(1)</script>','// line\r\n/* block */ / unfinished','/* unterminated','"\\\"quoted" false 1.2e-3','"unterminated\r\nnext','`template ${1 + `nested`} tail`',"'''triple\n\\'quotes''' x",'"'.repeat(12000),'\\'.repeat(12000),'x'.repeat(12000),'😀'.repeat(12000),' '.repeat(12000)];
for(const language of aliases)test(`exact highlight.js roundtrip: ${language}`,()=>{for(const value of adversarial){const tokens=highlightCode(value,language);assert.equal(tokens.map(t=>t.text).join(''),value);assert.ok(tokens.length<=value.length);}});
test('only exact aliases; missing/unknown/non-trimmed remain raw',()=>{for(const language of [undefined,'','javascriptreact',' jsx ',' js','ruby','<script>']){const value='const x = "hi";';assert.deepEqual(highlightCode(value,language),[{kind:'text',text:value}]);}});
test('over-bound input remains exact raw without scanning',()=>{const value='x'.repeat(24001);assert.deepEqual(highlightCode(value,'js'),[{kind:'text',text:value}]);});
test('deterministic adversarial fuzz preserves exact text',()=>{let seed=7;const chars=['a','0','"',"'",'`','/','*','\\','\n','\r','\t','中','😀','\u202e','{','}','#'];for(let trial=0;trial<300;trial++){let value='';for(let i=0;i<400;i++){seed=(seed*1664525+1013904223)>>>0;value+=chars[seed%chars.length];}const tokens=highlightCode(value,aliases[trial%aliases.length]);assert.equal(tokens.map(t=>t.text).join(''),value);}});

test('Bash and richer JavaScript grammar scopes are produced by highlight.js',()=>{assert.ok(highlightCode('echo "$HOME" # hello','bash').some(t=>t.kind==='built_in'));assert.ok(highlightCode('const sum = (n) => /hello/.test(n);','javascript').some(t=>t.kind==='regexp'));});
