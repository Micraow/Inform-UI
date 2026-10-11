import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../src/renderer/player-summaries.css',import.meta.url),'utf8');
function rule(selector){const start=css.indexOf(selector+'{');assert.notEqual(start,-1,'missing rule '+selector);const text=css.slice(start+selector.length+1);return text.slice(0,text.indexOf('}'));}
test('player cells preserve word intrinsic widths instead of arbitrary character breaks',()=>{
 const declarations=rule('.iui-player-summary :is(th,td)');
 assert.match(declarations,/overflow-wrap:normal(?:;|$)/);
 assert.match(declarations,/word-break:normal(?:;|$)/);
});
test('supplied period and numeric literals stay intact within locally scrolling tables',()=>{
 assert.match(rule('.iui-player-summary :is(th[scope=row],.iui-player-number)'),/white-space:nowrap/);
 assert.match(rule('.iui-player-table-scroll'),/overflow-x:auto/);
 assert.match(rule('.iui-player-table-scroll'),/max-inline-size:100%/);
});
