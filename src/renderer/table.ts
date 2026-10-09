import type { RendererContext } from './context.js';
import type { TableNode } from '../schema/document.js';
import { tableLayout } from '../core/table.js';

// Per-context numbering remains unique through siblings and controller.update(),
// while allowing an unmounted context and all of its identifiers to be collected.
const sequences = new WeakMap<RendererContext, number>();
type LayoutSection = ReturnType<typeof tableLayout>[number];
type PlacedCell = LayoutSection['rows'][number][number];
interface RenderedCell { model: PlacedCell; element: HTMLTableCellElement; section: number }
const overlaps = (start: number, span: number, other: number, otherSpan: number) =>
  start < other + otherSpan && other < start + span;

/** Render the core-validated layout; core owns every span/occupancy check. */
export function renderTable(c: RendererContext, n: TableNode): HTMLElement {
  const sequence = (sequences.get(c) ?? 0) + 1;
  sequences.set(c, sequence);
  const id = `${c.prefix}table-${sequence}`;
  const container = c.element('div', 'iui-table-container');
  const scroll = c.element('div', 'iui-table-wrap iui-table-scroll');
  const table = c.element('table', 'iui-table');
  const hint = c.element('p', 'iui-table-scroll-hint');
  const status = c.element('p', 'iui-table-status');
  const state = n.status ?? 'ready';
  container.dataset.status = state;
  if (state === 'loading') container.setAttribute('aria-busy', 'true');
  table.id = `${id}-data`;
  hint.id = `${id}-hint`;
  hint.hidden = true;
  status.id = `${id}-status`;
  status.hidden = true;
  scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region');
  const accessibleName = n.caption || `${c.labels().tableView}: ${n.columns.join(', ')}`;
  if (n.caption) {
    const caption = c.element('caption', '', n.caption);
    caption.id = `${id}-caption`;
    table.append(caption);
    scroll.setAttribute('aria-labelledby', caption.id);
  } else {
    table.setAttribute('aria-label', accessibleName);
    scroll.setAttribute('aria-label', accessibleName);
  }
  const sections = tableLayout(n);
  const rendered: RenderedCell[] = [];
  const headers: RenderedCell[] = [];
  let suppliedRowCount = 0;
  for (const [sectionIndex, section] of sections.entries()) {
    if (section.kind !== 'head') suppliedRowCount += section.rows.length;
    const group = c.element(section.kind === 'head' ? 'thead' : section.kind === 'foot' ? 'tfoot' : 'tbody');
    // Non-ready data must not be presented as current. Keep the real caption and
    // header shell visible; no fabricated rows, totals, or loading placeholders.
    if (state !== 'ready' && section.kind !== 'head') continue;
    for (const row of section.rows) {
      const tr = c.element('tr');
      for (const cell of row) {
        const element = c.element(cell.header ? 'th' : 'td');
        element.rowSpan = cell.rowSpan;
        element.colSpan = cell.colSpan;
        if (cell.scope) element.scope = cell.scope;
        if (cell.align) element.dataset.align = cell.align;
        const item: RenderedCell = { model: cell, element, section: sectionIndex };
        if (cell.header) {
          element.id = `${id}-header-${sectionIndex}-${cell.row}-${cell.column}`;
          headers.push(item);
        }
        c.bind(() => {
          const value = c.value(cell.value);
          c.showValue(element, value);
          element.classList.toggle('iui-table-number', typeof value === 'number');
          element.classList.toggle('iui-table-null', value === null);
        });
        rendered.push(item);
        tr.append(element);
      }
      group.append(tr);
    }
    table.append(group);
  }
  // Explicit headers provide stable associations even for multi-level headers,
  // merged data cells, and browsers/AT with incomplete native span inference.
  for (const target of rendered) {
    const columnHeaders: string[] = [];
    const rowHeaders: string[] = [];
    for (const header of headers) {
      if (header === target) continue;
      const source = header.model, cell = target.model;
      if (sections[header.section].kind === 'head') {
        if (overlaps(source.column, source.colSpan, cell.column, cell.colSpan)
          && (sections[target.section].kind !== 'head' || source.row + source.rowSpan <= cell.row)) {
          columnHeaders.push(header.element.id);
        }
      } else if (header.section === target.section
        && source.column + source.colSpan <= cell.column
        && overlaps(source.row, source.rowSpan, cell.row, cell.rowSpan)) {
        rowHeaders.push(header.element.id);
      }
    }
    const associated = [...columnHeaders, ...rowHeaders];
    if (associated.length) target.element.setAttribute('headers', associated.join(' '));
  }
  const empty = suppliedRowCount === 0;
  if (state !== 'ready' || empty) {
    status.hidden = false;
    status.textContent = n.message || (state === 'loading' ? c.labels().loading
      : state === 'error' ? c.labels().loadError : c.labels().empty);
    if (state === 'error') status.setAttribute('role', 'alert');
    else if (state === 'loading') status.setAttribute('role', 'status');
  }
  scroll.append(table);
  container.append(scroll, hint, status);
  let alive = true;
  const measure = () => {
    if (!alive) return;
    const overflow = scroll.scrollWidth > scroll.clientWidth + 1;
    scroll.dataset.overflow = String(overflow);
    hint.hidden = !overflow;
    // Follow the host's already resolved language, including nearest-host lang.
    hint.textContent = c.labels().tableView === '表格'
      ? '可横向滚动查看完整表格。'
      : 'Scroll horizontally to view the full table.';
    const descriptions = [overflow ? hint.id : '', status.hidden ? '' : status.id].filter(Boolean);
    if (descriptions.length) scroll.setAttribute('aria-describedby', descriptions.join(' '));
    else scroll.removeAttribute('aria-describedby');
  };
  c.bind(measure);
  const ResizeObserver = c.doc.defaultView?.ResizeObserver;
  const observer = ResizeObserver ? new ResizeObserver(measure) : undefined;
  observer?.observe(scroll);
  observer?.observe(table);
  // Covers older embeds without ResizeObserver; c.on participates in cleanup.
  if (!observer && c.doc.defaultView) c.on(c.doc.defaultView, 'resize', measure);
  c.cleanup(() => { alive = false; observer?.disconnect(); });
  return container;
}
