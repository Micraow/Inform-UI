import type { RendererContext } from './context.js';
import type { FlowNode, IconNode, PulseIndicatorNode } from '../schema/document.js';
import type { PrimitiveLabels } from './primitive-labels.js';
import { renderOfficialIcon, type OfficialIconName } from './official-icons.js';

/** Preserve the finite public names while using exact, pinned official geometry. */
const iconNames: Readonly<Record<IconNode['name'], OfficialIconName>> = {
  info: 'InfoCircle', check: 'Check', warning: 'TriangleExclamationErrorWarning',
  error: 'XCircle', plus: 'Plus', minus: 'Minus',
  'arrow-left': 'ArrowLeft', 'arrow-right': 'ArrowRight',
  'external-link': 'ExternalLink', clock: 'Clock'
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
      if (!Object.hasOwn(iconNames, n.name)) throw new TypeError('Unsupported primitive icon');
      const size = { sm: 16, md: 20, lg: 24 }[n.size ?? 'md'];
      const out = renderOfficialIcon(c, iconNames[n.name], { className: 'iui-icon', size, label: n.label });
      out.dataset.name = n.name; out.dataset.size = n.size ?? 'md'; out.dataset.tone = n.tone ?? 'default';
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
