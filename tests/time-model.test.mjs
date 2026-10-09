import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
const source = await readFile(new URL('../src/renderer/time-model.ts', import.meta.url), 'utf8');
const built = await transform(source, { loader: 'ts', format: 'esm', target: 'es2022' });
const { DurationSession, MAX_DURATION_MS, MAX_LAPS, durationParts, durationISO, formatDuration } = await import(`data:text/javascript;base64,${Buffer.from(built.code).toString('base64')}`);

test('duration display covers rollover, large hours and positive countdown rounding', () => {
  assert.equal(formatDuration(0), '00:00:00.00');
  assert.equal(formatDuration(9.99), '00:00:00.00');
  assert.equal(formatDuration(0.01, true), '00:00:00.01');
  assert.equal(formatDuration(999.1, true), '00:00:01.00');
  assert.equal(formatDuration(59999.99), '00:00:59.99');
  assert.equal(formatDuration(59999.99, true), '00:01:00.00');
  assert.equal(formatDuration(3_600_000), '01:00:00.00');
  assert.equal(formatDuration(MAX_DURATION_MS), '168:00:00.00');
  assert.equal(formatDuration(MAX_DURATION_MS + 1), '168:00:00.00');
  assert.equal(formatDuration(-1), '00:00:00.00');
  assert.deepEqual(durationParts(3_661_234), { hours: 1, minutes: 1, seconds: 1, hundredths: 23 });
  assert.equal(durationISO(1234.5), 'PT1.2345S');
});
test('stopwatch starts paused; start/pause/repeated input/resume/reset use exact baselines', () => {
  const s = new DurationSession('stopwatch', 5000);
  assert.equal(s.sample(1000), 5000); assert.equal(s.status, 'ready');
  assert.equal(s.start(1000), true); assert.equal(s.start(4000), false);
  assert.equal(s.sample(4200.5), 8200.5);
  assert.equal(s.pause(4210), true); assert.equal(s.pause(5000), false);
  assert.equal(s.sample(99999), 8210); assert.equal(s.status, 'paused');
  s.start(100000); assert.equal(s.sample(100099), 8309);
  s.reset(); assert.equal(s.status, 'ready'); assert.equal(s.sample(200000), 5000);
});
test('laps are exact, exclude supplied initial elapsed from the first split, and stop at cap', () => {
  const s = new DurationSession('stopwatch', 2000);
  assert.equal(s.lap(1), null); s.start(100);
  assert.deepEqual(s.lap(350.25), { totalMs: 2250.25, splitMs: 250.25 });
  assert.deepEqual(s.lap(600.5), { totalMs: 2500.5, splitMs: 250.25 });
  for (let i = 2; i < MAX_LAPS; i++) assert.ok(s.lap(1000 + i));
  assert.equal(s.laps.length, 100); assert.equal(s.lap(5000), null);
  assert.equal(s.laps[0].totalMs, 2250.25);
  s.reset(); assert.equal(s.laps.length, 0); s.start(10000); assert.equal(s.lap(10002).splitMs, 2);
});
test('stopwatch catches delayed callback and stops at maximum, including supplied maximum', () => {
  const s = new DurationSession('stopwatch', MAX_DURATION_MS - 1); s.start(0);
  assert.equal(s.sample(10_000), MAX_DURATION_MS); assert.equal(s.status, 'limit');
  assert.equal(s.start(10_001), false); assert.equal(s.lap(10002), null);
  const full = new DurationSession('stopwatch', MAX_DURATION_MS); assert.equal(full.status, 'limit'); assert.equal(full.start(1), false);
});
test('timer handles one millisecond, exact boundary, long delay, restart and pause near zero', () => {
  const s = new DurationSession('timer', 1); assert.equal(s.sample(999), 1);
  s.start(1000); assert.equal(s.sample(1000.999), 0.0009999999999763531); assert.equal(s.status, 'running');
  assert.equal(s.sample(1001), 0); assert.equal(s.status, 'complete'); assert.equal(s.start(2000), false);
  assert.equal(s.sample(1e9), 0); s.reset(); s.start(2e9); assert.equal(s.sample(3e9), 0);
  s.reset(); s.start(0); s.pause(.75); assert.equal(s.sample(500), .25); s.start(1000);
  assert.equal(s.sample(1000.25), 0); assert.equal(s.status, 'complete');
});
test('timer lap is unsupported; invalid initial durations are rejected', () => {
  const s = new DurationSession('timer', 500); s.start(0); assert.equal(s.lap(100), null);
  for (const value of [0, -1, 1.5, Infinity, NaN, MAX_DURATION_MS + 1]) assert.throws(() => new DurationSession('timer', value), RangeError);
  for (const value of [-1, .5, Infinity, NaN, MAX_DURATION_MS + 1]) assert.throws(() => new DurationSession('stopwatch', value), RangeError);
});
