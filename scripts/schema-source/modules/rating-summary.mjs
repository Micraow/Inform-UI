import {object,short,string} from '../primitives.mjs';

/** Original supplied display contract, independent of the local rating input. */
export function install({node}) {
  node('rating-summary', {
    ratingLabel: short,
    reviewCountLabel: short,
    provider: object({label: short, url: string(2048, 1)}, ['label', 'url']),
  }, ['ratingLabel']);
}
