import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { mount } from '../dist/v2/core-node.mjs';

test('the current README DSL example renders and updates its local reading goal', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const source = readme.split('```text\n')[1]?.split('```')[0];
  assert.ok(source, 'README must include a complete DSL example');
  const dom = new JSDOM('<!doctype html><main></main>', { pretendToBeVisual: true });
  const errors = [];
  const view = mount(dom.window.document.querySelector('main'), {
    source,
    onError: issues => errors.push(...issues),
  });
  try {
    assert.deepEqual(errors, []);
    assert.equal(view.element.dataset.phase, 'ready');
    assert.match(view.element.textContent, /今日目标：20 页/);
    const slider = view.element.querySelector('input[type="range"]');
    assert.ok(slider);
    slider.value = '40';
    slider.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    assert.equal(view.getSnapshot().state.$pages, 40);
    assert.match(view.element.textContent, /今日目标：40 页/);
    assert.deepEqual(errors, []);
  } finally {
    view.dispose();
    dom.window.close();
  }
});
