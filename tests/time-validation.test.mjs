import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDocument } from '../dist/index.js';
const document = (...body) => ({ version: 'iui/1', body });
const clock = extra => ({ type: 'clock', mode: 'snapshot', timezone: 'America/New_York', at: '2026-03-08T06:59:59Z', ...extra });
const rejected = (node, code) => {
  const result = validateDocument(document(node)); assert.equal(result.ok, false, JSON.stringify(node));
  assert.ok(result.issues.some(issue => issue.code === code), JSON.stringify(result.issues));
};
test('time schema accepts explicit live/snapshot clocks and bounded local duration controls', () => {
  for (const node of [clock({}), clock({ at: '2024-02-29T20:30:00.123+05:30' }), { type: 'clock', mode: 'live', timezone: 'UTC', seconds: false, hourCycle: 'h12' }, { type: 'stopwatch' }, { type: 'stopwatch', elapsedMs: 604800000, laps: false }, { type: 'timer', durationMs: 1 }, { type: 'timer', durationMs: 604800000 }]) assert.equal(validateDocument(document(node)).ok, true, JSON.stringify(node));
});
test('clock requires an explicit mode, snapshot instant and timezone without implicit current-time fallback', () => {
  for (const node of [
    { type: 'clock', timezone: 'UTC' }, { type: 'clock', mode: 'snapshot', timezone: 'UTC' },
    clock({ mode: 'live' }), clock({ mode: 'unknown' }), clock({ timezone: '' }), clock({ hourCycle: 'h24' }),
    clock({ at: '2026-10-09T12:00:00' }), clock({ at: '2026-10-09' }), clock({ at: 0 }),
    { type: 'timer', durationMs: 1000, onComplete: 'alert(1)' }, { type: 'stopwatch', autoStart: true }
  ]) rejected(node, 'SCHEMA');
  rejected(clock({ timezone: 'Not/A_Zone' }), 'TIMEZONE');
});
test('clock calendar and civil-time fields reject overflow rather than normalizing it', () => {
  for (const at of ['2026-02-29T00:00:00Z', '2026-02-30T00:00:00Z', '2026-04-31T00:00:00Z', '2026-10-09T24:00:00Z', '2026-10-09T12:60:00Z', '2026-10-09T12:00:60Z', '2026-10-09T12:00:00+24:00', '2026-10-09T12:00:00+00:60']) rejected(clock({ at }), 'TIME_DATE');
});
test('durations are integer milliseconds with explicit positive timer and seven-day upper bounds', () => {
  for (const durationMs of [0, -1, .5, 604800001, '1000']) rejected({ type: 'timer', durationMs }, 'SCHEMA');
  for (const elapsedMs of [-1, .5, 604800001, '0']) rejected({ type: 'stopwatch', elapsedMs }, 'SCHEMA');
  rejected({ type: 'timer' }, 'SCHEMA');
  rejected({ type: 'stopwatch', laps: 'true' }, 'SCHEMA');
  rejected({ type: 'timer', durationMs: Infinity }, 'NON_FINITE');
});
