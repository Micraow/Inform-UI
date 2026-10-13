import type {Node} from '../schema/document.js';
import type {Issue} from './index.js';

export type FillBlankNode = Extract<Node, {type: 'fill-blank'}>;

/** Original finite teaching contract. No answer interpretation beyond trim + exact equality. */
export function inspectFillBlank(node: FillBlankNode, path: string, add: (issue: Issue) => void): void {
  const error = (code: string, sub: string, message: string) => add({code, path: path + sub, message});
  const ids = new Set<string>();
  for (const [index, blank] of node.blanks.entries()) {
    if (ids.has(blank.id)) error('FILL_BLANK_ID', `/blanks/${index}/id`, 'Blank ids must be unique within this exercise.');
    ids.add(blank.id);
    const answers = new Set<string>();
    for (const [answerIndex, answer] of blank.answers.entries()) {
      const normalized = answer.trim();
      if (!normalized || /[\r\n]/.test(normalized)) error('FILL_BLANK_ANSWER', `/blanks/${index}/answers/${answerIndex}`, 'Answers must contain a nonblank single-line value after trimming.');
      if (answers.has(normalized)) error('FILL_BLANK_ANSWER', `/blanks/${index}/answers/${answerIndex}`, 'Answers must be unique after trimming.');
      answers.add(normalized);
    }
  }
  const references = new Map<string, number>();
  for (const [index, part] of node.parts.entries()) {
    if (typeof part === 'string') continue;
    if (!ids.has(part.blank)) error('FILL_BLANK_REFERENCE', `/parts/${index}/blank`, 'Each blank reference must name a supplied blank.');
    const count = (references.get(part.blank) ?? 0) + 1;
    references.set(part.blank, count);
    if (count > 1) error('FILL_BLANK_REFERENCE', `/parts/${index}/blank`, 'Each blank must occur exactly once in the passage.');
  }
  for (const [index, blank] of node.blanks.entries()) {
    if (!references.has(blank.id)) error('FILL_BLANK_REFERENCE', `/blanks/${index}/id`, 'Each supplied blank must occur in the passage.');
  }
}
