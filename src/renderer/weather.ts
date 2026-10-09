import type { WeatherNode } from '../schema/document.js';
import type { RendererContext } from './context.js';
import { dateInZone, timestamp } from '../core/extensions.js';

type Unit = WeatherNode['units']['temperature'];
type Metric = 'temperature' | 'precipitation';
type Hour = WeatherNode['hourly'][number];
let weatherId = 0;

/** Always convert from the immutable supplied unit, never from a previously displayed value. */
export function weatherTemperature(value: number | null | undefined, from: Unit, to: Unit): number | null {
  if (value == null) return null;
  return from === to ? value : to === 'fahrenheit' ? value * 9 / 5 + 32 : (value - 32) * 5 / 9;
}

/** Daily dates are calendar dates in the location; hourly instants retain their actual offsets. */
export function weatherHours(node: WeatherNode, date: string): Hour[] {
  return node.hourly.filter(hour => dateInZone(hour.time, node.location.timezone) === date)
    .slice().sort((a, b) => timestamp(a.time) - timestamp(b.time));
}

export function weatherCoordinates(hours: readonly Hour[], left: number, width: number): number[] {
  if (!hours.length) return [];
  const times = hours.map(hour => timestamp(hour.time));
  const first = Math.min(...times), last = Math.max(...times);
  return times.map(time => first === last ? left + width / 2 : left + (time - first) / (last - first) * width);
}

/** Offline weather presentation. No timers, remote icons, provider calls or implicit refresh. */
export function renderWeather(c: RendererContext, n: WeatherNode): HTMLElement {
  const { element: e, svg, on } = c, l = c.labels();
  const zh = l.temperature === '温度', locale = zh ? 'zh-CN' : 'en-US';
  const local = zh ? {
    observation: '观测时间', selected: '所选日期', high: '最高', low: '最低',
    unit: '温度单位', view: '展示方式', metric: '逐小时指标', time: '当地时间',
    instructions: '使用左右方向键浏览各时刻，Home 和 End 跳至首尾。完整数值可切换至表格查看。',
    conditions: { clear: '晴', 'partly-cloudy': '局部多云', cloudy: '多云', rain: '雨', snow: '雪', storm: '雷暴', fog: '雾', unknown: '天气状况未知' },
  } : {
    observation: 'Observed', selected: 'Selected date', high: 'High', low: 'Low',
    unit: 'Temperature unit', view: 'Display view', metric: 'Hourly metric', time: 'Local time',
    instructions: 'Use Left and Right arrow keys to browse times, Home and End for the first and last. Switch to Table for all values.',
    conditions: { clear: 'Clear', 'partly-cloudy': 'Partly cloudy', cloudy: 'Cloudy', rain: 'Rain', snow: 'Snow', storm: 'Storm', fog: 'Fog', unknown: 'Unknown conditions' },
  };
  const zone = n.location.timezone;
  const clock = new Intl.DateTimeFormat(locale, { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const clockWithZone = new Intl.DateTimeFormat(locale, { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset' });
  const fullTime = new Intl.DateTimeFormat(locale, { timeZone: zone, year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset' });
  // Calendar dates must not be reparsed in the location timezone: UTC noon is only a formatting anchor.
  const dayFormat = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' });
  const formatDay = (date: string) => dayFormat.format(new Date(`${date}T12:00:00Z`));
  const condition = (value: WeatherNode['current']['condition']) => local.conditions[value];
  const currentDate = dateInZone(n.current.time, zone);
  const dates = [...new Set([...n.daily.map(day => day.date), ...n.hourly.map(hour => dateInZone(hour.time, zone))])].sort();
  let selected = n.initialDate ?? (dates.includes(currentDate) ? currentDate : dates[0] ?? currentDate);
  let unit: Unit = n.units.temperature, metric: Metric = 'temperature', view: 'chart' | 'table' = 'chart', active = 0;
  const id = `${c.prefix}weather-${++weatherId}`;
  const root = e('section', 'iui-weather');
  root.setAttribute('aria-label', `${n.location.name} · ${l.daily}`);
  root.dataset.timezone = zone;
  const header = e('header', 'iui-weather-header'), place = e('div', 'iui-weather-place');
  place.append(e('h2', 'iui-weather-location', n.location.name), e('p', 'iui-caption', zone));
  const units = e('div', 'iui-weather-segment'); units.setAttribute('role', 'group'); units.setAttribute('aria-label', local.unit);
  const button = (label: string, action: string, value: string, cls = '') => {
    const b = e('button', cls, label); b.type = 'button'; b.dataset.weatherAction = action; b.dataset.value = value; return b;
  };
  const celsius = button('°C', 'unit', 'celsius'), fahrenheit = button('°F', 'unit', 'fahrenheit');
  celsius.setAttribute('aria-label', zh ? '摄氏度' : 'Celsius'); fahrenheit.setAttribute('aria-label', zh ? '华氏度' : 'Fahrenheit');
  units.append(celsius, fahrenheit); header.append(place, units);
  const state = e('p', 'iui-weather-status');
  const body = e('div', 'iui-weather-body'), current = e('div', 'iui-weather-current');
  const currentMain = e('div', 'iui-weather-current-main'), currentNumber = e('span', 'iui-weather-current-temperature');
  const currentIcon = weatherIcon(c, n.current.condition, 'iui-weather-current-icon');
  currentMain.append(currentIcon, currentNumber);
  const currentDescription = e('div', 'iui-weather-current-description');
  currentDescription.append(e('p', 'iui-weather-eyebrow', l.current), e('p', 'iui-weather-condition', condition(n.current.condition)));
  const observed = e('time', 'iui-caption', `${local.observation}: ${fullTime.format(new Date(n.current.time))}`); observed.dateTime = n.current.time;
  currentDescription.append(observed);
  const facts = e('dl', 'iui-weather-facts');
  current.append(currentMain, currentDescription, facts);
  const daily = e('div', 'iui-weather-days'); daily.setAttribute('role', 'tablist'); daily.setAttribute('aria-label', l.daily);
  const dayButtons: HTMLButtonElement[] = [];
  dates.forEach(date => {
    const day = n.daily.find(item => item.date === date), b = button('', 'date', date, 'iui-weather-day');
    b.setAttribute('role', 'tab'); b.id = `${id}-date-${date}`; b.setAttribute('aria-controls', `${id}-panel`);
    b.append(e('span', 'iui-weather-day-date', formatDay(date)));
    if (day) {
      b.append(weatherIcon(c, day.condition, 'iui-weather-day-icon'));
      b.append(e('span', 'iui-weather-day-range'), e('span', 'iui-weather-day-rain'));
    } else b.append(e('span', 'iui-weather-day-hourly', l.hourly));
    dayButtons.push(b); daily.append(b);
  });
  const panel = e('section', 'iui-weather-panel'); panel.id = `${id}-panel`; panel.setAttribute('role', 'tabpanel');
  const toolbar = e('div', 'iui-weather-toolbar'), metrics = e('div', 'iui-weather-segment'), views = e('div', 'iui-weather-segment');
  metrics.setAttribute('role', 'group'); metrics.setAttribute('aria-label', local.metric);
  views.setAttribute('role', 'group'); views.setAttribute('aria-label', local.view);
  const temperature = button(l.temperature, 'metric', 'temperature'), precipitation = button(l.precipitation, 'metric', 'precipitation');
  const chartButton = button(l.chartView, 'view', 'chart'), tableButton = button(l.tableView, 'view', 'table');
  metrics.append(temperature, precipitation); views.append(chartButton, tableButton); toolbar.append(metrics, views);
  const selectedTitle = e('h3', 'iui-weather-hourly-title');
  const empty = e('p', 'iui-weather-empty'); empty.setAttribute('role', 'status');
  const graphic = svg('svg', { class: 'iui-weather-chart', role: 'img', tabindex: 0, 'aria-describedby': `${id}-instructions ${id}-readout` });
  const instructions = e('p', 'iui-weather-visually-hidden', local.instructions); instructions.id = `${id}-instructions`;
  const readout = e('output', 'iui-weather-readout'); readout.id = `${id}-readout`; readout.setAttribute('aria-live', 'polite'); readout.setAttribute('aria-atomic', 'true');
  const tableWrap = e('div', 'iui-weather-table-wrap'); tableWrap.tabIndex = 0; tableWrap.setAttribute('role', 'region'); tableWrap.setAttribute('aria-label', l.hourly);
  panel.append(selectedTitle, toolbar, empty, graphic, instructions, readout, tableWrap);
  body.append(current, daily, panel);
  const footer = e('footer', 'iui-weather-source');
  const sourceLine = e('p'); sourceLine.append(c.doc.createTextNode(`${l.source}: `));
  if (n.source.url) {
    const a = e('a', '', n.source.label); a.href = n.source.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.referrerPolicy = 'no-referrer'; sourceLine.append(a);
  } else sourceLine.append(c.doc.createTextNode(n.source.label));
  if (n.source.synthetic) sourceLine.append(e('span', 'iui-weather-synthetic', l.synthetic));
  const updated = e('time', '', `${l.updated}: ${fullTime.format(new Date(n.updatedAt))}`); updated.dateTime = n.updatedAt;
  footer.append(sourceLine, updated); root.append(header, state, body, footer);

  const symbol = () => unit === 'celsius' ? '°C' : '°F';
  const number = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
  const temp = (value: number | null | undefined) => {
    const result = weatherTemperature(value, n.units.temperature, unit); return result === null ? l.missing : `${number(result)}${symbol()}`;
  };
  const percent = (value: number | null | undefined) => value == null ? l.missing : `${number(value)}%`;
  const summary = (hour: Hour) => `${clockWithZone.format(new Date(hour.time))} · ${l.temperature}: ${temp(hour.temperature)} · ${l.precipitation}: ${percent(hour.precipitationProbability)}`;
  let hours: Hour[] = [], positions: number[] = [], chartWidth = 640;
  const focusHour = (index: number) => {
    if (!hours.length) { readout.value = ''; return; }
    active = Math.max(0, Math.min(hours.length - 1, index)); readout.value = summary(hours[active]);
    graphic.querySelectorAll('[data-hour]').forEach(mark => mark.classList.toggle('iui-weather-point-active', Number(mark.getAttribute('data-hour')) === active));
    const guide = graphic.querySelector('[data-weather-cursor]');
    if (guide) { guide.setAttribute('x1', String(positions[active])); guide.setAttribute('x2', String(positions[active])); }
  };
  const pressed = (control: HTMLElement, value: boolean) => control.setAttribute('aria-pressed', String(value));
  const paint = () => {
    root.dataset.unit = unit; root.dataset.metric = metric; root.dataset.view = view; root.dataset.date = selected;
    const status = n.status ?? 'ready'; root.dataset.status = status; root.setAttribute('aria-busy', String(status === 'loading'));
    state.textContent = status === 'loading' ? n.message ?? l.loading : status === 'error' ? n.message ?? l.loadError : '';
    state.hidden = !state.textContent; state.setAttribute('role', status === 'error' ? 'alert' : 'status');
    body.hidden = status !== 'ready'; units.hidden = status !== 'ready';
    if (status !== 'ready') return;
    pressed(celsius, unit === 'celsius'); pressed(fahrenheit, unit === 'fahrenheit');
    pressed(temperature, metric === 'temperature'); pressed(precipitation, metric === 'precipitation');
    pressed(chartButton, view === 'chart'); pressed(tableButton, view === 'table');
    currentNumber.textContent = temp(n.current.temperature);
    currentNumber.setAttribute('aria-label', `${l.current} ${l.temperature}: ${temp(n.current.temperature)}`);
    facts.replaceChildren();
    const addFact = (label: string, value: string) => { const pair = e('div'); pair.append(e('dt', '', label), e('dd', '', value)); facts.append(pair); };
    if (n.current.feelsLike !== undefined) addFact(l.feelsLike, temp(n.current.feelsLike));
    if (n.current.humidity !== undefined) addFact(l.humidity, percent(n.current.humidity));
    const today = n.daily.find(day => day.date === currentDate);
    if (today) { addFact(local.high, temp(today.high)); addFact(local.low, temp(today.low)); }
    dayButtons.forEach(b => {
      const date = b.dataset.value!, day = n.daily.find(item => item.date === date), isSelected = date === selected;
      b.setAttribute('aria-selected', String(isSelected)); b.tabIndex = isSelected ? 0 : -1;
      let label = formatDay(date);
      if (day) {
        b.querySelector('.iui-weather-day-range')!.textContent = `${temp(day.high)} / ${temp(day.low)}`;
        b.querySelector('.iui-weather-day-rain')!.textContent = percent(day.precipitationProbability);
        label += `, ${condition(day.condition)}, ${local.high} ${temp(day.high)}, ${local.low} ${temp(day.low)}, ${l.precipitation} ${percent(day.precipitationProbability)}`;
      } else label += `, ${l.hourly}`;
      b.setAttribute('aria-label', label);
    });
    daily.hidden = dates.length === 0;
    if (dates.length) panel.setAttribute('aria-labelledby', `${id}-date-${selected}`);
    else panel.setAttribute('aria-label', l.hourly);
    selectedTitle.textContent = `${l.hourly} · ${formatDay(selected)}`;
    hours = weatherHours(n, selected); active = Math.min(active, Math.max(0, hours.length - 1));
    const values = hours.map(hour => metric === 'temperature' ? weatherTemperature(hour.temperature, n.units.temperature, unit) : hour.precipitationProbability);
    const valid = values.filter((value): value is number => value !== null);
    empty.textContent = !hours.length || !valid.length ? n.message ?? l.empty : ''; empty.hidden = !empty.textContent;
    graphic.style.display = view === 'chart' && valid.length ? 'block' : 'none';
    readout.hidden = view !== 'chart' || !hours.length; tableWrap.hidden = view !== 'table' || !hours.length;
    graphic.replaceChildren();
    chartWidth = Math.max(280, root.clientWidth || 640);
    let low = metric === 'precipitation' ? 0 : valid.length ? Math.min(...valid) : 0;
    let high = metric === 'precipitation' ? 100 : valid.length ? Math.max(...valid) : 1;
    if (low === high) { low -= 1; high += 1; }
    const tickLabel = (value: number) => `${number(value)}${metric === 'temperature' ? '°' : '%'}`;
    const left = Math.max(43, ...[low, (low + high) / 2, high].map(value => tickLabel(value).length * 6 + 8));
    const height = 120, pad = { left, right: 12, top: 10, bottom: 27 }, plotWidth = chartWidth - pad.left - pad.right, plotHeight = height - pad.top - pad.bottom;
    positions = weatherCoordinates(hours, pad.left, plotWidth);
    graphic.setAttribute('viewBox', `0 0 ${chartWidth} ${height}`);
    graphic.setAttribute('aria-label', `${n.location.name} · ${formatDay(selected)} · ${metric === 'temperature' ? `${l.temperature} (${symbol()})` : `${l.precipitation} (%)`}`);
    if (valid.length) {
      const y = (value: number) => pad.top + (high - value) / (high - low) * plotHeight;
      for (let tick = 0; tick < 3; tick++) {
        const value = low + (high - low) * tick / 2, yy = y(value);
        graphic.append(svg('line', { x1: pad.left, x2: chartWidth - pad.right, y1: yy, y2: yy, class: 'iui-weather-grid' }));
        const label = svg('text', { x: pad.left - 7, y: yy + 4, 'text-anchor': 'end', class: 'iui-weather-tick' }); label.textContent = tickLabel(value); graphic.append(label);
      }
      // Ticks come from actual instants. Their positions are never inferred from ordinal indexes.
      const tickIndexes = [...new Set(hours.length <= 3 ? hours.map((_, index) => index) : [0, positions.reduce((best, x, index) => Math.abs(x - (pad.left + plotWidth / 2)) < Math.abs(positions[best] - (pad.left + plotWidth / 2)) ? index : best, 0), hours.length - 1])];
      const duplicateClocks = new Set(hours.map(hour => clock.format(new Date(hour.time))).filter((value, index, array) => array.indexOf(value) !== index));
      tickIndexes.forEach((index, order) => {
        const label = svg('text', { x: positions[index], y: height - 5, 'text-anchor': order === 0 && tickIndexes.length > 1 ? 'start' : order === tickIndexes.length - 1 && tickIndexes.length > 1 ? 'end' : 'middle', class: 'iui-weather-tick', 'data-tick-time': hours[index].time });
        const formatted = clock.format(new Date(hours[index].time)); label.textContent = duplicateClocks.has(formatted) ? clockWithZone.format(new Date(hours[index].time)) : formatted; graphic.append(label);
      });
      const plot = svg('g', { 'data-weather-series': metric }); let segment: string[] = [];
      const flush = () => { if (segment.length) { const points=segment.map(command=>command.slice(2)),first=points[0].split(' ')[0],last=points.at(-1)!.split(' ')[0]; plot.prepend(svg('polygon',{points:[`${first} ${height-pad.bottom}`,...points,`${last} ${height-pad.bottom}`].join(' '),class:'iui-weather-area'})); plot.append(svg('path', { d: segment.join(' '), class: 'iui-weather-line', fill: 'none' })); } segment = []; };
      const nearestGap = positions.length > 1 ? Math.min(...positions.slice(1).map((x, index) => x - positions[index])) : plotWidth;
      const barWidth = Math.max(1, Math.min(22, nearestGap * .55));
      values.forEach((value, index) => {
        if (value === null) { flush(); return; }
        const x = positions[index], yy = y(value);
        const attributes = { 'data-hour': index, 'data-time': hours[index].time, 'data-timestamp': timestamp(hours[index].time), 'data-value': value };
        if (metric === 'temperature') {
          segment.push(`${segment.length ? 'L' : 'M'} ${x} ${yy}`);
          const point = svg('circle', { ...attributes, cx: x, cy: yy, r: 3, class: 'iui-weather-point' }); const title = svg('title'); title.textContent = summary(hours[index]); point.append(title); plot.append(point);
        } else {
          const bar = svg('rect', { ...attributes, x: x - barWidth / 2, y: yy, width: barWidth, height: y(0) - yy, rx: 2, class: 'iui-weather-bar' }); const title = svg('title'); title.textContent = summary(hours[index]); bar.append(title); plot.append(bar);
        }
      }); flush(); graphic.append(plot);
      graphic.append(svg('line', { 'data-weather-cursor': '', x1: positions[active], x2: positions[active], y1: pad.top, y2: height - pad.bottom, class: 'iui-weather-cursor' }));
    }
    const table = e('table', 'iui-weather-table'), caption = e('caption', '', `${l.hourly} · ${formatDay(selected)} · ${zone}`), head = e('thead'), tr = e('tr');
    for (const name of [local.time, `${l.temperature} (${symbol()})`, `${l.precipitation} (%)`]) { const th = e('th', '', name); th.scope = 'col'; tr.append(th); }
    head.append(tr); const tbody = e('tbody');
    hours.forEach(hour => {
      const row = e('tr'), th = e('th'); th.scope = 'row'; const time = e('time', '', clockWithZone.format(new Date(hour.time))); time.dateTime = hour.time; th.append(time);
      const tdTemp = e('td', '', temp(hour.temperature)), tdRain = e('td', '', percent(hour.precipitationProbability));
      if (hour.temperature !== null) { tdTemp.dataset.rawValue = String(hour.temperature); tdTemp.dataset.sourceUnit = n.units.temperature; }
      if (hour.precipitationProbability !== null) tdRain.dataset.rawValue = String(hour.precipitationProbability);
      row.append(th, tdTemp, tdRain); tbody.append(row);
    });
    table.append(caption, head, tbody); tableWrap.replaceChildren(table); focusHour(active);
  };

  // These listeners and this binding are registered exactly once per renderer instance.
  on(root, 'click', event => {
    const target = event.target as Element | null, control = target?.closest<HTMLButtonElement>('button[data-weather-action]');
    if (!control || !root.contains(control)) return;
    const action = control.dataset.weatherAction, value = control.dataset.value!;
    if (action === 'unit') unit = value as Unit;
    else if (action === 'metric') metric = value as Metric;
    else if (action === 'view') view = value as 'chart' | 'table';
    else if (action === 'date') { selected = value; active = 0; }
    paint();
  });
  on(daily, 'keydown', ((event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || !dates.length) return;
    event.preventDefault(); const index = dates.indexOf(selected), rtl = root.closest('[dir]')?.getAttribute('dir') === 'rtl';
    const direction = (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? dates.length - 1 : (index + direction + dates.length) % dates.length;
    selected = dates[next]; active = 0; paint(); dayButtons[next].focus();
  }) as EventListener);
  on(graphic, 'keydown', ((event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); focusHour(event.key === 'Home' ? 0 : event.key === 'End' ? hours.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1));
  }) as EventListener);
  on(graphic, 'focus', () => focusHour(active));
  on(graphic, 'pointermove', ((event: PointerEvent) => {
    const bounds = graphic.getBoundingClientRect(); if (!bounds.width || !positions.length) return;
    const at = (event.clientX - bounds.left) / bounds.width * chartWidth;
    focusHour(positions.reduce((nearest, x, index) => Math.abs(x - at) < Math.abs(positions[nearest] - at) ? index : nearest, 0));
  }) as EventListener);
  c.bind(paint);
  return root;
}

/** Small original inline glyphs; no vendor icon assets or remote image requests. */
function weatherIcon(c: RendererContext, condition: WeatherNode['current']['condition'], className: string): SVGElement {
  const icon = c.svg('svg', { viewBox: '0 0 28 28', class: className, 'aria-hidden': 'true', focusable: 'false', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const path = (d: string) => icon.append(c.svg('path', { d }));
  const sun = () => { icon.append(c.svg('circle', { cx: 14, cy: 12, r: 4 })); path('M14 3V1 M14 23V21 M3 12H1 M27 12H25 M6.2 4.2L4.8 2.8 M23.2 21.2L21.8 19.8 M6.2 19.8L4.8 21.2 M23.2 2.8L21.8 4.2'); };
  const cloud = () => path('M7 19H21a4.5 4.5 0 0 0 .6-9A7 7 0 0 0 8.5 9 5 5 0 0 0 7 19Z');
  if (condition === 'clear') sun();
  else if (condition === 'unknown') { icon.append(c.svg('circle', { cx: 14, cy: 14, r: 10 })); path('M11 10a3 3 0 1 1 5 2c-2 1-2 2-2 3 M14 19v.1'); }
  else if (condition === 'fog') path('M4 8H24 M1 13H21 M7 18H27 M3 23H22');
  else {
    if (condition === 'partly-cloudy') { icon.append(c.svg('circle', { cx: 8, cy: 7, r: 4 })); path('M8 1V0 M1 7H0 M3 2L2 1 M14 2L15 1'); }
    cloud();
    if (condition === 'rain') path('M8 22L7 25 M15 22L14 25 M22 22L21 25');
    if (condition === 'snow') path('M8 22V27 M5.8 23.2L10.2 25.8 M5.8 25.8L10.2 23.2 M21 22V27 M18.8 23.2L23.2 25.8 M18.8 25.8L23.2 23.2');
    if (condition === 'storm') path('M15 20L11 24H16L13 28');
  }
  return icon;
}
