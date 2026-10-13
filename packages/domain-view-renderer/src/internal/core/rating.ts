import type {RatingNode} from '../schema/document.js';
import type {Issue, Scalar} from './index.js';
/** Shared by document validation, every host patch, and declared button actions. */
export function ratingValueIssue(node: RatingNode, value: Scalar | undefined, path: string): Issue | undefined {
  if (typeof value !== 'number') return {code:'INPUT_TYPE',path,message:'Rating binding must be numeric.'};
  if (!Number.isInteger(value) || value < 0 || value > (node.max ?? 5)) {
    return {code:'RATING_VALUE',path,message:`Rating must be an integer from 0 (unrated) to ${node.max ?? 5}.`};
  }
}
