import type { RenderContext, RenderHandle, RendererAdapter } from './types';
function handle(element: HTMLElement | SVGElement): RenderHandle { return { element, dispose() { element.remove(); } }; }
/** Two real dependency-free adapters for contract integration tests. Foundation supplies the full set. */
export const textAdapter: RendererAdapter = Object.freeze({ kind: 'dom', key: 'Text', create(props: Record<string, unknown>, ctx: RenderContext) {
  ctx.budget.consume(); const node = ctx.document.createElement('p'); node.className = 'inform-v2-text'; node.textContent = props.content as string;
  if (props.tone) node.dataset.tone = props.tone as string;
  return handle(node);
} });
export const barChartAdapter: RendererAdapter = Object.freeze({ kind: 'dom', key: 'BarChart', create(props: Record<string, unknown>, ctx: RenderContext) {
  const labels = props.labels as string[], series = props.series as { name: string; values: number[] }[];
  const doc = ctx.document, ns = 'http://www.w3.org/2000/svg';
  const svgNode = (tag: string, attrs: Record<string, string | number> = {}) => {
    ctx.budget.consume(); const node = doc.createElementNS(ns, tag); for (const [key, value] of Object.entries(attrs)) { ctx.budget.consume(); node.setAttribute(key, String(value)); } return node;
  };
  const figure = doc.createElement('figure'); figure.className = 'inform-v2-chart';
  const caption = doc.createElement('figcaption'); caption.textContent = props.title as string; figure.append(caption);
  const svg = svgNode('svg', { viewBox: '0 0 720 320', role: 'img', 'aria-label': props.title as string });
  const title = svgNode('title'); title.textContent = props.title as string; svg.append(title);
  let min = 0, max = 0;
  for (const item of series) for (const value of item.values) { ctx.budget.consume(); min = Math.min(min, value); max = Math.max(max, value); }
  const range = max - min || 1, plotHeight = 238, left = 48, width = 650;
  const y = (value: number) => 16 + ((max - value) / range) * plotHeight;
  const baseline = y(0), band = width / labels.length, barWidth = band * .76 / series.length;
  svg.append(svgNode('line', { x1: left, x2: left + width, y1: baseline, y2: baseline, stroke: 'currentColor', opacity: '.35' }));
  labels.forEach((label, category) => {
    const text = svgNode('text', { x: left + band * (category + .5), y: 276, 'text-anchor': 'middle', fill: 'currentColor', 'font-size': 12 }); text.textContent = label; svg.append(text);
    series.forEach((item, index) => {
      const value = item.values[category], valueY = y(value);
      const rect = svgNode('rect', { x: left + band * category + band * .12 + index * barWidth, y: Math.min(valueY, baseline), width: Math.max(.1, barWidth - 1), height: Math.abs(baseline - valueY), fill: 'currentColor', opacity: String(1 - index / (series.length + 1) * .65), 'data-series': index });
      const tooltip = svgNode('title'); tooltip.textContent = `${label}, ${item.name}: ${value}`; rect.append(tooltip); svg.append(rect);
    });
  });
  figure.append(svg);
  const details = doc.createElement('details'), summary = doc.createElement('summary'); summary.textContent = 'View chart data'; details.append(summary);
  const table = doc.createElement('table'), head = doc.createElement('thead'), tr = doc.createElement('tr');
  for (const label of ['Category', ...series.map(item => item.name)]) { ctx.budget.consume(); const th = doc.createElement('th'); th.scope = 'col'; th.textContent = label; tr.append(th); }
  head.append(tr); table.append(head); const body = doc.createElement('tbody');
  labels.forEach((label, category) => {
    const row = doc.createElement('tr'), th = doc.createElement('th'); th.scope = 'row'; th.textContent = label; row.append(th);
    for (const item of series) { ctx.budget.consume(); const cell = doc.createElement('td'); cell.textContent = String(item.values[category]); row.append(cell); } body.append(row);
  });
  table.append(body); details.append(table); figure.append(details);
  return handle(figure);
} });
