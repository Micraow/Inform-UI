import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { mount, validateDocument, compileHtml } from '../dist/index.js';
const fixture = JSON.parse(await readFile('examples/foundations.json', 'utf8'));
const doc = body => ({ version: 'iui/1', state: { count: 0 }, body });
const setup = input => { const dom = new JSDOM('<html lang="zh-CN"><div id="host"></div></html>'); const host = dom.window.document.getElementById('host'); return { dom, host, controller: mount(host, input) }; };
test('rich text preserves markup semantics and literal hostile content, with stable reactive runs', () => {
  const input = doc([{ type: 'text', runs: [{ value: '<img onerror=bad()>', bold: true, italic: true, underline: true, strike: true, code: true }, { value: { $: 'count' }, href: '#target' }] }, { type: 'title', id: 'target', value: 'Target' }]);
  const original = structuredClone(input), { host, controller } = setup(input);
  assert.equal(host.querySelector('strong em u s code span').textContent, '<img onerror=bad()>'); assert.equal(host.querySelector('img'), null);
  const link = host.querySelector('a'), value = link.querySelector('span'); assert.equal(value.textContent, '0'); assert.equal(link.getAttribute('href'), '#' + host.querySelector('h1').id);
  for (let count = 1; count <= 25; count++) controller.setState({ count });
  assert.equal(link.querySelector('span'), value); assert.equal(value.textContent, '25'); assert.deepEqual(input, original);
  controller.dispose();
});
test('external run links are safe new-tab links and quote attribution stays inert', () => {
  const { host, controller } = setup(doc([{ type: 'text', runs: [{ value: 'Reference', href: 'https://example.com/' }] }, { type: 'blockquote', cite: 'https://example.com/quote', attribution: '<script>bad()</script>', children: [{ type: 'text', value: 'Original quote' }] }]));
  for (const anchor of host.querySelectorAll('a')) { assert.equal(anchor.target, '_blank'); assert.equal(anchor.rel, 'noopener noreferrer'); }
  assert.equal(host.querySelector('blockquote').cite, 'https://example.com/quote'); assert.equal(host.querySelector('blockquote footer').textContent, '<script>bad()</script>'); assert.equal(host.querySelector('script'), null); controller.dispose();
});
test('text decoration, inline code and grid spans have explicit independent DOM representations', () => {
  assert.equal(validateDocument(fixture).ok, true); const { host, controller } = setup(fixture);
  const strike = [...host.querySelectorAll('.iui-text')].find(el => el.style.textDecorationLine.includes('line-through')); assert.ok(strike);
  assert.equal(host.querySelector('[data-iui="code"]').tagName, 'CODE'); assert.equal(host.querySelectorAll('.iui-text-shimmer').length, 1);
  assert.equal(host.querySelector('.iui-grid').style.getPropertyValue('--iui-columns'), '3'); assert.equal(host.querySelector('.iui-grid-item').style.getPropertyValue('--iui-col-span'), '2');
  controller.dispose();
});
test('malformed text/run sources and unsafe URLs reject before rendering', () => {
  for (const node of [{ type: 'text' }, { type: 'text', value: 'x', runs: [{ value: 'y' }] }, { type: 'text', runs: [] }, { type: 'text', runs: [{ value: 'x', html: 'bad' }] }, { type: 'text', runs: [{ value: 'x', href: 'javascript:bad()' }] }, { type: 'blockquote', cite: 'data:text/html,bad', children: [] }]) assert.equal(validateDocument(doc([node])).ok, false);
  const result = validateDocument(doc([{ type: 'text', runs: [{ value: { $: 'missing' } }] }])); assert.equal(result.ok, false); assert.ok(result.issues.some(issue => issue.code === 'UNKNOWN_REFERENCE' && issue.path === '/body/0/runs/0/value/$'));
});
test('grid items require direct grid placement and valid desktop/mobile spans', () => {
  const item = { type: 'grid-item', children: [{ type: 'text', value: 'Cell' }] };
  for (const body of [[item], [{ type: 'col', children: [item] }], [{ type: 'grid', columns: 2, children: [{ ...item, colSpan: 3 }] }], [{ type: 'grid', mobileColumns: 1, children: [{ ...item, mobileColSpan: 2 }] }]]) assert.equal(validateDocument(doc(body)).ok, false);
  assert.equal(validateDocument(doc([{ type: 'grid', columns: 3, mobileColumns: 2, children: [{ ...item, colSpan: 3, mobileColSpan: 2 }] }])).ok, true);
});
test('new layouts compile deterministically and atomic rejection preserves the previous UI', async () => {
  assert.equal(await compileHtml(fixture), await compileHtml(fixture)); const { host, controller } = setup(fixture), before = host.innerHTML;
  const invalid = structuredClone(fixture); invalid.body[1].runs[0].href = 'javascript:bad()'; assert.throws(() => controller.update(invalid)); assert.equal(host.innerHTML, before); controller.dispose();
});
