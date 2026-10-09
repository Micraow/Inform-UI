import type { ButtonNode } from '../schema/document.js';
import type { StateValue } from '../core/index.js';
import type { RendererContext } from './context.js';
import type { ButtonLabels } from './button-labels.js';

let serial = 0;
/** The dispatcher retains the authored id/data-iui on this function's return value. */
export function renderButton(c: RendererContext, n: ButtonNode, labels: ButtonLabels, initial: Readonly<Record<string, StateValue>>): HTMLElement {
  const internal = `iui-button-internal-${c.prefix}${++serial}`;
  const main = c.element('button', 'iui-button', n.label);
  main.type = 'button';
  main.dataset.tone = n.tone ?? 'default';
  const hint = n.hint === undefined ? undefined : c.element('span', 'iui-button-hint', n.hint);
  if (hint) hint.id = `${internal}-hint`;
  const off = () => n.disabled !== undefined && c.value(n.disabled) === true;
  // matches includes an enclosing disabled fieldset; .disabled alone does not.
  const disabled = () => main.disabled || main.matches(':disabled');
  let alive = true;
  c.cleanup(() => { alive = false; });

  if (n.action.kind !== 'host') {
    // Preserve direct native button identity and the exact Forms draft policies.
    if (hint) {
      main.setAttribute('aria-label', n.label);
      main.setAttribute('aria-describedby', hint.id);
      main.append(hint);
    }
    c.bind(() => { main.disabled = off(); });
    c.on(main, 'click', () => {
      if (!alive || disabled()) return;
      if (n.action.kind === 'reset') c.fromControl({ ...initial }, 'reset');
      else if (n.action.kind === 'set') c.fromControl({ [n.action.bind]: n.action.value }, 'replace');
    });
    return main;
  }

  const name = n.action.name;
  const out = c.element('div', 'iui-button-host');
  const controls = c.element('div', 'iui-button-controls');
  const cancel = c.element('button', 'iui-button-cancel', labels.cancel);
  const status = c.element('span', 'iui-button-status');
  main.id = `${internal}-main`;
  cancel.id = `${internal}-cancel`;
  cancel.type = 'button';
  cancel.hidden = true;
  status.id = `${internal}-status`;
  status.tabIndex = -1;
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  main.setAttribute('aria-describedby', [hint?.id, status.id].filter(Boolean).join(' '));
  controls.append(main, cancel);
  out.append(controls);
  if (hint) out.append(hint);
  out.append(status);
  out.dataset.status = 'idle';

  let busy = false, transitioning = false, generation = 0;
  let abort: AbortController | undefined;
  let snapshot: Readonly<Record<string, StateValue>> | undefined;
  const unchanged = () => {
    const state = c.getState();
    return snapshot !== undefined && Object.keys(state).length === Object.keys(snapshot).length
      && Object.keys(snapshot).every(key => Object.is(state[key], snapshot![key]));
  };
  const setStatus = (state: string, message: string) => {
    out.dataset.status = state;
    status.textContent = message;
  };
  const paint = () => {
    main.disabled = off();
    main.setAttribute('aria-disabled', String(main.disabled || busy));
    main.setAttribute('aria-busy', String(busy));
    main.textContent = busy ? `${n.label} (${labels.working})` : n.label;
    cancel.hidden = !busy;
  };
  const fallback = (wasCancelFocused: boolean) => {
    if (wasCancelFocused && alive && out.isConnected) (disabled() ? status : main).focus();
  };
  const settle = (ticket: number, result: 'success' | 'error' | 'unavailable') => {
    if (!alive || ticket !== generation) return;
    transitioning = true;
    try {
      const focused = c.doc.activeElement === cancel;
      busy = false;
      abort = undefined;
      if (result === 'success' && !unchanged()) setStatus('idle', '');
      else setStatus(result, result === 'success' ? labels.completed : result === 'error' ? labels.failed : labels.unavailable);
      paint();
      fallback(focused);
    } finally { transitioning = false; }
  };
  c.bind(() => {
    if (!busy && out.dataset.status === 'success' && !unchanged()) setStatus('idle', '');
    paint();
  });
  // Use native click synthesis for pointer, touch, Enter and Space; no parallel
  // keydown handler that can double-dispatch or submit an enclosing form.
  c.on(main, 'click', () => {
    if (!alive || busy || transitioning || disabled() || !out.isConnected) return;
    transitioning = true;
    const ticket = ++generation;
    try {
      const action = Object.hasOwn(c.actions, name) ? c.actions[name] : undefined;
      const win = c.doc.defaultView;
      if (!alive || ticket !== generation) return;
      if (typeof action !== 'function' || !win?.AbortController || !win.Promise) {
        settle(ticket, 'unavailable');
        return;
      }
      abort = new win.AbortController();
      const signal = abort.signal;
      snapshot = Object.freeze({ ...c.getState() });
      busy = true;
      setStatus('busy', labels.pending);
      paint();
      const work = action(Object.freeze({ values: snapshot, signal }));
      // Promise.resolve safely assimilates throwing getters and foreign thenables.
      // Attach both handlers immediately, even if the callback updated/disposed us.
      if (work === undefined) settle(ticket, 'success');
      else win.Promise.resolve(work).then(() => settle(ticket, 'success'), () => settle(ticket, 'error'));
    } catch { settle(ticket, 'error'); }
    finally { transitioning = false; }
  });
  c.on(cancel, 'click', () => {
    if (!alive || !busy || transitioning || cancel.matches(':disabled')) return;
    transitioning = true;
    const focused = c.doc.activeElement === cancel;
    const pending = abort;
    ++generation;
    abort = undefined;
    busy = false;
    try {
      setStatus('cancelled', labels.cancelled);
      paint();
      fallback(focused);
      // Invalidate before abort: synchronous abort listeners may update/dispose.
      pending?.abort();
    } finally { transitioning = false; }
  });
  c.cleanup(() => {
    alive = false;
    ++generation;
    const pending = abort;
    abort = undefined;
    busy = false;
    pending?.abort();
  });
  return out;
}
