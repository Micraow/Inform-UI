import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { validateDocument, evaluateState, evaluateValue } from '../dist/index.js';

const doc = (body = [{ type: 'text', value: 'Hello' }], rest = {}) => ({ version: 'iui/1', ...rest, body });
const expr = (op, ...args) => ({ op, args });
const ref = ($) => ({ $ });
function invalid(value, code, path) {
  const result = validateDocument(value);
  assert.equal(result.ok, false, `Expected ${code}`);
  assert.ok(result.issues.some((i) => i.code === code && (path === undefined || i.path === path)), JSON.stringify(result.issues));
  for (const issue of result.issues) assert.deepEqual(Object.keys(issue).sort(), ['code', 'message', 'path']);
  return result;
}
const slider = { type: 'slider', label: 'Gain', bind: 'gain', min: 0, max: 10, step: 0.5 };
const chart = { type: 'chart', kind: 'line', xKey: 'x', data: [{ x: 'A', y: 1 }, { x: 'B', y: null }], series: [{ key: 'y', label: 'Value' }] };
const svg = (attrs) => ({ type: 'svg', viewBox: '0 0 100 100', shapes: [{ tag: 'rect', attrs }] });

test('all original examples validate; public contract contains 122 node types', async () => {
  for (const file of await readdir(new URL('../examples/', import.meta.url))) {
    if (!file.endsWith('.json')) continue;
    const input = JSON.parse(await readFile(new URL(`../examples/${file}`, import.meta.url), 'utf8'));
    const result = validateDocument(input);
    assert.equal(result.ok, true, `${file}: ${JSON.stringify(result.issues)}`);
  }
  const schema = JSON.parse(await readFile(new URL('../src/schema/iui.schema.json', import.meta.url), 'utf8'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.$defs.Node.oneOf.length, 122);
});

test('successful validation clones, normalizes and deeply freezes data', () => {
  const input = doc([{ type: 'col', children: [{ type: 'text', value: 'original' }] }]);
  const result = validateDocument(input);
  assert.equal(result.ok, true);
  input.body[0].children[0].value = 'changed';
  assert.equal(result.document.body[0].children[0].value, 'original');
  assert.equal(result.document.theme, 'auto');
  assert.deepEqual(result.document.state, {});
  assert.ok(Object.isFrozen(result.document));
  assert.ok(Object.isFrozen(result.document.body[0].children[0]));
  assert.throws(() => { result.document.body.push({ type: 'divider' }); }, TypeError);
});

test('rejects unknown properties and unknown components with JSON pointer paths', () => {
  invalid(doc([{ type: 'text', value: 'x', style: 'color:red' }]), 'SCHEMA', '/body/0/style');
  invalid(doc([{ type: 'script', value: 'x' }]), 'SCHEMA');
  invalid({ ...doc(), version: 'iui/2' }, 'SCHEMA', '/version');
});

test('native is an explicit unsupported semantic boundary', () => {
  invalid(doc([{ type: 'native', name: 'box', children: [] }]), 'UNSUPPORTED_NATIVE', '/body/0');
});

test('rejects non-finite input, non-JSON data, cycles and prototype pollution', () => {
  for (const value of [NaN, Infinity, -Infinity]) invalid(doc([{ type: 'text', value }]), 'NON_FINITE', '/body/0/value');
  for (const value of [undefined, () => 1, 1n, new Date(), /a/]) invalid(doc([{ type: 'text', value }]), 'JSON_TYPE');
  const circular = doc(); circular.body[0].value = circular;
  invalid(circular, 'CYCLIC_INPUT');
  for (const key of ['__proto__', 'constructor', 'prototype']) invalid(JSON.parse(`{"version":"iui/1","state":{"${key}":1},"body":[{"type":"text","value":"x"}]}`), 'RESERVED_KEY');
  assert.equal({}.polluted, undefined);
});

test('does not execute getters and rejects sparse arrays and custom prototypes', () => {
  let touched = false;
  const input = doc(); Object.defineProperty(input, 'title', { enumerable: true, get() { touched = true; throw new Error('getter executed'); } });
  invalid(input, 'JSON_TYPE', '/title'); assert.equal(touched, false);
  const sparse = doc(); sparse.body = new Array(5); invalid(sparse, 'JSON_TYPE');
  const custom = Object.create({ version: 'iui/1' }); custom.body = [];
  invalid(custom, 'JSON_TYPE');
});

test('enforces nesting, node, text and aggregate budgets before Ajv recursion', () => {
  let nested = { type: 'text', value: 'x' };
  // Fixed resource-depth fixture, deliberately independent of the node inventory.
  for (let i = 0; i < 70; i++) nested = { type: 'box', children: [nested] };
  invalid(doc([nested]), 'DEPTH_LIMIT');
  const nodes = Array.from({ length: 5 }, () => ({ type: 'box', children: Array.from({ length: 500 }, () => ({ type: 'divider' })) }));
  invalid(doc(nodes), 'NODE_LIMIT');
  invalid(doc([{ type: 'text', value: 'x'.repeat(2_000_001) }]), 'TEXT_LIMIT');
  invalid(doc([{ type: 'list', items: new Array(50001).fill(1) }]), 'VALUE_LIMIT');
});

test('references resolve across an acyclic dependency graph, including forward declarations', () => {
  const result = validateDocument(doc([{ type: 'metric', label: 'Value', value: ref('final') }], { state: { n: 4 }, computed: { final: expr('add', ref('double'), 1), double: expr('mul', ref('n'), 2) } }));
  assert.equal(result.ok, true);
  const state = evaluateState(result.document);
  assert.equal(state.ok, true);
  assert.equal(state.computed.final, 9);
  assert.equal(evaluateValue(ref('final'), state.state, state.computed), 9);
  assert.ok(Object.isFrozen(state.state) && Object.isFrozen(state.computed));
});

test('unknown references, state/computed collisions and cycles are explicit errors', () => {
  invalid(doc([{ type: 'text', value: ref('missing') }]), 'UNKNOWN_REFERENCE', '/body/0/value/$');
  invalid(doc(undefined, { state: { n: 1 }, computed: { n: 2 } }), 'NAME_COLLISION');
  invalid(doc(undefined, { computed: { a: ref('b'), b: ref('a') } }), 'COMPUTED_CYCLE');
  invalid(doc([{ type: 'text', value: expr('if', false, ref('missing'), 'safe') }]), 'UNKNOWN_REFERENCE');
});

test('operators use strict types, bounded arities and deterministic semantics', () => {
  const cases = [
    [expr('add', 1, 2, 3), 6], [expr('sub', 5, 2), 3], [expr('mul', 2, 3), 6], [expr('div', 9, 2), 4.5],
    [expr('max', 1, 4, 2), 4], [expr('min', 1, 4, 2), 1], [expr('abs', -4), 4], [expr('round', 1.234, 2), 1.23],
    [expr('clamp', 12, 0, 10), 10], [expr('gt', 3, 2), true], [expr('lt', 3, 2), false], [expr('eq', 'a', 'a'), true],
    [expr('if', true, 'yes', 'no'), 'yes'], [expr('format', 1.2, 2), '1.20'],
  ];
  for (const [value, expected] of cases) assert.equal(evaluateValue(value), expected);
  invalid(doc([{ type: 'text', value: expr('sub', 1) }]), 'OPERATOR_ARITY');
  invalid(doc([{ type: 'text', value: expr('add', '1', 2) }]), 'OPERATOR_TYPE');
  invalid(doc([{ type: 'text', value: expr('if', 1, 2, 3) }]), 'OPERATOR_TYPE');
  invalid(doc([{ type: 'text', value: expr('add', expr('if', true, 1, 'x'), 2) }]), 'OPERATOR_TYPE');
});

test('numeric boundaries reject division, overflow, precision and reversed clamp bounds', () => {
  invalid(doc([{ type: 'text', value: expr('div', 1, 0) }]), 'DIVISION_BY_ZERO');
  invalid(doc([{ type: 'text', value: expr('mul', 1e308, 1e308) }]), 'NON_FINITE_RESULT');
  for (const digits of [-1, 7, 0.5]) invalid(doc([{ type: 'text', value: expr('round', 2, digits) }]), 'NUMERIC_BOUNDARY');
  invalid(doc([{ type: 'text', value: expr('clamp', 2, 4, 1) }]), 'NUMERIC_BOUNDARY');
  assert.equal(evaluateValue(expr('if', false, expr('div', 1, 0), 4)), 4);
});

test('state updates reject unknown/type/range/step errors and remain immutable', () => {
  const validated = validateDocument(doc([slider], { state: { gain: 2 }, computed: { doubled: expr('mul', ref('gain'), 2) } }));
  assert.equal(validated.ok, true);
  const changed = evaluateState(validated.document, { gain: 3 });
  assert.equal(changed.ok, true); assert.equal(changed.computed.doubled, 6); assert.equal(validated.document.state.gain, 2);
  for (const [override, code] of [[{ extra: 1 }, 'UNKNOWN_BIND'], [{ gain: '2' }, 'INPUT_TYPE'], [{ gain: 11 }, 'INPUT_RANGE'], [{ gain: 2.2 }, 'INPUT_STEP'], [{ gain: Infinity }, 'NON_FINITE']]) {
    const result = evaluateState(validated.document, override); assert.equal(result.ok, false); assert.ok(result.issues.some((e) => e.code === code));
  }
});

test('every runtime update rechecks arithmetic and dynamic chart constraints', () => {
  const value = validateDocument(doc([{ type: 'text', value: ref('reciprocal') }], { state: { n: 1 }, computed: { reciprocal: expr('div', 1, ref('n')) } }));
  assert.equal(value.ok, true);
  assert.equal(evaluateState(value.document, { n: 0 }).issues[0].code, 'DIVISION_BY_ZERO');
  const plot = validateDocument(doc([{ ...chart, yMin: 0, yMax: 10, data: [{ x: 'A', y: ref('n') }] }], { state: { n: 1 } }));
  assert.equal(plot.ok, true);
  assert.ok(evaluateState(plot.document, { n: 20 }).issues.some((e) => e.code === 'CHART_BOUNDS'));
});

test('bindings, control ranges, options and button actions have strict contracts', () => {
  invalid(doc([slider]), 'UNKNOWN_BIND');
  invalid(doc([{ ...slider, min: 10, max: 1 }], { state: { gain: 2 } }), 'INPUT_RANGE');
  invalid(doc([{ ...slider, min: 1e308, max: 1.1e308, step: 1 }], { state: { gain: 1e308 } }), 'INPUT_RANGE');
  invalid(doc([{ ...slider, marks: [{ value: 20, label: 'bad' }] }], { state: { gain: 2 } }), 'INPUT_RANGE');
  invalid(doc([{ type: 'toggle', label: 'Enabled', bind: 'on' }], { state: { on: 1 } }), 'INPUT_TYPE');
  invalid(doc([{ type: 'select', label: 'Mode', bind: 'mode', options: [{ value: 'a', label: 'A' }] }], { state: { mode: 'b' } }), 'INPUT_OPTION');
  invalid(doc([{ type: 'select', label: 'Mode', bind: 'mode', options: [{ value: 'a', label: 'A' }, { value: 'a', label: 'Again' }] }], { state: { mode: 'a' } }), 'DUPLICATE_OPTION');
  invalid(doc([{ type: 'button', label: 'Set', action: { kind: 'set' } }]), 'SCHEMA', '/body/0/action/bind');
  invalid(doc([{ type: 'button', label: 'Reset', action: { kind: 'reset', bind: 'n' } }], { state: { n: 1 } }), 'SCHEMA', '/body/0/action/bind');
  invalid(doc([slider, { type: 'button', label: 'Set', action: { kind: 'set', bind: 'gain', value: 11 } }], { state: { gain: 1 } }), 'INPUT_RANGE');
});

test('duplicate ids, topology endpoints, loads and table widths are checked', () => {
  invalid(doc([{ type: 'divider', id: 'same' }, { type: 'divider', id: 'same' }]), 'DUPLICATE_ID');
  const topology = { type: 'topology', nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], links: [{ from: 'a', to: 'missing' }] };
  invalid(doc([topology]), 'TOPOLOGY_ENDPOINT');
  invalid(doc([{ ...topology, links: [{ from: 'a', to: 'b', load: -1 }] }]), 'TOPOLOGY_LOAD');
  invalid(doc([{ type: 'table', columns: ['a', 'b'], rows: [[1]] }]), 'TABLE_WIDTH', '/body/0/rows/0');
});

test('chart null gaps stay valid while missing cells and misleading bounds fail', () => {
  assert.equal(validateDocument(doc([chart])).ok, true);
  invalid(doc([{ ...chart, data: [{ x: 'A' }] }]), 'CHART_MISSING');
  assert.equal(validateDocument(doc([{ ...chart, data: [{ x: 'A', y: null }] }])).ok,true); // Explicit empty state, never a fabricated zero.
  invalid(doc([{ ...chart, data: [{ x: 'A', y: '1' }] }]), 'CHART_VALUE');
  invalid(doc([{ ...chart, data: [{ x: null, y: 1 }] }]), 'CHART_X');
  invalid(doc([{ ...chart, yMin: 2, yMax: 1 }]), 'CHART_BOUNDS');
  invalid(doc([{ ...chart, yMax: 1e308, data: [{ x: 'A', y: -1e308 }] }]), 'CHART_BOUNDS');
  invalid(doc([{ ...chart, yMin: 1, data: [{ x: 'A', y: 1 }] }]), 'CHART_BOUNDS');
  invalid(doc([{ ...chart, series: [{ key: 'x', label: 'Bad' }] }]), 'CHART_SERIES');
});

test('URL policy rejects script, HTML, SVG-data, protocol-relative and disguised URLs', () => {
  for (const href of ['javascript:alert(1)', 'data:text/html,a', '//example.com', '/relative', 'https://user:password@example.com', ' https://example.com', 'https:\\example.com', 'java\nscript:alert(1)']) invalid(doc([{ type: 'link', value: 'Link', href }]), 'UNSAFE_URL');
  for (const href of ['https://example.com/a', 'http://example.com/a', '#section-1', 'mailto:hello@example.com', 'tel:+1-123-456']) assert.equal(validateDocument(doc([{ type: 'link', value: 'Link', href }])).ok, true, href);
  for (const src of ['data:image/svg+xml;base64,PHN2Zz4=', 'data:text/html;base64,AAAA', 'file:///tmp/image.png']) invalid(doc([{ type: 'image', alt: 'Image', src }]), 'UNSAFE_URL');
  assert.equal(validateDocument(doc([{ type: 'image', alt: 'Image', src: 'data:image/png;base64,AAAA' }])).ok, true);
});

test('SVG only accepts whitelisted safe literal attributes', () => {
  assert.equal(validateDocument(doc([svg({ x: 0, y: 0, width: 10, height: 10, fill: '#fff', stroke: 'currentColor' })])).ok, true);
  for (const key of ['onload', 'onclick', 'style', 'href', 'xlink:href', 'filter']) invalid(doc([svg({ [key]: 'alert(1)' })]), 'SVG_ATTRIBUTE');
  for (const fill of ['url(https://example.com/evil.svg)', 'url(#target)', 'var(--evil)', 'red;stroke:black']) invalid(doc([svg({ fill })]), 'SVG_PAINT');
  invalid(doc([svg({ opacity: 2 })]), 'SVG_NUMBER');
  invalid(doc([svg({ d: 'M 1e999 0' })]), 'SVG_NUMBER');
  invalid(doc([svg({ transform: 'url(javascript:alert(1))' })]), 'SVG_TRANSFORM');
  invalid(doc([{ ...svg({}), viewBox: '0 0 0 10' }]), 'SVG_VIEWBOX');
});

test('standalone validation operates with dynamic code generation disabled', () => {
  const output = execFileSync(process.execPath, ['--disallow-code-generation-from-strings', '--input-type=module', '-e', `import {validateDocument} from './dist/index.js'; const r=validateDocument(${JSON.stringify(doc())}); if(!r.ok)process.exit(1); console.log('csp-safe');`], { cwd: new URL('../', import.meta.url), encoding: 'utf8' });
  assert.match(output, /csp-safe/);
});
