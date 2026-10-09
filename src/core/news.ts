import type {NewsArticleNode} from '../schema/document.js';
import type {Issue} from './index.js';
import {validInputDate} from './extensions.js';

/** Supplied publication labels remain floating dates. Never consult a clock or provider. */
export function inspectNewsArticle(node: NewsArticleNode, path: string, add: (issue: Issue) => void, safeURL: (url: string) => boolean): void {
  if (node.published !== undefined && !validInputDate(node.published)) add({code:'NEWS_DATE',path:`${path}/published`,message:'Use a real Gregorian date in YYYY-MM-DD format, years 0001–9999.'});
  if (node.source.url !== undefined && (!/^https?:\/\//i.test(node.source.url) || !safeURL(node.source.url))) add({code:'UNSAFE_URL',path:`${path}/source/url`,message:'News source links require allowed absolute HTTP(S) destinations.'});
}
