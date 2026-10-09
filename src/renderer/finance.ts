import type { FinanceInstrument, FinanceRange, Node } from '../schema/document.js';
import type { RendererContext } from './context.js';

type FinanceNode = Extract<Node, { type: 'finance-quote' | 'finance-chart' | 'finance-comparison' }>;
type Sample = { time: string; timestamp: number; value: number | null };
type Series = { instrument: FinanceInstrument; samples: Sample[]; baseline: number | null; reason: string; color: string; index: number };
let financeId = 0;
const finite = (value: number): number | null => Number.isFinite(value) ? value : null;
const palette = ['blue', 'green', 'orange', 'purple', 'red', 'gray'];

/** A current zero is a value. A zero previous close cannot define a percentage. */
export function financeChange(price: number | null, previousClose: number | null): { amount: number | null; percent: number | null } {
  const amount = price === null || previousClose === null ? null : finite(price - previousClose);
  return { amount, percent: amount === null || previousClose === null || previousClose <= 0 ? null : finite(amount / previousClose * 100) };
}

/** Match the instant, including equivalent explicit UTC offsets; never substitute a nearby observation. */
export function financeBaseline(instrument: FinanceInstrument, baselineAt: string): number | null {
  const instant = Date.parse(baselineAt), value = instrument.history.find(point => Date.parse(point.time) === instant)?.price;
  return value !== undefined && value !== null && value > 0 ? value : null;
}

/** Offline financial data presentation. The supplied asOf is never replaced by the wall clock. */
export function renderFinance(c: RendererContext, n: FinanceNode): HTMLElement {
  const { element: e, svg, on } = c, l = c.labels(), zh = l.temperature === '温度', locale = zh ? 'zh-CN' : 'en-US';
  const words = zh ? {
    quote: '行情', history: '价格走势', comparison: '相对表现', currency: '币种', previous: '前收盘', change: '较前收盘',
    unavailable: '无法计算', percentUnavailable: '前收盘需大于零才能计算百分比', range: '时间范围', all: '全部记录',
    prices: '价格', returns: '相对共同基准 (%)', baseline: '共同基准时刻', noBaseline: '不可比：此时刻没有有效价格',
    zeroBaseline: '不可比：基准价格必须大于零', baselineNote: '各系列按同一时刻、各自币种的价格归一化；不进行汇率换算。',
    noPoints: '所选范围内暂无观测记录', allMissing: '所选范围内没有有效数值，缺测保留在表格中。', hidden: '所有系列已隐藏，请选择上方系列。',
    single: '此范围只有一个有效观测点。', table: '完整数据表', time: '时间', series: '显示系列', notComparable: '不可比',
    hide: '隐藏', show: '显示', noDelay: '声明延迟 0 分钟', delayed: (minutes: number) => `延迟 ${minutes} 分钟`,
    instructions: '使用左右方向键逐点查看，Home 和 End 跳至首尾。下方完整数据表包含所选范围的全部记录。',
    market: { open: '开市', closed: '休市', pre: '盘前', post: '盘后', halted: '暂停交易', unknown: '市场状态未知' },
  } : {
    quote: 'Quote', history: 'Price history', comparison: 'Relative performance', currency: 'Currency', previous: 'Previous close', change: 'From previous close',
    unavailable: 'Unavailable', percentUnavailable: 'Percentage requires a previous close above zero', range: 'Time range', all: 'All observations',
    prices: 'Price', returns: 'From common baseline (%)', baseline: 'Common baseline instant', noBaseline: 'Not comparable: no valid price at this instant',
    zeroBaseline: 'Not comparable: baseline price must be above zero', baselineNote: 'Each series is normalized in its own currency at the same instant. No currency conversion is applied.',
    noPoints: 'No observations in the selected range', allMissing: 'No valid values in this range. Missing observations remain in the table.', hidden: 'All series are hidden. Select a series above.',
    single: 'This range contains one valid observation.', table: 'Full data table', time: 'Time', series: 'Visible series', notComparable: 'Not comparable',
    hide: 'Hide', show: 'Show', noDelay: 'Reported delay: 0 min', delayed: (minutes: number) => `Delayed ${minutes} min`,
    instructions: 'Use Left and Right arrow keys to inspect observations, Home and End for the first and last. The full data table below contains every observation in the selected range.',
    market: { open: 'Market open', closed: 'Market closed', pre: 'Pre-market', post: 'After-hours', halted: 'Trading halted', unknown: 'Market status unknown' },
  };
  const compare = n.type === 'finance-comparison', quoteOnly = n.type === 'finance-quote';
  const instruments = n.type === 'finance-comparison' ? n.instruments : [n.instrument];
  const zone = n.type === 'finance-comparison' ? n.timezone ?? 'UTC' : n.instrument.timezone;
  const number = new Intl.NumberFormat(locale, { maximumSignificantDigits: 12 });
  const percentNumber = new Intl.NumberFormat(locale, { maximumSignificantDigits: 8 });
  const signed = (value: number) => `${value > 0 ? '+' : ''}${number.format(Object.is(value, -0) ? 0 : value)}`;
  const percent = (value: number | null) => value === null ? l.missing : `${value > 0 ? '+' : ''}${percentNumber.format(Object.is(value, -0) ? 0 : value)}%`;
  const price = (value: number | null, currency: string) => value === null ? l.missing : `${number.format(value)} ${currency}`;
  const dateFormat = (timeZone: string, short = false) => new Intl.DateTimeFormat(locale, {
    timeZone, ...(short ? {} : { year: 'numeric' as const }), month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    second: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset',
  });
  const fullTime = dateFormat(zone), tickTime = new Intl.DateTimeFormat(locale, { timeZone: zone, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const id = `${c.prefix}finance-${++financeId}`, root = e('section', 'iui-finance');
  root.dataset.kind = n.type; root.dataset.timezone = zone;
  const title = n.title ?? (quoteOnly ? words.quote : compare ? words.comparison : words.history);
  const header = e('header', 'iui-finance-header');
  const heading = e('h2', 'iui-finance-title', title); heading.id = `${id}-title`; root.setAttribute('aria-labelledby', heading.id); header.append(heading);
  const status = e('p', 'iui-finance-status'), body = e('div', 'iui-finance-body');
  root.append(header, status, body);
  const marketMeta = (instrument: FinanceInstrument) => {
    const meta = e('div', 'iui-finance-meta');
    const market = e('span', 'iui-finance-market', words.market[instrument.marketStatus]); market.dataset.market = instrument.marketStatus;
    const delay = e('span', 'iui-finance-delay', instrument.delayMinutes > 0 ? words.delayed(instrument.delayMinutes) : words.noDelay);
    delay.dataset.minutes = String(instrument.delayMinutes);
    const updated = e('time', 'iui-finance-updated', `${l.updated}: ${dateFormat(instrument.timezone).format(new Date(instrument.asOf))}`);
    updated.dateTime = instrument.asOf; updated.title = `${instrument.asOf} · ${instrument.timezone}`;
    meta.append(market, delay, updated, e('span', 'iui-finance-zone', instrument.timezone)); return meta;
  };
  const currentQuote = (instrument: FinanceInstrument) => {
    const summary = e('section', 'iui-finance-quote'); summary.setAttribute('aria-label', `${instrument.symbol} ${words.quote}`);
    const name = e('div', 'iui-finance-identity');
    name.append(e('span', 'iui-finance-symbol', instrument.symbol), e('span', 'iui-finance-name', instrument.name));
    if (instrument.exchange) name.append(e('span', 'iui-finance-exchange', instrument.exchange));
    const value = e('div', 'iui-finance-price', price(instrument.price, instrument.currency));
    if (instrument.price !== null) value.dataset.rawValue = String(instrument.price);
    value.dataset.currency = instrument.currency;
    const change = financeChange(instrument.price, instrument.previousClose), delta = e('p', 'iui-finance-change');
    delta.dataset.direction = change.amount === null ? 'missing' : change.amount > 0 ? 'up' : change.amount < 0 ? 'down' : 'flat';
    const amount = e('span', 'iui-finance-change-amount', change.amount === null ? l.missing : `${signed(change.amount)} ${instrument.currency}`);
    const ratio = e('span', 'iui-finance-change-percent', change.percent === null ? `(${words.unavailable})` : `(${percent(change.percent)})`);
    if (change.amount !== null) amount.dataset.rawValue = String(change.amount);
    if (change.percent !== null) ratio.dataset.rawValue = String(change.percent);
    delta.append(amount, ratio, e('span', 'iui-finance-change-label', words.change));
    const previous = e('p', 'iui-finance-previous', `${words.previous}: ${price(instrument.previousClose, instrument.currency)}`);
    summary.append(name, value, delta, previous);
    if (instrument.previousClose !== null && instrument.previousClose <= 0) summary.append(e('p', 'iui-finance-note', words.percentUnavailable));
    summary.append(marketMeta(instrument)); return summary;
  };
  if (!compare) body.append(currentQuote(instruments[0]));
  const footer = e('footer', 'iui-finance-source');
  footer.append(c.doc.createTextNode(`${l.source}: `));
  if (n.source.url) { const link = e('a', '', n.source.label); link.href = n.source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer'; footer.append(link); }
  else footer.append(e('span', '', n.source.label));
  if (n.source.synthetic) footer.append(e('span', 'iui-finance-synthetic', l.synthetic));
  root.append(footer);

  const series: Series[] = instruments.map((instrument, index) => {
    const baseline = n.type === 'finance-comparison' ? financeBaseline(instrument, n.baselineAt) : null;
    const baselineRecord = n.type === 'finance-comparison' ? instrument.history.find(point => Date.parse(point.time) === Date.parse(n.baselineAt)) : undefined;
    const reason = compare && baseline === null ? baselineRecord?.price !== null && baselineRecord?.price !== undefined && baselineRecord.price <= 0 ? words.zeroBaseline : words.noBaseline : '';
    return { instrument, index, color: `var(--iui-series-${palette[index]})`, baseline, reason,
      samples: instrument.history.map(point => ({ time: point.time, timestamp: Date.parse(point.time), value: point.price === null ? null : compare ? baseline === null ? null : finite((point.price / baseline - 1) * 100) : point.price })) };
  });
  const visible = new Set(instruments.map(instrument => instrument.id));
  const legends: HTMLButtonElement[] = [];
  if (n.type === 'finance-comparison') {
    const baseline = e('p', 'iui-finance-baseline'); baseline.append(c.doc.createTextNode(`${words.baseline}: `));
    const instant = e('time', '', fullTime.format(new Date(n.baselineAt))); instant.dateTime = n.baselineAt; baseline.append(instant);
    body.append(baseline, e('p', 'iui-finance-note', words.baselineNote));
    const legend = e('div', 'iui-finance-legend'); legend.setAttribute('role', 'group'); legend.setAttribute('aria-label', words.series);
    series.forEach(item => {
      const row = e('div', 'iui-finance-legend-row'); row.dataset.instrument = item.instrument.id;
      const toggle = e('button', 'iui-finance-legend-button'); toggle.type = 'button'; toggle.dataset.financeAction = 'series'; toggle.dataset.value = item.instrument.id;
      const swatch = e('span', 'iui-finance-swatch'); swatch.style.setProperty('--iui-finance-series', item.color); swatch.dataset.dash = String(item.index); swatch.setAttribute('aria-hidden', 'true');
      toggle.append(swatch, e('span', 'iui-finance-symbol', item.instrument.symbol), e('span', 'iui-finance-name', item.instrument.name), e('span', 'iui-finance-currency', item.instrument.currency));
      legends.push(toggle); row.append(toggle, marketMeta(item.instrument));
      if (item.reason) { const reason = e('p', 'iui-finance-incomparable', item.reason); reason.id = `${id}-reason-${item.index}`; toggle.setAttribute('aria-describedby', reason.id); row.append(reason); }
      legend.append(row);
    }); body.append(legend);
  }

  const ranges: FinanceRange[] = quoteOnly ? [] : n.ranges;
  let selected = quoteOnly ? '' : n.initialRange ?? ranges[0]?.id ?? '';
  let activeTime: number | null = null, timeline: number[] = [], positions: number[] = [], chartWidth = 640;
  let filtered: Sample[][] = [], lookup: Map<number, Sample>[] = [];
  const rangeBar = e('div', 'iui-finance-ranges'); rangeBar.setAttribute('role', 'group'); rangeBar.setAttribute('aria-label', words.range);
  const rangeButtons = ranges.map(range => { const control = e('button', '', range.label); control.type = 'button'; control.dataset.financeAction = 'range'; control.dataset.value = range.id; rangeBar.append(control); return control; });
  const rangeDescription = e('p', 'iui-finance-range-description'); rangeDescription.id = `${id}-range`;
  const axis = e('p', 'iui-finance-axis-title', compare ? words.returns : `${words.prices} (${instruments[0].currency})`);
  const message = e('p', 'iui-finance-empty'); message.setAttribute('role', 'status');
  const graphic = svg('svg', { class: 'iui-finance-chart', role: 'img', tabindex: 0, 'aria-label': `${title} · ${compare ? words.returns : instruments[0].currency}`, 'aria-describedby': `${id}-instructions ${id}-range ${id}-readout` });
  const instructions = e('p', 'iui-finance-visually-hidden', words.instructions); instructions.id = `${id}-instructions`;
  const readout = e('output', 'iui-finance-readout'); readout.id = `${id}-readout`; readout.setAttribute('aria-live', 'polite'); readout.setAttribute('aria-atomic', 'true');
  const details = e('details', 'iui-finance-table-details'), summary = e('summary', '', words.table);
  const tableWrap = e('div', 'iui-finance-table-wrap'); tableWrap.tabIndex = 0; tableWrap.setAttribute('role', 'region'); tableWrap.setAttribute('aria-label', words.table);
  details.append(summary, tableWrap);
  if (!quoteOnly) body.append(rangeBar, rangeDescription, axis, message, graphic, instructions, readout, details);
  const valueText = (sample: Sample | undefined, item: Series) => item.reason ? words.notComparable : sample?.value == null ? l.missing : compare ? percent(sample.value) : price(sample.value, item.instrument.currency);
  const focusPoint = (index: number) => {
    if (!timeline.length) { activeTime = null; readout.value = ''; return; }
    const active = Math.max(0, Math.min(timeline.length - 1, index)); activeTime = timeline[active];
    readout.value = `${fullTime.format(new Date(activeTime))} · ${series.filter(item => visible.has(item.instrument.id)).map(item => `${item.instrument.symbol}: ${valueText(lookup[item.index].get(activeTime!), item)}`).join(' · ')}`;
    graphic.querySelectorAll('[data-finance-time]').forEach(point => point.classList.toggle('iui-finance-point-active', Number(point.getAttribute('data-finance-time')) === activeTime));
    const cursor = graphic.querySelector('[data-finance-cursor]'); if (cursor) { cursor.setAttribute('x1', String(positions[active])); cursor.setAttribute('x2', String(positions[active])); }
  };
  const paint = () => {
    const state = n.status ?? 'ready'; root.dataset.status = state; root.dataset.range = selected; root.setAttribute('aria-busy', String(state === 'loading'));
    status.textContent = state === 'loading' ? n.message ?? l.loading : state === 'error' ? n.message ?? l.loadError : '';
    status.hidden = !status.textContent; status.setAttribute('role', state === 'error' ? 'alert' : 'status'); body.hidden = state !== 'ready';
    if (state !== 'ready' || quoteOnly) return;
    rangeBar.hidden = !ranges.length;
    rangeButtons.forEach(control => control.setAttribute('aria-pressed', String(control.dataset.value === selected)));
    legends.forEach((control, index) => { const item = series[index], shown = visible.has(item.instrument.id); control.setAttribute('aria-pressed', String(shown)); control.setAttribute('aria-label', `${shown ? words.hide : words.show} ${item.instrument.symbol} · ${item.instrument.name} (${item.instrument.currency})`); });
    const range = ranges.find(item => item.id === selected), from = range ? Date.parse(range.from) : -Infinity, to = range ? Date.parse(range.to) : Infinity;
    rangeDescription.textContent = range ? `${range.label}: ${fullTime.format(new Date(range.from))} – ${fullTime.format(new Date(range.to))} · ${zone}` : `${words.all} · ${zone}`;
    filtered = series.map(item => item.samples.filter(point => point.timestamp >= from && point.timestamp <= to));
    lookup = filtered.map(samples => new Map(samples.map(point => [point.timestamp, point])));
    timeline = [...new Set(filtered.flat().map(point => point.timestamp))].sort((a, b) => a - b);
    const shown = series.filter(item => visible.has(item.instrument.id));
    const valid = shown.flatMap(item => filtered[item.index].flatMap(point => point.value === null ? [] : [point.value]));
    message.textContent = !shown.length ? words.hidden : !timeline.length ? n.message ?? words.noPoints : !valid.length ? words.allMissing : valid.length === 1 ? words.single : '';
    message.hidden = !message.textContent; graphic.style.display = valid.length ? 'block' : 'none';
    readout.hidden = !timeline.length || !shown.length; details.hidden = !timeline.length;
    graphic.replaceChildren();
    chartWidth = Math.max(260, root.clientWidth || 640);
    const height = 228, left = chartWidth < 400 ? 60 : 78, right = 14, top = 16, bottom = 47, plotWidth = chartWidth - left - right, plotHeight = height - top - bottom;
    const first = range ? from : timeline[0] ?? 0, last = range ? to : timeline.at(-1) ?? first;
    const x = (instant: number) => first === last ? left + plotWidth / 2 : left + (instant - first) / (last - first) * plotWidth;
    positions = timeline.map(x); graphic.setAttribute('viewBox', `0 0 ${chartWidth} ${height}`);
    if (valid.length) {
      let low = Math.min(...valid), high = Math.max(...valid);
      if (compare) { low = Math.min(0, low); high = Math.max(0, high); }
      if (low === high) { const padding = Math.abs(low) * .02 || 1; low = finite(low - padding) ?? low; high = finite(high + padding) ?? high; }
      // Divide before subtraction so extremely large finite values still have finite coordinates.
      const magnitude = Math.max(Math.abs(low), Math.abs(high), 1), lo = low / magnitude, hi = high / magnitude;
      const y = (value: number) => top + (hi - value / magnitude) / (hi - lo || 1) * plotHeight;
      const largest = Math.max(Math.abs(low), Math.abs(high));
      const tickNumber = new Intl.NumberFormat(locale, { maximumSignificantDigits: 4, notation: largest >= 1000000 ? 'compact' : largest > 0 && largest < .001 ? 'scientific' : 'standard' });
      for (let index = 0; index < 4; index++) {
        const ratio = index / 3, value = (lo * (1 - ratio) + hi * ratio) * magnitude, yy = top + (1 - ratio) * plotHeight;
        graphic.append(svg('line', { x1: left, x2: chartWidth - right, y1: yy, y2: yy, class: 'iui-finance-grid' }));
        const label = svg('text', { x: left - 8, y: yy + 4, 'text-anchor': 'end', class: 'iui-finance-tick' }); label.textContent = `${tickNumber.format(value)}${compare ? '%' : ''}`; graphic.append(label);
      }
      if (compare && low <= 0 && high >= 0) graphic.append(svg('line', { x1: left, x2: chartWidth - right, y1: y(0), y2: y(0), class: 'iui-finance-baseline-line' }));
      const tickIndexes = timeline.length <= 2 ? timeline.map((_, index) => index) : [0, timeline.length - 1];
      tickIndexes.forEach((index, order) => {
        const label = svg('text', { x: positions[index], y: height - 24, 'text-anchor': tickIndexes.length === 1 ? 'middle' : order === 0 ? 'start' : 'end', class: 'iui-finance-tick', 'data-tick-timestamp': timeline[index] });
        const display = svg('tspan', { x: positions[index], dy: 0 }); display.textContent = tickTime.format(new Date(timeline[index]));
        const offset = svg('tspan', { x: positions[index], dy: 14 }); offset.textContent = fullTime.formatToParts(new Date(timeline[index])).find(part => part.type === 'timeZoneName')?.value ?? zone;
        label.append(display, offset); graphic.append(label);
      });
      shown.forEach(item => {
        const group = svg('g', { 'data-finance-series': item.instrument.id, 'data-series-index': item.index }); group.style.setProperty('--iui-finance-series', item.color);
        let segment: string[] = [];
        const flush = () => { if (segment.length) group.append(svg('path', { d: segment.join(' '), class: 'iui-finance-line', fill: 'none', 'stroke-dasharray': ['', '7 3', '2 3', '9 3 2 3', '4 3', '1 3'][item.index] })); segment = []; };
        filtered[item.index].forEach(point => {
          if (point.value === null) { flush(); return; }
          const xx = x(point.timestamp), yy = y(point.value); segment.push(`${segment.length ? 'L' : 'M'} ${xx} ${yy}`);
          const mark = svg('circle', { cx: xx, cy: yy, r: 3, class: 'iui-finance-point', 'data-finance-time': point.timestamp, 'data-time': point.time, 'data-value': point.value });
          const label = svg('title'); label.textContent = `${item.instrument.symbol} · ${fullTime.format(new Date(point.timestamp))} · ${valueText(point, item)}`; mark.append(label); group.append(mark);
        }); flush(); graphic.append(group);
      });
      graphic.append(svg('line', { 'data-finance-cursor': '', y1: top, y2: height - bottom, class: 'iui-finance-cursor' }));
    }
    const table = e('table', 'iui-finance-table'), caption = e('caption', '', `${words.table} · ${compare ? words.returns : `${words.prices} (${instruments[0].currency})`} · ${zone}`);
    const thead = e('thead'), headRow = e('tr'), timeHead = e('th', '', words.time); timeHead.scope = 'col'; headRow.append(timeHead);
    series.forEach(item => { const th = e('th', '', `${item.instrument.symbol} (${compare ? '%' : item.instrument.currency})`); th.scope = 'col'; th.title = item.instrument.name; headRow.append(th); });
    thead.append(headRow); const tbody = e('tbody');
    timeline.forEach(instant => {
      const row = e('tr'), th = e('th'); th.scope = 'row';
      const time = e('time', '', fullTime.format(new Date(instant))); time.dateTime = new Date(instant).toISOString(); th.append(time); row.append(th);
      series.forEach(item => { const sample = lookup[item.index].get(instant), cell = e('td', '', valueText(sample, item)); cell.dataset.instrument = item.instrument.id; if (sample?.value !== null && sample?.value !== undefined) cell.dataset.rawValue = String(sample.value); if (item.reason) cell.title = item.reason; row.append(cell); });
      tbody.append(row);
    });
    table.append(caption, thead, tbody); tableWrap.replaceChildren(table);
    const retained = activeTime === null ? -1 : timeline.indexOf(activeTime); focusPoint(retained < 0 ? timeline.length - 1 : retained);
  };
  // Keep event targets and the single binding stable across local actions, shared-state refreshes and resize.
  on(root, 'click', event => {
    const target = event.target as Element | null, control = target?.closest<HTMLButtonElement>('button[data-finance-action]');
    if (!control || !root.contains(control)) return;
    if (control.dataset.financeAction === 'range') { selected = control.dataset.value!; activeTime = null; }
    else if (control.dataset.financeAction === 'series') { const value = control.dataset.value!; visible.has(value) ? visible.delete(value) : visible.add(value); }
    paint();
  });
  on(graphic, 'keydown', event => {
    const key = (event as KeyboardEvent).key;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key) || !timeline.length) return;
    event.preventDefault(); const active = activeTime === null ? 0 : timeline.indexOf(activeTime);
    focusPoint(key === 'Home' ? 0 : key === 'End' ? timeline.length - 1 : active + (key === 'ArrowLeft' ? -1 : 1));
  });
  on(graphic, 'pointermove', event => {
    if (!timeline.length) return; const box = graphic.getBoundingClientRect(); if (!box.width) return;
    const position = ((event as PointerEvent).clientX - box.left) / box.width * chartWidth;
    const nearest = positions.reduce((best, x, index) => Math.abs(x - position) < Math.abs(positions[best] - position) ? index : best, 0); focusPoint(nearest);
  });
  on(graphic, 'click', event => {
    const target = (event.target as Element | null)?.closest('[data-finance-time]'); if (target) focusPoint(timeline.indexOf(Number(target.getAttribute('data-finance-time'))));
  });
  c.bind(paint);
  return root;
}
