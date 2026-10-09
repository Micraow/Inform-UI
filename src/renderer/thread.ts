import type {RedditThreadCardNode, ThreadComment} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {ThreadLabels} from './thread-labels.js';
import {countThreadComments} from '../core/thread.js';

let serial = 0;
/** Native read-only disclosures. No bindings, listeners, actions, requests or rerenders. */
export function renderThread(c: RendererContext, node: RedditThreadCardNode, labels: ThreadLabels): HTMLElement {
  const out = c.element('article', 'iui-thread');
  const base = `iui-thread-internal-${c.prefix}${++serial}`;
  const title = c.element('h2', 'iui-thread-title', node.title); title.id = `${base}-title`;
  const note = c.element('p', 'iui-thread-note', labels.suppliedNote); note.id = `${base}-note`;
  out.setAttribute('aria-labelledby', title.id); out.setAttribute('aria-describedby', note.id);
  const field = (name: string, value: string, className: string) => {
    const line = c.element('p', 'iui-thread-meta');
    line.append(c.element('span', 'iui-thread-field-label', `${name}: `), c.element('bdi', className, value));
    return line;
  };
  const score = (value: number | null | undefined) => {
    const line = field(labels.score, value == null ? labels.notSupplied : String(value), 'iui-thread-score-value');
    line.classList.add('iui-thread-score');
    if (value != null) line.querySelector('bdi')!.dir = 'ltr';
    return line;
  };
  out.append(title);
  if (node.community !== undefined) out.append(field(labels.community, node.community, 'iui-thread-community'));
  out.append(field(labels.author, node.author, 'iui-thread-author'), score(node.score), c.element('p', 'iui-thread-body', node.body), note);
  const source = c.element('p', 'iui-thread-source'); source.append(c.element('span', '', `${labels.source}: `));
  if (node.source.url !== undefined) {
    const link = c.element('a', 'iui-thread-link'); link.href = node.source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
    link.append(c.element('bdi', 'iui-thread-source-label', node.source.label), c.doc.createTextNode(` (${labels.opensNewTab})`)); source.append(link);
  } else source.append(c.element('bdi', 'iui-thread-source-label', node.source.label));
  out.append(source);
  const list = (comments: readonly ThreadComment[], depth: number): HTMLUListElement => {
    const items = c.element('ul', 'iui-thread-comments');
    for (const comment of comments) {
      const item = c.element('li', 'iui-thread-comment-item'); item.dataset.commentId = comment.id; item.dataset.depth = String(depth);
      const article = c.element('article', 'iui-thread-comment');
      const author = field(labels.author, comment.author, 'iui-thread-comment-author'); author.id = `${base}-comment-${comment.id}`;
      article.setAttribute('aria-labelledby', author.id);
      article.append(author, score(comment.score), c.element('p', 'iui-thread-comment-body', comment.body));
      if (comment.replies?.length) {
        const replies = c.element('details', 'iui-thread-replies');
        replies.append(c.element('summary', '', labels.replies(countThreadComments(comment.replies))), list(comment.replies, depth + 1)); article.append(replies);
      }
      item.append(article); items.append(item);
    }
    return items;
  };
  if (node.comments.length) {
    const details = c.element('details', 'iui-thread-discussion'); details.open = node.expanded ?? false;
    details.append(c.element('summary', '', labels.comments(countThreadComments(node.comments))), list(node.comments, 1)); out.append(details);
  } else out.append(c.element('p', 'iui-thread-empty', labels.noComments));
  return out;
}
