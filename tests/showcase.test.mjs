import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import { createShowcaseCatalog, nodeTypes } from '../scripts/showcase-catalog.mjs';
import { SCHEMA_MODULES } from '../scripts/schema-source/catalog.mjs';
import { validateDocument } from '../dist/index.js';
const catalog = await createShowcaseCatalog();
const schema = JSON.parse(await readFile(new URL('../src/schema/iui.schema.json', import.meta.url), 'utf8'));
// Fail-fast preserves the complete schema decision without retaining errors from
// every non-matching branch of the recursive 219-node union.
const structural = new Ajv2020({ strict: true, allErrors: false }).compile(schema);

test('showcase covers every canonical Node exactly once without counting native as renderable', () => {
  const actual = schema.$defs.Node.oneOf.map(ref => schema.$defs[ref.$ref.slice('#/$defs/'.length)].properties.type.const).sort();
  assert.deepEqual(catalog.entries.map(entry => entry.type).sort(), actual);
  assert.equal(new Set(catalog.entries.map(entry => entry.type)).size, actual.length);
  assert.equal(catalog.inventoryCount, 219); assert.equal(catalog.renderableCount, 218); assert.equal(catalog.rejectedCount, 1);
  assert.equal(catalog.moduleCount, SCHEMA_MODULES.length); assert.equal(catalog.moduleCount, 91);
  assert.deepEqual(catalog.entries.filter(entry => entry.status === 'rejected').map(entry => entry.type), ['native']);
});
for (const entry of catalog.entries) test(`showcase ${entry.type}: exact sample passes structural schema and expected semantic boundary`, () => {
  assert.equal(structural(entry.document), true, JSON.stringify(structural.errors));
  assert.equal(validateDocument(entry.document).ok, entry.status === 'renderable');
  assert.ok(nodeTypes(entry.document).has(entry.type));
  assert.ok(entry.group); assert.ok(entry.contractPaths.length); assert.ok(entry.notes.length);
  assert.ok(entry.requiredModules.includes(entry.moduleId));
  assert.ok(entry.resolvedModules.includes(entry.moduleId));
  for (const dependency of entry.declaredDependencies) assert.ok(entry.resolvedModules.includes(dependency));
});
test('context-only examples retain grid, tab and label relationships', () => {
  const find = type => catalog.entries.find(entry => entry.type === type);
  assert.equal(find('grid-item').document.body[0].type, 'grid');
  assert.equal(find('tab-panel').document.body[0].type, 'tab-group');
  const label = find('label').document;
  assert.equal(label.body[0].target, label.body[1].id);
  assert.equal(validateDocument(label).ok, true);
});
test('gallery JSON formatting is lossless and markup is created without HTML injection', async () => {
  const app = await readFile(new URL('../showcase/showcase.js', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /\.innerHTML\s*=|insertAdjacentHTML|\beval\(/);
  assert.match(app, /JSON\.stringify\(mountedDocument, null, 2\)/);
  assert.match(app, /controller\?\.dispose\(\)/);
});

test('authored layouts demonstrate composition instead of minimized security fixtures', () => {
  const find = type => catalog.entries.find(entry => entry.type === type);
  for (const type of ['col', 'row', 'grid', 'box', 'card', 'section', 'figure', 'details', 'carousel', 'flow', 'divider', 'spacer']) {
    const entry = find(type);
    assert.equal(entry.sourceExample, `showcase/examples/${type}.json`, type);
    assert.doesNotMatch(JSON.stringify(entry.document), /<\/script>|<img\s|javascript:|onerror\s*=/i, type);
  }
  for (const type of ['col', 'row', 'grid', 'box', 'card', 'section', 'details', 'carousel', 'flow']) {
    const node = find(type).document.body[0];
    assert.equal(node.type, type);
    assert.ok(node.children.length >= 2, `${type} needs meaningful sibling content`);
    assert.ok(node.children.some(child => child.type !== 'code'), type);
  }
  assert.equal(find('col').document.body[0].children.length, 3);
  assert.equal(find('col').document.body[0].gap, 4);
  assert.equal(find('col').document.body[0].align, 'stretch');
  const grid = find('grid').document.body[0];
  assert.equal(grid.columns, 3); assert.equal(grid.mobileColumns, 1);
  assert.ok(grid.children.some(child => child.colSpan === 2));
  assert.deepEqual(find('grid-item').document, find('grid').document);
  for (const type of ['divider', 'spacer']) {
    assert.equal(find(type).document.body.length, 3);
    assert.equal(find(type).document.body[1].type, type);
  }
});

test('animate starts with visible, explicitly replayable content rather than an empty boundary',()=>{
 const entry=catalog.entries.find(entry=>entry.type==='animate');assert.equal(entry.sourceExample,'showcase/examples/animate.json');const n=entry.document.body[0];assert.equal(n.type,'animate');assert.ok(n.children.length>0);assert.equal(n.effect,'rise');assert.equal(n.duration,800);assert.match(JSON.stringify(n.children),/Reduce motion/);
});

test('native video is a supplemental html-view demonstration, never a fictional wire type',()=>{
 assert.equal(catalog.inventoryCount,catalog.entries.length);assert.equal(catalog.entries.some(entry=>entry.type==='video'),false);
 assert.equal(catalog.demonstrations.length,1);const demo=catalog.demonstrations[0];assert.equal(demo.type,'video');assert.equal(demo.wireType,'html-view');assert.equal(demo.document.body[0].type,'html-view');assert.equal(demo.sourceExample,'showcase/examples/video.json');assert.equal(validateDocument(demo.document).ok,true);assert.ok(catalog.entries.some(entry=>entry.type==='youtube'));
});

test('fail-fast structural validation still rejects invalid envelopes, unknown nodes and unknown fields',()=>{
 for(const document of [{version:'wrong',body:[]},{version:'iui/1',body:[{type:'not-a-node'}]},{version:'iui/1',body:[{type:'text',value:'visible',unexpected:true}]}])assert.equal(structural(document),false);
});

test('fee overview demonstrates semantic categories without the test-fixture placeholder logo', async () => {
  const catalog = await createShowcaseCatalog();
  const entry = catalog.entries.find(item => item.type === 'ledger-fee-interest-paid');
  assert.equal(entry.sourceExample, 'showcase/examples/ledger-fee-interest-paid.json');
  const node = entry.document.body[0];
  assert.equal(node.ranges.length, 2);
  assert.ok(node.ranges[0].transactions.some(row => row.categoryIcon === 'receipt'));
  assert.ok(node.ranges[0].transactions.some(row => row.categoryIcon === 'percent'));
  assert.ok(node.ranges.every(range => range.transactions.every(row => row.logoUrl === undefined)));
  assert.equal(node.ranges[1].transactions.length, 0);
});
