import { isSafeURL } from '../core/index.js';
import type { MarkdownNode } from '../schema/document.js';
import type { RendererContext } from './context.js';
import { parseMarkdown } from './markdown-parser.js';
import type { MarkdownLabels } from './markdown-labels.js';
import type { Inline } from './markdown-parser.js';
/** Static native DOM only. Authored content never becomes executable UI nodes. */
export function renderMarkdown(c: RendererContext, n: MarkdownNode, labels: MarkdownLabels): HTMLElement {
  const out = c.element('div', 'iui-markdown'), plan = parseMarkdown(n.value);
  if (plan.fallback) out.dataset.markdownFallback = 'budget';
  const append = (parent: HTMLElement, content: Inline[]) => {
    for (const token of content) {
      if (token.kind === 'text') { parent.append(c.doc.createTextNode(token.text)); continue; }
      if (token.kind === 'link') {
        if (!isSafeURL(token.href, 'link')) { parent.append(c.doc.createTextNode(token.source)); continue; }
        const a = c.element('a', '', token.text);
        if (token.href.startsWith('#')) a.href = `#${c.prefix}${token.href.slice(1)}`;
        else {
          a.href = token.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.referrerPolicy = 'no-referrer';
          a.append(c.element('span', 'iui-markdown-sr', ` (${/^https?:/i.test(token.href) ? labels.opensNewTab : labels.opensExternal})`));
        }
        parent.append(a); continue;
      }
      parent.append(c.element(token.kind, '', token.text));
    }
  };
  for (const block of plan.blocks) {
    if (block.kind === 'code') {
      const pre = c.element('pre', 'iui-code'); pre.tabIndex = 0; pre.setAttribute('aria-label', block.language ? `${block.language} ${c.labels().code}` : c.labels().code); pre.append(c.element('code', '', block.text));
      if (block.language) { const group = c.element('div', 'iui-markdown-code'); group.append(c.element('div', 'iui-markdown-language', block.language), pre); out.append(group); }
      else out.append(pre);
    } else if (block.kind === 'list') {
      const list = c.element(block.ordered ? 'ol' : 'ul');
      for (const item of block.items) { const li = c.element('li'); if (item.value !== undefined) li.value = item.value; append(li, item.content); list.append(li); } out.append(list);
    } else {
      const tag = block.kind === 'heading' ? `h${block.level}` as 'h1' : block.kind === 'quote' ? 'blockquote' : 'p';
      const element = c.element(tag, block.kind === 'literal' ? 'iui-markdown-literal' : ''); append(element, block.content); out.append(element);
    }
  }
  return out;
}
