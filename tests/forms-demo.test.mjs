import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createFormsDemoActions } from '../examples/forms/actions.mjs';
import { validateDocument } from '../dist/index.js';

test('all original state documents validate against the frozen contract', async () => {
  const states = JSON.parse(await readFile(new URL('../examples/forms/states.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(states), ['ready','empty','loading','error']);
  for (const [state, document] of Object.entries(states)) assert.equal(validateDocument(document).ok, true, state);
});

test('offline pending action completes explicitly and cancels without leaked listeners', async () => {
  const demo = createFormsDemoActions(), controller = new AbortController();
  const pending = demo.actions['demo.pending']({ values: Object.freeze({ amount: 42 }), signal: controller.signal });
  assert.equal(demo.pendingCount, 1);
  demo.completePending(); await pending;
  assert.equal(demo.pendingCount, 0);
  controller.abort(); assert.equal(demo.pendingCount, 0);
  const second = new AbortController();
  const cancelled = demo.actions['demo.pending']({ values: {}, signal: second.signal });
  const rejected = assert.rejects(cancelled, { name: 'AbortError' });
  second.abort(); await rejected;
  assert.equal(demo.pendingCount, 0);
  const aborted = new AbortController(); aborted.abort();
  await assert.rejects(demo.actions['demo.pending']({ values: {}, signal: aborted.signal }), { name: 'AbortError' });
  assert.equal(demo.pendingCount, 0);
});

test('offline error action rejects once, then allows a real retry', async () => {
  const demo = createFormsDemoActions();
  const context = { values: {}, signal: new AbortController().signal };
  await assert.rejects(demo.actions['demo.failOnce'](context), /Synthetic/);
  assert.equal(demo.actions['demo.failOnce'](context), undefined);
});
