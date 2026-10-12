import {suppliedLinkProps} from './layout.mjs';
/** Existing authored declarations, moved without changing wire values. */
export function install({defs,node}) {
node('link-card',suppliedLinkProps,[],'base');
node('recommendation-link-card',suppliedLinkProps,[],'base');
}
