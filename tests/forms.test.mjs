import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { mount, validateDocument } from '../dist/index.js';

const input = (bind = 'title', extras = {}) => ({ type: 'input', kind: 'text', label: 'Title', bind, ...extras });
const number = (extras = {}) => input('amount', { kind: 'number', label: 'Amount', ...extras });
const form = (children, extras = {}) => ({ type: 'form', label: 'Synthetic split', children, ...extras });
const spec = (state, children, extras = {}) => ({ version: 'iui/1', state, body: [form(children, extras)] });
function setup(document, options) {
  const dom = new JSDOM('<!doctype html><html lang="en"><body><div id="host"></div></body></html>', { url: 'https://example.com/' });
  const host = dom.window.document.getElementById('host');
  const controller = mount(host, document, options);
  return { dom, host, controller, form: host.querySelector('form') };
}
const dispatch = (ctx, target, type) => target.dispatchEvent(new ctx.dom.window.Event(type, { bubbles: true, cancelable: true }));
function fill(ctx, selector, value) { const target = ctx.host.querySelector(selector); target.value = value; dispatch(ctx, target, 'input'); return target; }
const submit = ctx => dispatch(ctx, ctx.form, 'submit');
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const error = ctx => ctx.host.querySelector('.iui-field-error').textContent;

// These use the public mount API; no alternate RendererContext is invented.
test('form contract rejects code, URLs, unknown bindings, invalid scalar types, and nested forms', () => {
  const invalid = [
    spec({ title: '' }, [input()], { action: 'https://example.com/save' }),
    spec({ title: '' }, [input()], { action: 'eval(alert(1))' }),
    spec({ title: '' }, [input('missing')]),
    spec({ title: 1 }, [input()]),
    spec({ amount: '' }, [number()]),
    spec({}, [form([])]),
    spec({ title: '' }, [input('title', { disabled: 'true' })]),
    spec({ title: '' }, [input('title', { error: false })]),
    spec({ title: '' }, [input('title', { minLength: 5, maxLength: 2 })]),
    spec({ amount: 1 }, [number({ min: 2, max: 1 })]),
    spec({ amount: 1 }, [number({ step: 0 })])
  ];
  for (const doc of invalid) assert.equal(validateDocument(doc).ok, false, JSON.stringify(doc));
});

test('labels, hints, errors, required flags and native fieldsets are correctly associated', () => {
  const ctx = setup(spec({ title: '' }, [{ type: 'field', label: 'Details', hint: 'Synthetic only', children: [input('title', { hint: 'Give this split a name', required: true })] }]));
  const control = ctx.host.querySelector('input');
  assert.equal(ctx.host.querySelector('[data-iui=field]').tagName, 'FIELDSET');
  assert.equal(ctx.host.querySelector('label').htmlFor, control.id);
  for (const id of control.getAttribute('aria-describedby').split(' ')) assert.ok(ctx.dom.window.document.getElementById(id));
  assert.equal(control.required, true);
  assert.equal(control.getAttribute('aria-required'), 'true');
  assert.equal(error(ctx), '');
  submit(ctx);
  assert.equal(ctx.form.dataset.status, 'invalid');
  assert.equal(ctx.dom.window.document.activeElement, control);
  assert.equal(control.getAttribute('aria-invalid'), 'true');
  assert.equal(ctx.dom.window.document.getElementById(control.getAttribute('aria-errormessage')).textContent, 'This field is required.');
  ctx.controller.dispose();
});

test('unrelated refreshes preserve empty number drafts without changing numeric state', () => {
  const ctx = setup(spec({ amount: 12, other: 'a' }, [number({ required: true })]));
  const control = fill(ctx, 'input', '');
  assert.equal(ctx.controller.getState().amount, 12);
  ctx.controller.setState({ other: 'b' });
  assert.equal(control.value, '');
  submit(ctx);
  assert.equal(error(ctx), 'This field is required.');
  assert.equal(ctx.form.dataset.status, 'invalid');
  fill(ctx, 'input', '24.5');
  assert.equal(ctx.controller.getState().amount, 24.5);
  assert.equal(error(ctx), '');
  assert.equal(control.getAttribute('aria-invalid'), 'false');
  assert.equal(control.hasAttribute('aria-errormessage'), false);
  ctx.controller.dispose();
});

test('optional empty and invalid number drafts cannot silently submit the previous numeric value', () => {
  const ctx = setup(spec({ amount: 12 }, [number()]));
  for (const raw of ['', 'not a number', '1e999']) {
    fill(ctx, 'input', raw);
    submit(ctx);
    assert.equal(ctx.controller.getState().amount, 12);
    assert.equal(error(ctx), 'Enter a valid number.');
    assert.equal(ctx.form.dataset.status, 'invalid');
  }
  ctx.controller.setState({ amount: 15 });
  assert.equal(ctx.host.querySelector('input').value, '15');
  assert.equal(error(ctx), '');
  ctx.controller.dispose();
});

test('numeric bounds and steps keep invalid drafts out of shared state while validating the visible draft', () => {
  const ctx = setup(spec({ amount: 1 }, [number({ min: 1, max: 5, step: .5 })]));
  for (const [value, message] of [['0', 'minimum'], ['6', 'maximum'], ['1.2', 'step']]) {
    const control = fill(ctx, 'input', value);
    dispatch(ctx, control, 'blur');
    assert.match(error(ctx), new RegExp(message));
    assert.equal(control.value, value);
    assert.equal(ctx.controller.getState().amount, 1);
    submit(ctx);
    assert.equal(ctx.form.dataset.status, 'invalid');
  }
  fill(ctx, 'input', '1.5');
  assert.equal(error(ctx), '');
  assert.throws(() => ctx.controller.setState({ amount: '1.5' }));
  assert.throws(() => ctx.controller.setState({ amount: NaN }));
  assert.equal(ctx.controller.getState().amount, 1.5);
  ctx.controller.dispose();
});

test('invalid numeric drafts preserve derived budgets and cannot invoke actions or emit submission snapshots', async () => {
  let calls = 0, events = 0, payload;
  const document = {
    version: 'iui/1', state: { hours: 6, weeks: 4, rate: 80, other: 0 },
    computed: { cost: { op: 'mul', args: [{ $: 'hours' }, { $: 'weeks' }, { $: 'rate' }] } },
    body: [form([input('hours', { kind: 'number', min: 0, max: 20, step: .5, required: true }), { type: 'metric', label: 'Cost', value: { $: 'cost' } }], { action: 'save' })]
  };
  const ctx = setup(document, { actions: { save: ({ values }) => { calls++; payload = values; } } });
  ctx.form.addEventListener('iui:submit', () => events++);
  const control = fill(ctx, 'input', '10');
  assert.equal(ctx.host.querySelector('.iui-metric-value').textContent, '3200');
  for (const [raw, message] of [['-1', /minimum/], ['21', /maximum/], ['0.1', /step/], ['', /required/]]) {
    fill(ctx, 'input', raw); ctx.controller.setState({ other: ctx.controller.getState().other + 1 });
    assert.equal(control.value, raw); assert.equal(ctx.controller.getState().hours, 10);
    assert.equal(ctx.host.querySelector('.iui-metric-value').textContent, '3200');
    submit(ctx); await settle();
    assert.match(error(ctx), message); assert.equal(ctx.form.dataset.status, 'invalid');
    assert.equal(ctx.dom.window.document.activeElement, control); assert.equal(calls, 0); assert.equal(events, 0);
  }
  fill(ctx, 'input', '12.5'); submit(ctx); await settle();
  assert.equal(ctx.controller.getState().hours, 12.5); assert.equal(ctx.host.querySelector('.iui-metric-value').textContent, '4000');
  assert.deepEqual(payload, { hours: 12.5 }); assert.equal(calls, 1); assert.equal(events, 1);
  fill(ctx, 'input', '-1'); assert.equal(ctx.form.dataset.status, 'idle');
  ctx.form.reset(); assert.equal(control.value, '6'); assert.equal(ctx.controller.getState().hours, 6);
  assert.equal(ctx.host.querySelector('.iui-metric-value').textContent, '1920');
  ctx.controller.dispose();
});

test('host numeric state remains authoritative but invalid host values still block form submission', async () => {
  let calls = 0;
  const ctx = setup(spec({ amount: 1, other: 0 }, [number({ min: 0, max: 5, step: .5 })], { action: 'save' }), { actions: { save: () => calls++ } });
  const control = fill(ctx, 'input', '-1');
  ctx.controller.setState({ amount: 2 }); assert.equal(control.value, '2');
  submit(ctx); await settle(); assert.equal(calls, 1);
  ctx.controller.setState({ amount: -2 }); assert.equal(control.value, '-2');
  submit(ctx); await settle(); assert.match(error(ctx), /minimum/); assert.equal(calls, 1);
  fill(ctx, 'input', '1.5'); assert.equal(ctx.controller.getState().amount, 1.5);
  ctx.controller.dispose();
});

test('empty required email, malformed email, and corrected values use native validity', () => {
  const ctx = setup(spec({ title: '' }, [input('title', { kind: 'email', required: true })]));
  submit(ctx); assert.match(error(ctx), /required/);
  fill(ctx, 'input', 'invalid'); submit(ctx); assert.match(error(ctx), /email/);
  fill(ctx, 'input', 'synthetic@example.invalid'); assert.equal(error(ctx), '');
  ctx.controller.dispose();
});

test('text and textarea length checks agree with native UTF-16 length constraints', () => {
  for (const node of [input('title', { minLength: 2, maxLength: 4 }), { type: 'textarea', label: 'Note', bind: 'title', minLength: 2, maxLength: 4, rows: 3 }]) {
    const ctx = setup(spec({ title: '' }, [node]));
    const selector = node.type === 'textarea' ? 'textarea' : 'input';
    fill(ctx, selector, 'a'); submit(ctx); assert.match(error(ctx), /short/);
    fill(ctx, selector, 'abcde'); assert.match(error(ctx), /long/);
    fill(ctx, selector, '😀😀'); assert.equal(error(ctx), '');
    assert.equal(ctx.host.querySelector(selector).minLength, 2);
    if (node.type === 'textarea') assert.equal(ctx.host.querySelector(selector).rows, 3);
    ctx.controller.dispose();
  }
});

test('inert host-provided errors resolve from Value and clear reactively', () => {
  const ctx = setup(spec({ title: 'Trip', server: '<img src=x onerror=alert(1)>' }, [input('title', { error: { $: 'server' } })]));
  assert.equal(ctx.host.querySelector('img'), null);
  assert.equal(error(ctx), '<img src=x onerror=alert(1)>');
  submit(ctx); assert.equal(ctx.form.dataset.status, 'invalid');
  ctx.controller.setState({ server: '' });
  assert.equal(error(ctx), '');
  ctx.controller.dispose();
});

test('disabled nested fieldsets skip validation and values, then restore validation when enabled', async () => {
  let values;
  const ctx = setup(spec({ title: '', locked: false }, [{ type: 'field', label: 'Outer', disabled: { $: 'locked' }, children: [{ type: 'field', label: 'Inner', children: [input('title', { required: true })] }] }], { action: 'save' }), { actions: { save: context => { values = context.values; } } });
  submit(ctx); assert.match(error(ctx), /required/);
  ctx.controller.setState({ locked: true });
  assert.equal(ctx.host.querySelector('input').matches(':disabled'), true);
  assert.equal(error(ctx), '');
  fill(ctx, 'input', 'ignored synthetic event');
  assert.equal(ctx.controller.getState().title, '');
  submit(ctx); await settle();
  assert.deepEqual(values, {});
  ctx.controller.setState({ locked: false });
  submit(ctx); assert.equal(ctx.form.dataset.status, 'invalid');
  ctx.controller.dispose();
});

test('disabled form blocks submit; disabled fields do not enter host payloads', async () => {
  let calls = 0, payload;
  const ctx = setup(spec({ title: 'Keep', disabled: true, hidden: 'not sent' }, [input(), input('hidden', { disabled: true })], { disabled: { $: 'disabled' }, action: 'save' }), { actions: { save: ({ values }) => { calls++; payload = values; } } });
  submit(ctx); await settle(); assert.equal(calls, 0);
  ctx.controller.setState({ disabled: false });
  submit(ctx); await settle();
  assert.equal(calls, 1); assert.deepEqual(payload, { title: 'Keep' });
  ctx.controller.dispose();
});

test('radio and segmented controls preserve string and number option types with native semantics', () => {
  for (const type of ['radio', 'segmented']) for (const values of [['metre', 'centimetre'], [1, 100]]) {
    const ctx = setup(spec({ unit: values[0] }, [{ type, label: 'Unit', bind: 'unit', required: true, options: values.map((value, i) => ({ value, label: ['Metres', 'Centimetres'][i] })) }]));
    const radios = [...ctx.host.querySelectorAll('input[type=radio]')];
    assert.equal(ctx.host.querySelector('.iui-choices').tagName, 'FIELDSET');
    assert.equal(ctx.host.querySelector('.iui-choices legend').textContent, 'Unit *');
    assert.equal(radios[0].name, radios[1].name);
    assert.equal(radios[0].required, true);
    radios[1].checked = true; dispatch(ctx, radios[1], 'change');
    assert.equal(ctx.controller.getState().unit, values[1]);
    assert.equal(typeof ctx.controller.getState().unit, typeof values[1]);
    assert.equal(radios[0].checked, false);
    ctx.controller.dispose();
  }
});

test('unselected required and disabled-selected choices are invalid; disabled options ignore input', () => {
  const ctx = setup(spec({ unit: '' }, [{ type: 'radio', label: 'Unit', bind: 'unit', required: true, options: [{ value: 'm', label: 'Metres' }, { value: 'cm', label: 'Unavailable', disabled: true }] }]));
  submit(ctx); assert.match(error(ctx), /required/);
  const unavailable = ctx.host.querySelectorAll('input')[1];
  unavailable.checked = true; dispatch(ctx, unavailable, 'change'); assert.equal(ctx.controller.getState().unit, '');
  ctx.controller.setState({ unit: 'cm' }); submit(ctx); assert.match(error(ctx), /available/);
  ctx.controller.dispose();
});

test('submit captures only form-owned enabled bound controls including slider/toggle/select', async () => {
  let snapshot;
  const document = spec({ title: 'Split', amount: 20, include: true, currency: 'USD', unrelated: 'private', disabled: 'omit' }, [
    input(), { type: 'slider', label: 'Amount', bind: 'amount', min: 0, max: 100, step: 1 },
    { type: 'toggle', label: 'Include', bind: 'include' },
    { type: 'select', label: 'Currency', bind: 'currency', options: [{ value: 'USD', label: 'USD' }] },
    { type: 'field', label: 'Disabled', disabled: true, children: [input('disabled')] }
  ], { action: 'save' });
  const ctx = setup(document, { actions: { save: ({ values }) => { snapshot = values; } } });
  submit(ctx); await settle();
  assert.deepEqual(snapshot, { title: 'Split', amount: 20, include: true, currency: 'USD' });
  assert.equal(Object.isFrozen(snapshot), true);
  assert.throws(() => { snapshot.title = 'mutated'; });
  ctx.controller.setState({ amount: 25 });
  assert.equal(snapshot.amount, 20);
  ctx.controller.dispose();
});

test('local submit prevents native navigation and emits one safe snapshot event', async () => {
  const ctx = setup(spec({ title: 'Local only' }, [input()], { id: 'split-form', successMessage: 'Confirmed locally' }));
  const events = [];
  ctx.host.addEventListener('iui:submit', event => events.push(event.detail));
  assert.equal(submit(ctx), false);
  await settle();
  assert.equal(ctx.form.dataset.status, 'success');
  assert.equal(ctx.form.getAttribute('action'), null);
  assert.equal(ctx.form.getAttribute('aria-busy'), 'false');
  assert.equal(ctx.host.querySelector('.iui-form-status').textContent, 'Confirmed locally');
  assert.deepEqual(events, [{ id: 'split-form', values: { title: 'Local only' } }]);
  assert.equal(ctx.dom.window.location.href, 'https://example.com/');
  ctx.controller.dispose();
});

test('missing and inherited actions fail closed rather than invoke arbitrary host properties', async () => {
  let calls = 0;
  for (const actions of [{}, Object.create({ save: () => calls++ }), { save: 'not a function' }]) {
    const ctx = setup(spec({ title: 'Local' }, [input()], { action: 'save' }), { actions });
    submit(ctx); await settle();
    assert.equal(ctx.form.dataset.status, 'error');
    assert.match(ctx.host.querySelector('.iui-form-status').textContent, /not configured/);
    ctx.controller.dispose();
  }
  assert.equal(calls, 0);
});

test('busy prevents repeated submission, exposes live status, and keeps cancel available', async () => {
  const work = deferred(); let calls = 0, signal;
  const ctx = setup(spec({ title: 'Trip' }, [input()], { action: 'save' }), { actions: { save: context => { calls++; signal = context.signal; return work.promise; } } });
  submit(ctx); submit(ctx); submit(ctx);
  assert.equal(calls, 1);
  assert.equal(signal.aborted, false);
  assert.equal(ctx.form.getAttribute('aria-busy'), 'true');
  assert.equal(ctx.form.dataset.status, 'busy');
  assert.equal(ctx.host.querySelector('input').matches(':disabled'), true);
  assert.equal(ctx.host.querySelector('button[type=submit]').disabled, true);
  assert.equal(ctx.host.querySelector('button[type=button]').disabled, false);
  assert.equal(ctx.host.querySelector('.iui-form-status').getAttribute('role'), 'status');
  work.resolve(); await settle();
  assert.equal(ctx.form.dataset.status, 'success');
  assert.equal(ctx.host.querySelector('input').matches(':disabled'), false);
  ctx.controller.dispose();
});

test('cancel aborts, restores only this form, clears drafts and ignores late resolution', async () => {
  const work = deferred(); let signal;
  const ctx = setup(spec({ amount: 10, include: true, outside: 'before' }, [number(), { type: 'toggle', label: 'Include', bind: 'include' }], { action: 'save' }), { actions: { save: context => { signal = context.signal; return work.promise; } } });
  ctx.controller.setState({ amount: 20, include: false, outside: 'after' });
  submit(ctx);
  ctx.host.querySelector('button[type=button]').click();
  assert.equal(signal.aborted, true);
  assert.deepEqual(ctx.controller.getState(), { amount: 10, include: true, outside: 'after' });
  assert.equal(ctx.form.dataset.status, 'cancelled');
  work.resolve(); await settle();
  assert.equal(ctx.form.dataset.status, 'cancelled');
  fill(ctx, 'input[type=number]', ''); submit(ctx);
  ctx.host.querySelector('button[type=button]').click();
  assert.equal(ctx.host.querySelector('input[type=number]').value, '10');
  assert.equal(error(ctx), '');
  ctx.controller.dispose();
});

test('cancelled late rejection cannot overwrite a newer successful retry', async () => {
  const old = deferred(), latest = deferred(); let calls = 0;
  const ctx = setup(spec({ title: 'Trip' }, [input()], { action: 'save' }), { actions: { save: () => ++calls === 1 ? old.promise : latest.promise } });
  submit(ctx); ctx.host.querySelector('button[type=button]').click(); submit(ctx);
  assert.equal(calls, 2);
  latest.resolve(); await settle(); assert.equal(ctx.form.dataset.status, 'success');
  old.reject(new Error('Late failure')); await settle(); assert.equal(ctx.form.dataset.status, 'success');
  ctx.controller.dispose();
});

test('synchronous throw and rejected promise both become retryable error states', async () => {
  for (const asynchronous of [false, true]) {
    let calls = 0;
    const ctx = setup(spec({ title: 'Trip' }, [input()], { action: 'save', errorMessage: 'Synthetic failure. Retry.' }), { actions: { save: () => { if (++calls === 1) { if (asynchronous) return Promise.reject(new Error('secret stack')); throw new Error('secret stack'); } } } });
    submit(ctx); await settle();
    assert.equal(ctx.form.dataset.status, 'error');
    assert.equal(ctx.host.querySelector('.iui-form-status').textContent, 'Synthetic failure. Retry.');
    assert.equal(ctx.host.querySelector('button[type=submit]').disabled, false);
    submit(ctx); await settle(); assert.equal(ctx.form.dataset.status, 'success');
    ctx.controller.dispose();
  }
});

test('native form reset follows typed state reset, rather than diverging DOM values', () => {
  const ctx = setup(spec({ title: 'Original' }, [input()]));
  fill(ctx, 'input', 'Changed');
  ctx.form.reset();
  assert.equal(ctx.controller.getState().title, 'Original');
  assert.equal(ctx.host.querySelector('input').value, 'Original');
  assert.equal(ctx.form.dataset.status, 'cancelled');
  ctx.controller.dispose();
});

test('updating and disposing abort pending work, remove old handlers, and suppress old events', async () => {
  for (const operation of ['update', 'dispose']) {
    const work = deferred(); let signal, calls = 0, events = 0;
    const ctx = setup(spec({ title: 'Old' }, [input()], { action: 'save' }), { actions: { save: context => { calls++; signal = context.signal; return work.promise; } } });
    ctx.host.addEventListener('iui:submit', () => events++);
    const oldForm = ctx.form, oldInput = ctx.host.querySelector('input');
    submit(ctx);
    if (operation === 'update') ctx.controller.update(spec({ title: 'New' }, [input()]));
    else ctx.controller.dispose();
    assert.equal(signal.aborted, true);
    dispatch(ctx, oldForm, 'submit'); oldInput.value = 'Ignored'; dispatch(ctx, oldInput, 'input');
    work.resolve(); await settle();
    assert.equal(calls, 1); assert.equal(events, 0);
    if (operation === 'update') {
      assert.equal(ctx.controller.getState().title, 'New');
      assert.equal(ctx.host.querySelector('form').dataset.status, 'idle');
      ctx.controller.dispose();
    } else assert.equal(ctx.host.childElementCount, 0);
  }
});

test('multiple forms and mounts have independent controls, snapshots and unique labels', async () => {
  let leftValues;
  const document = { version: 'iui/1', state: { left: 'L', right: 'R' }, body: [form([input('left')], { action: 'save' }), form([input('right')], { label: 'Right split' })] };
  const ctx = setup(document, { actions: { save: ({ values }) => { leftValues = values; } } });
  const second = setup(document);
  const ids = [...ctx.host.querySelectorAll('input'), ...second.host.querySelectorAll('input')].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length);
  ctx.controller.setState({ left: 'changed', right: 'unchanged by cancel' });
  submit(ctx); await settle(); assert.deepEqual(leftValues, { left: 'changed' });
  ctx.form.querySelector('button[type=button]').click();
  assert.deepEqual(ctx.controller.getState(), { left: 'L', right: 'unchanged by cancel' });
  assert.deepEqual(second.controller.getState(), { left: 'L', right: 'R' });
  ctx.controller.dispose(); second.controller.dispose();
});

test('empty form has a valid zero-field local result', async () => {
  const ctx = setup(spec({ unrelated: 'not included' }, []));
  let values; ctx.form.addEventListener('iui:submit', event => { values = event.detail.values; });
  submit(ctx); await settle();
  assert.equal(ctx.form.dataset.status, 'success'); assert.deepEqual(values, {});
  ctx.controller.dispose();
});

test('Chinese validation and status use host language', async () => {
  const ctx = setup(spec({ title: '' }, [input('title', { required: true })]));
  ctx.host.lang = 'zh-CN'; ctx.controller.update(spec({ title: '' }, [input('title', { required: true })]));
  ctx.form = ctx.host.querySelector('form');
  submit(ctx); assert.equal(error(ctx), '请填写此项。');
  fill(ctx, 'input', '合成分账'); submit(ctx); await settle();
  assert.equal(ctx.host.querySelector('.iui-form-status').textContent, '已完成本地提交');
  ctx.controller.dispose();
});

test('original split fixture validates, renders every new control, and computes local results', async () => {
  const document = JSON.parse(await readFile(new URL('../examples/forms.json', import.meta.url), 'utf8'));
  assert.equal(validateDocument(document).ok, true);
  const ctx = setup(document);
  for (const type of ['input', 'textarea', 'radio', 'segmented', 'field', 'form']) assert.ok(ctx.host.querySelector(`[data-iui=${type}]`), type);
  fill(ctx, 'input[data-bind=amount]', '150');
  assert.equal(ctx.host.querySelector('.iui-metric-value').textContent, '50点');
  submit(ctx); await settle(); assert.equal(ctx.form.dataset.status, 'success');
  ctx.controller.dispose();
});

test('cancel still aborts but reports an atomic reset failure caused by changed global dependencies', async () => {
  const work = deferred(); let signal;
  const document = {
    ...spec({ amount: 10, divisor: 2 }, [number()], { action: 'save' }),
    computed: { difference: { op: 'sub', args: [{ $: 'amount' }, { $: 'divisor' }] }, ratio: { op: 'div', args: [1, { $: 'difference' }] } }
  };
  const ctx = setup(document, { actions: { save: context => { signal = context.signal; return work.promise; } } });
  ctx.controller.setState({ amount: 20, divisor: 10 });
  submit(ctx);
  ctx.host.querySelector('button[type=button]').click();
  assert.equal(signal.aborted, true);
  assert.equal(ctx.form.getAttribute('aria-busy'), 'false');
  assert.equal(ctx.form.dataset.status, 'error');
  assert.match(ctx.host.querySelector('.iui-form-status').textContent, /DIVISION_BY_ZERO/);
  assert.deepEqual(ctx.controller.getState(), { amount: 20, divisor: 10 });
  assert.equal(ctx.host.querySelector('input').value, '20');
  work.resolve(); await settle(); assert.equal(ctx.form.dataset.status, 'error');
  ctx.controller.dispose();
});

test('explicit document ids cannot collide with generated form control ids', () => {
  const ctx = setup(spec({ title: '' }, [input('title', { id: 'field-2' })], { id: 'form-1-status' }));
  const ids = [...ctx.host.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length);
  const control = ctx.host.querySelector('input');
  assert.equal(ctx.dom.window.document.getElementById(ctx.host.querySelector('label').htmlFor), control);
  ctx.controller.dispose();
});
test('native string normalization cannot make a different bound value pass submission validation',async()=>{for(const field of [input('email',{kind:'email'}),input('email',{kind:'text'}),{type:'textarea',label:'Notes',bind:'email'}]){const original='a\r\n@b.com',ctx=setup(spec({email:original},[field]));let submitted;ctx.form.addEventListener('iui:submit',event=>submitted=event.detail.values);assert.notEqual(ctx.host.querySelector('input,textarea').value,original);submit(ctx);await settle();assert.equal(ctx.form.dataset.status,'invalid');assert.equal(submitted,undefined);assert.equal(ctx.controller.getState().email,original);fill(ctx,'input,textarea','a@b.com');submit(ctx);await settle();assert.equal(ctx.form.dataset.status,'success');assert.equal(submitted.email,'a@b.com');ctx.controller.dispose();}});

test('editing submitted values clears stale success, including invalid drafts and host state updates',async()=>{const ctx=setup(spec({amount:10,other:0},[number()]));submit(ctx);await settle();assert.equal(ctx.form.dataset.status,'success');ctx.controller.setState({other:1});assert.equal(ctx.form.dataset.status,'success');ctx.controller.setState({amount:20});assert.equal(ctx.form.dataset.status,'idle');submit(ctx);await settle();assert.equal(ctx.form.dataset.status,'success');fill(ctx,'input','');assert.equal(ctx.form.dataset.status,'idle');assert.equal(ctx.form.querySelector('.iui-form-status').textContent,'');assert.equal(ctx.controller.getState().amount,20);ctx.controller.dispose();});
test('late successful adapter results do not claim newly changed host values were submitted',async()=>{const pending=deferred(),ctx=setup(spec({title:'before'},[input()],{action:'submit'}),{actions:{submit:()=>pending.promise}});submit(ctx);ctx.controller.setState({title:'after'});pending.resolve();await settle();assert.equal(ctx.form.dataset.status,'idle');assert.equal(ctx.controller.getState().title,'after');ctx.controller.dispose();});
