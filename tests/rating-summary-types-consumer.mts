import type {Node} from '../dist/index.js';
const minimal: Node = {type: 'rating-summary', ratingLabel: '4.8'};
const linked: Node = {type: 'rating-summary', ratingLabel: '4.8', reviewCountLabel: '(120 reviews)', provider: {label: 'Example reviews', url: 'https://example.com/reviews'}};
// @ts-expect-error ratingLabel is required
const missing: Node = {type: 'rating-summary'};
// @ts-expect-error supplied rating labels are literal strings
const numeric: Node = {type: 'rating-summary', ratingLabel: 4.8};
// @ts-expect-error supplied review counts are literal strings, not state expressions
const expression: Node = {type: 'rating-summary', ratingLabel: '4.8', reviewCountLabel: {$: 'count'}};
// @ts-expect-error provider needs its source URL
const noURL: Node = {type: 'rating-summary', ratingLabel: '4.8', provider: {label: 'Example reviews'}};
// @ts-expect-error interactive rating binding belongs to the separate rating node
const binding: Node = {type: 'rating-summary', ratingLabel: '4.8', bind: 'score'};
// @ts-expect-error logo assets are not supported
const logo: Node = {type: 'rating-summary', ratingLabel: '4.8', provider: {label: 'Example reviews', url: 'https://example.com/reviews', logo: 'logo.png'}};
void [minimal, linked, missing, numeric, expression, noURL, binding, logo];
