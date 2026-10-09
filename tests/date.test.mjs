import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import { JSDOM } from 'jsdom';
import { mount, validateDocument, compileHtml } from '../dist/index.js';

const date = (bind = 'day', extra = {}) => ({ type: 'input', kind: 'date', label: 'Practice date', bind, ...extra });
const spec = (extra = {}, state = { day: '2024-02-29', other: 0 }, children = [date('day', extra)]) => ({ version: 'iui/1', state, body: [{ type: 'form', label: 'Date practice', action: 'save', children }] });
function setup(s = spec(), options = {}, lang = 'en') {
  const dom = new JSDOM(`<html lang="${lang}"><body><div id="host"></div></body></html>`);
  const host = dom.window.document.getElementById('host'), controller = mount(host, s, options);
  return { dom, host, controller, input: host.querySelector('input'), form: host.querySelector('form') };
}
const dispatch = (x, target, type) => target.dispatchEvent(new x.dom.window.Event(type, { bubbles: true, cancelable: true }));
const fill = (x, value, input = x.input) => { input.value = value; dispatch(x, input, 'input'); };
const submit = x => dispatch(x, x.form, 'submit');
const error = x => x.host.querySelector('.iui-field-error').textContent;
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

test('date full and Forms subset schemas strictly separate date-only from text/numeric props', async () => {
  for (const path of ['../src/schema/iui.schema.json', '../src/schema/fragments/forms.schema.json']) {
    const schema = JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
    const validate = new Ajv({ strict: true, allErrors: true }).compile(schema);
    assert.equal(validate(spec({ minDate: '0001-01-01', maxDate: '9999-12-31' })), true);
    for (const [key, value] of Object.entries({ placeholder: '', min: 0, max: 1, step: 1, minLength: 0, maxLength: 1 })) {
      const input = spec({ [key]: value }); assert.equal(validate(input), false, key); assert.equal(validateDocument(input).ok, false, key);
    }
    for (const kind of ['text', 'number', 'email', 'checkbox']) for (const bound of ['minDate', 'maxDate']) {
      assert.equal(validate(spec({ kind, [bound]: '2024-01-01' })), false, `${kind}/${bound}`);
    }
    for (const value of ['0000-01-01', '10000-01-01', '2024-1-01', '2024-01-1', '2024-13-01', '2024-01-32', '2024-01-01T00:00:00Z', 0]) {
      assert.equal(validate(spec({ minDate: value })), false, String(value));
    }
  }
});

test('public validation enforces real Gregorian dates including leap centuries and endpoints', () => {
  for (const value of ['', '0001-01-01', '0099-12-31', '1900-02-28', '2000-02-29', '2024-02-29', '9999-12-31']) {
    assert.equal(validateDocument(spec({}, { day: value })).ok, true, value);
  }
  for (const value of ['0000-01-01', '1900-02-29', '2001-02-29', '2024-02-30', '2024-04-31', '2024-00-01', '2024-01-00', '2024-01-01\n', ' 2024-01-01', '2024-01-01T00:00:00Z', '10000-01-01', 0, true, null, [], {}]) {
    assert.equal(validateDocument(spec({}, { day: value })).ok, false, JSON.stringify(value));
  }
});

test('bounds are real, literal and ordered; required and out-of-range initial values remain host-authoritative', () => {
  for (const extra of [{ minDate: '1900-02-29' }, { maxDate: '2024-02-30' }, { minDate: '2024-03-01', maxDate: '2024-02-29' }, { minDate: { $: 'day' } }]) assert.equal(validateDocument(spec(extra)).ok, false);
  for (const day of ['', '2023-12-31', '2025-01-01']) assert.equal(validateDocument(spec({ minDate: '2024-01-01', maxDate: '2024-12-31', required: true }, { day })).ok, true);
  assert.equal(validateDocument(spec({ minDate: '2024-02-29', maxDate: '2024-02-29' })).ok, true);
});

test('invalid initial data rejects before mounting or mutating an existing host', () => {
  const dom = new JSDOM('<div id="host"><p>Keep this</p></div>'), host = dom.window.document.getElementById('host');
  assert.throws(() => mount(host, spec({}, { day: '2024-02-30' })));
  assert.equal(host.innerHTML, '<p>Keep this</p>');
});

test('native ISO values and labels, hints, required and date attributes use the shared Forms API', () => {
  const x = setup(spec({ minDate: '2024-01-01', maxDate: '2024-12-31', required: true, hint: 'Local date-only example' }));
  assert.equal(x.input.type, 'date'); assert.equal(x.input.value, '2024-02-29'); assert.equal(typeof x.controller.getState().day, 'string');
  assert.equal(x.input.min, '2024-01-01'); assert.equal(x.input.max, '2024-12-31'); assert.equal(x.input.hasAttribute('step'), false);
  assert.equal(x.input.required, true); assert.equal(x.input.getAttribute('aria-required'), 'true');
  assert.equal(x.host.querySelector('label').htmlFor, x.input.id);
  for (const id of x.input.getAttribute('aria-describedby').split(' ')) assert.ok(x.dom.window.document.getElementById(id));
  assert.equal(error(x), ''); x.controller.dispose();
});

test('optional blank is accepted and submitted as an empty string, including initial blank', async () => {
  for (const initial of ['2024-02-29', '']) {
    let values; const x = setup(spec({}, { day: initial }), { actions: { save: args => { values = args.values; } } });
    fill(x, ''); assert.equal(x.controller.getState().day, ''); submit(x); await settle();
    assert.deepEqual(values, { day: '' }); assert.equal(x.form.dataset.status, 'success'); assert.equal(error(x), ''); x.controller.dispose();
  }
});

test('required blank is a draft, stays quiet until blur, blocks stale submission and focuses the field', () => {
  let calls = 0; const x = setup(spec({ required: true }), { actions: { save: () => { calls++; } } });
  fill(x, ''); assert.equal(x.controller.getState().day, '2024-02-29'); assert.equal(error(x), '');
  dispatch(x, x.input, 'blur'); assert.match(error(x), /required/); submit(x);
  assert.equal(x.form.dataset.status, 'invalid'); assert.equal(x.dom.window.document.activeElement, x.input); assert.equal(calls, 0);
  fill(x, '2024-03-01'); assert.equal(x.controller.getState().day, '2024-03-01'); assert.equal(error(x), ''); x.controller.dispose();
});

test('native badInput empty draft never becomes an accepted optional blank', () => {
  const x = setup(); x.input.value = '';
  Object.defineProperty(x.input, 'validity', { configurable: true, value: { badInput: true } });
  dispatch(x, x.input, 'input'); assert.equal(x.controller.getState().day, '2024-02-29'); assert.equal(error(x), '');
  dispatch(x, x.input, 'blur'); assert.equal(error(x), 'Enter a valid date.'); submit(x); assert.equal(x.form.dataset.status, 'invalid');
  delete x.input.validity; fill(x, ''); assert.equal(x.controller.getState().day, ''); assert.equal(error(x), ''); x.controller.dispose();
});

test('unsanitized impossible browser draft and native normalized invalid programmatic values are distinct', () => {
  const x = setup({ ...spec({ required: true }) });
  x.input.value = '2024-02-30'; assert.equal(x.input.value, '', 'native assignment sanitizes impossible dates');
  dispatch(x, x.input, 'input'); assert.equal(x.controller.getState().day, '2024-02-29');
  // JSDOM cannot type partially complete calendar segments. Emulate a raw invalid draft only for the guard.
  Object.defineProperty(x.input, 'value', { configurable: true, value: '2024-02-30' });
  dispatch(x, x.input, 'input'); dispatch(x, x.input, 'blur'); assert.equal(error(x), 'Enter a valid date.');
  assert.equal(x.controller.getState().day, '2024-02-29'); delete x.input.value;
  x.controller.setState({ day: '2024-02-29' }); assert.equal(x.input.value, '2024-02-29'); assert.equal(error(x), ''); x.controller.dispose();
});

test('min/max are inclusive and rejected drafts preserve derived and unrelated state', async () => {
  let values; const s = spec({ minDate: '2024-02-01', maxDate: '2024-03-31' });
  s.computed = { leapDay: { op: 'eq', args: [{ $: 'day' }, '2024-02-29'] } }; s.body[0].children.push({ type: 'text', value: { $: 'leapDay' } });
  const x = setup(s, { actions: { save: args => { values = args.values; } } });
  for (const [raw, message] of [['2024-01-31', /earliest/], ['2024-04-01', /latest/]]) {
    fill(x, raw); x.controller.setState({ other: x.controller.getState().other + 1 });
    assert.equal(x.input.value, raw); assert.equal(x.controller.getState().day, '2024-02-29'); assert.equal(x.host.querySelector('.iui-text').textContent, 'true');
    submit(x); assert.match(error(x), message); assert.equal(values, undefined);
  }
  for (const raw of ['2024-02-01', '2024-03-31']) { fill(x, raw); submit(x); await settle(); assert.deepEqual(values, { day: raw }); assert.equal(error(x), ''); }
  x.controller.dispose();
});

test('host accepts valid outside-range/empty strings, rejects malformed patches atomically before DOM mutation', () => {
  const x = setup(spec({ required: true, minDate: '2024-01-01', maxDate: '2024-12-31' }));
  for (const day of ['2023-12-31', '2025-01-01', '']) { x.controller.setState({ day }); assert.equal(x.input.value, day); submit(x); assert.equal(x.form.dataset.status, 'invalid'); }
  x.controller.setState({ day: '2024-02-29' }); fill(x, '2025-01-01'); dispatch(x, x.input, 'blur');
  const before = x.host.innerHTML;
  for (const day of ['1900-02-29', '0000-01-01', '2024-02-30', 1, true]) {
    assert.throws(() => x.controller.setState({ day, other: 7 })); assert.deepEqual(x.controller.getState(), { day: '2024-02-29', other: 0 }); assert.equal(x.host.innerHTML, before); assert.equal(x.input.value, '2025-01-01');
  }
  x.controller.dispose();
});

test('same-value host and button overwrites clear only targeted drafts and preserve identity/focus', () => {
  const s = spec({}, { day: '2024-02-29', second: '2024-03-01', other: 0 }, [date('day', { maxDate: '2024-12-31' }), date('second', { maxDate: '2024-12-31' }), { type: 'button', label: 'Set date', action: { kind: 'set', bind: 'day', value: '2024-02-29' } }]);
  const x = setup(s), second = x.host.querySelector('[data-bind=second]');
  for (const overwrite of [() => x.controller.setState({ day: '2024-02-29' }), () => [...x.host.querySelectorAll('button')].find(b => b.textContent === 'Set date').click()]) {
    fill(x, '2025-01-01'); fill(x, '2025-02-01', second); dispatch(x, x.input, 'blur'); x.input.focus(); overwrite();
    assert.equal(x.input.value, '2024-02-29'); assert.equal(second.value, '2025-02-01'); assert.equal(error(x), ''); assert.equal(x.host.querySelector('input'), x.input); assert.equal(x.dom.window.document.activeElement, x.input);
  }
  x.controller.dispose();
});

test('globally rejected date-derived change preserves atomic shared state and leaves an explicit draft error', () => {
  const s = spec(); s.body.push({ type: 'loading', label: 'Derived progress', progress: { op: 'if', args: [{ op: 'eq', args: [{ $: 'day' }, '2024-03-01'] }, 101, 0] } });
  const x = setup(s); x.input.focus(); fill(x, '2024-03-01'); dispatch(x, x.input, 'blur');
  assert.deepEqual(x.controller.getState(), { day: '2024-02-29', other: 0 }); assert.equal(x.input.value, '2024-03-01'); assert.notEqual(error(x), ''); assert.equal(x.dom.window.document.activeElement, x.input);
  submit(x); assert.equal(x.form.dataset.status, 'invalid'); x.controller.setState({ day: '2024-02-29' }); assert.equal(x.input.value, '2024-02-29'); assert.equal(error(x), '');
  const before = x.host.innerHTML; assert.throws(() => x.controller.setState({ day: '2024-03-01', other: 4 })); assert.equal(x.host.innerHTML, before); assert.deepEqual(x.controller.getState(), { day: '2024-02-29', other: 0 }); x.controller.dispose();
});

test('form reset, cancel, document reset and update use the existing shared lifecycle', () => {
  const s = spec({ required: true }); s.body.push({ type: 'button', label: 'Reset document', action: { kind: 'reset' } });
  const x = setup(s);
  for (const reset of [() => x.form.reset(), () => x.host.querySelector('button[type=button]').click(), () => [...x.host.querySelectorAll('button')].find(b => b.textContent === 'Reset document').click()]) {
    fill(x, '2024-03-01'); fill(x, ''); dispatch(x, x.input, 'blur'); reset(); assert.equal(x.input.value, '2024-02-29'); assert.equal(error(x), '');
  }
  const oldInput = x.input; x.controller.update(s); fill(x, '2024-04-01', oldInput); assert.equal(x.controller.getState().day, '2024-02-29');
  assert.throws(() => x.controller.update(spec({}, { day: '0000-01-01' }))); assert.equal(x.host.querySelector('input').value, '2024-02-29'); x.controller.dispose();
});

test('disabled fieldsets ignore forged edits, exclude values and resume validation when enabled', async () => {
  let values; const s = spec({}, { day: '', locked: true }, [{ type: 'field', label: 'Details', disabled: { $: 'locked' }, children: [date('day', { required: true })] }]);
  const x = setup(s, { actions: { save: args => { values = args.values; } } });
  assert.equal(x.input.matches(':disabled'), true); fill(x, '2024-02-29'); assert.equal(x.input.value, ''); assert.equal(x.controller.getState().day, ''); submit(x); await settle(); assert.deepEqual(values, {});
  x.controller.setState({ locked: false }); submit(x); assert.equal(x.form.dataset.status, 'invalid'); assert.match(error(x), /required/); x.controller.dispose();
});

test('supplied errors, disabled fields and localized date errors preserve established semantics', () => {
  const s = spec({ minDate: '2024-01-01', maxDate: '2024-12-31', error: { $: 'server' }, disabled: { $: 'locked' } }, { day: '2024-02-29', server: 'Review this date', locked: false });
  const x = setup(s, {}, 'zh-CN'); assert.equal(error(x), 'Review this date'); fill(x, '2023-12-31'); dispatch(x, x.input, 'blur'); assert.equal(error(x), 'Review this date');
  x.controller.setState({ server: '' }); assert.equal(error(x), '日期早于允许的最早日期。'); fill(x, '2025-01-01'); assert.equal(error(x), '日期晚于允许的最晚日期。');
  Object.defineProperty(x.input, 'validity', { configurable: true, value: { badInput: true } }); dispatch(x, x.input, 'input'); assert.equal(error(x), '请输入有效日期。'); delete x.input.validity;
  x.controller.setState({ locked: true }); assert.equal(error(x), ''); fill(x, '2024-03-01'); assert.equal(x.input.value, '2024-02-29'); x.controller.setState({ locked: false }); assert.equal(error(x), ''); x.controller.dispose();
});

test('pending submit freezes a string snapshot, ignores repeats, aborts on cancel and discards stale completion', async () => {
  let resolve, signal, values, calls = 0; const work = new Promise(r => { resolve = r; });
  const x = setup(spec(), { actions: { save: args => { calls++; ({ signal, values } = args); return work; } } });
  fill(x, '2024-03-01'); submit(x); submit(x); assert.equal(calls, 1); assert.deepEqual(values, { day: '2024-03-01' }); assert.equal(Object.isFrozen(values), true); assert.equal(x.input.matches(':disabled'), true);
  fill(x, '2024-04-01'); assert.equal(x.input.value, '2024-03-01'); assert.equal(x.controller.getState().day, '2024-03-01');
  x.host.querySelector('button[type=button]').click(); assert.equal(signal.aborted, true); assert.equal(x.input.value, '2024-02-29'); resolve(); await settle(); assert.equal(x.form.dataset.status, 'cancelled'); x.controller.dispose();
});

test('busy host update changes current value without mutating submitted snapshot; disposal aborts', async () => {
  let resolve, values, signal; const work = new Promise(r => { resolve = r; });
  const x = setup(spec(), { actions: { save: args => { ({ values, signal } = args); return work; } } });
  submit(x); x.controller.setState({ day: '2024-03-01' }); assert.deepEqual(values, { day: '2024-02-29' }); resolve(); await settle(); assert.equal(x.form.dataset.status, 'idle');
  submit(x); x.controller.dispose(); assert.equal(signal.aborted, true); assert.equal(x.host.childElementCount, 0); fill(x, '2024-04-01'); assert.throws(() => x.controller.getState(), /disposed/);
});

test('separate owner documents use distinct IDs, first invalid follows field order, and listeners detach', () => {
  const s = spec({}, { day: '', second: '' }, [date('day', { required: true }), date('second', { required: true })]), a = setup(s), b = setup(s);
  assert.notEqual(a.input.id, b.input.id); submit(a); assert.equal(a.dom.window.document.activeElement, a.input); fill(a, '0001-01-01'); submit(a); assert.equal(a.dom.window.document.activeElement, a.host.querySelector('[data-bind=second]'));
  fill(a, '9999-12-31'); assert.equal(a.input.value, '9999-12-31'); a.controller.dispose(); fill(a, '2024-03-01'); fill(b, '2000-02-29'); assert.equal(b.controller.getState().day, '2000-02-29'); b.controller.dispose();
});

test('public standalone compiler executes the actual date component offline and rejects invalid documents', async () => {
  const s = spec({ required: true }); delete s.body[0].action;
  const html = await compileHtml(s), dom = new JSDOM(html, { runScripts: 'dangerously' });
  const input = dom.window.document.querySelector('input'), form = dom.window.document.querySelector('form'); assert.equal(input.type, 'date'); assert.equal(input.value, '2024-02-29');
  input.value = ''; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); assert.equal(form.dataset.status, 'invalid');
  input.value = '2000-02-29'; input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); await settle(); assert.equal(form.dataset.status, 'success');
  await assert.rejects(() => compileHtml(spec({ minDate: '1900-02-29' }))); await assert.rejects(() => compileHtml(spec({}, { day: '0000-01-01' }))); dom.window.close();
});
