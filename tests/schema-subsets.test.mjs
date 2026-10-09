import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateDocument } from '../dist/index.js';
import { assertClosedReferences, assertOwners, assertSchemaDirectoryContents, createSchemaSubset, encodeSchema, nodeInventory, schemaMetrics, SCHEMA_GROUPS } from '../scripts/schema-subsets.mjs';
const fullText = await readFile('src/schema/iui.schema.json', 'utf8'), full = JSON.parse(fullText);
const index = JSON.parse(await readFile('src/schema/fragments/index.json', 'utf8')), owners = index.nodeOwners;
const compile = schema => new Ajv2020({ strict: true, allErrors: false }).compile(schema), fullValidate = compile(full);
const example = async path => JSON.parse(await readFile(path, 'utf8'));
const types = value => {
  const out = new Set();
  const visit = v => { if (v && typeof v === 'object') { if (!Array.isArray(v) && Object.hasOwn(owners, v.type)) out.add(v.type); for (const child of Object.values(v)) visit(child); } };
  visit(value); return out;
};

test('every canonical node has one group; generated references are closed and metrics match bytes', async () => {
  assert.equal(assertOwners(full, owners).length, 116);
  assert.equal(new Set(index.groups.flatMap(g => g.ownedNodeTypes)).size, 116);
  assert.equal(index.groups.reduce((n, g) => n + g.ownedNodeTypes.length, 0), 116);
  assert.equal(index.fullSchema.sha256, createHash('sha256').update(fullText).digest('hex'));
  assert.deepEqual(schemaMetrics(fullText), Object.fromEntries(Object.entries(index.fullSchema).filter(([k]) => k !== 'path')));
  assert.match(index.tokenEstimateMethod, /rough.*not measured/); assert.equal(index.nodeSupportExceptions.native, 'rejected');
  for (const group of index.groups) {
    assert.deepEqual(group.includedGroups, group.id === 'base' ? ['base'] : ['base', group.id]);
    for (const kind of ['documentSchema', 'nodeSchema']) {
      const entry = group[kind], text = await readFile('src/schema/fragments/' + entry.path, 'utf8'), schema = JSON.parse(text);
      assertClosedReferences(schema); compile(schema); assert.ok(schema.$id.includes(index.fullSchema.sha256));
      assert.deepEqual(schemaMetrics(text), Object.fromEntries(Object.entries(entry).filter(([k]) => !['path', 'rootKind'].includes(k))));
      if (kind === 'documentSchema') {
        for (const key of ['version', 'title', 'description', 'theme', 'state', 'computed', 'body']) assert.deepEqual(schema.properties[key], full.properties[key]);
        assert.deepEqual(schema.required, full.required);
      } else { assert.equal(schema.$ref, '#/$defs/Node'); assert.equal(schema.properties, undefined); }
    }
  }
});

test('default domain Document bundles accept actual examples including shared layout/control nodes', async () => {
  for (const group of index.groups) {
    const schema = JSON.parse(await readFile('src/schema/fragments/' + group.documentSchema.path, 'utf8')), validate = compile(schema);
    for (const fixture of group.examples) {
      assert.equal(fixture.path, '../../' + fixture.repositoryPath);
      const input = await example(fixture.repositoryPath);
      assert.equal(fullValidate(input), true, fixture.repositoryPath);
      assert.equal(validate(input), true, JSON.stringify({ fixture: fixture.repositoryPath, errors: validate.errors }));
      assert.equal(validateDocument(input).ok, true);
    }
  }
  const finance = await example('examples/finance.json');
  const wrapped = { ...finance, body: [{ type: 'title', value: 'Shared heading' }, { type: 'row', children: finance.body }] };
  assert.equal(compile(createSchemaSubset(full, owners, ['base', 'finance']))(wrapped), true);
  assert.equal(compile(createSchemaSubset(full, owners, ['finance']))(wrapped), false);
});

test('union subsets preserve full structural results for every original example and invalid variant', async () => {
  for (const file of (await readdir('examples')).filter(name => name.endsWith('.json'))) {
    const input = await example('examples/' + file), groups = [...new Set([...types(input)].map(type => owners[type]))];
    const validate = compile(createSchemaSubset(full, owners, groups));
    assert.equal(validate(input), fullValidate(input), file); assert.equal(validate(input), true, file);
    const unknown = structuredClone(input); unknown.unexpected = true;
    const wrongVersion = { ...input, version: 'iui/2' }, extraNode = structuredClone(input); extraNode.body[0].unknownProperty = 'not permitted';
    const missingBody = { ...input }; delete missingBody.body;
    for (const variant of [unknown, wrongVersion, extraNode, missingBody]) { assert.equal(fullValidate(variant), false); assert.equal(validate(variant), fullValidate(variant), file); }
  }
  const mixed = { version: 'iui/1', body: [...(await example('examples/finance.json')).body, ...(await example('examples/weather.json')).body] };
  assert.equal(fullValidate(mixed), true);
  assert.equal(compile(createSchemaSubset(full, owners, ['base', 'finance']))(mixed), false);
  assert.equal(compile(createSchemaSubset(full, owners, ['base', 'finance', 'weather']))(mixed), true);
});

test('subset structure does not masquerade as shared runtime semantic validation', () => {
  const validate = compile(createSchemaSubset(full, owners, ['base']));
  for (const input of [
    { version: 'iui/1', body: [{ type: 'link', value: 'Invalid', href: 'javascript:alert(1)' }] },
    { version: 'iui/1', state: { x: 1 }, body: [{ type: 'slider', label: 'Invalid range', bind: 'x', min: 10, max: 0, step: 1 }] },
    { version: 'iui/1', body: [{ type: 'text', value: { $: 'missing' } }] },
  ]) { assert.equal(fullValidate(input), true); assert.equal(validate(input), true); assert.equal(validateDocument(input).ok, false); }
  const native = { version: 'iui/1', body: [{ type: 'native', name: 'box', children: [] }] };
  assert.equal(compile(createSchemaSubset(full, owners, ['base', 'compatibility']))(native), true); assert.equal(validateDocument(native).ok, false);
});

test('missing/remote references and ownership drift fail generation instead of shipping incomplete schemas', () => {
  const missing = structuredClone(full); delete missing.$defs.Value;
  assert.throws(() => createSchemaSubset(missing, owners, ['base']), /Unresolved/);
  const remote = structuredClone(full); remote.$defs.TextNode.properties.value = { $ref: 'https://example.invalid/never-fetch' };
  assert.throws(() => createSchemaSubset(remote, owners, ['base']), /Unsupported|local/);
  const nested = structuredClone(full); nested.$defs.TextNode.properties.value = { $ref: '#/$defs/Value/missing' };
  assert.throws(() => createSchemaSubset(nested, owners, ['base']), /Unresolved/);
  const incomplete = { ...owners }; delete incomplete.text;
  assert.throws(() => createSchemaSubset(full, incomplete, ['base']), /exactly one/);
  assert.throws(() => createSchemaSubset(full, { ...owners, text: 'missing' }, ['base']), /Unknown owner/);
  assert.throws(() => createSchemaSubset(full, owners, []), /at least one/);
  assert.throws(() => createSchemaSubset(full, owners, ['missing']), /Unknown schema group/);
});

test('generation is deterministic, never mutates the full schema, and CLI unions need no implementation copy', async () => {
  const before = encodeSchema(full), a = createSchemaSubset(full, owners, ['finance', 'base', 'finance']), b = createSchemaSubset(full, owners, ['base', 'finance']);
  assert.equal(encodeSchema(a), encodeSchema(b)); assert.equal(encodeSchema(full), before); assert.equal(before, fullText);
  assert.equal(encodeSchema(a), await readFile('src/schema/fragments/finance.schema.json', 'utf8'));
  assert.equal(execFileSync(process.execPath, ['scripts/schema-subset.mjs', '--groups', 'finance,base'], { encoding: 'utf8' }), encodeSchema(a));
  assert.equal(spawnSync(process.execPath, ['scripts/schema-subset.mjs', '--groups', 'unknown'], { encoding: 'utf8' }).status, 2);
  const all = createSchemaSubset(full, owners, Object.keys(SCHEMA_GROUPS)); assert.equal(nodeInventory(all).length, 116); const validate = compile(all);
  for (const file of (await readdir('examples')).filter(name => name.endsWith('.json'))) { const input = await example('examples/' + file); assert.equal(validate(input), fullValidate(input)); }
});

test('CDN discovery index and all closed bundles are byte-identical to generated source artifacts', async () => {
  assert.equal(await readFile('cdn/schema/index.json', 'utf8'), await readFile('src/schema/fragments/index.json', 'utf8'));
  for (const group of index.groups) for (const kind of ['documentSchema', 'nodeSchema']) {
    const path = group[kind].path; assert.equal(await readFile('cdn/schema/' + path, 'utf8'), await readFile('src/schema/fragments/' + path, 'utf8'));
  }
});

test('generated directories reject stale, missing or unexpected files rather than publishing silent drift', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'inform-schema-inventory-'));
  try {
    await mkdir(join(directory, 'nodes'));
    await assertSchemaDirectoryContents(directory);
    await assert.rejects(assertSchemaDirectoryContents(directory, { complete: true }), /Missing generated/);
    await writeFile(join(directory, 'retired.schema.json'), '{}');
    await assert.rejects(assertSchemaDirectoryContents(directory), /Unexpected generated/);
    await assertSchemaDirectoryContents('src/schema/fragments', { complete: true });
    await assertSchemaDirectoryContents('cdn/schema', { complete: true });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
