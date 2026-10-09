import type { RendererContext } from './context.js';
import type { FlowNode, IconNode, PulseIndicatorNode } from '../schema/document.js';
import type { PrimitiveLabels } from './primitive-labels.js';

type Shape = readonly [tag: 'path' | 'circle' | 'line' | 'polyline', attrs: Readonly<Record<string, string | number>>];
/** Ten original, deliberately finite semantic glyphs. Every coordinate is project
 * authored. Nothing is imported from a captured UI or an external icon library. */
const geometry: Readonly<Record<IconNode['name'], readonly Shape[]>> = {
  info: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'M11 11h1v6M10 17h4' }], ['circle', { cx: 12, cy: 7.5, r: .65, fill: 'currentColor', stroke: 'none' }]],
  check: [['polyline', { points: '4.5,12 9.5,17 19.5,6.5' }]],
  warning: [['path', { d: 'M12 3.5 21 20H3Z' }], ['line', { x1: 12, y1: 9, x2: 12, y2: 13.5 }], ['circle', { cx: 12, cy: 17, r: .65, fill: 'currentColor', stroke: 'none' }]],
  error: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'm8.5 8.5 7 7m0-7-7 7' }]],
  plus: [['path', { d: 'M5 12h14M12 5v14' }]],
  minus: [['line', { x1: 5, y1: 12, x2: 19, y2: 12 }]],
  'arrow-left': [['path', { d: 'M20 12H4m7-7-7 7 7 7' }]],
  'arrow-right': [['path', { d: 'M4 12h16m-7-7 7 7-7 7' }]],
  'external-link': [['path', { d: 'M10 5H5v14h14v-5M13 4h7v7M20 4 10 14' }]],
  clock: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['polyline', { points: '12,6.5 12,12 16,14.5' }]]
};

/** Pure construction: no listeners, timers, observers, state binding or network.
 * The public mount validates the whole document before dispatch. IDs and data-iui
 * are applied by that dispatcher, exactly as for existing ordinary nodes. */
export function renderPrimitive(
  c: RendererContext,
  n: FlowNode | IconNode | PulseIndicatorNode,
  labels: PrimitiveLabels
): HTMLElement | SVGElement {
  switch (n.type) {
    case 'flow': {
      const out = c.element('div', 'iui-flow');
      out.dataset.gap = n.gap ?? 'md';
      out.dataset.align = n.align ?? 'center';
      out.dataset.justify = n.justify ?? 'start';
      // Append each real child exactly once. No wrappers, reorder or rerender on
      // unrelated setState: child renderers own their bindings and local state.
      for (const child of n.children) out.append(c.render(child));
      return out;
    }
    case 'icon': {
      if (!Object.hasOwn(geometry, n.name)) throw new TypeError('Unsupported primitive icon');
      const size = { sm: 16, md: 20, lg: 24 }[n.size ?? 'md'];
      const out = c.svg('svg', {
        class: 'iui-icon', viewBox: '0 0 24 24', width: size, height: size,
        fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', focusable: 'false'
      });
      out.dataset.name = n.name; out.dataset.size = n.size ?? 'md'; out.dataset.tone = n.tone ?? 'default';
      if (n.label !== undefined) { out.setAttribute('role', 'img'); out.setAttribute('aria-label', n.label); }
      else out.setAttribute('aria-hidden', 'true');
      for (const [tag, attrs] of geometry[n.name]) out.append(c.svg(tag, attrs));
      return out;
    }
    case 'pulse-indicator': {
      const out = c.element('span', 'iui-pulse-indicator');
      out.dataset.status = n.status; out.dataset.animate = String(n.animate ?? true);
      const dot = c.element('span', 'iui-pulse-dot'); dot.setAttribute('aria-hidden', 'true');
      const content = c.element('span', 'iui-pulse-content');
      const label = c.element('span', 'iui-pulse-label', n.label);
      const status = c.element('span', 'iui-pulse-status', labels[n.status]);
      content.append(label, c.doc.createTextNode(' '), status);
      out.append(dot, content);
      // Deliberately no role=status/aria-live/aria-busy: this is caller-supplied
      // status text, not a live service monitor or a claim about subtree readiness.
      return out;
    }
    default: throw new TypeError('Unsupported primitive node');
  }
}
