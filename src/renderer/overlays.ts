import type { RendererContext } from './context.js';
import type { TooltipNode, PopoverNode } from '../schema/document.js';
import type { OverlayLabels } from './overlay-labels.js';
import { positionOverlay, type OverlayViewport } from './overlay-position.js';

type CloseReason = 'escape' | 'close' | 'outside' | 'sibling' | 'ancestor' | 'leave' | 'toggle' | 'detached' | 'dispose';
interface Entry {
  kind: 'tooltip' | 'popover'; root: HTMLElement; trigger: HTMLButtonElement; surface: HTMLElement;
  hide: (reason: CloseReason) => void;
}
interface Coordinator { open: (entry: Entry) => void; close: (entry: Entry, reason: CloseReason) => void }
const coordinators = new WeakMap<Document, Coordinator>();
const serials = new WeakMap<RendererContext, number>();

/** One Escape/outside-pointer coordinator per ownerDocument, not per mount or surface.
 * Only one popover branch is open. Ancestors remain open when descendants open.
 * Escape dismisses the deepest/latest open surface once; dismissing an ancestor
 * closes all descendants without moving focus through hidden intermediate triggers.
 */
function coordinator(doc: Document): Coordinator {
  const existing = coordinators.get(doc); if (existing) return existing;
  const active: Entry[] = [];
  const hit = (entry: Entry, event: Event) => {
    const path = event.composedPath();
    return path.includes(entry.trigger) || path.includes(entry.surface)
      || (event.target instanceof (doc.defaultView?.Node ?? Object)
        && (entry.trigger.contains(event.target as Node) || entry.surface.contains(event.target as Node)));
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing || !active.length) return;
    event.preventDefault(); api.close(active[active.length - 1]!, 'escape');
  };
  const pointerdown = (event: PointerEvent) => {
    for (const entry of [...active].reverse()) if (!hit(entry, event)) api.close(entry, 'outside');
  };
  const detach = () => {
    if (active.length) return;
    doc.removeEventListener('keydown', keydown); doc.removeEventListener('pointerdown', pointerdown, true);
  };
  const remove = (entry: Entry, reason: CloseReason) => {
    const index = active.indexOf(entry); if (index < 0) return;
    active.splice(index, 1); entry.hide(reason);
  };
  const api: Coordinator = {
    open(entry) {
      for (const other of [...active].reverse()) {
        if (other === entry || other.surface.contains(entry.trigger)) continue;
        if (entry.kind === 'popover' || other.kind === 'tooltip') api.close(other, 'sibling');
      }
      if (active.includes(entry)) return;
      if (!active.length) {
        doc.addEventListener('keydown', keydown); doc.addEventListener('pointerdown', pointerdown, true);
      }
      active.push(entry);
    },
    close(entry, reason) {
      for (const other of [...active].reverse()) {
        if (other !== entry && entry.surface.contains(other.trigger)) remove(other, 'ancestor');
      }
      remove(entry, reason); detach();
    }
  };
  coordinators.set(doc, api); return api;
}

/** Original tooltip/nonmodal-dialog renderer. Native popovers stay in their host DOM
 * for theme, language and control inheritance. Without the top-layer API, a bounded
 * in-flow disclosure is used instead of an untrustworthy fixed/overflow-clipped portal.
 */
export function renderOverlay(c: RendererContext, n: TooltipNode | PopoverNode, labels: OverlayLabels): HTMLElement {
  const { doc } = c, win = doc.defaultView;
  const serial = (serials.get(c) ?? 0) + 1; serials.set(c, serial);
  const base = `iui-overlay-internal-${c.prefix}${serial}`;
  const root = c.element('div', `iui-overlay iui-overlay-${n.type}`);
  const trigger = c.element('button', 'iui-overlay-trigger', n.label);
  const surface = c.element('div', `iui-overlay-surface iui-${n.type}-surface`);
  root.dataset.iui = n.type; root.dataset.open = 'false';
  trigger.type = 'button'; trigger.id = `${base}-trigger`;
  surface.id = `${base}-surface`; surface.hidden = true; surface.setAttribute('inert', '');
  const native = typeof surface.showPopover === 'function' && typeof surface.hidePopover === 'function';
  surface.dataset.positioning = native ? 'top-layer' : 'inline';
  if (native) surface.setAttribute('popover', 'manual');
  let closeButton: HTMLButtonElement | undefined;
  if (n.type === 'tooltip') {
    trigger.setAttribute('aria-describedby', surface.id); surface.setAttribute('role', 'tooltip');
    surface.textContent = n.value;
  } else {
    trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-controls', surface.id);
    trigger.setAttribute('aria-haspopup', 'dialog'); surface.setAttribute('role', 'dialog');
    const header = c.element('div', 'iui-popover-header');
    if (n.title) {
      const title = c.element('p', 'iui-popover-title', n.title); title.id = `${base}-title`;
      header.append(title); surface.setAttribute('aria-labelledby', title.id);
    } else surface.setAttribute('aria-labelledby', trigger.id);
    closeButton = c.element('button', 'iui-overlay-close', labels.closeOverlay); closeButton.type = 'button';
    header.append(closeButton); surface.append(header);
    const body = c.element('div', 'iui-popover-body');
    for (const child of n.children) body.append(c.render(child));
    surface.append(body);
  }
  root.append(trigger, surface);
  const manager = coordinator(doc);
  let opened = false, disposed = false, hoverTrigger = false, hoverSurface = false, focused = false;
  let pinned = false;
  let pointerGesture: { id: number; wasOpen: boolean; cancelled: boolean } | undefined;
  const setTimer = (fn: () => void, delay: number) => win ? win.setTimeout(fn, delay) : globalThis.setTimeout(fn, delay);
  const clearTimer = (timer: ReturnType<typeof setTimer>) => {
    if (win) win.clearTimeout(timer as number);
    else globalThis.clearTimeout(timer as ReturnType<typeof setTimeout>);
  };
  let leaveTimer: ReturnType<typeof setTimer> | undefined;
  let removePointerWatch: (() => void) | undefined;
  let frame: number | undefined;
  let observers: (() => void)[] = [];
  const cancelLeave = () => { if (leaveTimer !== undefined) { clearTimer(leaveTimer); leaveTimer = undefined; } };
  const cancelPointer = () => {
    removePointerWatch?.(); removePointerWatch = undefined;
  };
  const visibleAnchor = () => trigger.isConnected && !trigger.closest('[hidden], [inert], details:not([open])')
    && (!native || trigger.getClientRects().length > 0);
  const viewport = (): OverlayViewport => ({
    left: win?.visualViewport?.offsetLeft ?? 0, top: win?.visualViewport?.offsetTop ?? 0,
    width: win?.visualViewport?.width ?? (doc.documentElement.clientWidth || win?.innerWidth || 1024),
    height: win?.visualViewport?.height ?? (doc.documentElement.clientHeight || win?.innerHeight || 768)
  });
  const stopWatching = () => {
    for (const remove of observers) remove(); observers = [];
    if (frame !== undefined) { win?.cancelAnimationFrame(frame); frame = undefined; }
  };
  const hide = (reason: CloseReason) => {
    if (!opened) return;
    opened = false; root.dataset.open = 'false'; pinned = false;
    cancelLeave(); cancelPointer(); pointerGesture = undefined; stopWatching();
    if (n.type === 'popover') trigger.setAttribute('aria-expanded', 'false');
    // Mark closed first: the platform may synchronously issue beforetoggle while hiding.
    if (native) { try { surface.hidePopover(); } catch { /* Already detached or platform-closed. */ } }
    surface.hidden = true; surface.setAttribute('inert', '');
    if (n.type === 'popover' && (reason === 'escape' || reason === 'close') && visibleAnchor()) trigger.focus({ preventScroll: true });
  };
  const entry: Entry = { kind: n.type, root, trigger, surface, hide };
  const close = (reason: CloseReason) => manager.close(entry, reason);
  const reposition = () => {
    if (!opened || disposed) return;
    if (!visibleAnchor()) { close('detached'); return; }
    if (!native) return;
    const view = viewport(), anchor = trigger.getBoundingClientRect();
    if (anchor.bottom < view.top || anchor.top > view.top + view.height || anchor.right < view.left || anchor.left > view.left + view.width) {
      close('detached'); return;
    }
    surface.style.maxWidth = `${Math.max(0, Math.min(n.type === 'tooltip' ? 320 : 360, view.width - 16))}px`;
    surface.style.maxHeight = `${Math.max(0, view.height - 16)}px`;
    const result = positionOverlay(anchor, surface.getBoundingClientRect(), view, n.placement ?? (n.type === 'tooltip' ? 'top' : 'bottom'));
    surface.style.left = `${result.left}px`; surface.style.top = `${result.top}px`;
    surface.dataset.placement = result.placement;
  };
  const schedule = () => {
    if (!opened || disposed || frame !== undefined) return;
    if (!win?.requestAnimationFrame) { reposition(); return; }
    frame = win.requestAnimationFrame(() => { frame = undefined; reposition(); });
  };
  const watch = () => {
    if (!win) return;
    const listen = (target: EventTarget, name: string, capture = false) => {
      target.addEventListener(name, schedule, capture);
      observers.push(() => target.removeEventListener(name, schedule, capture));
    };
    listen(doc, 'scroll', true); listen(win, 'resize');
    if (win.visualViewport) { listen(win.visualViewport, 'resize'); listen(win.visualViewport, 'scroll'); }
    if (win.ResizeObserver) {
      const observer = new win.ResizeObserver(schedule); observer.observe(trigger); observer.observe(surface);
      observers.push(() => observer.disconnect());
    }
    if (win.MutationObserver && doc.documentElement) {
      const observer = new win.MutationObserver(() => { if (opened && !visibleAnchor()) close('detached'); });
      observer.observe(doc.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'inert', 'open', 'style', 'class'] });
      observers.push(() => observer.disconnect());
    }
  };
  const open = () => {
    if (disposed || opened || !visibleAnchor()) return;
    cancelLeave(); surface.hidden = false; surface.removeAttribute('inert');
    if (native) {
      try {
        surface.showPopover();
        if (!surface.matches(':popover-open')) { surface.hidden = true; surface.setAttribute('inert', ''); return; }
      } catch {
        surface.hidden = true; surface.setAttribute('inert', ''); return;
      }
    }
    opened = true; root.dataset.open = 'true'; manager.open(entry);
    if (n.type === 'popover') trigger.setAttribute('aria-expanded', 'true');
    reposition();
    if (!opened) return;
    watch();
    if (closeButton) closeButton.focus({ preventScroll: true });
  };
  const delayedLeave = () => {
    cancelLeave();
    if (hoverTrigger || hoverSurface || focused || pinned) return;
    leaveTimer = setTimer(() => { leaveTimer = undefined; if (!hoverTrigger && !hoverSurface && !focused && !pinned) close('leave'); }, 120);
  };
  c.on(surface, 'toggle', (event: Event) => {
    if (native && opened && (event as ToggleEvent).newState === 'closed' && !surface.matches(':popover-open')) close('toggle');
  });
  if (n.type === 'tooltip') {
    c.on(trigger, 'pointerenter', (event: Event) => {
      if ((event as PointerEvent).pointerType === 'touch') return;
      hoverTrigger = true; open();
    });
    c.on(trigger, 'pointerleave', () => { hoverTrigger = false; delayedLeave(); });
    c.on(surface, 'pointerenter', () => { hoverSurface = true; cancelLeave(); });
    c.on(surface, 'pointerleave', () => { hoverSurface = false; delayedLeave(); });
    // A fresh focus event starts a new interaction, including after hover-only
    // Escape. Calling focus() on an already-focused trigger emits no new event,
    // so dismissal stays closed until the user actually leaves and returns.
    c.on(trigger, 'focus', () => { focused = true; open(); });
    c.on(trigger, 'blur', () => { focused = false; pinned = false; pointerGesture = undefined; cancelPointer(); delayedLeave(); });
    c.on(trigger, 'pointerdown', (event: Event) => {
      const pointer = event as PointerEvent;
      if (pointer.isPrimary === false || pointer.button > 0) return;
      cancelPointer();
      const pointerId = pointer.pointerId;
      pointerGesture = { id: pointerId, wasOpen: opened, cancelled: false };
      // Preserve the gesture through a delayed compatibility click. A zero-delay
      // timer is not an ordering boundary for touch-generated focus/click events.
      // Release removes listeners; click identity or a new interaction consumes
      // the bounded gesture record, so keyboard activation cannot inherit it.
      const release = (event: Event) => {
        if ((event as PointerEvent).pointerId !== pointerId) return;
        cancelPointer();
        const pointer = event as PointerEvent, rect = trigger.getBoundingClientRect();
        const insideTarget = event.composedPath().includes(trigger);
        const hasPoint = Number.isFinite(pointer.clientX) && Number.isFinite(pointer.clientY) && rect.width > 0 && rect.height > 0;
        const insidePoint = !hasPoint || (pointer.clientX >= rect.left && pointer.clientX <= rect.right && pointer.clientY >= rect.top && pointer.clientY <= rect.bottom);
        if (pointerGesture) pointerGesture.cancelled = !insideTarget || !insidePoint;
      };
      const cancel = (event: Event) => {
        if ((event as PointerEvent).pointerId !== pointerId) return;
        if (pointerGesture) pointerGesture.cancelled = true; cancelPointer();
      };
      doc.addEventListener('pointerup', release, true); doc.addEventListener('pointercancel', cancel, true);
      removePointerWatch = () => { doc.removeEventListener('pointerup', release, true); doc.removeEventListener('pointercancel', cancel, true); };
    });
    if (win) c.on(win, 'blur', () => { pointerGesture = undefined; cancelPointer(); close('leave'); });
    c.on(trigger, 'click', (event: Event) => {
      const click = event as MouseEvent & { pointerId?: number };
      const gesture = click.detail > 0 && pointerGesture
        && (click.pointerId === undefined || click.pointerId === pointerGesture.id) ? pointerGesture : undefined;
      pointerGesture = undefined; cancelPointer();
      if (gesture?.cancelled) return;
      const wasOpen = gesture?.wasOpen ?? opened;
      if (wasOpen) close('toggle'); else { pinned = true; open(); }
    });
  } else {
    c.on(trigger, 'click', () => { if (opened) close('toggle'); else open(); });
    c.on(closeButton!, 'click', () => close('close'));
    // This is a nonmodal dialog: Tab is never trapped. Leaving the branch closes it
    // without stealing new focus. Shift+Tab back to this branch's trigger keeps
    // the panel open; a further Tab/Shift+Tab outside the whole root closes it.
    c.on(root, 'focusout', (event: Event) => {
      const next = (event as FocusEvent).relatedTarget;
      if (next && next instanceof (win?.Node ?? Object) && !root.contains(next as Node)) close('outside');
    });
  }
  // Reposition only. Never rerender children or reset local interaction on setState.
  c.bind(() => { if (opened) schedule(); });
  c.cleanup(() => {
    disposed = true; close('dispose'); stopWatching(); cancelLeave(); cancelPointer();
    surface.hidden = true; surface.setAttribute('inert', ''); surface.remove();
  });
  return root;
}
