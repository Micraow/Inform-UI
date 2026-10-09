import type {ChartNode, Value} from '../schema/document.js';
import type {RendererContext} from './context.js';

import type {PieLabels} from './pie-labels.js';
const colors = ['blue', 'green', 'orange', 'red', 'purple', 'gray'] as const;
const colorAt = (index: number) => `var(--iui-series-${colors[index % colors.length]})`;
const TAU = Math.PI * 2;
export interface PieSector {index: number; start: number; end: number; share: number; value: number}

/** Zero and missing rows retain their positions in the table/keyboard order, not fabricated sectors. */
export function pieSectors(values: readonly unknown[]): PieSector[] {
  if (values.some(value => value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0))) return [];
  const total = values.reduce<number>((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
  if (!(total > 0) || !Number.isFinite(total)) return [];
  const result: PieSector[] = [];
  let cumulative = 0;
  values.forEach((value, index) => {
    if (typeof value !== 'number' || value <= 0) return;
    const start = cumulative / total * TAU;
    cumulative += value;
    result.push({index, start, end: cumulative / total * TAU, share: value / total, value});
  });
  return result;
}

/** Clockwise angles start at twelve o'clock. The center has no unique angular item. */
export function pieHitTest(sectors: readonly PieSector[], x: number, y: number, radius: number): number | null {
  const distance = Math.hypot(x, y);
  if (!Number.isFinite(distance) || distance === 0 || distance > radius) return null;
  const angle = (Math.atan2(y, x) + Math.PI / 2 + TAU) % TAU;
  return sectors.find(sector => angle >= sector.start && angle < sector.end)?.index ?? null;
}

export function pieSectorPath(sector: PieSector, cx: number, cy: number, radius: number): string {
  const polar = (angle: number) => `${cx + Math.sin(angle) * radius} ${cy - Math.cos(angle) * radius}`;
  // Two arcs are required for a complete circle; one SVG arc with equal endpoints disappears.
  if (sector.end - sector.start >= TAU) return `M ${cx} ${cy} L ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`;
  return `M ${cx} ${cy} L ${polar(sector.start)} A ${radius} ${radius} 0 ${sector.end - sector.start > Math.PI ? 1 : 0} 1 ${polar(sector.end)} Z`;
}

/** Original solid-sector SVG. State resolution and atomic validation remain owned by the host. */
export function renderPie(c: RendererContext, n: ChartNode, labels: PieLabels): HTMLElement {
  const {element: e, svg, on} = c, l = c.labels();
  const figure = e('figure', 'iui-chart iui-pie');
  if (n.title) figure.append(e('figcaption', 'iui-chart-title', n.title));
  const state = e('p', 'iui-data-status');
  const graphic = svg('svg', {role: 'img', 'aria-label': n.title ?? l.chartData, tabindex: 0});
  const controls = e('div', 'iui-chart-controls'), readout = e('output', 'iui-chart-readout');
  readout.setAttribute('aria-live', 'polite');
  const explanation = e('p', 'iui-caption iui-pie-denominator', labels.knownValues);
  const details = e('details'), tableHost = e('div');
  details.append(e('summary', '', l.viewChartData), tableHost);
  figure.append(state, graphic, controls, readout, explanation, details);
  if (n.note) figure.append(e('p', 'iui-caption', n.note));
  let rows: {label: unknown; value: unknown}[] = [], sectors: PieSector[] = [];
  let active = 0, hasActive = false, width = 640;
  const height = 240, cy = 112, radius = 85;
  const summary = (index: number) => {
    const row = rows[index];
    if (!row) return '';
    const sector = sectors.find(item => item.index === index);
    return `${c.display(row.label)} · ${n.series[0].label}: ${c.display(row.value ?? l.missing)}${n.unit ?? ''}${sector ? ` (${labels.share(sector.share * 100 < .1 ? '<0.1%' : `${(sector.share * 100).toFixed(1)}%`)})` : ''}`;
  };
  const focusItem = (index: number) => {
    if (!rows.length) return;
    active = Math.max(0, Math.min(rows.length - 1, index));
    hasActive = true;
    readout.value = summary(active);
    for (const key of controls.querySelectorAll('[data-item]')) key.classList.toggle('iui-pie-key-active', Number(key.getAttribute('data-item')) === active);
    for (const path of graphic.querySelectorAll('[data-point]')) {
      const selected = Number(path.getAttribute('data-point')) === active;
      path.classList.toggle('iui-point-active', selected);
      path.setAttribute('stroke', selected ? 'var(--iui-ink)' : 'none');
      path.setAttribute('stroke-width', selected ? '2' : '0');
    }
  };
  on(graphic, 'focus', () => focusItem(active));
  on(graphic, 'keydown', ((event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    focusItem(event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1));
  }) as EventListener);
  const selectFromPointer = (event: MouseEvent) => {
    const box = graphic.getBoundingClientRect();
    if (!box.width || !box.height) return;
    // Default SVG xMidYMid meet also handles a host-imposed size with letterboxing.
    const scale = Math.min(box.width / width, box.height / height);
    const x = (event.clientX - box.left - (box.width - width * scale) / 2) / scale;
    const y = (event.clientY - box.top - (box.height - height * scale) / 2) / scale;
    let localX = x, localY = y;
    const root = graphic as SVGSVGElement;
    if (typeof root.getScreenCTM === 'function' && typeof root.createSVGPoint === 'function') {
      const matrix = root.getScreenCTM();
      if (matrix) {
        try {const point = root.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
          const local = point.matrixTransform(matrix.inverse()); localX = local.x; localY = local.y;
        } catch { return; }
      }
    }
    const index = pieHitTest(sectors, localX - width / 2, localY - cy, radius);
    if (index !== null) focusItem(index);
  };
  on(graphic, 'pointermove', selectFromPointer as EventListener);
  on(graphic, 'click', selectFromPointer as EventListener);
  c.bind(() => {
    rows = n.data.map(row => ({label: c.value(row[n.xKey] as Value), value: c.value(row[n.series[0].key] as Value)}));
    sectors = pieSectors(rows.map(row => row.value));
    const ready = (n.status ?? 'ready') === 'ready', empty = sectors.length === 0;
    state.textContent = n.status === 'loading' ? n.message ?? l.loading : n.status === 'error' ? n.message ?? l.loadError : empty ? n.message ?? labels.noPositiveData : '';
    state.hidden = !state.textContent;
    state.dataset.state = ready ? (empty ? 'empty' : 'ready') : n.status!;
    state.setAttribute('role', n.status === 'error' ? 'alert' : 'status');
    figure.setAttribute('aria-busy', String(n.status === 'loading'));
    graphic.style.display = ready && !empty ? 'block' : 'none';
    controls.hidden = !ready || empty; details.hidden = !ready; readout.hidden = !ready || empty; explanation.hidden = !ready;
    width = Math.max(290, figure.clientWidth || 640);
    graphic.setAttribute('viewBox', `0 0 ${width} ${height}`);
    graphic.replaceChildren();
    if (ready && !empty) for (const sector of sectors) {
      const path = svg('path', {d: pieSectorPath(sector, width / 2, cy, radius), fill: colorAt(sector.index), 'data-point': sector.index, 'data-value': sector.value, 'data-share': sector.share});
      const title = svg('title'); title.textContent = summary(sector.index); path.append(title); graphic.append(path);
    }
    controls.replaceChildren();
    for (const [index, row] of rows.entries()) {
      const key = e('span', 'iui-chart-key'), swatch = e('span', 'iui-swatch');
      key.dataset.item = String(index);
      swatch.style.background = colorAt(index);
      key.append(swatch, c.doc.createTextNode(`${c.display(row.label)}: ${c.display(row.value ?? l.missing)}`));
      controls.append(key);
    }
    const wrap = e('div', 'iui-table-wrap'), table = e('table'), head = e('thead'), header = e('tr'), body = e('tbody');
    table.setAttribute('aria-label', n.title ? `${l.chartData}: ${n.title}` : l.chartData);
    for (const label of [n.xLabel ?? l.category, n.series[0].label + (n.unit?.trim() ? ` (${n.unit.trim()})` : '')]) {
      const cell = e('th', '', label); cell.scope = 'col'; header.append(cell);
    }
    head.append(header); table.append(head, body);
    for (const row of rows) {
      const tr = e('tr');
      for (const value of [row.label, row.value]) {const td = e('td'); c.showValue(td, value === null ? l.missing : value); tr.append(td);}
      body.append(tr);
    }
    wrap.append(table); tableHost.replaceChildren(wrap);
    if (hasActive) focusItem(active);
  });
  return figure;
}
