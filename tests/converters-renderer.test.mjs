import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mount, validateDocument, compileHtml } from '../dist/index.js';

const unit = (patch = {}) => ({ type: 'unit-converter', category: 'length', amount: 1, from: 'm', to: 'cm', ...patch });
const currency = (patch = {}) => ({ type: 'currency-converter', source: { label: 'Original synthetic rate snapshot', synthetic: true, url: 'https://example.org/rates' }, asOf: '2026-10-08T10:00:00+08:00', base: 'USD', rates: [{ currency: 'EUR', rate: .8 }, { currency: 'JPY', rate: 160 }, { currency: 'GBP', rate: null }], amount: 100, from: 'USD', to: 'EUR', ...patch });
const document = (nodes) => ({ version: 'iui/1', title: 'Original offline converter fixture', state: { tick: 0 }, body: Array.isArray(nodes) ? nodes : [nodes] });
function setup(node = unit(), lang = 'en') {
  const dom = new JSDOM(`<!doctype html><html lang="${lang}"><body><div id="host"></div></body></html>`, { url: 'https://example.org/' });
  const host = dom.window.document.getElementById('host'), controller = mount(host, document(node));
  const root = host.querySelector('.iui-converter'), control = name => root.querySelector(`[data-converter-control="${name}"]`), result = () => root.querySelector('output');
  const change = (name, value) => { const element = control(name); element.value = String(value); element.dispatchEvent(new dom.window.Event(name === 'amount' ? 'input' : 'change', { bubbles: true })); };
  return { dom, host, root, control, result, change, controller };
}

test('converter mount has native labels, one live output and valid control references', () => {
  const { root, control, result, controller } = setup();
  assert.equal(result().value, '100 cm'); assert.equal(result().dataset.rawValue, '100'); assert.equal(result().getAttribute('aria-live'), 'polite');
  for (const name of ['category', 'mode', 'amount', 'from', 'to']) { const element = control(name); assert.equal(root.querySelector(`label[for="${element.id}"]`).control, element); }
  assert.ok(result().getAttribute('for').split(' ').every(id => root.querySelector(`[id="${id}"]`)));
  controller.dispose();
});

test('all nine categories offer valid controls and independent known conversion results', () => {
  const { root, control, change, result, controller } = setup(); assert.equal(control('category').options.length, 9);
  const cases = [['length', 'm', 'cm', 100], ['mass', 'kg', 'g', 1000], ['temperature', 'K', 'C', -272.15], ['speed', 'm-s', 'km-h', 3.6], ['area', 'm2', 'cm2', 10000], ['volume', 'L', 'mL', 1000], ['time', 's', 'ms', 1000], ['pressure', 'Pa', 'kPa', .001], ['data', 'B', 'bit', 8]];
  for (const [category, from, to, expected] of cases) { change('category', category); assert.equal(root.dataset.category, category); assert.equal(control('from').value, from); assert.equal(control('to').value, to); assert.ok(Math.abs(Number(result().dataset.rawValue) - expected) < 1e-10); }
  change('from', 'MiB'); change('to', 'MB'); assert.equal(result().value, '1.048576 MB'); assert.match(root.querySelector('.iui-converter-note').textContent, /decimal.*binary/); controller.dispose();
});

test('temperature controls distinguish absolute offsets and signed temperature differences', () => {
  const { root, change, result, controller } = setup(unit({ category: 'temperature', from: 'C', to: 'F', amount: 0 }));
  assert.equal(result().value, '32 °F'); change('mode', 'difference'); assert.equal(result().value, '0 Δ°F'); change('amount', '10'); assert.equal(result().value, '18 Δ°F');
  change('amount', '-300'); assert.equal(result().value, '-540 Δ°F'); change('mode', 'absolute'); assert.equal(result().value, '—'); assert.match(root.querySelector('.iui-converter-error').textContent, /absolute zero/); assert.equal(result().dataset.rawValue, undefined);
  change('amount', '-273.15'); assert.ok(Math.abs(Number(result().dataset.rawValue) + 459.67) < 1e-10); controller.dispose();
});

test('input preserves unfinished drafts and rejects blank, grouping, nonfinite and underflow-as-zero', () => {
  const { root, control, change, result, controller } = setup();
  for (const invalid of ['', ' ', '-', '.', '1e', '1e+', '1,000', '0x10', 'Infinity', 'NaN', '1e999', '1e-999']) { change('amount', invalid); assert.equal(control('amount').value, invalid); assert.equal(result().value, '—'); assert.equal(result().dataset.rawValue, undefined); assert.equal(control('amount').getAttribute('aria-invalid'), 'true'); assert.equal(root.dataset.result, 'invalid'); }
  for (const [input, expected] of [['0', '0 cm'], ['-0', '0 cm'], ['0e-999', '0 cm'], ['1.5e3', '150,000 cm'], ['+.5', '50 cm']]) { change('amount', input); assert.equal(result().value, expected); assert.equal(control('amount').getAttribute('aria-invalid'), 'false'); }
  controller.dispose();
});

test('swap and reset remain local, preserve focus and restore node defaults', () => {
  const initial = unit({ category: 'temperature', from: 'C', to: 'F', amount: 10, temperatureMode: 'difference' });
  const { dom, root, control, change, result, controller } = setup(initial);
  root.querySelector('[data-converter-action="swap"]').click(); assert.equal(control('amount').value, '10'); assert.ok(Math.abs(Number(result().dataset.rawValue) - 10 / 1.8) < 1e-10);
  change('amount', '1e'); change('category', 'data'); control('amount').focus(); controller.setState({ tick: 1 }); assert.equal(dom.window.document.activeElement, control('amount')); assert.equal(control('amount').value, '1e'); assert.deepEqual(controller.getState(), { tick: 1 });
  const reset = root.querySelector('[data-converter-action="reset"]'); reset.focus(); reset.click(); assert.equal(dom.window.document.activeElement, reset); assert.equal(result().value, '18 Δ°F'); assert.equal(control('category').value, 'temperature'); assert.equal(control('mode').value, 'difference');
  assert.deepEqual(initial, { type: 'unit-converter', category: 'temperature', amount: 10, from: 'C', to: 'F', temperatureMode: 'difference' }); controller.dispose();
});

test('precision means significant digits; tiny values are not silently rounded to zero', () => {
  for (const [node, expected, raw] of [[unit({ amount: 12345.6789, from: 'm', to: 'm', precision: 3 }), '12,300 m', '12345.6789'], [unit({ amount: 1e-14, from: 'm', to: 'm', precision: 2 }), '1E-14 m', '1e-14'], [unit({ amount: 1.234567891, from: 'm', to: 'm' }), '1.2345679 m', '1.234567891']]) { const { result, controller } = setup(node); assert.equal(result().value, expected); assert.equal(result().dataset.rawValue, raw); assert.match(result().title, /Original value/); controller.dispose(); }
});

test('currency rates are from supplied base snapshot; missing, zero and same-currency stay distinct', () => {
  const { root, control, change, result, controller } = setup(currency()); assert.equal(result().value, '80 EUR');
  change('from', 'EUR'); change('to', 'JPY'); assert.equal(result().value, '20,000 JPY'); change('to', 'USD'); assert.equal(result().value, '125 USD'); change('amount', '-2'); assert.equal(result().value, '-2.5 USD');
  change('to', 'GBP'); assert.equal(root.dataset.result, 'missing'); assert.equal(result().value, '—'); assert.equal(control('amount').getAttribute('aria-invalid'), 'false'); change('amount', '0'); assert.equal(result().value, '—');
  change('to', 'EUR'); assert.equal(result().value, '0 EUR'); change('amount', '2'); assert.equal(result().value, '2 EUR');
  change('from', 'GBP'); change('to', 'GBP'); assert.equal(result().value, '2 GBP');
  controller.dispose();
});

test('currency provenance preserves original timestamp and labels all supplied rates', () => {
  const { root, controller } = setup(currency()), footer = root.querySelector('footer');
  assert.equal(footer.querySelector('time').dateTime, '2026-10-08T10:00:00+08:00'); assert.match(footer.textContent, /Synthetic demonstration/); assert.match(footer.textContent, /Base currency: USD/);
  const source = footer.querySelector('a'); assert.equal(source.href, 'https://example.org/rates'); assert.equal(source.rel, 'noopener noreferrer'); assert.equal(source.referrerPolicy, 'no-referrer');
  assert.match(root.querySelector('.iui-converter-note').textContent, /caller-provided.*does not fetch quotes.*Fees/); assert.doesNotMatch(root.textContent, /live quote|real.time/i);
  assert.equal(root.querySelectorAll('tbody tr').length, 4); assert.equal(root.querySelector('[data-currency="USD"] td').dataset.rawValue, '1'); assert.equal(root.querySelector('[data-currency="GBP"] td').textContent, 'Missing'); controller.dispose();
});

test('currency ready/loading/error/empty lifecycle retains provenance and disposes old controls', () => {
  const { host, root, controller } = setup(currency());
  for (const status of ['loading', 'error', 'ready', 'loading', 'ready']) { controller.update(document(currency({ status }))); const current = host.querySelector('.iui-converter'); assert.equal(current.dataset.status, status); assert.equal(current.querySelector('.iui-converter-body').hidden, status !== 'ready'); assert.equal(current.querySelector('time').dateTime, '2026-10-08T10:00:00+08:00'); }
  root.querySelector('[data-converter-action="swap"]').click(); assert.equal(root.querySelector('output').value, '80 EUR');
  controller.update(document(currency({ rates: [], from: 'USD', to: 'USD' }))); const empty = host.querySelector('.iui-converter'); assert.equal(empty.dataset.status, 'empty'); assert.equal(empty.querySelector('.iui-converter-body').hidden, true); assert.match(empty.querySelector('.iui-converter-status').textContent, /No exchange-rate records/);
  controller.update(document(unit())); const last = host.querySelector('.iui-converter'); controller.dispose(); last.querySelector('button').click(); assert.equal(last.querySelector('output').value, '100 cm'); assert.equal(host.children.length, 0);
});

test('multiple converters have unique ids and render labels as text, including Chinese', () => {
  const { host, controller } = setup([unit({ title: '<img src=x onerror=alert(1)>' }), currency()], 'zh-CN');
  assert.equal(host.querySelectorAll('.iui-converter').length, 2); assert.equal(host.querySelector('img'), null); assert.match(host.textContent, /<img/); assert.match(host.textContent, /数值/);
  const ids = [...host.querySelectorAll('[id]')].map(element => element.id); assert.equal(new Set(ids).size, ids.length); controller.dispose();
});

test('offline compile includes original converter implementation without external scripts', async () => {
  const input = document([unit(), currency()]); assert.equal(validateDocument(input).ok, true); const html = await compileHtml(input); assert.match(html, /iui-converter/); assert.doesNotMatch(html, /<script[^>]+src="https?:/);
});
