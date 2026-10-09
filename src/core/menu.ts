import type {RestaurantMenuNode} from '../schema/document.js';
import type {Issue} from './index.js';

/** Supplied menu semantics; no availability, currency, ingredient or provider inference. */
export function inspectMenu(node: RestaurantMenuNode, path: string, add: (issue: Issue) => void, safeURL: (url: string) => boolean): void {
  const sections = new Set<string>(), items = new Set<string>();
  let count = 0;
  node.sections.forEach((section, sectionIndex) => {
    const at = `${path}/sections/${sectionIndex}`;
    if (sections.has(section.id)) add({code:'MENU_ID',path:at+'/id',message:'Menu section identities must be unique.'});
    sections.add(section.id);
    section.items.forEach((item, itemIndex) => {
      if (items.has(item.id)) add({code:'MENU_ID',path:`${at}/items/${itemIndex}/id`,message:'Menu item identities must be unique across all sections.'});
      items.add(item.id); count++;
    });
  });
  if (count > 200) add({code:'MENU_LIMIT',path:path+'/sections',message:'A menu may contain at most 200 items.'});
  if (node.source?.url !== undefined && (!/^https?:\/\//i.test(node.source.url) || !safeURL(node.source.url))) {
    add({code:'UNSAFE_URL',path:path+'/source/url',message:'Menu sources require an allowed absolute HTTP(S) URL.'});
  }
}
