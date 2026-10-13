import type {RedditThreadCardNode, ThreadComment} from '../schema/document.js';
import type {Issue} from './index.js';

/** Validate supplied tree boundaries without inventing provider facts or changing order. */
export function inspectThread(node: RedditThreadCardNode, path: string, add: (issue: Issue) => void, safeURL: (url: string) => boolean): void {
  if (node.source.url !== undefined && (!/^https?:\/\//i.test(node.source.url) || !safeURL(node.source.url))) {
    add({code:'UNSAFE_URL',path:`${path}/source/url`,message:'Thread source links require allowed absolute HTTP(S) destinations.'});
  }
  const ids = new Set<string>();
  let count = 0;
  const visit = (comments: readonly ThreadComment[], at: string, depth: number) => {
    comments.forEach((comment, index) => {
      const here = `${at}/${index}`;
      if (++count === 101) add({code:'THREAD_COUNT',path:here,message:'At most 100 supplied comments, including replies, are allowed per thread.'});
      if (depth === 5) add({code:'THREAD_DEPTH',path:here,message:'Comments may nest at most four levels below the thread root.'});
      if (ids.has(comment.id)) add({code:'DUPLICATE_ID',path:`${here}/id`,message:'Comment IDs must be unique across the supplied thread.'});
      ids.add(comment.id);
      if (comment.replies) visit(comment.replies, `${here}/replies`, depth + 1);
    });
  };
  visit(node.comments, `${path}/comments`, 1);
}

/** Counts only supplied comments, including supplied nested replies. */
export function countThreadComments(comments: readonly ThreadComment[]): number {
  return comments.reduce((total, comment) => total + 1 + countThreadComments(comment.replies ?? []), 0);
}
