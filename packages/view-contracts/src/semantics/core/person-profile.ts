import type {PersonProfileNode} from '../schema/document.js';
import type {Issue} from './index.js';

/** Inspect supplied records only. Never resolve people, contacts, or identities. */
export function inspectPersonProfile(node: PersonProfileNode, path: string, add: (issue: Issue) => void, safeURL: (url: string) => boolean): void {
  for (const field of ['facts', 'links'] as const) {
    const ids = new Set<string>();
    node[field]?.forEach((item, index) => {
      if (ids.has(item.id)) add({code:'DUPLICATE_ID',path:path+'/'+field+'/'+index+'/id',message:'Person record IDs must be unique within their list.'});
      ids.add(item.id);
    });
  }
  const urls: [string, string][] = (node.links ?? []).map((link, index) => [link.url, path+'/links/'+index+'/url']);
  if (node.source?.url !== undefined) urls.push([node.source.url, path+'/source/url']);
  for (const [url, at] of urls) {
    if (!/^https?:\/\//i.test(url) || !safeURL(url)) add({code:'UNSAFE_URL',path:at,message:'Person links require allowed absolute HTTP(S) destinations.'});
  }
}
