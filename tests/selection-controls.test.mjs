import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
import {JSDOM} from 'jsdom';
import {mount, validateDocument} from '../dist/index.js';
import {selectionControlsDocument} from './selection-controls-fixture.mjs';

const css = await readFile(new URL('../src/renderer/selection-controls.css', import.meta.url), 'utf8');
test('shared selection layer is valid offline CSS and excludes separate native presentations', async () => {
  const compiled = await transform(css, {loader: 'css', minify: true, logLevel: 'silent'});
  assert.deepEqual(compiled.warnings, []);
  assert.match(css, /--iui-control-height: 44px/);
  assert.match(css, /--iui-choice-size: 18px/);
  assert.match(css, /--iui-choice-gap: 8px/);
  assert.match(css, /:not\(:where\(\.iui-segmented input, \.iui-rating input\)\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /appearance: auto/);
  assert.doesNotMatch(css, /url\(|@import|content:\s*['"][^'"]+/);
  assert.doesNotMatch(css, /iui-automation|iui-plan-|slider-runnable-track|slider-thumb/);
});

test('original fixture retains real fields, accessible labels and independent business inputs', () => {
  const input = selectionControlsDocument();
  const validation = validateDocument(input);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));
  const dom = new JSDOM('<main></main>');
  const host = dom.window.document.querySelector('main');
  const controller = mount(host, input);
  try {
    const radios = [...host.querySelectorAll('.iui-choices:not(.iui-segmented) input')];
    assert.equal(radios.length, 3);
    assert.ok(radios.every(el => el.type === 'radio' && el.labels.length === 1));
    assert.equal(radios[0].checked, true);
    radios[1].click();
    assert.equal(radios[1].checked, true);
    assert.equal(radios[0].checked, false);
    assert.equal(radios[2].disabled, true);
    const checkbox = host.querySelector('input[data-bind="accepted"]');
    assert.equal(checkbox.type, 'checkbox');
    checkbox.labels[0].click();
    assert.equal(checkbox.checked, true);
    controller.setState({locked: true});
    assert.equal(host.querySelector('input[data-bind="frozen"]').matches(':disabled'), true);
    const controls = [...host.querySelectorAll('.iui-rox input,.iui-rox select')];
    assert.equal(controls.length, 8);
    assert.ok(controls.every(el => el.labels.length === 1));
    assert.ok(controls.filter(el => el.tagName === 'INPUT').every(el => el.type === 'text' && el.inputMode === 'decimal'));
    assert.equal(host.querySelector('[data-value="rox"]').textContent, '9.5');
    assert.ok(host.querySelector('.iui-gcs input[type=radio]'));
    assert.ok(host.querySelector('.iui-onboarding input'));
    assert.equal(host.querySelectorAll('.iui-segmented input[type=radio]').length, 2);
    assert.equal(host.querySelectorAll('.iui-rating input[type=radio]').length, 5);
    assert.equal(host.querySelector('.iui-slider input').type, 'range');
  } finally {
    controller.dispose();
    assert.equal(host.childElementCount, 0);
    dom.window.close();
  }
});
