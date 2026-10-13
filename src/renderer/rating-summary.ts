import type {RatingSummaryNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import {renderOfficialIcon} from './official-icons.js';

/** Original read-only supplied summary: one decorative star and exact labels. */
export function renderRatingSummary(c: RendererContext, n: RatingSummaryNode): HTMLElement {
  const out = n.provider ? c.element('a', 'iui-rating-summary') : c.element('span', 'iui-rating-summary');
  if (n.provider) {
    const link = out as HTMLAnchorElement;
    link.href = n.provider.url;
    link.rel = 'noreferrer';
    link.referrerPolicy = 'no-referrer';
  }
  const star = renderOfficialIcon(c, 'StarFilled', {className: 'iui-rating-summary-star', size: 14});
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
