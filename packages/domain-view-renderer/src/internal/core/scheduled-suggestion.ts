import type { ScheduledTaskSuggestionNode } from '../schema/document.js';
import type { Issue } from './index.js';
export function inspectScheduledSuggestion(node: ScheduledTaskSuggestionNode, path: string, add: (issue: Issue) => void): void {
  for (const key of ['label', 'creationGuidelines', 'fallback'] as const) {
    if (typeof node[key] === 'string' && !node[key]!.trim()) add({code: 'SCHEDULED_SUGGESTION_TEXT', path: path + '/' + key, message: 'Supply nonblank text.'});
  }
  if ((node.status ?? 'resolved') === 'resolved' && (node.action ?? 'new-turn') === 'new-turn' && !node.creationGuidelines?.trim()) {
    add({code: 'SCHEDULED_SUGGESTION_GUIDELINES', path: path + '/creationGuidelines', message: 'A new-turn suggestion requires explicit supplied guidelines.'});
  }
}
