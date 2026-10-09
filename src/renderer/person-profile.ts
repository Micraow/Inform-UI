import type {PersonProfileNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {PersonLabels} from './person-labels.js';

let serial = 0;
/** Static supplied content. Native disclosure state survives unrelated host updates. */
export function renderPersonProfile(c: RendererContext, node: PersonProfileNode, labels: PersonLabels): HTMLElement {
  const out = c.element('article', 'iui-person-profile');
  const base = 'iui-person-internal-'+c.prefix+(++serial);
  const name = c.element('h2', 'iui-person-name', node.name); name.id = base+'-name';
  out.setAttribute('aria-labelledby', name.id); out.append(name);
  for (const field of ['role', 'organization', 'location'] as const) {
    if (node[field] !== undefined) {
      const line = c.element('p', 'iui-person-'+field);
      line.append(c.element('span', 'iui-person-field-label', labels[field]+': '), c.element('span', 'iui-person-field-value', node[field]));
      out.append(line);
    }
  }
  const note = c.element('p', 'iui-person-note', labels.suppliedNote); note.id = base+'-note';
  out.setAttribute('aria-describedby', note.id); out.append(note);
  if (node.facts?.length) {
    const facts = c.element('dl', 'iui-person-facts'); facts.setAttribute('aria-label', labels.facts);
    for (const fact of node.facts) {
      const row = c.element('div', 'iui-person-fact'); row.dataset.factId = fact.id;
      row.append(c.element('dt', '', fact.label), c.element('dd', '', fact.value)); facts.append(row);
    }
    out.append(facts);
  }
  if (node.biography !== undefined) {
    const details = c.element('details', 'iui-person-biography'); details.open = node.expanded ?? false;
    details.append(c.element('summary', '', labels.biography), c.element('p', 'iui-person-biography-text', node.biography)); out.append(details);
  }
  const link = (label: string, url: string) => {
    const anchor = c.element('a', 'iui-person-link'); anchor.href = url;
    anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.referrerPolicy = 'no-referrer';
    anchor.append(c.element('span', 'iui-person-link-label', label), c.element('span', 'iui-person-link-hint', ' ('+labels.opensNewTab+')'));
    return anchor;
  };
  if (node.links?.length) {
    const section = c.element('section', 'iui-person-links');
    const heading = c.element('h3', 'iui-person-links-title', labels.links); heading.id = base+'-links';
    section.setAttribute('aria-labelledby', heading.id); section.append(heading);
    const list = c.element('ul');
    for (const item of node.links) {
      const row = c.element('li'); row.dataset.linkId = item.id; row.append(link(item.label, item.url)); list.append(row);
    }
    section.append(list); out.append(section);
  }
  if (node.source !== undefined) {
    const source = c.element('p', 'iui-person-source'); source.append(c.element('span', 'iui-person-field-label', labels.source+': '));
    source.append(node.source.url === undefined ? c.element('span', 'iui-person-source-label', node.source.label) : link(node.source.label, node.source.url)); out.append(source);
  }
  return out;
}
