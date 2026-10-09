import type {AnimateNode, CelebrationNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {MotionLabels} from './motion-labels.js';

type MotionTarget = { element: HTMLElement; frames: Keyframe[] };
type Outcome = 'completed' | 'stopped' | 'reduced' | 'unavailable' | 'failed';
let serial = 0;

/** Original finite, explicitly activated previews. Child DOM is never replaced. */
export function renderMotion(c: RendererContext, node: AnimateNode | CelebrationNode, labels: MotionLabels): HTMLElement {
  const out = c.element('section', `iui-motion iui-${node.type}`);
  const base = `iui-motion-internal-${c.prefix}${++serial}`;
  const title = c.element('h2', 'iui-motion-label', node.label);
  title.id = `${base}-label`; out.setAttribute('aria-labelledby', title.id); out.append(title);
  out.dataset.status = 'idle';
  const targets: MotionTarget[] = [];
  if (node.type === 'animate') {
    const content = c.element('div', 'iui-motion-content');
    for (const child of node.children) content.append(c.render(child));
    out.append(content);
    if (!node.children.length) { out.append(c.element('p', 'iui-motion-empty', labels.empty)); return out; }
    targets.push({ element: content, frames: node.effect === 'rise'
      ? [{ opacity: .35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0px)' }]
      : [{ opacity: .35 }, { opacity: 1 }] });
  } else {
    const note = c.element('p', 'iui-motion-note', labels.supplied);
    note.id = `${base}-note`; out.setAttribute('aria-describedby', note.id); out.append(note);
    out.append(c.element('p', 'iui-celebration-message', node.message));
    // Six fixed original ornaments, entirely separate from the reading/focus surface.
    const decoration = c.element('div', 'iui-celebration-decoration');
    decoration.setAttribute('aria-hidden', 'true');
    const pattern = [
      [12, 20, -8, -30, 'blue'], [27, 27, 6, 25, 'green'], [43, 18, -4, 40, 'orange'],
      [59, 25, 8, -25, 'purple'], [74, 17, -6, 30, 'blue'], [88, 26, 4, -40, 'green']
    ] as const;
    for (const [position, top, drift, rotation, color] of pattern) {
      const shape = c.element('span', 'iui-celebration-shape');
      shape.style.insetInlineStart = `${position}%`; shape.style.top = `${top}px`;
      shape.style.backgroundColor = `var(--iui-series-${color})`; decoration.append(shape);
      targets.push({ element: shape, frames: [
        { opacity: .35, transform: 'translate(0px, 8px) rotate(0deg)' },
        { opacity: .8, transform: `translate(${drift}px, -8px) rotate(${rotation}deg)` },
        { opacity: .35, transform: 'translate(0px, 0px) rotate(0deg)' }
      ] });
    }
    out.append(decoration);
  }
  const controls = c.element('div', 'iui-motion-controls');
  const preview = c.element('button', 'iui-motion-preview', node.type === 'animate' ? labels.previewMotion : labels.previewCelebration);
  const stop = c.element('button', 'iui-motion-stop', labels.stop);
  for (const button of [preview, stop]) { button.type = 'button'; button.disabled = node.disabled ?? false; }
  const status = c.element('p', 'iui-motion-status');
  status.id = `${base}-status`; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
  for (const button of [preview, stop]) button.setAttribute('aria-describedby', status.id);
  controls.append(preview, stop); out.append(controls, status);

  let alive = true, playing = false, transitioning = false, generation = 0;
  let owned: Animation[] = [];
  let unsubscribe: (() => void) | undefined;
  const live = (ticket: number) => alive && ticket === generation;
  const paint = () => {
    preview.setAttribute('aria-disabled', String(Boolean(node.disabled) || playing));
    stop.setAttribute('aria-disabled', String(Boolean(node.disabled) || !playing));
  };
  const release = () => {
    const animations = owned, detach = unsubscribe; owned = []; unsubscribe = undefined;
    // Invalidate before invoking platform hooks: even patched hooks may reenter.
    let released = true;
    try { detach?.(); } catch { released = false; }
    for (const animation of animations) { try { animation.cancel(); } catch { released = false; } }
    return released;
  };
  const settle = (ticket: number, outcome: Outcome) => {
    if (!live(ticket)) return;
    const wasTransitioning = transitioning; transitioning = true;
    const settled = ++generation; playing = false;
    out.dataset.status = outcome; status.textContent = labels[outcome]; paint();
    try {
      const released = release();
      if (!released && live(settled)) { out.dataset.status = 'failed'; status.textContent = labels.failed; }
    } finally { transitioning = wasTransitioning; }
  };
  c.cleanup(() => { alive = false; ++generation; playing = false; release(); });
  c.on(preview, 'click', () => {
    if (!alive || playing || transitioning || preview.matches(':disabled') || !out.isConnected) return;
    transitioning = true;
    const ticket = ++generation;
    try {
      const win = c.doc.defaultView, PromiseClass = win?.Promise;
      if (!live(ticket)) return;
      if (!win || !PromiseClass) { settle(ticket, 'unavailable'); return; }
      const matchMedia = win.matchMedia;
      if (!live(ticket)) return;
      if (typeof matchMedia === 'function') {
        const media = matchMedia.call(win, '(prefers-reduced-motion: reduce)');
        if (!live(ticket)) return;
        if (media.matches) { if (live(ticket)) settle(ticket, 'reduced'); return; }
        if (!live(ticket)) return;
        const changed = () => {
          if (!live(ticket)) return;
          try { if (media.matches) settle(ticket, 'reduced'); }
          catch { settle(ticket, 'failed'); }
        };
        const add = media.addEventListener, remove = media.removeEventListener;
        if (!live(ticket)) return;
        if (typeof add === 'function' && typeof remove === 'function') {
          unsubscribe = () => remove.call(media, 'change', changed);
          try { add.call(media, 'change', changed); }
          finally { if (!live(ticket)) { try { remove.call(media, 'change', changed); } catch { /* Retired listener. */ } } }
        } else {
          const addLegacy = media.addListener, removeLegacy = media.removeListener;
          if (!live(ticket)) return;
          if (typeof addLegacy === 'function' && typeof removeLegacy === 'function') {
            unsubscribe = () => removeLegacy.call(media, changed);
            try { addLegacy.call(media, changed); }
            finally { if (!live(ticket)) { try { removeLegacy.call(media, changed); } catch { /* Retired listener. */ } } }
          } else { settle(ticket, 'unavailable'); return; }
        }
        if (!live(ticket)) return;
        if (media.matches) { if (live(ticket)) settle(ticket, 'reduced'); return; }
      }
      if (!live(ticket)) return;
      // Inspect every API before starting any shape; never leave a partial preview.
      const methods: typeof Element.prototype.animate[] = [];
      for (const target of targets) {
        const animate = target.element.animate;
        if (!live(ticket)) return;
        if (typeof animate !== 'function') { settle(ticket, 'unavailable'); return; }
        methods.push(animate);
      }
      playing = true; out.dataset.status = 'playing'; status.textContent = labels.playing; paint();
      let remaining = targets.length;
      for (const [index, target] of targets.entries()) {
        if (!live(ticket)) return;
        const animation = methods[index].call(target.element, target.frames, {
          duration: node.duration ?? (node.type === 'animate' ? 300 : 900),
          iterations: 1, easing: 'ease-out', fill: 'none'
        });
        // Observe returned promises even when animate synchronously retired us.
        const current = live(ticket);
        if (current) owned.push(animation);
        try {
          const finished = animation.finished;
          if (!finished || typeof finished.then !== 'function') throw new win.Error('No animation completion promise');
          PromiseClass.resolve(finished).then(
            () => { if (live(ticket) && --remaining === 0) settle(ticket, 'completed'); },
            () => settle(ticket, 'failed')
          );
        } finally {
          if (!live(ticket)) { try { animation.cancel(); } catch { /* Retired handle. */ } }
        }
        if (!live(ticket)) return;
      }
    } catch { settle(ticket, 'failed'); }
    finally { transitioning = false; }
  });
  c.on(stop, 'click', () => {
    if (!alive || !playing || transitioning || stop.matches(':disabled') || !out.isConnected) return;
    settle(generation, 'stopped');
  });
  paint(); return out;
}
