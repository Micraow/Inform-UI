import type { Node } from '../schema/document.js';
import type { RendererContext } from './context.js';

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
interface Association { control?: Control; labels: Set<HTMLLabelElement> }

/** Local, synchronous native associations. No document lookup or event forwarding. */
export function createLabels(c: RendererContext) {
  const targets = new Map<string, Association>();
  let serial = 0;
  const entry = (id: string) => {
    let association = targets.get(id);
    if (!association) { association = { labels: new Set() }; targets.set(id, association); }
    return association;
  };
  const release = (id: string, association: Association) => {
    if (!association.control && !association.labels.size) targets.delete(id);
  };

  function render(n: Extract<Node, { type: 'label' }>): HTMLLabelElement {
    const out = c.element('label', 'iui-label', n.text);
    const association = entry(n.target);
    association.labels.add(out);
    if (association.control) out.htmlFor = association.control.id;
    c.cleanup(() => {
      out.removeAttribute('for');
      association.labels.delete(out);
      release(n.target, association);
    });
    return out;
  }

  function registerTarget(n: Node, out: HTMLElement | SVGElement): void {
    if (!n.id || !['input', 'textarea', 'slider', 'toggle', 'select'].includes(n.type)) return;
    // These renderers each own exactly one native control. The authored ID stays
    // on their wrapper, and pre-existing native label/control IDs stay intact.
    const control = out.querySelector<Control>('input, textarea, select');
    if (!control) throw new Error('Label target renderer requires a native control.');
    const assigned = !control.id;
    if (assigned) control.id = `iui-label-target-internal-${c.prefix}${++serial}`;
    const association = entry(n.id);
    association.control = control;
    for (const label of association.labels) label.htmlFor = control.id;
    c.cleanup(() => {
      for (const label of association.labels) label.removeAttribute('for');
      delete association.control;
      if (assigned) control.removeAttribute('id');
      release(n.id!, association);
    });
  }

  return { render, registerTarget };
}
