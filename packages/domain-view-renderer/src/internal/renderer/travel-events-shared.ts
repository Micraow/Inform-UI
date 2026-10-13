import type {RendererContext} from './context.js';
import type {TravelEventsLabels} from './travel-events-labels.js';

/** Ordinary supplied links: no handler, prefetch, image, or business action. */
export function travelLink(c: RendererContext, url: string, text: string, labels: TravelEventsLabels): HTMLAnchorElement {
  const link = c.element('a','',`${text} (${labels.opensNewTab})`);
  link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
  return link;
}
export function travelSource(c: RendererContext, source: {label:string;url:string}, labels: TravelEventsLabels): HTMLElement {
  const out = c.element('p','iui-travel-source'); out.append(c.doc.createTextNode(`${labels.source}: `),travelLink(c,source.url,source.label,labels)); return out;
}
