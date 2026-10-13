import type {EntityReviewsNode, ReviewRecord} from '../schema/document.js';
import type {Issue} from './index.js';
import {validInputDate} from './extensions.js';

/** Inspect only supplied data. No provider, current-date or aggregate-score semantics. */
export function inspectEntityReviews(node: EntityReviewsNode, path: string, add: (issue: Issue) => void, safeURL: (url: string) => boolean): void {
  const link = (url: string, at: string) => {
    if (!/^https?:\/\//i.test(url) || !safeURL(url)) add({code:'UNSAFE_URL',path:at,message:'Review links require allowed absolute HTTP(S) destinations.'});
  };
  if (node.source?.url !== undefined) link(node.source.url, `${path}/source/url`);
  const ids = new Set<string>();
  node.items.forEach((review, index) => {
    const at = `${path}/items/${index}`;
    if (ids.has(review.id)) add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Review IDs must be unique within their supplied collection.'});
    ids.add(review.id);
    if (review.date !== undefined && !validInputDate(review.date)) add({code:'REVIEW_DATE',path:`${at}/date`,message:'Use a real Gregorian date in YYYY-MM-DD format, years 0001–9999.'});
    if (review.url !== undefined) link(review.url, `${at}/url`);
  });
}

export const reviewFilters = ['all','rated','unrated','5','4','3','2','1'] as const;
export const reviewSorts = ['supplied','newest','highest','lowest'] as const;
export type ReviewFilter = typeof reviewFilters[number];
export type ReviewSort = typeof reviewSorts[number];
export function matchesReview(review: ReviewRecord, filter: ReviewFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'rated') return review.rating !== null;
  if (filter === 'unrated') return review.rating === null;
  return review.rating === Number(filter);
}
/** Original indices explicitly break ties; missing dates/ratings always sort last. */
export function reviewOrder(items: readonly ReviewRecord[], sort: ReviewSort): number[] {
  return items.map((_, index) => index).sort((a, b) => {
    if (sort === 'supplied') return a - b;
    const x = sort === 'newest' ? items[a].date ?? null : items[a].rating;
    const y = sort === 'newest' ? items[b].date ?? null : items[b].rating;
    if (x === null) return y === null ? a - b : 1;
    if (y === null) return -1;
    const comparison = x < y ? -1 : x > y ? 1 : 0;
    return (sort === 'lowest' ? comparison : -comparison) || a - b;
  });
}
