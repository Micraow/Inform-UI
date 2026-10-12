import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import { createShowcaseCatalog, nodeTypes } from '../scripts/showcase-catalog.mjs';
import { SCHEMA_MODULES } from '../scripts/schema-source/catalog.mjs';
import { validateDocument } from '../dist/index.js';
const catalog = await createShowcaseCatalog();
const schema = JSON.parse(await readFile(new URL('../src/schema/iui.schema.json', import.meta.url), 'utf8'));
const structural = new Ajv2020({ strict: true, allErrors: true }).compile(schema);

test('showcase covers every canonical Node exactly once without counting native as renderable', () => {
  const actual = schema.$defs.Node.oneOf.map(ref => schema.$defs[ref.$ref.slice('#/$defs/'.length)].properties.type.const).sort();
  assert.deepEqual(catalog.entries.map(entry => entry.type).sort(), actual);
  assert.equal(new Set(catalog.entries.map(entry => entry.type)).size, actual.length);
  assert.equal(catalog.inventoryCount, 218); assert.equal(catalog.renderableCount, 217); assert.equal(catalog.rejectedCount, 1);
  assert.equal(catalog.moduleCount, SCHEMA_MODULES.length); assert.equal(catalog.moduleCount, 90);
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

test('README minimal JSON is a valid complete document', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const text = readme.split('```json\n')[1]?.split('```')[0];
  assert.ok(text); assert.equal(validateDocument(JSON.parse(text)).ok, true);
});
