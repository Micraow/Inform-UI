export interface OverlayRect { left: number; top: number; right: number; bottom: number; width: number; height: number }
export interface OverlayViewport { left: number; top: number; width: number; height: number }
export interface OverlayPosition { left: number; top: number; placement: 'top' | 'bottom'; maxWidth: number; maxHeight: number }
const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), Math.max(low, high));
/** Original viewport-space positioning, including visual-viewport offsets and small screens. */
export function positionOverlay(anchor: OverlayRect, surface: Pick<OverlayRect, 'width' | 'height'>,
  viewport: OverlayViewport, preferred: 'top' | 'bottom', gap = 8, margin = 8): OverlayPosition {
  const maxWidth = Math.max(0, viewport.width - margin * 2);
  const maxHeight = Math.max(0, viewport.height - margin * 2);
  const width = Math.min(surface.width, maxWidth), height = Math.min(surface.height, maxHeight);
  const minTop = viewport.top + margin, maxBottom = viewport.top + viewport.height - margin;
  const above = Math.max(0, anchor.top - gap - minTop), below = Math.max(0, maxBottom - anchor.bottom - gap);
  const placement = preferred === 'top'
    ? (height <= above || above >= below ? 'top' : 'bottom')
    : (height <= below || below >= above ? 'bottom' : 'top');
  return {
    left: clamp(anchor.left + anchor.width / 2 - width / 2, viewport.left + margin, viewport.left + viewport.width - margin - width),
    top: clamp(placement === 'top' ? anchor.top - gap - height : anchor.bottom + gap, minTop, maxBottom - height),
    placement, maxWidth, maxHeight
  };
}
