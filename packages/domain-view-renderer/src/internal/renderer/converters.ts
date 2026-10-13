import type { CurrencyConverterNode, UnitConverterNode } from '../schema/document.js';
import { UNIT_CATEGORIES, convertCurrency, convertUnit, unitById, type UnitCategory } from '../core/units.js';
import type { RendererContext } from './context.js';

type ConverterNode = UnitConverterNode | CurrencyConverterNode;
let serial = 0;

/** Deliberately do not accept partial numbers, grouping separators, hex, Infinity, or blank-as-zero. */
export function converterInput(text: string): number | null {
  const value = text.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) return null;
  const number = Number(value);
  if (number === 0 && /[1-9]/.test(value.split(/[eE]/)[0])) return null;
  return Number.isFinite(number) ? (Object.is(number, -0) ? 0 : number) : null;
}

/** Original, offline converter controls. All unit definitions and arithmetic belong to core/units. */
export function renderConverter(c: RendererContext, n: ConverterNode): HTMLElement {
  const e = c.element, l = c.labels(), zh = l.missing === '缺测', locale = zh ? 'zh-CN' : 'en-US';
  const words = zh ? {
    unitTitle: '单位换算', currencyTitle: '货币换算', category: '类别', amount: '数值', from: '原单位', to: '目标单位',
    fromCurrency: '原币种', toCurrency: '目标币种', swap: '互换', swapLabel: '互换原单位与目标单位', swapCurrencyLabel: '互换原币种与目标币种',
    result: '换算结果', mode: '温度模式', absolute: '绝对温度', difference: '温差', blank: '请输入数值。', invalid: '请输入可表示的有限十进制数；不支持千位分隔符。',
    help: '小数使用英文句点，可使用科学记数法，如 1.5e3。互换只交换单位或币种，数值保持不变。', zero: '绝对温度不能低于绝对零度。', range: '结果超出可表示的数值范围。', reset: '重置', resetLabel: '恢复初始换算设置', empty: '尚未提供汇率快照记录。',
    unknown: '所选单位不可用。', missingRate: '所选币种缺少有效汇率，无法换算。',
    snapshot: '仅使用调用方提供的汇率快照；此组件不获取报价。结果未计入费用或买卖价差。',
    asOf: '快照时刻', base: '基准币种', rates: '完整汇率快照', currency: '币种', rate: '相对基准的汇率', baseRate: '基准（1）',
    absoluteNote: '绝对温度包含温标偏移；温差只换算间隔大小。', differenceNote: '温差不应用温标偏移，结果以 Δ 标注。',
    dataNote: 'kB、MB、GB 为十进制；KiB、MiB、GiB 为二进制。B 为字节，bit 为比特。',
    timeNote: '此处为固定时长；1 日等于 86400 秒，不进行日历或时区换算。',
    volumeNote: '美制液体加仑与英制加仑分别列出。', numericNote: '显示经过舍入；原始计算结果保留在结果的提示中。',
  } : {
    unitTitle: 'Unit converter', currencyTitle: 'Currency converter', category: 'Category', amount: 'Amount', from: 'From unit', to: 'To unit',
    fromCurrency: 'From currency', toCurrency: 'To currency', swap: 'Swap', swapLabel: 'Swap from and to units', swapCurrencyLabel: 'Swap from and to currencies',
    result: 'Converted value', mode: 'Temperature mode', absolute: 'Absolute temperature', difference: 'Temperature difference', blank: 'Enter an amount.', invalid: 'Enter a representable finite decimal number without grouping separators.',
    help: 'Use a decimal point; scientific notation such as 1.5e3 is allowed. Swap changes units or currencies only; the amount stays unchanged.', zero: 'An absolute temperature cannot be below absolute zero.', range: 'The result is outside the representable numeric range.', reset: 'Reset', resetLabel: 'Restore initial conversion settings', empty: 'No exchange-rate records were supplied.',
    unknown: 'The selected unit is unavailable.', missingRate: 'A valid rate is missing for a selected currency. Conversion is unavailable.',
    snapshot: 'Uses only the caller-provided exchange-rate snapshot. This component does not fetch quotes. Fees and bid/ask spreads are not included.',
    asOf: 'Snapshot as of', base: 'Base currency', rates: 'Full rate snapshot', currency: 'Currency', rate: 'Rate relative to base', baseRate: 'Base (1)',
    absoluteNote: 'Absolute temperatures include scale offsets; differences convert interval size only.', differenceNote: 'Temperature differences do not apply scale offsets. Results are marked Δ.',
    dataNote: 'kB, MB and GB are decimal; KiB, MiB and GiB are binary. B denotes bytes and bit denotes bits.',
    timeNote: 'Fixed durations only: a day is 86400 seconds. No calendar or time-zone conversion is performed.',
    volumeNote: 'US liquid gallons and Imperial gallons are listed separately.', numericNote: 'Displayed values are rounded; the original computed value remains in the result tooltip.',
  };
  const currency = n.type === 'currency-converter';
  const id = `${c.prefix}converter-${++serial}`, root = e('section', 'iui-converter');
  root.dataset.kind = n.type;
  const title = e('h2', 'iui-converter-title', n.title ?? (currency ? words.currencyTitle : words.unitTitle));
  title.id = `${id}-title`; root.setAttribute('aria-labelledby', title.id);
  const status = e('p', 'iui-converter-status'), body = e('div', 'iui-converter-body');
  root.append(title, status, body);
  const controls = e('div', 'iui-converter-controls');
  const field = (label: string, control: HTMLInputElement | HTMLSelectElement, name: string) => {
    const wrapper = e('div', `iui-converter-field iui-converter-${name}-field`), text = e('label', '', label);
    control.id = `${id}-${name}`; text.htmlFor = control.id; control.dataset.converterControl = name;
    wrapper.append(text, control); return wrapper;
  };
  const category = e('select'), mode = e('select');
  const categoryField = field(words.category, category, 'category'), modeField = field(words.mode, mode, 'mode');
  const appendOption = (select: HTMLSelectElement, value: string, text: string) => {
    const option = e('option', '', text); option.value = value; select.append(option);
  };
  let selectedCategory: UnitCategory = n.type === 'unit-converter' ? n.category : 'length';
  let temperatureMode: 'absolute' | 'difference' = n.type === 'unit-converter' ? n.temperatureMode ?? 'absolute' : 'absolute';
  for (const [key, value] of Object.entries(UNIT_CATEGORIES)) appendOption(category, key, value[zh ? 'zh' : 'en']);
  appendOption(mode, 'absolute', words.absolute); appendOption(mode, 'difference', words.difference);
  category.value = selectedCategory; mode.value = temperatureMode;
  const amount = e('input'); amount.type = 'text'; amount.inputMode = 'decimal'; amount.autocomplete = 'off'; amount.spellcheck = false; amount.value = String(n.amount);
  const amountField = field(words.amount, amount, 'amount');
  const from = e('select'), to = e('select'), fromField = field(currency ? words.fromCurrency : words.from, from, 'from'), toField = field(currency ? words.toCurrency : words.to, to, 'to');
  const swap = e('button', 'iui-converter-swap', words.swap); swap.type = 'button'; swap.dataset.converterAction = 'swap';
  swap.setAttribute('aria-label', currency ? words.swapCurrencyLabel : words.swapLabel);
  const pair = e('div', 'iui-converter-pair'); pair.append(fromField, swap, toField);
  const hint = e('p', 'iui-converter-hint', words.help); hint.id = `${id}-hint`;
  const error = e('p', 'iui-converter-error'); error.id = `${id}-error`; error.setAttribute('role', 'status'); error.setAttribute('aria-live', 'polite'); error.setAttribute('aria-atomic', 'true');
  amount.setAttribute('aria-describedby', `${hint.id} ${error.id}`);
  from.setAttribute('aria-describedby', error.id); to.setAttribute('aria-describedby', error.id);
  const outputLabel = e('label', 'iui-converter-result-label', words.result), output = e('output', 'iui-converter-result');
  output.id = `${id}-result`; outputLabel.htmlFor = output.id; output.setAttribute('aria-live', 'polite'); output.setAttribute('aria-atomic', 'true');
  output.setAttribute('for', [amount, from, to, ...currency ? [] : [category, mode]].map(control => control.id).join(' '));
  const resultBox = e('div', 'iui-converter-result-box'); resultBox.append(outputLabel, output);
  const relation = e('p', 'iui-converter-relation'), note = e('p', 'iui-converter-note'); note.id = `${id}-note`;
  const rounding = e('p', 'iui-converter-rounding', words.numericNote);
  const reset = e('button', 'iui-converter-reset', words.reset); reset.type = 'button'; reset.dataset.converterAction = 'reset'; reset.setAttribute('aria-label', words.resetLabel);
  controls.append(...currency ? [] : [categoryField, modeField], amountField);
  body.append(controls, pair, hint, error, resultBox, relation, note, rounding, reset);
  let selectedFrom = n.type === 'unit-converter' ? n.from : n.from ?? n.base;
  const currencies = n.type === 'currency-converter' ? [...new Set([n.base, ...n.rates.map(rate => rate.currency)])] : [];
  let selectedTo = n.type === 'unit-converter' ? n.to : n.to ?? currencies.find(code => code !== selectedFrom) ?? selectedFrom;
  const initial = { category: selectedCategory, mode: temperatureMode, from: selectedFrom, to: selectedTo };
  const precision = n.precision ?? 8;
  const number = new Intl.NumberFormat(locale, { maximumSignificantDigits: precision });
  const scientific = new Intl.NumberFormat(locale, { notation: 'scientific', maximumSignificantDigits: precision });
  const format = (value: number) => {
    const clean = Object.is(value, -0) ? 0 : value;
    return clean !== 0 && (Math.abs(clean) >= 1e15 || Math.abs(clean) < 1e-6) ? scientific.format(clean) : number.format(clean);
  };
  const unitLabel = (code: string) => {
    const unit = unitById(selectedCategory, code);
    return unit ? `${unit.symbol} · ${unit[zh ? 'zh' : 'en']}` : code;
  };
  const symbol = (code: string) => currency ? code : `${selectedCategory === 'temperature' && temperatureMode === 'difference' ? 'Δ' : ''}${unitById(selectedCategory, code)?.symbol ?? code}`;
  const options = () => {
    const values = currency ? currencies : UNIT_CATEGORIES[selectedCategory].units.map(unit => unit.id);
    for (const select of [from, to]) {
      select.replaceChildren();
      for (const code of values) {
        const missing = n.type === 'currency-converter' && code !== n.base && n.rates.find(rate => rate.currency === code)?.rate == null;
        appendOption(select, code, currency ? `${code}${missing ? ` · ${l.missing}` : ''}` : unitLabel(code));
      }
    }
    from.value = selectedFrom; to.value = selectedTo;
  };
  options();
  const calculate = (value: number) => n.type === 'currency-converter'
    ? convertCurrency(value, selectedFrom, selectedTo, n.base, n.rates)
    : convertUnit(value, selectedCategory, selectedFrom, selectedTo, temperatureMode);
  const updateResult = () => {
    const text = amount.value, value = converterInput(text); let message = '', result: number | null = null;
    if (!text.trim()) message = words.blank;
    else if (value === null) message = words.invalid;
    else {
      try { result = calculate(value); if (result === null) message = words.missingRate; }
      catch (cause) { message = cause instanceof Error && cause.message === 'ABSOLUTE_ZERO' ? words.zero : cause instanceof Error && cause.message === 'UNKNOWN_UNIT' ? words.unknown : words.range; }
    }
    error.textContent = message; error.hidden = !message;
    amount.setAttribute('aria-invalid', String(Boolean(message) && message !== words.missingRate));
    root.dataset.result = message ? (message === words.missingRate ? 'missing' : 'invalid') : 'ready';
    root.dataset.from = selectedFrom; root.dataset.to = selectedTo;
    if (result === null || message) { output.value = '—'; delete output.dataset.rawValue; output.removeAttribute('title'); relation.textContent = ''; rounding.hidden = true; }
    else {
      output.value = `${format(result)} ${symbol(selectedTo)}`; output.dataset.rawValue = String(result); output.title = `${l.rawValue}: ${result} ${symbol(selectedTo)}`;
      relation.textContent = `${format(value!)} ${symbol(selectedFrom)} = ${format(result)} ${symbol(selectedTo)}`; rounding.hidden = false;
    }
  };
  const paint = () => {
    const declared = n.type === 'currency-converter' ? n.status ?? 'ready' : 'ready';
    const state = n.type === 'currency-converter' && declared === 'ready' && n.rates.length === 0 ? 'empty' : declared;
    root.dataset.status = state; root.setAttribute('aria-busy', String(state === 'loading'));
    status.textContent = state === 'loading' ? n.type === 'currency-converter' ? n.message ?? l.loading : l.loading : state === 'error' ? n.type === 'currency-converter' ? n.message ?? l.loadError : l.loadError : state === 'empty' ? n.type === 'currency-converter' ? n.message ?? words.empty : words.empty : '';
    status.hidden = !status.textContent; status.setAttribute('role', state === 'error' ? 'alert' : 'status'); body.hidden = state !== 'ready';
    if (state !== 'ready') return;
    modeField.hidden = currency || selectedCategory !== 'temperature';
    root.dataset.category = currency ? 'currency' : selectedCategory;
    if (!currency) root.dataset.temperatureMode = temperatureMode;
    note.textContent = currency ? words.snapshot : selectedCategory === 'temperature' ? temperatureMode === 'difference' ? words.differenceNote : words.absoluteNote : selectedCategory === 'data' ? words.dataNote : selectedCategory === 'time' ? words.timeNote : selectedCategory === 'volume' ? words.volumeNote : '';
    note.hidden = !note.textContent;
    updateResult();
  };
  c.on(amount, 'input', updateResult);
  c.on(from, 'change', () => { selectedFrom = from.value; updateResult(); });
  c.on(to, 'change', () => { selectedTo = to.value; updateResult(); });
  c.on(swap, 'click', () => { [selectedFrom, selectedTo] = [selectedTo, selectedFrom]; from.value = selectedFrom; to.value = selectedTo; updateResult(); });
  c.on(category, 'change', () => {
    selectedCategory = category.value as UnitCategory;
    const units = UNIT_CATEGORIES[selectedCategory].units;
    selectedFrom = units[0].id; selectedTo = units[1]?.id ?? units[0].id; options(); paint();
  });
  c.on(mode, 'change', () => { temperatureMode = mode.value as 'absolute' | 'difference'; paint(); });
  c.on(reset, 'click', () => {
    selectedCategory = initial.category; temperatureMode = initial.mode; selectedFrom = initial.from; selectedTo = initial.to;
    category.value = selectedCategory; mode.value = temperatureMode; amount.value = String(n.amount); options(); paint();
  });
  if (n.type === 'currency-converter') {
    const footer = e('footer', 'iui-converter-source'), source = e('span'); source.append(c.doc.createTextNode(`${l.source}: `));
    if (n.source.url) { const link = e('a', '', n.source.label); link.href = n.source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer'; source.append(link); }
    else source.append(c.doc.createTextNode(n.source.label));
    const date = e('time', '', `${words.asOf}: ${n.asOf}`); date.dateTime = n.asOf;
    footer.append(source, date, e('span', '', `${words.base}: ${n.base}`));
    if (n.source.synthetic) footer.append(e('strong', 'iui-converter-synthetic', l.synthetic));
    root.append(footer);
    const details = e('details', 'iui-converter-rates'), summary = e('summary', '', words.rates), scroll = e('div', 'iui-converter-table-wrap');
    scroll.tabIndex = 0; scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', words.rates);
    const table = e('table'), caption = e('caption', '', `${words.rate} · 1 ${n.base}`), thead = e('thead'), heading = e('tr'), tbody = e('tbody');
    for (const label of [words.currency, words.rate]) { const th = e('th', '', label); th.scope = 'col'; heading.append(th); }
    thead.append(heading);
    for (const code of currencies) {
      const rate = code === n.base ? 1 : n.rates.find(item => item.currency === code)?.rate ?? null;
      const row = e('tr'); row.dataset.currency = code;
      const label = e('th', '', code); label.scope = 'row';
      const cell = e('td', '', rate === null ? l.missing : `${format(rate)}${code === n.base ? ` · ${words.baseRate}` : ''}`);
      if (rate !== null) { cell.dataset.rawValue = String(rate); cell.title = `${l.rawValue}: ${rate}`; }
      row.append(label, cell); tbody.append(row);
    }
    table.append(caption, thead, tbody); scroll.append(table); details.append(summary, scroll); body.append(details);
  }
  c.bind(paint); return root;
}
