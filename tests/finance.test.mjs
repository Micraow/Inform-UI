import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { mount, validateDocument, compileHtml } from '../dist/index.js';

const fixture = JSON.parse(await readFile(new URL('../examples/finance.json', import.meta.url)));
const input = () => structuredClone(fixture);
const only = (index, mutate = () => {}) => { const spec = input(); spec.body = [spec.body[index]]; mutate(spec.body[0]); return spec; };
function setup(spec = input(), lang = 'en') {
  const dom = new JSDOM(`<!doctype html><html lang="${lang}"><body><div id="host"></div></body></html>`, { url: 'https://example.org/' });
  const host = dom.window.document.getElementById('host'), controller = mount(host, spec);
  return { dom, host, controller, root: host.querySelector('.iui-finance') };
}
const byKind = (host, kind) => host.querySelector(`[data-kind="finance-${kind}"]`);
const click = (root, action, value) => root.querySelector(`[data-finance-action="${action}"][data-value="${value}"]`).click();
const key = (dom, target, key) => target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

test('finance fixture mounts three real renderers with honest metadata and offline assets', () => {
  assert.equal(validateDocument(fixture).ok, true);
  const { host, controller } = setup(), quote = byKind(host, 'quote'), comparison = byKind(host, 'comparison');
  assert.equal(host.querySelectorAll('.iui-finance').length, 3);
  assert.equal(quote.querySelector('.iui-finance-price').textContent, '112 USD');
  assert.match(quote.textContent, /Market closed/); assert.match(quote.textContent, /Delayed 15 min/);
  assert.equal(quote.querySelector('.iui-finance-updated').dateTime, '2026-11-01T06:15:00-08:00');
  assert.match(comparison.textContent, /Trading halted/);
  for (const source of host.querySelectorAll('.iui-finance-source')) assert.match(source.textContent, /Synthetic demonstration/);
  assert.equal(host.querySelectorAll('img,iframe,video').length, 0); controller.dispose();
});

test('quote computes signed differences, preserves current zero, and never divides by a zero close', () => {
  const cases = [
    [0, 100, '0 USD', '-100 USD', '(-100%)', 'down'],
    [2, 0, '2 USD', '+2 USD', '(Unavailable)', 'up'],
    [0, 0, '0 USD', '0 USD', '(Unavailable)', 'flat'],
    [null, 100, 'Missing', 'Missing', '(Unavailable)', 'missing'],
    [2, null, '2 USD', 'Missing', '(Unavailable)', 'missing'],
    [0.0032, 0.0025, '0.0032 USD', '+0.0007 USD', '(+28%)', 'up'],
  ];
  for (const [price, previousClose, display, amount, percent, direction] of cases) {
    const { root, controller } = setup(only(0, node => Object.assign(node.instrument, { price, previousClose })));
    assert.equal(root.querySelector('.iui-finance-price').textContent, display);
    assert.equal(root.querySelector('.iui-finance-change-amount').textContent, amount);
    assert.equal(root.querySelector('.iui-finance-change-percent').textContent, percent);
    assert.equal(root.querySelector('.iui-finance-change').dataset.direction, direction);
    if (previousClose === 0) assert.match(root.textContent, /previous close above zero/);
    assert.doesNotMatch(root.textContent, /NaN|Infinity/); controller.dispose();
  }
});

test('declared zero delay is displayed explicitly without claiming a live quote', () => {
  for (const [lang, expected] of [['en', 'Reported delay: 0 min'], ['zh-CN', '声明延迟 0 分钟']]) {
    const { root, controller } = setup(only(0, node => { node.instrument.delayMinutes = 0; }), lang);
    assert.equal(root.querySelector('.iui-finance-delay').textContent, expected);
    assert.equal(root.querySelector('.iui-finance-delay').dataset.minutes, '0');
    assert.doesNotMatch(root.textContent, /live quote|real.time|实时/); controller.dispose();
  }
});

test('chart uses numeric time distances, preserves null gaps, and shows zero as a real point', () => {
  const { root, controller } = setup(only(1));
  const group = root.querySelector('[data-finance-series="orbit"]'), marks = group.querySelectorAll('circle');
  assert.equal(group.querySelectorAll('path').length, 2); assert.equal(marks.length, 5);
  const x = index => Number(marks[index].getAttribute('cx'));
  assert.ok(Math.abs((x(2) - x(1)) / (x(1) - x(0)) - 2) < 1e-9);
  assert.equal(root.querySelector('[data-time="2026-11-01T02:00:00-08:00"]'), null);
  controller.update(only(1, node => { node.instrument.history[1].price = 0; }));
  assert.equal(controller.getState().untouched, undefined);
  controller.dispose();
  const zero = setup(only(1, node => { node.instrument.history[1].price = 0; }));
  assert.equal(zero.root.querySelector('[data-time="2026-11-01T01:00:00-07:00"]').dataset.value, '0'); zero.controller.dispose();
});

test('keyboard readout includes missing points and distinguishes repeated wall clocks across DST', () => {
  const { dom, root, controller } = setup(only(1)), chart = root.querySelector('svg'), output = root.querySelector('output');
  key(dom, chart, 'Home'); assert.match(output.value, /00:30:00 GMT-7/);
  key(dom, chart, 'ArrowRight'); assert.match(output.value, /01:00:00 GMT-7/);
  key(dom, chart, 'ArrowRight'); assert.match(output.value, /01:00:00 GMT-8/);
  key(dom, chart, 'ArrowRight'); assert.match(output.value, /Missing/);
  key(dom, chart, 'End'); assert.match(output.value, /112 USD/);
  key(dom, chart, 'ArrowRight'); assert.match(output.value, /112 USD/);
  assert.match(root.querySelector('tbody').textContent, /01:00:00 GMT-7/);
  assert.match(root.querySelector('tbody').textContent, /01:00:00 GMT-8/);
  assert.equal(root.querySelectorAll('tbody tr').length, 6); controller.dispose();
});

test('spring DST follows elapsed instants rather than the skipped wall-clock hour', () => {
  const spec = only(1, node => {
    node.ranges = []; delete node.initialRange;
    node.instrument.history = [
      { time: '2026-03-08T01:00:00-08:00', price: 0.000012 },
      { time: '2026-03-08T03:00:00-07:00', price: 0.000011 },
      { time: '2026-03-08T05:00:00-07:00', price: 0.000014 },
    ];
  });
  const { root, controller } = setup(spec), marks = root.querySelectorAll('circle'), x = index => Number(marks[index].getAttribute('cx'));
  assert.ok(Math.abs((x(2) - x(1)) / (x(1) - x(0)) - 2) < 1e-9); assert.match(root.querySelector('tbody').textContent, /0.000012 USD/); controller.dispose();
});

test('comparison uses one exact baseline instant across currencies, without absolute-price series', () => {
  const { root, controller } = setup(only(2));
  const value = (id, time) => Number(root.querySelector(`[data-finance-series="${id}"] [data-time="${time}"]`).dataset.value);
  assert.ok(Math.abs(value('orbit', '2026-11-01T06:00:00-08:00') - 12) < 1e-9);
  assert.ok(Math.abs(value('tide', '2026-11-01T06:00:00-08:00') - 12) < 1e-9);
  assert.match(root.querySelector('.iui-finance-baseline').textContent, /00:30:00 GMT-7/);
  assert.match(root.querySelector('.iui-finance-note').textContent, /No currency conversion/);
  assert.equal(root.querySelectorAll('.iui-finance-price').length, 0);
  assert.equal(root.querySelector('[data-finance-series="seed"] circle'), null);
  assert.match(root.querySelector('.iui-finance-incomparable').textContent, /no valid price at this instant/);
  assert.match(root.querySelector('thead').textContent, /ORBT \(%\).*TIDE \(%\).*SEED \(%\)/);
  assert.doesNotMatch(root.querySelector('tbody').textContent, /USD|EUR|JPY/);
  click(root, 'range', 'point');
  assert.ok(Math.abs(Number(root.querySelector('[data-finance-series="orbit"] circle').dataset.value) - 12) < 1e-9);
  controller.dispose();
});

test('equivalent UTC offsets match a baseline; absent, null and zero baselines never borrow a nearby day', () => {
  for (const baselineValue of ['absent', null, 0]) {
    const spec = only(2, node => {
      node.baselineAt = '2026-11-01T07:30:00Z';
      if (baselineValue === 'absent') node.instruments[0].history.shift();
      else node.instruments[0].history[0].price = baselineValue;
    });
    const { root, controller } = setup(spec);
    assert.equal(root.querySelector('[data-finance-series="orbit"] circle'), null);
    assert.match(root.querySelector('[data-instrument="orbit"] .iui-finance-incomparable').textContent, baselineValue === 0 ? /above zero/ : /no valid price/);
    assert.ok(root.querySelector('[data-finance-series="tide"] circle'));
    assert.equal(root.querySelector('tbody [data-instrument="orbit"]').textContent, 'Not comparable'); controller.dispose();
  }
});

test('comparison preserves a zero subsequent price as -100%, and raw input never changes', () => {
  const spec = only(2, node => { node.instruments[0].history.at(-1).price = 0; }); const before = structuredClone(spec);
  const { root, controller } = setup(spec);
  assert.equal(root.querySelector('[data-finance-series="orbit"] circle:last-of-type').dataset.value, '-100');
  for (let index = 0; index < 20; index++) { click(root, 'series', 'orbit'); click(root, 'range', index % 2 ? 'all' : 'dst'); }
  assert.deepEqual(spec, before); controller.dispose();
});

test('legend visibility is local, does not remove full-table data, and handles all-hidden state', () => {
  const spec = only(2); spec.state = { untouched: 7 };
  const { root, controller } = setup(spec);
  for (const instrument of spec.body[0].instruments) click(root, 'series', instrument.id);
  assert.match(root.querySelector('.iui-finance-empty').textContent, /All series are hidden/);
  assert.equal(root.querySelector('svg').style.display, 'none'); assert.equal(root.querySelectorAll('tbody tr').length, 6);
  assert.equal(root.querySelectorAll('[data-finance-action="series"][aria-pressed="false"]').length, 3);
  click(root, 'series', 'tide'); assert.ok(root.querySelector('[data-finance-series="tide"] circle'));
  assert.equal(root.querySelector('[data-finance-series="orbit"]'), null);
  assert.deepEqual(controller.getState(), { untouched: 7 }); controller.dispose();
});

test('range boundaries filter inclusively; one-point, no-observation and all-null ranges stay readable', () => {
  const { root, host, controller } = setup(only(1));
  click(root, 'range', 'dst'); assert.equal(root.querySelectorAll('circle').length, 2);
  click(root, 'range', 'point'); assert.equal(root.querySelectorAll('circle').length, 1); assert.match(root.querySelector('.iui-finance-empty').textContent, /one valid observation/);
  for (const axis of ['cx', 'cy']) assert.ok(Number.isFinite(Number(root.querySelector('circle').getAttribute(axis))));
  click(root, 'range', 'empty'); assert.equal(root.querySelectorAll('circle').length, 0); assert.match(root.querySelector('.iui-finance-empty').textContent, /No observations/);
  assert.equal(root.querySelector('details').hidden, true);
  controller.update(only(1, node => { node.instrument.history.forEach(point => { point.price = null; }); }));
  const missing = host.querySelector('.iui-finance'); assert.match(missing.querySelector('.iui-finance-empty').textContent, /No valid values/);
  assert.equal(missing.querySelectorAll('tbody tr').length, 6); assert.match(missing.querySelector('tbody').textContent, /Missing/);
  controller.update(only(1, node => { node.instrument.history = []; node.ranges = []; delete node.initialRange; }));
  assert.match(host.querySelector('.iui-finance-empty').textContent, /No observations/); controller.dispose();
});

test('refreshes preserve focused controls, chart focus, table disclosure and selected observation', () => {
  const spec = only(1); spec.state = { refresh: 0 };
  const { dom, root, controller } = setup(spec), button = root.querySelector('[data-value="dst"]'), chart = root.querySelector('svg');
  button.focus(); button.click(); assert.equal(dom.window.document.activeElement, button);
  root.querySelector('details').open = true; controller.setState({ refresh: 1 });
  assert.equal(dom.window.document.activeElement, button); assert.equal(root.querySelector('details').open, true);
  chart.focus(); key(dom, chart, 'Home'); const readout = root.querySelector('output').value;
  controller.setState({ refresh: 2 }); assert.equal(dom.window.document.activeElement, chart); assert.equal(root.querySelector('output').value, readout);
  assert.equal(root.querySelector('svg'), chart); controller.dispose();
});

test('repeated local paints do not accumulate refresh bindings or alter shared state', () => {
  const spec = only(2); spec.state = { refresh: 0 };
  const { dom, root, controller } = setup(spec), original = dom.window.document.createElementNS.bind(dom.window.document);
  let count = 0; dom.window.document.createElementNS = (...args) => { count++; return original(...args); };
  controller.setState({ refresh: 1 }); const before = count;
  for (let index = 0; index < 24; index++) { click(root, 'range', 'dst'); click(root, 'range', 'all'); click(root, 'series', 'tide'); click(root, 'series', 'tide'); }
  count = 0; controller.setState({ refresh: 2 }); assert.equal(count, before); assert.deepEqual(controller.getState(), { refresh: 2 }); controller.dispose();
});

test('update and dispose remove old listeners, isolate sibling mounts, and reject invalid documents atomically', () => {
  const { dom, host, controller } = setup(only(1)), original = host.querySelector('.iui-finance'), oldButton = original.querySelector('[data-value="dst"]');
  const second = dom.window.document.createElement('div'); dom.window.document.body.append(second); const sibling = mount(second, only(1));
  for (const status of ['loading', 'error', 'ready', 'loading', 'ready']) {
    controller.update(only(1, node => { node.status = status; })); const current = host.querySelector('.iui-finance');
    assert.equal(host.querySelectorAll('.iui-finance').length, 1); assert.equal(current.dataset.status, status);
    assert.equal(current.querySelector('.iui-finance-body').hidden, status !== 'ready');
    assert.match(current.querySelector('.iui-finance-source').textContent, /Synthetic demonstration/);
    if (status === 'error') assert.equal(current.querySelector('.iui-finance-status').getAttribute('role'), 'alert');
    assert.equal(current.getAttribute('aria-busy'), String(status === 'loading'));
  }
  oldButton.click(); assert.equal(original.dataset.range, 'all');
  const current = host.querySelector('.iui-finance'); click(current, 'range', 'dst'); assert.equal(second.querySelector('.iui-finance').dataset.range, 'all');
  const invalid = only(1, node => { node.instrument.currency = 'TOOLONG'; }); assert.throws(() => controller.update(invalid)); assert.equal(host.querySelector('.iui-finance'), current);
  const detached = current.querySelector('[data-value="all"]'); controller.dispose(); detached.click(); assert.equal(current.dataset.range, 'dst'); assert.equal(host.childElementCount, 0);
  assert.ok(second.querySelector('.iui-finance')); sibling.dispose();
});

test('Chinese labels, literal untrusted text, and all ARIA references remain valid across sibling nodes', () => {
  const spec = input(); spec.body[0].instrument.name = '<img src=x onerror=alert(1)>';
  const { dom, host, controller } = setup(spec, 'zh-CN');
  assert.match(host.textContent, /<img src=x onerror=alert\(1\)>/); assert.equal(host.querySelector('img'), null);
  assert.match(host.textContent, /休市/); assert.match(host.textContent, /更新时间/); assert.match(host.textContent, /合成演示/); assert.match(host.textContent, /不可比/);
  for (const element of host.querySelectorAll('[aria-labelledby],[aria-describedby]')) {
    for (const attribute of ['aria-labelledby', 'aria-describedby']) for (const id of (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean)) assert.ok(dom.window.document.getElementById(id), `Missing ${id}`);
  }
  const ids = [...host.querySelectorAll('[id]')].map(node => node.id); assert.equal(new Set(ids).size, ids.length); controller.dispose();
});

test('finance compilation is deterministic and preserves synthetic provenance', async () => {
  const first = await compileHtml(input()), second = await compileHtml(input());
  assert.equal(first, second); assert.match(first, /Intelligent-UI original synthetic market fixture/); assert.match(first, /sha256-/);
});

test('subsecond observations remain distinguishable in complete tables and keyboard readouts',()=>{const{root,dom,controller}=setup(only(1,n=>{n.ranges=[];delete n.initialRange;n.instrument.timezone='UTC';n.instrument.history=[{time:'2026-11-01T00:00:00.001Z',price:1},{time:'2026-11-01T00:00:00.002Z',price:2}];}));const times=[...root.querySelectorAll('tbody time')].map(e=>e.textContent);assert.match(times[0],/00:00:00\.001/);assert.match(times[1],/00:00:00\.002/);key(dom,root.querySelector('svg'),'End');assert.match(root.querySelector('output').value,/00:00:00\.002/);controller.dispose();});
