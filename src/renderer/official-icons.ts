import type { RendererContext } from './context.js';
import { officialIconGeometry } from './icons/openai-apps-sdk-ui/geometry.js';

export type OfficialIconName = keyof typeof officialIconGeometry;
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
  if (!Object.hasOwn(officialIconGeometry, name)) throw new TypeError('Unsupported official icon');
  const geometry = officialIconGeometry[name], size = options.size ?? '1em';
  const out = c.svg('svg', {
    ...geometry.attrs,
    class: ['iui-official-icon', options.className].filter(Boolean).join(' '),
    width: size, height: size, focusable: 'false',
    'data-iui-icon': name,
    ...(options.label !== undefined
      ? { role: 'img', 'aria-label': options.label }
      : { 'aria-hidden': 'true' })
  });
  for (const [tag, attributes] of geometry.shapes) out.append(c.svg(tag, attributes));
  return out;
}
