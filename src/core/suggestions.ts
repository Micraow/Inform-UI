import type {Node} from '../schema/document.js';
import type {Issue} from './index.js';

export type PromptSuggestionsNode = Extract<Node, {type: 'prompt-suggestions'}>;

export function inspectSuggestions(node: PromptSuggestionsNode, path: string, add: (issue: Issue) => void): void {
  const ids = new Set<string>();
  node.items.forEach((item, index) => {
    if (ids.has(item.id)) add({code: 'SUGGESTION_ID', path: `${path}/items/${index}/id`, message: 'Suggestion ids must be unique; supplied text may repeat.'});
    ids.add(item.id);
  });
}
