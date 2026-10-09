import type {Node} from '../schema/document.js';
import type {Issue} from './index.js';

export type SentenceBuilderNode = Extract<Node, {type: 'sentence-builder'}>;

/** Authored token identities are the entire finite grading contract. */
export function inspectSentenceBuilder(n: SentenceBuilderNode, path: string, add: (issue: Issue) => void): void {
  const error = (suffix: string, message: string) => add({code: 'SENTENCE_BUILDER_ID', path: path + suffix, message});
  const tokens = new Set<string>();
  n.tokens.forEach((token, index) => {
    if (tokens.has(token.id)) error(`/tokens/${index}/id`, 'Token ids must be unique; visible text may repeat.');
    tokens.add(token.id);
  });
  const answer = new Set<string>();
  n.answer.forEach((id, index) => {
    if (!tokens.has(id)) error(`/answer/${index}`, 'Every answer id must reference a supplied token.');
    if (answer.has(id)) error(`/answer/${index}`, 'Answer ids must not repeat.');
    answer.add(id);
  });
  if (n.answer.length !== n.tokens.length || [...tokens].some(id => !answer.has(id))) {
    error('/answer', 'The reference order must contain every token id exactly once.');
  }
}
