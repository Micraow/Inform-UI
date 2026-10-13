import { isSafeURL } from '../core/index.js';
import type { RendererContext } from './context.js';
import type { CitationNode, WebLinkCardsNode } from '../schema/document.js';
type SourceRecord = WebLinkCardsNode['items'][number];
import type { SourceLabels } from './source-labels.js';
import { measureRail, logicalOffset, physicalOffset } from './source-geometry.js';
import type { RTLScrollModel } from './source-geometry.js';

let serial = 0;
/** Last-resort guard only. Full structural and semantic checks belong to the
 * public mount validator before any old DOM/state is replaced. */
function sourceURL(value: string): URL {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || !isSafeURL(value, 'link')) throw new TypeError('Source URL must be an allowed absolute HTTP(S) URL');
  return new URL(value);
}
function record(c: RendererContext, item: SourceRecord, tabHint: string, number?: number): HTMLElement {
  const parsed = sourceURL(item.url), box = c.element('div', 'iui-source-content');
  const title = c.element('a', 'iui-source-title', item.title);
  title.href = item.url; title.target = '_blank'; title.rel = 'noopener noreferrer'; title.referrerPolicy = 'no-referrer';
  title.setAttribute('aria-describedby', tabHint);
  const heading = c.element('div', 'iui-source-heading');
  if (number !== undefined) heading.append(c.element('span', 'iui-source-number', `[${number}]`));
  heading.append(title); box.append(heading);
  const meta = c.element('div', 'iui-source-meta');
  if (item.publisher !== undefined) meta.append(c.element('span', 'iui-source-publisher', item.publisher));
  const domain = c.element('bdi', 'iui-source-domain', parsed.host); domain.dir = 'ltr'; meta.append(domain); box.append(meta);
  if (item.description !== undefined) box.append(c.element('p', 'iui-source-description', item.description));
  return box;
}
/** Finite authored source content. No retrieval, source assessment, image loads,
 * automatic numbering, selection state, keyboard interception or link handlers. */
export function renderSource(c: RendererContext, n: CitationNode | WebLinkCardsNode, labels: SourceLabels): HTMLElement {
  const base = `iui-source-internal-${c.prefix}${++serial}`;
  const tabHint = c.element('span', 'iui-source-sr', labels.opensNewTab); tabHint.id = `${base}-new-tab`;
  if (n.type === 'citation') {
    const out = c.element('div', 'iui-citation'); out.append(record(c, n, tabHint.id, n.number), tabHint); return out;
  }
  if (n.type !== 'web-link-cards') throw new TypeError('Unsupported source node');
  // Reject a bypassed empty/oversized array before allocating lifecycle resources.
  if (!Array.isArray(n.items) || n.items.length < 1 || n.items.length > 20) throw new TypeError('Source cards require 1–20 items');
  for (const item of n.items) sourceURL(item.url);
  const out = c.element('section', 'iui-web-link-cards'), heading = c.element('div', 'iui-source-toolbar');
  const label = c.element('div', 'iui-source-label', n.label); label.id = `${base}-label`; out.setAttribute('aria-labelledby', label.id);
  const controls = c.element('div', 'iui-source-controls');
  const previous = c.element('button', 'iui-source-previous', labels.previous), next = c.element('button', 'iui-source-next', labels.next);
  const rail = c.element('ul', 'iui-source-rail'); rail.id = `${base}-rail`; rail.setAttribute('role', 'list'); rail.setAttribute('aria-labelledby', label.id);
  const position = c.element('div', 'iui-source-position'); position.id = `${base}-position`;
  rail.setAttribute('aria-describedby', position.id);
  for (const button of [previous, next]) { button.type = 'button'; button.setAttribute('aria-controls', rail.id); button.setAttribute('aria-disabled', 'true'); }
  controls.append(previous, next); heading.append(label, controls); out.append(heading, rail, position, tabHint);
  const cards = n.items.map(item => { const card = c.element('li', 'iui-source-card'); card.append(record(c, item, tabHint.id)); rail.append(card); return card; });
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
