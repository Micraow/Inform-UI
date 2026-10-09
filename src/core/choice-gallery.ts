import type {LocationChoiceRequestNode, BusinessGalleryNode} from '../schema/document.js';
import type {Issue} from './index.js';

/** These supplied records have local IDs, never coordinates or provider identities. */
export function inspectLocationChoice(node: LocationChoiceRequestNode, path: string, add: (issue: Issue) => void, safeURL: (url: string) => boolean): void {
  const ids = new Set<string>();
  node.options.forEach((option, index) => {
    if (ids.has(option.id)) add({code:'DUPLICATE_ID',path:`${path}/options/${index}/id`,message:'Option IDs must be unique within their location choice.'});
    ids.add(option.id);
  });
  if (node.source?.url !== undefined && (!/^https?:\/\//i.test(node.source.url) || !safeURL(node.source.url))) add({code:'UNSAFE_URL',path:`${path}/source/url`,message:'Source links require allowed absolute HTTP(S) destinations.'});
}

/** Reuse the image node's exact URL policy, without fetching or inspecting media. */
export function inspectBusinessGallery(node: BusinessGalleryNode, path: string, add: (issue: Issue) => void, safeImageURL: (url: string) => boolean): void {
  const ids = new Set<string>();
  node.images.forEach((image, index) => {
    const at = `${path}/images/${index}`;
    if (ids.has(image.id)) add({code:'DUPLICATE_ID',path:`${at}/id`,message:'Image IDs must be unique within their gallery.'});
    ids.add(image.id);
    if (!safeImageURL(image.src)) add({code:'UNSAFE_URL',path:`${at}/src`,message:'Images must use HTTP(S) or base64 PNG, JPEG, GIF or WebP.'});
  });
}
