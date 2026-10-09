// Copy to repository tests/ after schema/core/renderer integration.
// These acceptance tests deliberately use the single public validator; they are
// not run by the isolated candidate and must not be counted as passed yet.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { validateDocument, evaluateState, mount, compileHtml } from '../dist/index.js';
const fixture = JSON.parse(await readFile(new URL('../examples/loading-states.json', import.meta.url), 'utf8'));
const invalidFixtures = JSON.parse(await readFile(new URL('./fixtures/loading-invalid.json', import.meta.url), 'utf8'));
const doc = (body, extra = {}) => ({version: 'iui/1', body, ...extra});
const valid = node => validateDocument(doc([node]));
const loading = (progress, extra = {}) => ({type: 'loading', label: 'Supplied label', progress, ...extra});
const block = (extra = {}) => ({type: 'loading-block', label: 'Supplied placeholder', ...extra});
const setup = () => { const dom = new JSDOM('<!doctype html><html lang="en"><body><div id="host"></div></body></html>', {pretendToBeVisual: true, url: 'https://example.invalid/'}); return {dom, host: dom.window.document.getElementById('host')}; };

test('public loading accepts finite exact endpoints, fractions, sizes and omitted progress distinctly', () => {
  assert.equal(validateDocument(fixture).ok, true);
  for (const progress of [0, 100, 100 / 3, Number.MIN_VALUE]) for (const size of ['sm', 'md', 'lg']) for (const showValue of [true, false]) assert.equal(valid(loading(progress, {size, showValue})).ok, true);
  assert.equal(valid({type: 'loading', label: 'Omitted progress'}).ok, true);
  assert.equal(valid({type: 'loading', label: '字'.repeat(200)}).ok, true);
  assert.equal(valid({type: 'loading', label: '👩'.repeat(200)}).ok, true);
  for (const lines of [1, 10]) for (const animate of [true, false]) assert.equal(valid(block({lines, animate})).ok, true);
  for (const shape of ['text', 'card', 'circle']) assert.equal(valid(block({shape})).ok, true);
});

test('generated schema rejects structural boundaries and unknown fields while semantic validation rejects bad progress', () => {
  for (const {why, node} of invalidFixtures) assert.equal(valid(node).ok, false, why);
  for (const progress of [null, '', '0', '50', true, false, -1, 101, Infinity, -Infinity, NaN]) assert.equal(valid(loading(progress)).ok, false, String(progress));
  for (const label of ['', 'a'.repeat(201), null, 3, {$: 'label'}]) for (const type of ['loading', 'loading-block']) assert.equal(valid({type, label}).ok, false);
  for (const size of [null, 20, 'xl', {$: 'size'}]) assert.equal(valid(loading(25, {size})).ok, false);
  for (const showValue of [null, 0, 'true']) assert.equal(valid(loading(25, {showValue})).ok, false);
  for (const shape of ['constructor', 'square', null]) assert.equal(valid(block({shape})).ok, false);
  for (const lines of [null, '3', .5, Infinity, NaN]) assert.equal(valid(block({lines})).ok, false);
  for (const animate of [null, 0, 'true']) assert.equal(valid(block({animate})).ok, false);
  for (const node of [loading(50), block()]) for (const property of ['style', 'html', 'url', 'src', 'onload', 'onerror', 'duration', 'bind', 'className']) assert.equal(valid({...node, [property]: 'untrusted'}).ok, false);
});

test('all progress expression and computed references use the existing evaluator and candidate state path', () => {
  const state = {done: 1, total: 3}, computed = {percent: {op: 'mul', args: [{op: 'div', args: [{$: 'done'}, {$: 'total'}]}, 100]}};
  const spec = doc([loading({$: 'percent'})], {state, computed});
  assert.equal(validateDocument(spec).ok, true); assert.equal(evaluateState(spec, {done: 3}).ok, true);
  for (const patch of [{done: 4}, {done: -1}, {total: 0}, {total: -.1}]) assert.equal(evaluateState(spec, patch).ok, false);
  for (const progress of [{$: 'missing'}, {op: 'format', args: [25]}, {op: 'if', args: [true, null, 25]}, {op: 'div', args: [1, 0]}, {op: 'mul', args: [1e308, 1e308]}, {op: 'add', args: [100, 1]}]) assert.equal(valid(loading(progress)).ok, false);
});

test('public mount keeps original ratio, hidden-value semantics and genuinely indeterminate metadata', () => {
  const {dom, host} = setup(), controller = mount(host, fixture);
  for (const [id, expected] of [['zero-progress', 0], ['full-progress', 100], ['fraction-progress', 100 / 3]]) {
    const out = host.querySelector(`[id$="-${id}"]`); assert.equal(out.getAttribute('aria-valuenow'), String(expected)); assert.equal(parseFloat(out.querySelector('.iui-loading-fill').style.inlineSize), expected);
  }
  const indeterminate = host.querySelector('[id$="-indeterminate"]'); assert.equal(indeterminate.hasAttribute('aria-valuenow'), false); assert.equal(indeterminate.hasAttribute('data-value'), false); assert.equal(indeterminate.querySelector('.iui-loading-value'), null);
  assert.equal(host.querySelector('[id$="-hidden-value"] .iui-loading-value'), null); assert.equal(host.querySelector('[id$="-hidden-value"]').getAttribute('aria-valuenow'), '12.5');
  for (const label of host.querySelectorAll('.iui-loading-block-label')) assert.equal(label.closest('[aria-hidden]'), null);
  for (const shapes of host.querySelectorAll('.iui-loading-block-shapes')) assert.equal(shapes.getAttribute('aria-hidden'), 'true');
  assert.equal(host.querySelectorAll('.iui-loading[aria-live],.iui-loading-block[aria-live],.iui-loading-block[role],[aria-busy]').length, 0);
  assert.equal(host.querySelector('svg').ownerDocument, dom.window.document); controller.dispose();
});

test('invalid derived-progress patches and document updates are atomic, preserving state, focus and DOM', () => {
  const {dom, host} = setup(), controller = mount(host, fixture), root = host.firstElementChild, input = host.querySelector('input'); input.focus();
  const out = host.querySelector('[id$="-reactive-progress"]'), fill = out.querySelector('.iui-loading-fill');
  controller.setState({done: 50}); assert.equal(out.getAttribute('aria-valuenow'), '50');
  const beforeState = controller.getState(), beforeHTML = root.outerHTML;
  controller.setState({done: 50}); assert.equal(root.outerHTML, beforeHTML); assert.equal(out.querySelector('.iui-loading-fill'), fill); assert.equal(dom.window.document.activeElement, input);
  // done remains a legal slider value. Only derived progress makes these invalid.
  for (const patch of [{total: 25}, {total: -100}, {total: 0}, {done: 75, total: 50}]) {
    assert.throws(() => controller.setState(patch)); assert.deepEqual(controller.getState(), beforeState); assert.equal(root.outerHTML, beforeHTML); assert.equal(dom.window.document.activeElement, input);
  }
  for (const {node} of invalidFixtures) {
    assert.throws(() => controller.update(doc([node]))); assert.equal(host.firstElementChild, root); assert.deepEqual(controller.getState(), beforeState); assert.equal(dom.window.document.activeElement, input);
  }
  controller.setState({done: 25.125, other: 1}); assert.equal(out.getAttribute('aria-valuenow'), String(25.125 / 100 * 100)); assert.equal(out.querySelector('.iui-loading-fill'), fill); assert.equal(dom.window.document.activeElement, input); controller.dispose();
});

test('nearest-host language and theme stay isolated, ownerDocument is foreign-safe, and caller IDs do not collide', () => {
  const {dom, host: a} = setup(), b = dom.window.document.createElement('div'); b.lang = 'zh-Hant'; dom.window.document.body.append(b);
  const body = [{type: 'loading', id: 'same', label: 'Authored unchanged'}, block({id: 'same-block', shape: 'circle'})];
  const ca = mount(a, doc(body, {theme: 'light'})), cb = mount(b, doc(body, {theme: 'dark'}));
  assert.equal(a.querySelector('.iui-loading-hint').textContent, 'Progress not supplied'); assert.equal(b.querySelector('.iui-loading-hint').textContent, '未提供进度');
  assert.notEqual(a.querySelector('.iui-loading').id, b.querySelector('.iui-loading').id); assert.equal(b.querySelector('svg').ownerDocument, dom.window.document);
  assert.equal(a.querySelector('.iui-root').dataset.theme, 'light'); assert.equal(b.querySelector('.iui-root').dataset.theme, 'dark');
  ca.dispose(); assert.ok(b.querySelector('svg')); cb.dispose();
});

test('update/dispose clears old progress bindings while other mounted instances remain independent', () => {
  const {dom, host} = setup(), other = dom.window.document.createElement('div'); dom.window.document.body.append(other);
  const controller = mount(host, fixture), sibling = mount(other, fixture); let old = host.querySelector('.iui-loading');
  for (let i = 0; i < 8; i++) {
    const before = old.outerHTML; controller.update(fixture); controller.setState({done: i}); assert.equal(old.outerHTML, before); assert.equal(old.isConnected, false); old = host.querySelector('.iui-loading');
  }
  assert.equal(other.querySelector('.iui-loading').getAttribute('aria-valuenow'), '25');
  controller.dispose(); controller.dispose(); assert.equal(host.childElementCount, 0); assert.throws(() => controller.setState({done: 50}));
  sibling.setState({done: 100}); assert.equal(other.querySelector('.iui-loading').getAttribute('aria-valuenow'), '100'); sibling.dispose();
});

test('public compiler and renderer preserve literal labels with no executable or network markup', async () => {
  const label = '</script><img src="https://evil.invalid/pixel" onerror="bad()">', spec = doc([loading(0, {label}), {type: 'loading', label}, block({label})]);
  const {host} = setup(), controller = mount(host, spec);
  assert.equal(host.querySelectorAll('img,iframe,script,use,image,foreignObject').length, 0);
  assert.ok([...host.querySelectorAll('.iui-loading-label,.iui-loading-block-label')].every(el => el.textContent === label));
  const html = await compileHtml(spec); assert.ok(html.includes('\\u003c/script\\u003e')); assert.ok(!html.includes('<img src="https://evil.invalid/pixel"')); controller.dispose();
});
