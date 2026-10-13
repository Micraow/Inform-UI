import type {RatingSummaryNode} from '../schema/document.js';
import type {Issue} from './index.js';

/** A source URL is supplied data, never evidence that the rating was verified. */
export function inspectRatingSummary(
  node: RatingSummaryNode,
  path: string,
  add: (issue: Issue) => void,
  safeURL: (url: string) => boolean,
): void {
  if (node.provider && (!/^https?:\/\//i.test(node.provider.url) || !safeURL(node.provider.url))) {
    add({code: 'UNSAFE_URL', path: `${path}/provider/url`, message: 'Rating sources require allowed absolute HTTP(S) destinations.'});
  }
}
