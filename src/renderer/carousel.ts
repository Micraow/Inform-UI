import type { RendererContext } from './context.js';
import type { CarouselNode } from '../schema/document.js';
import type { CarouselLabels } from './carousel-labels.js';
import { measureRail, logicalOffset, physicalOffset } from './source-geometry.js';
import type { RTLScrollModel } from './source-geometry.js';
let serial = 0;
/** Finite native collection. Render each ordinary child once; no state binding,
 * selected slide, cloning, animation, keyboard interception or network access. */
export function renderCarousel(c: RendererContext, n: CarouselNode, labels: CarouselLabels): HTMLElement {
  const base = `iui-carousel-internal-${c.prefix}${++serial}`;
  const out = c.element('div', 'iui-carousel-shell');
  const toolbar = c.element('div', 'iui-carousel-toolbar');
  const label = c.element('div', 'iui-carousel-label', n.label ?? labels.collection); label.id = `${base}-label`;
  const rail = c.element('div', 'iui-carousel'); rail.id = `${base}-rail`;
  rail.setAttribute('role', 'region'); rail.setAttribute('aria-labelledby', label.id);
  const position = c.element('div', 'iui-carousel-position'); position.id = `${base}-position`;
  rail.setAttribute('aria-describedby', position.id);
  const previous = c.element('button', 'iui-carousel-previous', labels.previous);
  const next = c.element('button', 'iui-carousel-next', labels.next);
  for (const button of [previous, next]) { button.type = 'button'; button.setAttribute('aria-controls', rail.id); button.setAttribute('aria-disabled', 'true'); }
  toolbar.append(label);
  if (n.controls !== false && n.children.length > 1) {
    const controls = c.element('div', 'iui-carousel-controls'); controls.append(previous, next); toolbar.append(controls);
  }
  out.append(toolbar, rail, position);
  const cards = n.children.map(child => { const card = c.render(child); rail.append(card); return card; });
  if (!cards.length) { position.textContent = labels.empty; return out; }
  const win = c.doc.defaultView; let disposed = false, frame: number | undefined;
  const isRTL = () => win?.getComputedStyle(rail).direction === 'rtl';
  const refresh = () => {
    if (disposed) return;
    const rect = rail.getBoundingClientRect();
    // Rectangles include CSS zoom/transforms; clientWidth/Left do not. Compare
    // cards and viewport in the same physical coordinate space.
    const scale = rail.offsetWidth > 0 ? rect.width / rail.offsetWidth : 1;
    const left = rect.left + rail.clientLeft * scale;
    const state = measureRail({left, right: left + rail.clientWidth * scale}, cards.map(card => card.getBoundingClientRect()), isRTL());
    previous.setAttribute('aria-disabled', String(!state.previous)); next.setAttribute('aria-disabled', String(!state.next));
    if (state.previous || state.next) rail.tabIndex = 0; else rail.removeAttribute('tabindex');
    position.textContent = state.first ? labels.visible(state.first, state.last, cards.length) : '';
  };
  const schedule = () => {
    if (disposed || frame !== undefined) return;
    if (!win?.requestAnimationFrame) { refresh(); return; }
    frame = win.requestAnimationFrame(() => { frame = undefined; refresh(); });
  };
  /** Detect only on an attached, actually overflowing RTL rail. A synchronous
   * one-pixel probe is restored before returning and never alters focus. */
  const rtlModel = (): RTLScrollModel => {
    const before = rail.scrollLeft;
    if (before < 0) return 'negative';
    rail.scrollLeft = -1;
    const negative = rail.scrollLeft < 0; rail.scrollLeft = before;
    if (negative) return 'negative';
    // Probe actual displacement, so mid-rail positions and edge padding cannot
    // confuse the two positive models. These assignments are synchronous.
    rail.scrollLeft = 0; const atZero = cards[0].getBoundingClientRect().right;
    rail.scrollLeft = 1; const atOne = cards[0].getBoundingClientRect().right;
    rail.scrollLeft = before;
    return atOne < atZero ? 'default' : 'reverse';
  };
  const move = (step: -1 | 1) => {
    if (disposed) return;
    refresh(); const button = step < 0 ? previous : next;
    if (button.getAttribute('aria-disabled') === 'true') return;
    const rtl = isRTL(), model = rtl ? rtlModel() : 'negative';
    const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const target = physicalOffset(logicalOffset(rail.scrollLeft, max, rtl, model) + step * rail.clientWidth, max, rtl, model);
    // Intentionally instant for every motion preference. No pending animation,
    // race, autoplay, focus relocation or repeated live-region announcement.
    if (rail.scrollTo) rail.scrollTo({left: target, behavior: 'instant'}); else rail.scrollLeft = target;
    refresh(); schedule();
  };
  c.on(previous, 'click', () => move(-1)); c.on(next, 'click', () => move(1));
  c.on(rail, 'scroll', schedule);
  if (win) {
    c.on(win, 'resize', schedule);
    if (win.visualViewport) c.on(win.visualViewport, 'resize', schedule);
    if (win.ResizeObserver) {
      const observer = new win.ResizeObserver(schedule); observer.observe(rail); for (const card of cards) observer.observe(card);
      c.cleanup(() => observer.disconnect());
    }
  }
  if (c.doc.fonts) c.on(c.doc.fonts, 'loadingdone', schedule);
  c.cleanup(() => { disposed = true; if (frame !== undefined) win?.cancelAnimationFrame(frame); frame = undefined; });
  refresh(); schedule(); return out;
}
