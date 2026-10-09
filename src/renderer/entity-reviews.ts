import type {EntityReviewsNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {ReviewsLabels} from './entity-reviews-labels.js';
import {matchesReview, reviewOrder, reviewFilters, reviewSorts, type ReviewFilter, type ReviewSort} from '../core/entity-reviews.js';

let serial = 0;
/** Local presentation only: keep every review's actual DOM, with no host bindings. */
export function renderEntityReviews(c: RendererContext, node: EntityReviewsNode, labels: ReviewsLabels): HTMLElement {
  const out = c.element('section', 'iui-reviews');
  const base = `iui-reviews-internal-${c.prefix}${++serial}`;
  const title = c.element('h2', 'iui-reviews-label', node.label);
  title.id = `${base}-label`; out.setAttribute('aria-labelledby', title.id); out.append(title);
  const descriptions: string[] = [];
  if (node.description !== undefined) {
    const description = c.element('p', 'iui-reviews-description', node.description);
    description.id = `${base}-description`; out.append(description); descriptions.push(description.id);
  }
  const note = c.element('p', 'iui-reviews-note', labels.note);
  note.id = `${base}-note`; out.append(note); descriptions.push(note.id);
  out.setAttribute('aria-describedby', descriptions.join(' '));
  const externalLink = (url: string, text: string, cls: string) => {
    const a = c.element('a', cls, `${text} (${labels.opensNewTab})`);
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.referrerPolicy = 'no-referrer'; return a;
  };
  if (node.source) {
    const source = c.element('p', 'iui-reviews-source'); source.append(c.element('span', '', `${labels.source}: `));
    source.append(node.source.url === undefined ? c.element('span', 'iui-reviews-source-label', node.source.label) : externalLink(node.source.url, node.source.label, 'iui-reviews-source-link'));
    out.append(source);
  }
  const toolbar = c.element('div', 'iui-reviews-toolbar');
  function selector<T extends string>(name: string, text: string, values: readonly T[], choices: Readonly<Record<T, string>>) {
    const group = c.element('div', 'iui-reviews-control'), label = c.element('label', '', text), select = c.element('select', `iui-reviews-${name}`);
    select.id = `${base}-${name}`; label.htmlFor = select.id;
    for (const value of values) { const option = c.element('option', '', choices[value]); option.value = value; select.append(option); }
    select.disabled = node.items.length === 0; group.append(label, select); toolbar.append(group); return select;
  }
  const filter = selector('filter', labels.filter, reviewFilters, labels.filters);
  const sort = selector('sort', labels.sort, reviewSorts, labels.sorts);
  const count = c.element('p', 'iui-reviews-count'); count.id = `${base}-count`; count.setAttribute('role','status'); count.setAttribute('aria-atomic','true');
  filter.setAttribute('aria-describedby', count.id); sort.setAttribute('aria-describedby', count.id);
  out.append(toolbar, count);
  const list = c.element('ul', 'iui-reviews-list'); list.setAttribute('aria-labelledby', title.id);
  const rows = node.items.map((review, index) => {
    const row = c.element('li', 'iui-reviews-item'); row.dataset.reviewId = review.id;
    const author = c.element('h3', 'iui-reviews-author', review.author); author.id = `${base}-author-${index}`;
    row.append(author);
    if (review.title !== undefined) row.append(c.element('p', 'iui-reviews-title', review.title));
    row.append(c.element('p', 'iui-reviews-rating', review.rating === null ? labels.unrated : labels.rating(review.rating)));
    if (review.date !== undefined) { const time = c.element('time', 'iui-reviews-date', review.date); time.dateTime = review.date; time.dir = 'ltr'; row.append(time); }
    const details = c.element('details', 'iui-reviews-details'), summary = c.element('summary', '', labels.details);
    summary.setAttribute('aria-describedby', author.id);
    details.append(summary, c.element('p', 'iui-reviews-body', review.body)); row.append(details);
    if (review.url !== undefined) {const a = externalLink(review.url, labels.reviewLink, 'iui-reviews-link'); a.setAttribute('aria-describedby',author.id); row.append(a);}
    list.append(row); return row;
  });
  const empty = c.element('p', 'iui-reviews-empty'); out.append(list, empty);
  let selectedFilter: ReviewFilter = 'all', selectedSort: ReviewSort = 'supplied', disposed = false;
  function sync(select: HTMLSelectElement, value: string) {
    // Native enclosing-form reset must preserve this local presentation state.
    for (const option of select.options) option.defaultSelected = option.value === value;
    select.value = value;
  }
  function paint(responsible?: HTMLSelectElement) {
    const active = c.doc.activeElement;
    const focusedReviewControl = active && rows.some(row => row.contains(active)) && active.matches('a,summary') ? active as HTMLElement : undefined;
    sync(filter, selectedFilter); sync(sort, selectedSort);
    let visible = 0;
    rows.forEach((row, index) => { row.hidden = !matchesReview(node.items[index], selectedFilter); if (!row.hidden) visible++; });
    // Only move out-of-place rows; filter changes and repeated selections do not detach them.
    reviewOrder(node.items, selectedSort).forEach((index, position) => { if (list.children[position] !== rows[index]) list.insertBefore(rows[index], list.children[position] ?? null); });
    if (focusedReviewControl && responsible) {
      const hidden = rows.some(row => row.hidden && row.contains(focusedReviewControl));
      if (hidden) responsible.focus({preventScroll:true});
      else if (c.doc.activeElement !== focusedReviewControl) focusedReviewControl.focus({preventScroll:true});
    }
    // Focus can synchronously invoke a host update/dispose and retire this tree.
    if (disposed) return;
    const message = labels.count(visible, rows.length); if (count.textContent !== message) count.textContent = message;
    empty.hidden = visible > 0; empty.textContent = rows.length ? labels.noMatches : labels.noReviews;
  }
  c.on(filter, 'change', () => {
    if (disposed) return;
    if (filter.matches(':disabled') || !reviewFilters.includes(filter.value as ReviewFilter)) { sync(filter, selectedFilter); return; }
    selectedFilter = filter.value as ReviewFilter; paint(filter);
  });
  c.on(sort, 'change', () => {
    if (disposed) return;
    if (sort.matches(':disabled') || !reviewSorts.includes(sort.value as ReviewSort)) { sync(sort, selectedSort); return; }
    selectedSort = sort.value as ReviewSort; paint(sort);
  });
  c.cleanup(() => { disposed = true; }); paint(); return out;
}
