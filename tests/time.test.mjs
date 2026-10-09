/** Drop into the repository's tests/ alongside time-fake-clock.mjs, after schema integration. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mount, validateDocument, compileHtml } from '../dist/index.js';
import { fakeClock } from './time-fake-clock.mjs';
const document = body => ({ version: 'iui/1', state: { tick: 0 }, body: Array.isArray(body) ? body : [body] });
const valid = [{ type: 'clock', timezone: 'UTC', mode: 'snapshot', at: '2026-10-09T23:59:59Z' }, { type: 'stopwatch', elapsedMs: 500 }, { type: 'timer', durationMs: 1250 }];
function setup(nodes = valid, language = 'en') {
  const dom = new JSDOM(`<!doctype html><html lang="en"><body><section lang="${language}"><div id="host"></div></section></body></html>`, { runScripts: 'outside-only', url: 'https://example.org/' });
  const host = dom.window.document.getElementById('host'), clock = fakeClock(dom.window), controller = mount(host, document(nodes));
  return { dom, host, clock, controller, action: (root, name) => root.querySelector(`[data-time-action="${name}"]`) };
}

test('time public validation enforces strict fields, bounds, valid dates and zone/mode exclusivity', () => {
  assert.equal(validateDocument(document(valid)).ok, true);
  const bad = [
    { type: 'clock', timezone: 'UTC', mode: 'snapshot' },
    { type: 'clock', timezone: 'UTC', mode: 'live', at: '2026-10-09T00:00:00Z' },
    { type: 'clock', timezone: 'Not/A_Zone', mode: 'live' },
    ...['2026-02-30T00:00:00Z', '2026-10-09T00:00:00', 'not-a-date'].map(at => ({ ...valid[0], at })),
    { ...valid[0], hourCycle: 'h24' }, { ...valid[0], title: '' }, { ...valid[0], extra: true },
    ...[-1, .5, 604800001].map(elapsedMs => ({ type: 'stopwatch', elapsedMs })),
    ...[0, -1, .5, 604800001].map(durationMs => ({ type: 'timer', durationMs })),
  ];
  for (const node of bad) assert.equal(validateDocument(document(node)).ok, false, JSON.stringify(node));
});
test('actual public mount keeps local timing/laps/focus through setState and rejects invalid update atomically', () => {
  const s = setup(), root = s.host.querySelector('[data-kind=stopwatch]'), start = s.action(root, 'start'), lap = s.action(root, 'lap');
  start.click(); s.clock.advance(100); lap.click(); lap.focus();
  s.controller.setState({ tick: 1 }); assert.equal(s.dom.window.document.activeElement, lap); assert.equal(s.host.querySelector('[data-kind=stopwatch]'), root);
  assert.equal(root.querySelectorAll('tbody tr').length, 1);
  assert.throws(() => s.controller.update(document({ type: 'timer', durationMs: 0 })));
  assert.equal(s.host.querySelector('[data-kind=stopwatch]'), root); assert.equal(root.querySelectorAll('tbody tr').length, 1); assert.equal(s.clock.pending, 1);
  s.clock.advance(100); s.action(root, 'pause').click(); assert.equal(root.querySelector('time').dataset.milliseconds, '700');
  s.controller.dispose(); assert.equal(s.clock.pending, 0);
});
test('public update cancels old running sessions and retained controls cannot affect new sessions', () => {
  const s = setup(), previous = s.host.querySelector('[data-kind=stopwatch]'); s.action(previous, 'start').click();
  const oldTime = previous.querySelector('time'); s.clock.advance(100); const before = oldTime.textContent;
  s.controller.update(document({ type: 'timer', durationMs: 10 })); assert.equal(s.clock.pending, 0);
  s.action(previous, 'start').click(); s.action(previous, 'reset').click(); s.clock.advance(1000);
  assert.equal(oldTime.textContent, before); assert.equal(s.clock.pending, 0);
  const current = s.host.querySelector('[data-kind=timer]'); assert.equal(current.querySelector('time').textContent, '00:00:00.01');
  s.action(current, 'start').click(); s.clock.advance(10); assert.equal(current.dataset.status, 'complete');
  s.controller.dispose(); assert.equal(s.host.children.length, 0); assert.equal(s.clock.pending, 0);
});
test('nearest host language translates time controls and titles remain inert', () => {
  const s = setup({ type: 'timer', durationMs: 1, title: '<img src=x onerror=alert(1)>' }, 'zh-CN');
  assert.equal(s.host.querySelector('img'), null); assert.match(s.host.textContent, /<img/); assert.match(s.host.textContent, /开始/);
  const root = s.host.querySelector('[data-kind=timer]'); s.action(root, 'start').click(); s.clock.advance(1);
  assert.equal(root.querySelector('[role=status]').textContent, '倒计时结束。'); s.controller.dispose();
});
test('time compilation remains deterministic with live clocks and stays offline', async () => {
  const input = document([...valid, { type: 'clock', mode: 'live', timezone: 'UTC' }]);
  const one = await compileHtml(input), two = await compileHtml(input); assert.equal(one, two);
  assert.doesNotMatch(one, /<script[^>]+src="https?:/); assert.match(one, /iui-time/);
});

test('time internal label ids cannot collide with caller-supplied node ids', () => {
  const s = setup([{ type: 'timer', id: 'time-1-title', durationMs: 1 }, { type: 'stopwatch', id: 'time-1-note' }]);
  const ids = [...s.host.querySelectorAll('[id]')].map(node => node.id); assert.equal(ids.length, new Set(ids).size);
  for (const root of s.host.querySelectorAll('.iui-time')) {
    const heading = root.querySelector('h2'), note = root.querySelector('.iui-time-note');
    assert.ok(heading.id.startsWith('iui-time-internal-')); assert.equal(root.getAttribute('aria-labelledby'), heading.id);
    assert.equal(root.getAttribute('aria-describedby'), note.id); assert.equal(s.dom.window.document.getElementById(heading.id), heading);
  }
  s.controller.dispose();
});
