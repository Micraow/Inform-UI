import type { Node } from '../schema/document.js';
import type { StateValue } from '../core/index.js';
import type { FieldNode } from '../core/extensions.js';
import type { RendererContext } from './context.js';

interface FieldHandle { validate: () => boolean; reset: () => void; focus: () => void }
interface FormScope { fields: FieldHandle[] }
type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Native controls, local validation, and explicitly allowlisted host actions. Never performs network I/O. */
export function createForms(c: RendererContext) {
  let scope: FormScope | undefined;
  let serial = 0;
  const { element: e, on, bind } = c;
  const disabled = (control: Control) => control.matches(':disabled');

  function field(n: FieldNode): HTMLElement {
    const id = `iui-form-internal-${c.prefix}field-${++serial}`;
    const out = e('div', 'iui-field');
    const hint = e('p', 'iui-caption iui-field-hint', n.hint);
    const error = e('p', 'iui-field-error');
    hint.id = `${id}-hint`;
    hint.hidden = !n.hint;
    error.id = `${id}-error`;
    error.setAttribute('aria-live', 'polite');
    error.setAttribute('aria-atomic', 'true');
    const choice = n.type === 'radio' || n.type === 'segmented';
    const group = choice ? e('fieldset', `iui-choices${n.type === 'segmented' ? ' iui-segmented' : ''}`) : undefined;
    const label = choice ? e('legend', 'iui-field-label', n.label) : e('label', 'iui-field-label', n.label);
    if (!choice) (label as HTMLLabelElement).htmlFor = id;
    if (n.required) {
      const required = e('span', 'iui-field-required', ' *');
      required.setAttribute('aria-hidden', 'true');
      label.append(required);
    }
    (group ?? out).append(label);
    if (group) out.append(group);
    const inputs: (HTMLInputElement | HTMLTextAreaElement)[] = [];
    let touched = false;
    let localError = '';
    let last: StateValue | undefined;
    let committing = false;
    const describedBy = [n.hint ? hint.id : '', error.id].filter(Boolean).join(' ');
    const setupInput = (input: HTMLInputElement | HTMLTextAreaElement) => {
      input.dataset.bind = n.bind;
      input.required = !!n.required;
      input.setAttribute('aria-describedby', describedBy);
      input.setAttribute('aria-required', String(!!n.required));
      inputs.push(input);
      on(input, 'blur', () => { if (!disabled(input)) { touched = true; refresh(); } });
    };

    if (choice) {
      n.options.forEach((option, i) => {
        const optionLabel = e('label', 'iui-choice');
        const input = e('input');
        input.type = 'radio';
        input.name = id;
        input.id = `${id}-${i}`;
        input.value = String(i);
        setupInput(input);
        optionLabel.append(input, e('span', 'iui-choice-text', option.label));
        group!.append(optionLabel);
        on(input, 'change', () => {
          if (disabled(input)) { refresh(); return; }
          if (!input.checked) return;
          touched = true;
          localError = '';
          try { c.change({ [n.bind]: option.value }); }
          catch { localError = c.labels().invalidChoice; }
          refresh();
        });
      });
    } else {
      const input = n.type === 'textarea' ? e('textarea') : e('input');
      input.id = id;
      if (n.type === 'textarea') (input as HTMLTextAreaElement).rows = n.rows ?? 4;
      else (input as HTMLInputElement).type = n.kind;
      if (n.placeholder !== undefined) input.placeholder = n.placeholder;
      if (n.minLength !== undefined) input.minLength = n.minLength;
      if (n.maxLength !== undefined) input.maxLength = n.maxLength;
      if (n.type === 'input' && n.kind === 'number') {
        if (n.min !== undefined) input.setAttribute('min', String(n.min));
        if (n.max !== undefined) input.setAttribute('max', String(n.max));
        input.setAttribute('step', String(n.step ?? 'any'));
      }
      setupInput(input);
      out.append(input);
      on(input, 'input', () => {
        if (disabled(input)) { last = undefined; refresh(); return; }
        localError = '';
        const numeric = n.type === 'input' && n.kind === 'number';
        const next = numeric ? (input as HTMLInputElement).valueAsNumber : input.value;
        // Validate the numeric DOM draft before publishing it to shared state.
        // Finite values outside min/max/step are drafts too: derived metrics must
        // retain the last accepted value while the user corrects the field.
        if (!numeric || !numberProblem(input as HTMLInputElement)) {
          committing = true;
          try { c.change({ [n.bind]: next }); }
          catch (failure) { localError = failure instanceof Error ? failure.message : c.labels().formInvalid; }
          finally { committing = false; }
        }
        refresh();
      });
    }
    out.append(hint, error);

    function numberProblem(input: HTMLInputElement): string {
      if (n.type !== 'input' || n.kind !== 'number') return '';
      const l = c.labels(), raw = input.value, number = input.valueAsNumber;
      if (input.validity.badInput || !Number.isFinite(number)) {
        return !raw && !input.validity.badInput && n.required ? l.required : l.invalidNumber;
      }
      if (n.min !== undefined && number < n.min) return l.belowMin;
      if (n.max !== undefined && number > n.max) return l.aboveMax;
      if (n.step !== undefined) {
        const steps = (number - (n.min ?? 0)) / n.step;
        // Overflowed ratios cannot be proven aligned and must not silently pass.
        if (!Number.isFinite(steps) || Math.abs(steps - Math.round(steps)) > Number.EPSILON * 16 * Math.max(1, Math.abs(steps))) return l.stepMismatch;
      }
      return '';
    }

    function problem(): string {
      if (inputs.every(disabled)) return '';
      const l = c.labels();
      const current = c.getState()[n.bind];
      const provided = n.error === undefined ? '' : c.display(c.value(n.error));
      if (provided) return provided;
      if (localError) return localError;
      if (choice) {
        const selected = n.options.find(option => option.value === current);
        if (!selected) return n.required ? l.required : current === '' ? '' : l.invalidChoice;
        return selected.disabled ? l.invalidChoice : '';
      }
      const input = inputs[0];
      const raw = input.value;
      if (n.type === 'input' && n.kind === 'number') return numberProblem(input as HTMLInputElement);
      if (raw !== String(current)) return l.inputMismatch;
      if (n.required && !raw.trim()) return l.required;
      if (raw) {
        if (n.type === 'input' && n.kind === 'email' && input.validity.typeMismatch) return l.invalidEmail;
        // Native HTML minlength/maxlength count UTF-16 code units, including surrogate pairs.
        if (n.minLength !== undefined && raw.length < n.minLength) return l.tooShort;
        if (n.maxLength !== undefined && raw.length > n.maxLength) return l.tooLong;
      }
      return '';
    }

    function refresh() {
      const current = c.getState()[n.bind];
      const off = n.disabled !== undefined && c.value(n.disabled) === true;
      if (group) group.disabled = off;
      inputs.forEach((input, i) => {
        input.disabled = off || (choice && !!n.options[i].disabled);
        if (choice) (input as HTMLInputElement).checked = n.options[i].value === current;
        else if (current !== last && !committing) {
          input.value = String(current);
          localError = '';
        }
      });
      last = current;
      const provided = n.error === undefined ? '' : c.display(c.value(n.error));
      const message = inputs.every(disabled) ? '' : touched ? problem() : provided;
      error.textContent = message;
      error.hidden = !message;
      out.dataset.invalid = String(!!message);
      for (const target of group ? [group, ...inputs] : inputs) {
        target.setAttribute('aria-invalid', String(!!message));
        if (message) target.setAttribute('aria-errormessage', error.id);
        else target.removeAttribute('aria-errormessage');
      }
    }

    scope?.fields.push({
      validate: () => { touched = true; refresh(); return !problem(); },
      reset: () => { touched = false; localError = ''; last = undefined; refresh(); },
      focus: () => inputs.find(input => !disabled(input))?.focus()
    });
    bind(refresh);
    return out;
  }

  function group(n: Extract<Node, { type: 'field' }>): HTMLElement {
    const out = e('fieldset', 'iui-field-group');
    out.append(e('legend', 'iui-field-label', n.label));
    if (n.hint) {
      const hint = e('p', 'iui-caption iui-field-group-hint', n.hint);
      hint.id = `iui-form-internal-${c.prefix}group-${++serial}-hint`;
      out.setAttribute('aria-describedby', hint.id);
      out.append(hint);
    }
    // Run ancestor disabled refreshes first, so descendants see the final inherited state.
    bind(() => { out.disabled = n.disabled !== undefined && c.value(n.disabled) === true; });
    for (const child of n.children) out.append(c.render(child));
    return out;
  }

  function form(n: Extract<Node, { type: 'form' }>): HTMLElement {
    const out = e('form', 'iui-form');
    const fieldset = e('fieldset', 'iui-form-fields');
    const status = e('p', 'iui-form-status');
    const actions = e('div', 'iui-form-actions');
    const submit = e('button', 'iui-button-primary');
    const cancel = e('button');
    const local: FormScope = { fields: [] };
    let busy = false;
    let generation = 0;
    let abort: AbortController | undefined;
    let alive = true;
    out.noValidate = true;
    out.setAttribute('aria-label', n.label);
    status.id = `iui-form-internal-${c.prefix}status-${++serial}`;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    out.setAttribute('aria-describedby', status.id);
    submit.type = 'submit';
    cancel.type = 'button';
    cancel.textContent = n.cancelLabel ?? c.labels().cancel;
    fieldset.append(e('legend', 'iui-form-title', n.label));
    const paint = () => {
      const off = n.disabled !== undefined && c.value(n.disabled) === true;
      fieldset.disabled = busy || off;
      submit.disabled = busy || off;
      cancel.disabled = off && !busy;
      submit.textContent = busy ? c.labels().submitting : n.submitLabel ?? c.labels().submit;
      out.setAttribute('aria-busy', String(busy));
    };
    bind(paint);
    const previous = scope;
    scope = local;
    try { for (const child of n.children) fieldset.append(c.render(child)); }
    finally { scope = previous; }
    actions.append(submit, cancel);
    out.append(fieldset, actions, status);
    // Includes the established slider/toggle/select controls as well as new fields.
    const controls = [...fieldset.querySelectorAll<Control>('input[data-bind], textarea[data-bind], select[data-bind]')];
    const bindings = [...new Set(controls.map(control => control.dataset.bind!))];
    const initial = Object.fromEntries(bindings.map(key => [key, c.getState()[key]]));
    const setStatus = (state: string, text: string) => {
      out.dataset.status = state;
      status.textContent = text;
      status.dataset.error = String(state === 'error' || state === 'invalid');
    };
    let observed = Object.fromEntries(bindings.map(key => [key, c.getState()[key]]));
    const clearSuccess = () => { if (!busy && out.dataset.status === 'success') setStatus('idle', ''); };
    bind(() => { const current = c.getState(); if (bindings.some(key => !Object.is(current[key], observed[key]))) clearSuccess(); observed = Object.fromEntries(bindings.map(key => [key, current[key]])); });
    // Draft-only edits (for example an empty number input) also invalidate a prior success label.
    on(out, 'input', clearSuccess); on(out, 'change', clearSuccess);
    const reset = () => {
      generation++;
      const pending = abort;
      abort = undefined;
      busy = false;
      pending?.abort();
      if (!alive) return;
      paint();
      try {
        c.change(initial);
        local.fields.forEach(field => field.reset());
        setStatus('cancelled', c.labels().cancelled);
      } catch (failure) {
        // Cancellation still aborts work. A rejected atomic state reset must never claim success.
        setStatus('error', failure instanceof Error ? failure.message : c.labels().formInvalid);
      }
    };

    on(out, 'submit', (event: Event) => {
      event.preventDefault();
      if (!alive || busy || submit.disabled) return;
      const invalid = local.fields.filter(field => !field.validate());
      if (invalid.length) {
        setStatus('invalid', c.labels().formInvalid);
        invalid[0].focus();
        return;
      }
      const enabled = new Set(controls.filter(control => !disabled(control)).map(control => control.dataset.bind!));
      const values = Object.freeze(Object.fromEntries([...enabled].map(key => [key, c.getState()[key]])));
      // Only own properties can be selected, including for objects with a prototype.
      const action = n.action && Object.hasOwn(c.actions, n.action) ? c.actions[n.action] : undefined;
      if (n.action && typeof action !== 'function') {
        setStatus('error', c.labels().noAdapter);
        return;
      }
      const ticket = ++generation;
      abort = new AbortController();
      const signal = abort.signal;
      busy = true;
      setStatus('busy', c.labels().submitting);
      paint();
      let work: void | Promise<void>;
      try { work = action?.({ values, signal }); }
      catch { work = Promise.reject(new Error('Action failed')); }
      Promise.resolve(work).then(() => {
        if (!alive || ticket !== generation) return;
        busy = false;
        abort = undefined;
        paint();
        if ([...enabled].every(key => Object.is(c.getState()[key], values[key]))) setStatus('success', n.successMessage ?? c.labels().submitted);
        else setStatus('idle', '');
        const CustomEvent = c.doc.defaultView?.CustomEvent;
        if (CustomEvent) out.dispatchEvent(new CustomEvent('iui:submit', { bubbles: true, detail: { id: n.id ?? null, values } }));
      }, () => {
        if (!alive || ticket !== generation) return;
        busy = false;
        abort = undefined;
        paint();
        setStatus('error', n.errorMessage ?? c.labels().submitError);
      });
    });
    on(cancel, 'click', () => { if (!cancel.disabled) reset(); });
    on(out, 'reset', (event: Event) => { event.preventDefault(); if (alive && !cancel.disabled) reset(); });
    c.cleanup(() => { alive = false; generation++; abort?.abort(); abort = undefined; });
    out.dataset.status = 'idle';
    return out;
  }
  return { field, group, form };
}
