/** Pure logical geometry; no browser or device-global measurements. */
export interface HorizontalRect { left: number; right: number }
export interface RailPosition { previous: boolean; next: boolean; first: number; last: number }
export function measureRail(view: HorizontalRect, cards: readonly HorizontalRect[], rtl: boolean): RailPosition {
  const empty = { previous: false, next: false, first: 0, last: 0 };
  if (!(view.right > view.left) || !cards.length) return empty;
  // Half a CSS pixel tolerates subpixel edge arithmetic, not hidden cards.
  const epsilon = .5, first = cards[0], last = cards[cards.length - 1];
  const visible = cards.map((card, index) => ({card, index})).filter(({card}) => card.right > view.left + epsilon && card.left < view.right - epsilon);
  return {
    previous: rtl ? first.right > view.right + epsilon : first.left < view.left - epsilon,
    next: rtl ? last.left < view.left - epsilon : last.right > view.right + epsilon,
    first: visible.length ? visible[0].index + 1 : 0,
    last: visible.length ? visible[visible.length - 1].index + 1 : 0
  };
}
export type RTLScrollModel = 'negative' | 'reverse' | 'default';
/** Physical scrollLeft models vary across engines. Logical offset is always
 * distance from the first caller-supplied item, increasing toward the last. */
export function logicalOffset(raw: number, max: number, rtl: boolean, model: RTLScrollModel): number {
  return Math.max(0, Math.min(max, !rtl ? raw : model === 'negative' ? -raw : model === 'default' ? max - raw : raw));
}
export function physicalOffset(logical: number, max: number, rtl: boolean, model: RTLScrollModel): number {
  const bounded = Math.max(0, Math.min(max, logical));
  return !rtl ? bounded : model === 'negative' ? -bounded : model === 'default' ? max - bounded : bounded;
}
