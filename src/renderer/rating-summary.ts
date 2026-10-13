import type {RatingSummaryNode} from '../schema/document.js';
import type {RendererContext} from './context.js';

/** Original read-only supplied summary: one decorative star and exact labels. */
export function renderRatingSummary(c: RendererContext, n: RatingSummaryNode): HTMLElement {
  const out = n.provider ? c.element('a', 'iui-rating-summary') : c.element('span', 'iui-rating-summary');
  if (n.provider) {
    const link = out as HTMLAnchorElement;
    link.href = n.provider.url;
    link.rel = 'noreferrer';
    link.referrerPolicy = 'no-referrer';
  }
  const star = c.svg('svg', {
    class: 'iui-rating-summary-star', viewBox: '0 0 20 20',
    'aria-hidden': 'true', focusable: 'false', fill: 'currentColor',
  });
  // A regular five-point silhouette, authored here without external assets.
  star.append(c.svg('polygon', {points: '10,1 12.65,6.36 18.57,7.23 14.29,11.41 15.31,17.31 10,14.52 4.69,17.31 5.71,11.41 1.43,7.23 7.35,6.36'}));
  out.append(star);
  function label(className: string, value: string): void {
    const text = c.element('bdi', className, value);
    text.dir = 'auto';
    text.title = value;
    // Text-node separators preserve a natural accessible name outside flex layout.
    if (out.childElementCount > 1) out.append(c.doc.createTextNode(' '));
    out.append(text);
  }
  label('iui-rating-summary-rating', n.ratingLabel);
  if (n.reviewCountLabel !== undefined) label('iui-rating-summary-count', n.reviewCountLabel);
  if (n.provider) label('iui-rating-summary-provider', n.provider.label);
  return out;
}
