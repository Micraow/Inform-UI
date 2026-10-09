import type {NewsArticleNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {NewsLabels} from './news-labels.js';

let serial = 0;
/** Static supplied content with browser-owned disclosure. No bind, state, events or requests. */
export function renderNewsArticle(c: RendererContext, node: NewsArticleNode, labels: NewsLabels): HTMLElement {
  const out = c.element('article', 'iui-news-article');
  // Authored IDs always start with c.prefix; this namespace cannot collide with them.
  const base = `iui-news-internal-${c.prefix}${++serial}`;
  const headline = c.element('h2', 'iui-news-headline', node.headline);
  headline.id = `${base}-headline`;
  out.setAttribute('aria-labelledby', headline.id);
  out.append(headline);
  const metadata = c.element('dl', 'iui-news-metadata');
  const field = (label: string, value: HTMLElement) => {
    const item = c.element('div', 'iui-news-meta-item');
    const dd = c.element('dd'); dd.append(value); item.append(c.element('dt', '', label), dd); metadata.append(item);
  };
  const source = c.element('span', 'iui-news-source');
  if (node.source.url === undefined) source.textContent = node.source.label;
  else {
    const link = c.element('a', 'iui-news-source-link');
    link.href = node.source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
    link.append(c.element('span', 'iui-news-source-label', node.source.label), c.element('span', 'iui-news-link-hint', ` (${labels.opensNewTab})`)); source.append(link);
  }
  field(labels.source, source);
  if (node.author !== undefined) field(labels.author, c.element('span', 'iui-news-author', node.author));
  if (node.published !== undefined) {
    const date = c.element('time', 'iui-news-published', node.published); date.dateTime = node.published; date.dir = 'ltr'; field(labels.published, date);
  }
  out.append(metadata);
  const note = c.element('p', 'iui-news-note', labels.suppliedNote); note.id = `${base}-note`;
  out.setAttribute('aria-describedby', note.id); out.append(note);
  if (node.tags?.length) {
    const tags = c.element('ul', 'iui-news-tags'); tags.setAttribute('aria-label', labels.tags);
    for (const tag of node.tags) tags.append(c.element('li', 'iui-news-tag', tag));
    out.append(tags);
  }
  if (node.summary !== undefined) out.append(c.element('p', 'iui-news-summary', node.summary));
  if (node.paragraphs?.length) {
    const details = c.element('details', 'iui-news-details'); details.open = node.expanded ?? false;
    details.append(c.element('summary', '', labels.readArticle));
    const body = c.element('div', 'iui-news-body');
    for (const paragraph of node.paragraphs) body.append(c.element('p', 'iui-news-paragraph', paragraph));
    details.append(body); out.append(details);
  }
  return out;
}
