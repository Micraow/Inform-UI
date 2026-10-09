import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setup } from './loading-harness.mjs';

const loading = (progress, options = {}) => ({type: 'loading', label: 'Caller-supplied sample', progress, ...options});
const block = options => ({type: 'loading-block', label: 'Original placeholder', ...options});

test('determinate exact endpoints, fractions and sizes preserve raw progress and ratio', () => {
  const h = setup();
  for (const value of [0, 100, 0.01, 25.125, 100 / 3, 99.99999999999999, Number.MIN_VALUE]) for (const size of ['sm', 'md', 'lg']) {
    const out = h.mount(loading(value, {size}));
    assert.equal(out.getAttribute('role'), 'progressbar');
    assert.equal(out.getAttribute('aria-label'), 'Caller-supplied sample');
    assert.equal(out.getAttribute('aria-valuemin'), '0'); assert.equal(out.getAttribute('aria-valuemax'), '100');
    assert.equal(out.getAttribute('aria-valuenow'), String(value)); assert.equal(out.dataset.value, String(value));
    // CSSOM can serialize scientific notation differently, but the ratio stays numeric.
    assert.equal(parseFloat(out.querySelector('.iui-loading-fill').style.inlineSize), value);
    assert.equal(out.querySelector('.iui-loading-value').textContent, `${value}%`);
    assert.equal(out.dataset.size, size); assert.equal(out.querySelectorAll('svg').length, 0);
  }
  h.dispose();
});

test('omitted progress stays indeterminate without fabricated numeric metadata or percentage', () => {
  for (const lang of ['en', 'zh-Hant', 'fr']) {
    const h = setup({lang}), out = h.mount({type: 'loading', label: 'Supplied caption'});
    assert.equal(out.dataset.kind, 'indeterminate'); assert.equal(out.dataset.size, 'md');
    assert.equal(out.hasAttribute('aria-valuenow'), false); assert.equal(out.hasAttribute('data-value'), false);
    assert.equal(out.querySelector('.iui-loading-value'), null); assert.equal(out.querySelector('.iui-loading-track'), null);
    assert.equal(out.querySelector('.iui-loading-label').textContent, 'Supplied caption');
    assert.equal(out.querySelector('.iui-loading-hint').textContent, lang === 'zh-Hant' ? '未提供进度' : 'Progress not supplied');
    const spinner = out.querySelector('svg'); assert.equal(spinner.getAttribute('aria-hidden'), 'true'); assert.equal(spinner.getAttribute('focusable'), 'false');
    assert.equal(h.metrics.bindings, 0); assert.equal(h.metrics.valueReads, 0);
    h.refreshWith({progress: 99}); assert.equal(out.hasAttribute('aria-valuenow'), false); h.dispose();
  }
});

test('showValue=false removes only displayed percentage and keeps authored and accessible values', () => {
  const h = setup(), out = h.mount(loading(42.25, {showValue: false}));
  assert.equal(out.querySelector('.iui-loading-value'), null); assert.equal(out.getAttribute('aria-valuenow'), '42.25');
  assert.equal(out.querySelector('.iui-loading-label').textContent, 'Caller-supplied sample');
  assert.equal(out.querySelector('.iui-loading-track').getAttribute('aria-hidden'), 'true'); h.dispose();
});

test('ordinary Value expressions and computed references update in place without changing focus', () => {
  const h = setup({state: {done: 25, total: 100, other: 0}, computed: {percent: {op: 'mul', args: [{op: 'div', args: [{$: 'done'}, {$: 'total'}]}, 100]}}});
  const out = h.mount(loading({$: 'percent'})), fill = out.querySelector('.iui-loading-fill'), header = out.firstElementChild;
  const input = h.doc.createElement('input'); input.value = 'Original'; h.host.append(input); input.focus(); input.setSelectionRange(2, 5);
  for (const done of [0, 100, 12.5, 33.333]) {
    h.refreshWith({done}); assert.equal(out.getAttribute('aria-valuenow'), String(done / 100 * 100));
    assert.equal(out.querySelector('.iui-loading-fill'), fill); assert.equal(out.firstElementChild, header);
    assert.equal(h.doc.activeElement, input); assert.equal(input.selectionStart, 2); assert.equal(input.selectionEnd, 5);
  }
  h.refreshWith({done: 33.333}); assert.equal(out.querySelector('.iui-loading-fill'), fill); assert.equal(h.doc.activeElement, input);
  h.refreshWith({other: 99}); assert.equal(h.doc.activeElement, input); assert.equal(h.activeBindings(), 1); h.dispose();
});

test('defensive resolved-value guard rejects coercion, range violations and nonfinite results before DOM mutation', () => {
  const invalid = [null, false, true, '', '0', '50', -1, 100.001, NaN, Infinity, -Infinity];
  for (const value of invalid) {
    const h = setup(); assert.throws(() => h.mount(loading(value))); assert.equal(h.root.childElementCount, 0); h.dispose();
  }
  const h = setup(), out = h.mount(loading({$: 'progress'})), before = out.outerHTML;
  for (const value of invalid) { assert.throws(() => h.refreshWith({progress: value})); assert.equal(out.outerHTML, before); }
  h.refreshWith({progress: 50}); assert.equal(out.getAttribute('aria-valuenow'), '50'); h.dispose();
});

test('text, card and circle skeletons stay finite, deterministic, decorative and visibly labelled', () => {
  const h = setup();
  for (const lines of [1, 3, 10]) {
    const out = h.mount(block({lines})); assert.equal(out.dataset.shape, 'text'); assert.equal(out.dataset.animate, 'true');
    assert.equal(out.querySelectorAll('.iui-loading-block-line').length, lines);
    assert.equal(out.querySelector('.iui-loading-block-shapes').getAttribute('aria-hidden'), 'true');
    assert.equal(out.querySelector('.iui-loading-block-label').closest('[aria-hidden]'), null);
  }
  assert.equal(h.mount(block({})).querySelectorAll('.iui-loading-block-line').length, 3);
  const card = h.mount(block({shape: 'card', animate: false})); assert.equal(card.querySelectorAll('.iui-loading-block-piece').length, 3); assert.equal(card.dataset.animate, 'false');
  const circle = h.mount(block({shape: 'circle'})); assert.equal(circle.querySelectorAll('.iui-loading-block-piece').length, 1);
  assert.equal(h.root.querySelectorAll('[role], [aria-live], [aria-busy], [tabindex]').length, 0);
  assert.equal(h.metrics.bindings, 0); assert.equal(h.metrics.valueReads, 0); h.dispose();
});

test('defensive skeleton allocation bounds reject arbitrary shape, fractional or unbounded lines', () => {
  for (const options of [{shape: 'image'}, {shape: 'constructor'}, {lines: 0}, {lines: 11}, {lines: .5}, {lines: '3'}, {lines: NaN}, {lines: Infinity}, {shape: 'card', lines: 3}, {shape: 'circle', lines: 1}]) {
    const h = setup(); assert.throws(() => h.mount(block(options))); assert.equal(h.root.childElementCount, 0); h.dispose();
  }
});

test('multiple hosts and foreign ownerDocuments preserve independent progress, identifiers and labels', () => {
  const a = setup(), b = setup({dom: a.dom, lang: 'zh-CN', theme: 'dark'}), c = setup({lang: 'en'});
  const aNode = a.mount(loading({$: 'progress'}, {id: 'same'})), bNode = b.mount(loading({$: 'progress'}, {id: 'same'}));
  const cNode = c.mount({type: 'loading', label: 'Independent'});
  assert.notEqual(aNode.id, bNode.id); assert.equal(aNode.ownerDocument, a.doc); assert.equal(bNode.ownerDocument, a.doc); assert.equal(cNode.ownerDocument, c.doc); assert.notEqual(c.doc, a.doc);
  assert.equal(cNode.querySelector('svg').ownerDocument, c.doc);
  a.refreshWith({progress: 75}); assert.equal(bNode.getAttribute('aria-valuenow'), '25');
  a.dispose(); b.refreshWith({progress: 12}); assert.equal(bNode.getAttribute('aria-valuenow'), '12'); assert.equal(b.root.dataset.theme, 'dark'); b.dispose(); c.dispose();
});

test('repeated update and disposal remove bindings and leave detached elements unchanged', () => {
  const h = setup(); let previous = h.mount(loading({$: 'progress'}));
  for (let i = 1; i <= 12; i++) {
    const detached = previous, before = detached.outerHTML;
    [previous] = h.update([loading({$: 'progress'})]); h.refreshWith({progress: i});
    assert.equal(detached.isConnected, false); assert.equal(detached.outerHTML, before); assert.equal(h.activeBindings(), 1);
  }
  h.update([block({shape: 'card'})]); assert.equal(h.activeBindings(), 0);
  h.dispose(); h.dispose(); assert.equal(h.activeBindings(), 0); assert.equal(h.root.childElementCount, 0); assert.throws(() => h.refreshWith({progress: 20}));
});

test('authored strings are literal data, without network elements or live/busy claims', () => {
  const h = setup(), label = '</script><img src="https://evil.invalid/pixel" onerror="bad()">';
  for (const node of [loading(12.5, {label}), {type: 'loading', label}, block({label})]) h.mount(node);
  assert.equal(h.root.querySelectorAll('img,script,iframe,link,style,use,image,a,button').length, 0);
  assert.equal(h.root.querySelectorAll('[aria-live],[aria-busy],[role=status]').length, 0);
  assert.ok([...h.root.querySelectorAll('.iui-loading-label,.iui-loading-block-label')].every(el => el.textContent === label));
  assert.equal(h.host.hasAttribute('aria-busy'), false); h.dispose();
});

test('production source and CSS contain scoped motion fallback and no autonomous activity or external assets', async () => {
  const source = await readFile(new URL('../src/renderer/loading.ts', import.meta.url), 'utf8'), shared = await readFile(new URL('../src/renderer/style.css', import.meta.url), 'utf8');
  const start = shared.indexOf('/* Original finite loading geometry.'); assert.ok(start >= 0);
  const tail = shared.slice(start), end = tail.indexOf('\n/* Original', 1), css = end < 0 ? tail : tail.slice(0, end);
  // Type-only module paths such as schema/document.js are not global DOM access.
  assert.doesNotMatch(source.replace(/^import type .*;$/gm, ''), /\b(?:setTimeout|setInterval|requestAnimationFrame|fetch|XMLHttpRequest|WebSocket|Date)\s*\(|\bMath\.random|\b(?:window|document)\s*\./);
  assert.doesNotMatch(css, /url\s*\(|@import/); assert.match(css, /@media \(prefers-reduced-motion: reduce\)/); assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /animation: none; opacity: 1/); assert.doesNotMatch(css, /transition:/);
});
