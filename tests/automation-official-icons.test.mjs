import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {plan, setup, tick} from './automation-icons-harness.mjs';

test('automation step markers show supplied status and are not selectable inputs', () => {
  const s = setup(plan({completedExpanded: true}));
  try {
    const rows = [...s.root.querySelectorAll('.iui-automation-step')];
    assert.equal(rows.length, 4);
    for (const row of rows) {
      const marker = row.querySelector('.iui-automation-marker'), text = row.querySelector('.iui-automation-step-status');
      const labels = {completed: 'Completed', in_progress: 'In progress', pending: 'Pending'};
      assert.equal(marker.getAttribute('role'), 'img');
      assert.equal(marker.getAttribute('aria-label'), labels[row.dataset.status]);
      assert.equal(text.textContent, labels[row.dataset.status]);
      assert.equal(text.getAttribute('aria-hidden'), 'true');
      assert.equal(marker.hasAttribute('tabindex'), false);
      assert.equal(marker.hasAttribute('aria-checked'), false);
      assert.equal(marker.querySelector('input,button,[role=radio],[role=checkbox]'), null);
      assert.equal(marker.textContent, '');
      if (row.dataset.status === 'in_progress') assert.ok(marker.querySelector('.iui-automation-status-spinner'));
      else assert.equal(marker.querySelector('svg').dataset.iuiIcon, row.dataset.status === 'completed' ? 'CheckCircleFilled' : 'EmptyCircle');
      for (const icon of marker.querySelectorAll('svg')) {
        assert.equal(icon.getAttribute('aria-hidden'), 'true');
        assert.equal(icon.getAttribute('focusable'), 'false');
        assert.equal(icon.getAttribute('viewBox'), '0 0 24 24');
      }
    }
  } finally {s.close();}
});

test('clicking or pressing Space on a read-only marker never changes a step or emits an action', () => {
  const value = plan(), original = structuredClone(value), s = setup(value), events = [];
  try {
    s.host.addEventListener('iui:automation-toggle', event => events.push(event));
    s.host.addEventListener('iui:automation-open', event => events.push(event));
    const before = s.root.innerHTML;
    for (const marker of s.root.querySelectorAll('.iui-automation-marker')) {
      marker.click();
      marker.dispatchEvent(new s.win.KeyboardEvent('keydown', {key: ' ', bubbles: true, cancelable: true}));
      marker.dispatchEvent(new s.win.KeyboardEvent('keyup', {key: ' ', bubbles: true, cancelable: true}));
    }
    assert.deepEqual(value, original);
    assert.deepEqual(events, []);
    assert.equal(s.root.innerHTML, before);
    assert.equal(s.root.querySelector('input,[role=radio],[role=checkbox]'), null);
  } finally {s.close();}
});

test('the two real disclosure controls still operate, honor cancellation and reset', async () => {
  const s = setup();
  try {
    const completed = s.root.querySelector('.iui-automation-completed'), toggle = s.root.querySelector('.iui-automation-plan-toggle'), body = s.root.querySelector('.iui-automation-plan-body');
    const changes = [];
    s.host.addEventListener('iui:automation-toggle', event => {assert.ok(Object.isFrozen(event.detail)); changes.push(event.detail);});
    assert.equal(s.root.querySelectorAll('button').length, 2);
    assert.equal(completed.getAttribute('aria-expanded'), 'false');
    completed.click();
    assert.equal(completed.getAttribute('aria-expanded'), 'true');
    assert.equal(s.root.querySelectorAll('.iui-automation-step:not([hidden])').length, 4);
    s.host.addEventListener('iui:automation-toggle', event => event.preventDefault(), {once: true});
    toggle.click(); assert.equal(body.hidden, false);
    toggle.click(); assert.equal(body.hidden, true);
    s.form.reset(); await tick();
    assert.equal(body.hidden, false);
    assert.equal(completed.getAttribute('aria-expanded'), 'false');
    assert.deepEqual(changes.map(({section}) => section), ['completed', 'plan', 'plan']);
    assert.equal(s.root.querySelector('[data-status=in_progress]').dataset.status, 'in_progress');
  } finally {s.close();}
});

test('language learning keeps unfinished step numbers and library order', () => {
  const s = setup(plan({layout: 'library', planType: 'language_learning'}));
  try {
    const markers = [...s.root.querySelectorAll('.iui-automation-marker')];
    assert.equal(markers.length, 4);
    assert.equal(markers[0].querySelector('svg').dataset.iuiIcon, 'CheckCircleFilled');
    assert.equal(markers[2].textContent, '3');
    assert.equal(markers[3].textContent, '4');
    assert.equal(s.root.querySelector('.iui-automation-status-spinner'), null);
    assert.equal(s.root.querySelector('.iui-automation-plan-toggle'), null);
    assert.equal(s.root.querySelector('.iui-automation-completed'), null);
  } finally {s.close();}
});

test('replacement and disablement preserve existing ownership and action gates', () => {
  const s = setup();
  try {
    let calls = 0; s.host.addEventListener('iui:automation-toggle', () => calls++);
    const old = s.root.querySelector('.iui-automation-completed');
    s.update(plan({disabled: true, title: 'Replacement'}));
    old.click(); s.root.querySelector('.iui-automation-completed').click();
    assert.equal(calls, 0);
    assert.equal(s.root.querySelector('.iui-automation-completed').getAttribute('aria-expanded'), 'false');
    assert.equal(s.root.querySelector('.iui-automation-plan-title').textContent, 'Replacement');
    s.dispose(); old.click(); assert.equal(calls, 0);
  } finally {s.close();}
});

test('status layout has explicit glyph alignment, a finite terminal row and noninteractive styling', async () => {
  const css = await readFile(new URL('../src/renderer/automation.css', import.meta.url), 'utf8');
  const license = await readFile(new URL('../src/renderer/icons/openai-apps-sdk-ui/LICENSE', import.meta.url), 'utf8');
  assert.ok(css.includes(license), 'standalone CSS must also retain the full upstream MIT notice');
  assert.match(css, /mask-image:conic-gradient\(rgb\(0 0 0 \/ 0%\),rgb\(0 0 0\)\)/);
  assert.match(css, /var\(--indicator-rotate-duration,\.8s\) linear infinite/);
  assert.match(css, /\.iui-automation-step\[data-last=true\]\s*\{[^}]*min-height:\s*20px/);
  assert.match(css, /\.iui-automation-marker\s*\{[^}]*width:\s*28px/);
  assert.match(css, /\.iui-automation-marker-glyph\s*\{[^}]*height:\s*20px/);
  assert.match(css, /\.iui-automation-step\[data-status=in_progress\] \.iui-automation-marker-glyph\s*\{[^}]*height:\s*28px/);
  assert.match(css, /\.iui-automation-marker-connector\s*\{[^}]*width:\s*1px/);
  assert.match(css, /\.iui-automation-marker-glyph > svg\s*\{[^}]*display:\s*block/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.iui-automation-status-spinner\s*\{[^}]*animation:\s*none/);
  assert.doesNotMatch(css, /\.iui-automation-marker[^{}]*\{[^}]*(?:cursor:\s*pointer|appearance:\s*auto)/);
  const s = setup();
  try {
    const rows = [...s.root.querySelectorAll('.iui-automation-step')];
    assert.equal(rows.filter(row => row.dataset.last === 'true').length, 1);
    assert.equal(rows.at(-1).dataset.status, 'pending');
    assert.equal(rows.at(-1).querySelector('.iui-automation-marker-connector'), null);
  } finally {s.close();}
});
