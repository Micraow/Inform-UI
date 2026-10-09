// Copy to Inform-UI/tests/table.test.mjs after the renderer/schema are integrated.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {mount,validateDocument,compileHtml,compileArtifact} from '../dist/index.js';
const fixture=JSON.parse(await readFile(new URL('../examples/structured-tables.json',import.meta.url)));
const setup=()=>{const dom=new JSDOM('<div id="host"></div>',{url:'https://example.test/'});return {dom,host:dom.window.document.getElementById('host')};};

test('public table mount preserves structured semantics, expressions, state focus, update and disposal',()=>{
  assert.equal(validateDocument(fixture).ok,true);const {dom,host}=setup();const controller=mount(host,fixture);
  assert.equal(host.querySelectorAll('.iui-table').length,2);assert.equal(host.querySelectorAll('.iui-table')[0].tBodies.length,2);
  const scroll=host.querySelector('.iui-table-scroll'),cell=host.querySelector('.iui-table tbody tr').cells[2];scroll.focus();
  controller.setState({count:23});assert.equal(cell.textContent,'23');assert.equal(host.querySelector('.iui-table-scroll'),scroll);assert.equal(dom.window.document.activeElement,scroll);
  const ids=[...host.querySelectorAll('th[id]')].map(node=>node.id);assert.equal(new Set(ids).size,ids.length);
  controller.update(fixture);assert.ok([...host.querySelectorAll('th[id]')].every(node=>!ids.includes(node.id)));
  controller.update({version:'iui/1',body:[{type:'table',columns:['Value','Row label'],rows:[[1,{value:'Trailing',header:true}]]}]});
  const leading=host.querySelector('td');assert.deepEqual(leading.getAttribute('headers').split(' ').map(id=>dom.window.document.getElementById(id).textContent),['Value']);
  controller.dispose();assert.equal(host.childElementCount,0);controller.dispose();
});

test('public invalid occupancy/state updates reject atomically instead of repairing or showing partial table',()=>{
  const {host}=setup();const controller=mount(host,fixture),before=host.innerHTML;
  const invalid=structuredClone(fixture);invalid.body[0].sections[1].rows[0][0].rowSpan=20;
  assert.throws(()=>controller.update(invalid));assert.equal(host.innerHTML,before);
  const sourceConflict=structuredClone(fixture);sourceConflict.body[0].rows=[];assert.throws(()=>controller.update(sourceConflict));assert.equal(host.innerHTML,before);
  assert.throws(()=>controller.setState({count:Infinity}));assert.equal(host.innerHTML,before);assert.equal(controller.getState().count,0);
  const badExpression=structuredClone(fixture);badExpression.body[0].sections[1].rows[0][2].value={$:'unavailable'};
  assert.throws(()=>controller.update(badExpression));assert.equal(host.innerHTML,before);controller.dispose();
});

test('public compiler remains deterministic and retains structured table data without executing markup',async()=>{
  const input=structuredClone(fixture);input.body[0].caption='Literal </script><script>window.bad=1</script>';
  const first=await compileHtml(input),second=await compileHtml(input);assert.equal(first,second);
  assert.match(first,/\\u003c\/script\\u003e/);assert.doesNotMatch(first,/<script>window\.bad=1<\/script>/);
  const artifact=await compileArtifact(input,{assets:'shared'});assert.ok(artifact.html.includes('sha256-'));assert.ok(Object.keys(artifact.assets).length>0);
});
