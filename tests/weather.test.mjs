// Copy to the integrated repository's tests/; requires examples/weather.json and its rebuilt dist/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { mount, validateDocument, compileHtml } from '../dist/index.js';

const fixture = JSON.parse(await readFile(new URL('../examples/weather.json', import.meta.url)));
const input = () => structuredClone(fixture);
const setup = (spec = input(), lang = 'en') => {
  const dom = new JSDOM(`<!doctype html><html lang="${lang}"><body><div id="host"></div></body></html>`, { url: 'https://example.org/' });
  const host = dom.window.document.getElementById('host'), controller = mount(host, spec);
  return { dom, host, controller, root: host.querySelector('.iui-weather') };
};
const click = (root, action, value) => root.querySelector(`[data-weather-action="${action}"][data-value="${value}"]`).click();

test('weather fixture is a functional domain renderer, not schema-only recognition', () => {
  assert.equal(validateDocument(fixture).ok, true); const { host, controller } = setup();
  assert.ok(host.querySelector('.iui-weather-current-temperature')); assert.ok(host.querySelector('.iui-weather-days'));
  assert.ok(host.querySelector('[data-weather-series="temperature"]')); assert.match(host.textContent, /Synthetic demonstration/);
  assert.match(host.querySelector('.iui-weather-source').textContent, /Updated/); assert.equal(host.querySelectorAll('img,iframe').length, 0); controller.dispose();
});
test('weather update cycles detach old events, keep sibling mounts isolated and validate atomically', () => {
  const { dom, host, controller } = setup(), second = dom.window.document.createElement('div'); dom.window.document.body.append(second);
  const sibling = mount(second, input()), old = host.querySelector('.iui-weather'), oldButton = old.querySelector('[data-value="fahrenheit"]');
  for (let index = 0; index < 18; index++) {
    const next = input(); next.body[0].status = ['ready', 'loading', 'error'][index % 3]; controller.update(next);
    assert.equal(host.querySelectorAll('.iui-weather').length, 1); assert.equal(host.querySelector('.iui-weather').dataset.status, next.body[0].status);
  }
  controller.update(input()); oldButton.click(); assert.equal(old.dataset.unit, 'celsius');
  const current = host.querySelector('.iui-weather'); click(current, 'unit', 'fahrenheit'); assert.equal(second.querySelector('.iui-weather').dataset.unit, 'celsius');
  const invalid = input(); invalid.body[0].hourly.reverse(); assert.throws(() => controller.update(invalid)); assert.equal(host.querySelector('.iui-weather'), current);
  const detachedButton = current.querySelector('[data-value="celsius"]'); controller.dispose(); detachedButton.click(); assert.equal(current.dataset.unit, 'fahrenheit');
  assert.equal(host.childElementCount, 0); assert.ok(second.querySelector('.iui-weather')); sibling.dispose();
});
test('weather display controls remain local and never change document input or shared state', () => {
  const spec = input(); spec.state = { untouched: 7 }; const before = structuredClone(spec); const { root, controller } = setup(spec);
  for (let index = 0; index < 20; index++) { click(root, 'unit', 'fahrenheit'); click(root, 'unit', 'celsius'); click(root, 'view', index % 2 ? 'chart' : 'table'); }
  assert.equal(root.querySelector('.iui-weather-current-temperature').textContent, '14.2°C'); assert.deepEqual(controller.getState(), { untouched: 7 }); assert.deepEqual(spec, before); controller.dispose();
});
test('weather chart keeps missing gaps, zero precipitation and actual elapsed-time distances', () => {
  const { root, controller } = setup(); assert.equal(root.querySelectorAll('[data-weather-series] path').length, 2); assert.equal(root.querySelector('[data-hour="4"]'), null);
  const points = root.querySelectorAll('circle[data-hour]'); const x = index => Number(points[index].getAttribute('cx'));
  assert.ok(Math.abs((x(3) - x(1)) / (x(1) - x(0)) - 3) < 1e-9);
  click(root, 'metric', 'precipitation'); assert.equal(root.querySelector('[data-hour="6"]').getAttribute('data-value'), '0'); assert.equal(root.querySelector('[data-hour="7"]'), null);
  click(root, 'view', 'table'); assert.match(root.querySelector('tbody').textContent, /01:00 GMT-7/); assert.match(root.querySelector('tbody').textContent, /01:00 GMT-8/); controller.dispose();
});
test('weather compile is deterministic and includes synthetic provenance without external assets', async () => {
  const a = await compileHtml(input()), b = await compileHtml(input()); assert.equal(a, b);
  assert.match(a, /Inform UI synthetic fixture/); assert.match(a, /sha256-/);
});
test('weather date selection uses location calendar days across UTC offsets and spring DST', () => {
  const spec = input(), node = spec.body[0];
  node.hourly = [
    { time: '2026-11-02T07:30:00Z', temperature: 10, precipitationProbability: 0 },
    { time: '2026-11-02T08:30:00Z', temperature: 11, precipitationProbability: 0 },
  ];
  const { root, controller } = setup(spec); assert.equal(root.querySelector('[data-hour]').dataset.time, '2026-11-02T07:30:00Z');
  click(root, 'date', '2026-11-02'); assert.equal(root.querySelector('[data-hour]').dataset.time, '2026-11-02T08:30:00Z');
  const spring = input(); spring.body[0].daily = []; delete spring.body[0].initialDate;
  spring.body[0].hourly = [
    { time: '2026-03-08T01:00:00-08:00', temperature: 10, precipitationProbability: 0 },
    { time: '2026-03-08T03:00:00-07:00', temperature: 11, precipitationProbability: 0 },
    { time: '2026-03-08T05:00:00-07:00', temperature: 12, precipitationProbability: 0 },
  ];
  controller.dispose();
  const another = setup(spring), marks = another.root.querySelectorAll('circle[data-hour]'), x = index => Number(marks[index].getAttribute('cx'));
  assert.equal(marks.length, 3); assert.ok(Math.abs((x(2) - x(1)) / (x(1) - x(0)) - 2) < 1e-9); another.controller.dispose();
});
test('weather ready empty, all-missing and one-point displays are distinct from loading/error', () => {
  const spec = input(); spec.body[0].daily = []; spec.body[0].hourly = []; delete spec.body[0].initialDate;
  const { host, root, controller } = setup(spec); assert.equal(root.dataset.status, 'ready'); assert.equal(root.querySelector('.iui-weather-empty').textContent, 'No data available');
  assert.equal(root.querySelector('[role="tablist"]').hidden, true); assert.equal(root.querySelectorAll('[data-hour]').length, 0);
  controller.update(input()); const ready = host.querySelector('.iui-weather'); click(ready, 'date', '2026-11-03');
  const point = ready.querySelector('circle[data-hour]'); assert.ok(point); assert.ok(Number.isFinite(Number(point.getAttribute('cx')))); assert.ok(Number.isFinite(Number(point.getAttribute('cy'))));
  assert.equal(ready.querySelectorAll('[data-tick-time]').length, 1);
  click(ready, 'date', '2026-11-06'); assert.equal(ready.querySelector('.iui-weather-empty').hidden, false); assert.equal(ready.querySelectorAll('[data-hour]').length, 0);
  click(ready, 'view', 'table'); assert.match(ready.querySelector('tbody').textContent, /Missing/);
  const missingTemperature = input(); missingTemperature.body[0].current.temperature = null;
  missingTemperature.body[0].hourly = [{ time: missingTemperature.body[0].current.time, temperature: null, precipitationProbability: 35 }];
  controller.update(missingTemperature); const missing = host.querySelector('.iui-weather'); assert.equal(missing.querySelector('.iui-weather-current-temperature').textContent, 'Missing');
  assert.equal(missing.querySelector('.iui-weather-chart').style.display, 'none'); click(missing, 'metric', 'precipitation');
  assert.equal(missing.querySelector('[data-hour]').dataset.value, '35'); controller.dispose();
});
test('weather native Fahrenheit and Chinese labels preserve units, source and honest missing values', () => {
  const spec = input(); spec.body[0].units.temperature = 'fahrenheit'; spec.body[0].current.temperature = 32;
  const { root, controller } = setup(spec, 'zh-CN'); assert.equal(root.querySelector('.iui-weather-current-temperature').textContent, '32°F');
  click(root, 'unit', 'celsius'); assert.equal(root.querySelector('.iui-weather-current-temperature').textContent, '0°C');
  click(root, 'unit', 'fahrenheit'); assert.equal(root.querySelector('.iui-weather-current-temperature').textContent, '32°F');
  assert.match(root.textContent, /合成演示/); assert.match(root.textContent, /更新时间/); assert.match(root.textContent, /局部多云/);
  click(root, 'view', 'table'); assert.match(root.querySelector('tbody').textContent, /缺测/); controller.dispose();
});
test('weather controls expose keyboard selection, ARIA state and unique ids across multiple weather nodes', () => {
  const spec = input(); const second = structuredClone(spec.body[0]); second.id = 'second-weather'; spec.body.push(second);
  const { dom, host, root, controller } = setup(spec); const key = (element, value) => element.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
  const firstTab = root.querySelector('[role="tab"]'); firstTab.focus(); key(firstTab, 'ArrowRight'); assert.equal(root.dataset.date, '2026-11-02'); assert.equal(dom.window.document.activeElement.dataset.value, '2026-11-02');
  key(dom.window.document.activeElement, 'End'); assert.equal(root.dataset.date, '2026-11-06'); key(dom.window.document.activeElement, 'Home'); assert.equal(root.dataset.date, '2026-11-01');
  assert.equal(root.querySelectorAll('[role="tab"][tabindex="0"]').length, 1);
  const chart = root.querySelector('.iui-weather-chart'); key(chart, 'ArrowRight'); assert.match(root.querySelector('output').value, /GMT-7/); key(chart, 'ArrowRight'); assert.match(root.querySelector('output').value, /GMT-8/);
  const panels = [...host.querySelectorAll('[role="tabpanel"]')]; assert.notEqual(panels[0].id, panels[1].id);
  for (const tab of host.querySelectorAll('[role="tab"]')) assert.ok(dom.window.document.getElementById(tab.getAttribute('aria-controls')));
  controller.dispose();
});
test('weather semantic rejection covers unsorted/duplicate times, absent offsets, bad dates, unit ranges and URLs', () => {
  const mutations = [
    node => node.hourly.reverse(), node => { node.hourly[1].time = node.hourly[0].time; },
    node => { node.current.time = '2026-11-01T01:00:00'; }, node => { node.updatedAt = '2026-02-30T01:00:00Z'; },
    node => { node.daily[1].date = node.daily[0].date; }, node => { node.initialDate = '2026-12-31'; },
    node => { node.location.timezone = 'Invalid/Zone'; }, node => { node.hourly[0].precipitationProbability = 101; },
    node => { node.current.humidity = -1; }, node => { node.daily[0].low = node.daily[0].high + 1; },
    node => { node.current.temperature = -300; }, node => { node.source.url = 'javascript:alert(1)'; },
  ];
  for (const mutate of mutations) { const spec = input(); mutate(spec.body[0]); assert.equal(validateDocument(spec).ok, false); }
});
