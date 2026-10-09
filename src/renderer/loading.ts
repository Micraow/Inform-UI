import type { RendererContext } from './context.js';
import type { LoadingNode, LoadingBlockNode } from '../schema/document.js';
import type { LoadingLabels } from './loading-labels.js';

/** Only a defensive rendering boundary, never a second public validator.
 * The host must validate resolved values against candidate state BEFORE commit. */
function progressNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new TypeError('Loading progress must resolve to a finite number from 0 to 100');
  }
  return value;
}

/** Caller-supplied presentation. No network, timers, task observation, automatic
 * progress or live announcements. Bindings/lifecycle belong to the host context. */
export function renderLoading(
  c: RendererContext,
  n: LoadingNode | LoadingBlockNode,
  labels: LoadingLabels
): HTMLElement {
  if (n.type === 'loading') {
    const out = c.element('div', 'iui-loading');
    const determinate = n.progress !== undefined;
    out.dataset.kind = determinate ? 'determinate' : 'indeterminate';
    out.dataset.size = n.size ?? 'md';
    out.setAttribute('role', 'progressbar');
    out.setAttribute('aria-label', n.label);
    out.setAttribute('aria-valuemin', '0');
    out.setAttribute('aria-valuemax', '100');
    const header = c.element('div', 'iui-loading-header');
    header.append(c.element('span', 'iui-loading-label', n.label));
    out.append(header);
    if (determinate) {
      const track = c.element('div', 'iui-loading-track');
      track.setAttribute('aria-hidden', 'true');
      const fill = c.element('span', 'iui-loading-fill');
      track.append(fill); out.append(track);
      // Visual percentage is redundant with aria-valuenow, so it is decorative
      // to accessibility APIs. showValue=false never suppresses the ARIA value.
      const percent = n.showValue === false ? undefined : c.element('span', 'iui-loading-value');
      if (percent) { percent.setAttribute('aria-hidden', 'true'); header.append(percent); }
      c.bind(() => {
        const progress = progressNumber(c.value(n.progress!));
        const raw = String(progress);
        // Resolve and validate before ANY DOM mutation. No conversion/clamping.
        out.setAttribute('aria-valuenow', raw);
        out.dataset.value = raw;
        fill.style.inlineSize = `${raw}%`;
        if (percent) percent.textContent = labels.percent(progress);
      });
    } else {
      const mark = c.svg('svg', {
        class: 'iui-loading-spinner', viewBox: '0 0 24 24',
        fill: 'none', 'aria-hidden': 'true', focusable: 'false'
      });
      // Original finite geometry. No referenced SVG, URL, image or external font.
      mark.append(
        c.svg('circle', { class: 'iui-loading-spinner-ring', cx: 12, cy: 12, r: 8.5 }),
        c.svg('path', { class: 'iui-loading-spinner-arc', d: 'M12 3.5a8.5 8.5 0 0 1 8.5 8.5' })
      );
      const hint = c.element('span', 'iui-loading-hint', labels.indeterminate);
      header.prepend(mark); header.append(hint);
      // Missing progress is not zero. aria-valuenow and data-value stay absent.
    }
    return out;
  }

  if (n.type === 'loading-block') {
    const shape = n.shape ?? 'text';
    if (!['text', 'card', 'circle'].includes(shape)) throw new TypeError('Unsupported loading-block shape');
    if (shape !== 'text' && n.lines !== undefined) throw new TypeError('Loading-block lines require the text shape');
    const lines = n.lines ?? 3;
    if (!Number.isInteger(lines) || lines < 1 || lines > 10) throw new TypeError('Loading-block lines must be an integer from 1 to 10');
    const out = c.element('div', 'iui-loading-block');
    out.dataset.shape = shape;
    out.dataset.animate = String(n.animate ?? true);
    out.append(c.element('span', 'iui-loading-block-label', n.label));
    const shapes = c.element('div', 'iui-loading-block-shapes');
    shapes.setAttribute('aria-hidden', 'true');
    const part = (name: string) => c.element('span', `iui-loading-block-piece iui-loading-block-${name}`);
    if (shape === 'text') {
      for (let line = 0; line < lines; line++) shapes.append(part('line'));
    } else if (shape === 'card') {
      const copy = c.element('div', 'iui-loading-block-copy');
      copy.append(part('line'), part('line'));
      shapes.append(part('media'), copy);
    } else shapes.append(part('circle'));
    out.append(shapes);
    // Deliberately no role=status, aria-live or aria-busy on this or its host.
    return out;
  }
  throw new TypeError('Unsupported loading node');
}
