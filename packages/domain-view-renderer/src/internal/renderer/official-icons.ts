import type { RendererContext } from './context.js';


export type OfficialIconName = string;
export interface OfficialIconOptions {
  /** Additional CSS class names; dimensions can be controlled by the component. */
  className?: string;
  /** Both dimensions. Defaults to 1em, as in the official React components. */
  size?: number | string;
  /** Omit for a decorative icon. Labels remain plain text attributes. */
  label?: string;
}

/**
 * Native, finite adapter for MIT-licensed OpenAI Apps SDK UI SVG geometry.
 * No React, HTML parsing, sprite IDs, events, observers, fonts or network calls.
 * Literal left/right names retain their physical direction, including in RTL.
 * Semantic previous/next controls should select the appropriate icon themselves.
 * Scoped renderers may wrap construction with their normal lifecycle.during.
 */
export function renderOfficialIcon(
  c: Pick<RendererContext, 'svg'>,
  name: OfficialIconName,
  options: OfficialIconOptions = {}
): SVGElement {
  const render=(c as any).officialIcon;
  if(typeof render!=='function')throw new TypeError('The shared official icon bridge is required');
  return render(name,options);
}
