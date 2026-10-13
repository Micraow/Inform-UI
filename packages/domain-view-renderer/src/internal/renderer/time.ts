import type { ClockNode, StopwatchNode, TimerNode } from '../schema/document.js';
import type { RendererContext } from './context.js';
import type { TimeLabels } from './time-labels.js';
import { DurationSession, MAX_LAPS, durationISO, durationParts, formatDuration } from './time-model.js';
export type TimeNode = ClockNode | StopwatchNode | TimerNode;
export type { TimeLabels } from './time-labels.js';
let serial = 0;
const text = (target: HTMLElement, value: string) => { if (target.textContent !== value) target.textContent = value; };

/** Original offline time UI; validation belongs to core, lifecycle belongs to its mount context. */
export function renderTime(c: RendererContext, n: TimeNode, labels: TimeLabels): HTMLElement {
  const e = c.element, win = c.doc.defaultView;
  if (!win) throw new Error('Time controls require a document window');
  const id = `iui-time-internal-${c.prefix}${++serial}`, root = e('section', 'iui-time');
  root.dataset.kind = n.type;
  const title = e('h2', 'iui-time-title', n.title ?? labels[n.type]); title.id = `${id}-title`;
  root.setAttribute('aria-labelledby', title.id);
  const readout = e('time', 'iui-time-digits'); readout.setAttribute('aria-live', 'off');
  const note = e('p', 'iui-time-note'); note.id = `${id}-note`;
  root.setAttribute('aria-describedby', note.id);
  root.append(title, readout);
  let timeout: number | undefined, disposed = false;
  const cancel = () => { if (timeout !== undefined) { win.clearTimeout(timeout); timeout = undefined; } };
  c.cleanup(() => { disposed = true; cancel(); });
  const schedule = (callback: () => void, delay: number) => {
    cancel(); if (!disposed) timeout = win.setTimeout(() => { timeout = undefined; if (!disposed) callback(); }, delay);
  };
  if (n.type === 'clock') {
    const locale = labels.locale;
    const formatter = new Intl.DateTimeFormat(locale, { timeZone: n.timezone, hour: '2-digit', minute: '2-digit', ...(n.seconds === false ? {} : { second: '2-digit' }), hourCycle: n.hourCycle ?? 'h23' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { timeZone: n.timezone, year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    const dateParts = new Intl.DateTimeFormat('en-US-u-ca-iso8601-nu-latn', { timeZone: n.timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const date = e('time', 'iui-time-date'), zone = e('p', 'iui-time-zone', n.timezone);
    const mode = e('span', 'iui-time-mode', labels[n.mode]); title.append(e('span', 'iui-time-separator', ' · '), mode);
    root.dataset.mode = n.mode; note.textContent = n.mode === 'live' ? labels.deviceTime : labels.snapshotNote;
    root.append(date, zone, note);
    // The document window owns the clock. Snapshot mode never reads the current time.
    const fixed = n.mode === 'snapshot' ? Date.parse(n.at!) : undefined;
    if (n.mode === 'snapshot' && !Number.isFinite(fixed)) throw new RangeError('Invalid snapshot instant');
    const paint = () => {
      if (disposed) return;
      const milliseconds = fixed ?? (win as Window & typeof globalThis).Date.now(), instant = new Date(milliseconds);
      text(readout, formatter.format(instant)); readout.dateTime = instant.toISOString();
      text(date, dateFormatter.format(instant));
      const parts = dateParts.formatToParts(instant), part = (type: string) => parts.find(p => p.type === type)?.value ?? '';
      date.dateTime = `${part('year').padStart(4, '0')}-${part('month')}-${part('day')}`;
      if (n.mode === 'live') { const interval = n.seconds === false ? 60_000 : 1_000; schedule(paint, interval - (milliseconds % interval)); }
    };
    paint();
    if (n.mode === 'live') { c.on(c.doc, 'visibilitychange', paint); c.on(win, 'pageshow', paint); }
    return root;
  }
  const countdown = n.type === 'timer', session = new DurationSession(n.type, countdown ? n.durationMs : n.elapsedMs ?? 0);
  readout.setAttribute('role', 'timer');
  const format = e('p', 'iui-time-format', labels.durationFormat); format.id = `${id}-format`;
  readout.setAttribute('aria-describedby', format.id);
  const status = e('p', 'iui-time-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
  const actions = e('div', 'iui-time-actions');
  const button = (action: string, label: string) => { const b = e('button', '', label); b.type = 'button'; b.dataset.timeAction = action; actions.append(b); return b; };
  // Separate start and pause buttons make repeated input idempotent; focus is never moved by ticks.
  const start = button('start', labels.start), pause = button('pause', labels.pause), reset = button('reset', labels.reset);
  const lapButton = n.type === 'stopwatch' && n.laps !== false ? button('lap', labels.lap) : undefined;
  note.textContent = labels.inPageNote;
  root.append(format, status, actions, note);
  let lastState = '', lastCount = 0;
  const lapRegion = lapButton ? e('div', 'iui-time-lap-region') : undefined;
  const lapBody = lapButton ? e('tbody') : undefined;
  const lapEmpty = lapButton ? e('p', 'iui-time-lap-empty', labels.noLaps) : undefined;
  const lapLimit = lapButton ? e('p', 'iui-time-lap-limit', labels.lapLimit) : undefined;
  if (lapRegion && lapBody && lapEmpty && lapLimit) {
    lapRegion.tabIndex = 0; lapRegion.setAttribute('role', 'region'); lapRegion.setAttribute('aria-label', labels.laps);
    const table = e('table', 'iui-time-laps'), caption = e('caption', '', labels.laps), head = e('thead'), row = e('tr');
    for (const label of [labels.lapNumber, labels.total, labels.split]) { const th = e('th', '', label); th.scope = 'col'; row.append(th); }
    head.append(row); table.append(caption, head, lapBody); lapRegion.append(table);
    lapLimit.id = `${id}-lap-limit`; lapButton!.setAttribute('aria-describedby', lapLimit.id);
    root.append(lapEmpty, lapRegion, lapLimit);
  }
  const now = () => win.performance.now();
  const paint = () => {
    if (disposed) return;
    const focused = c.doc.activeElement;
    const value = session.sample(now()), state = session.status, parts = durationParts(value, countdown);
    text(readout, formatDuration(value, countdown)); readout.dateTime = durationISO(value); readout.dataset.milliseconds = String(value);
    readout.setAttribute('aria-label', `${countdown ? labels.remaining : labels.elapsed}: ${parts.hours} ${labels.hours}, ${parts.minutes} ${labels.minutes}, ${parts.seconds}.${String(parts.hundredths).padStart(2, '0')} ${labels.seconds}`);
    root.dataset.status = state;
    start.disabled = state === 'running' || state === 'limit'; pause.disabled = state !== 'running';
    text(start, state === 'complete' ? labels.restart : state === 'paused' ? labels.resume : labels.start);
    if (state !== lastState) { text(status, labels[state]); lastState = state; }
    if (lapButton && lapRegion && lapBody && lapEmpty && lapLimit) {
      const count = session.laps.length;
      lapButton.disabled = state !== 'running' || count >= MAX_LAPS;
      lapLimit.hidden = count < MAX_LAPS; lapEmpty.hidden = count > 0; lapRegion.hidden = count === 0;
      if (count < lastCount) lapBody.replaceChildren();
      for (let index = count < lastCount ? 0 : lastCount; index < count; index++) {
        const lap = session.laps[index], row = e('tr'), number = e('th', '', index + 1); number.scope = 'row';
        const total = e('td', '', formatDuration(lap.totalMs)), split = e('td', '', formatDuration(lap.splitMs));
        total.dataset.milliseconds = String(lap.totalMs); split.dataset.milliseconds = String(lap.splitMs);
        row.append(number, total, split); lapBody.append(row);
      }
      lastCount = count;
    }
    // Native disabling can blur a focused button. Move only that now-unavailable focus,
    // never focus elsewhere on ordinary ticks or when another component has focus.
    if ((focused === start && start.disabled) || (focused === pause && pause.disabled) || (focused === lapButton && lapButton.disabled)) {
      const next = state === 'running' ? pause : state === 'limit' ? reset : start;
      next.focus({ preventScroll: true });
    }
    if (state === 'running') schedule(paint, Math.max(1, Math.min(25, countdown ? value : session.limitMs - value)));
    else cancel();
  };
  c.on(start, 'click', () => {
    if (disposed) return;
    if (session.status === 'complete') session.reset();
    if (session.start(now())) paint();
  });
  c.on(pause, 'click', () => { if (!disposed && session.pause(now())) paint(); });
  c.on(reset, 'click', () => { if (!disposed) { session.reset(); paint(); } });
  if (lapButton) c.on(lapButton, 'click', () => {
    if (disposed) return;
    const lap = session.lap(now()); paint();
    if (lap) text(status, `${labels.running} · ${labels.lapSaved} ${session.laps.length}${session.laps.length === MAX_LAPS ? ` · ${labels.lapLimit}` : ''}`);
  });
  c.on(c.doc, 'visibilitychange', () => { if (session.status === 'running') paint(); });
  c.on(win, 'pageshow', () => { if (session.status === 'running') paint(); });
  paint();
  return root;
}
