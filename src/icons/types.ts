/** Supported static SVG subset. No HTML, events, styles or remote resources. */
export type IconShapeTag = 'path' | 'rect' | 'circle' | 'g' | 'defs' | 'clipPath';
export type IconAttribute = 'width' | 'height' | 'viewBox' | 'fill' | 'stroke' | 'stroke-width' | 'stroke-linecap' | 'stroke-linejoin' | 'fill-rule' | 'clip-rule' | 'd' | 'rx' | 'x' | 'y' | 'cx' | 'cy' | 'r' | 'opacity' | 'transform' | 'clip-path' | 'id' | 'class';
export type IconAttributes = Readonly<Partial<Record<IconAttribute, string>>>;
export type IconShape = readonly [tag: IconShapeTag, attrs: IconAttributes, children?: readonly IconShape[]];
export interface IconDefinition<Name extends string = string> {
  readonly name: Name;
  readonly attrs: IconAttributes;
  readonly shapes: readonly IconShape[];
}
export interface IconOptions {
  /** Both dimensions; a positive number (px) or px/em/rem/% length. Default: 1em. */
  size?: number | string;
  /** A nonempty accessible label. Omit for decorative aria-hidden output. */
  label?: string;
  /** Added to iui-official-icon and any pinned upstream classes. */
  className?: string;
}
