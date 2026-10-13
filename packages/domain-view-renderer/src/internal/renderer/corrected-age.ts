import type {RendererContext} from './context.js';
import {suppliedReaderContext} from './supplied-reader-lifecycle.js';
import {readerBlocked, readerNativeReset} from './reader-controls.js';
import {intentGate} from './intent-gate.js';
import {internalId} from './internal-id.js';
import {calculateCorrectedAge, type CorrectedAgeNode, type CorrectedAgeInput, type CorrectedAgeResult, type CorrectedAgeDetail} from '../core/corrected-age.js';

export function renderCorrectedAge(parent: RendererContext, node: CorrectedAgeNode): HTMLElement {
  const root = parent.element('section', 'iui-corrected-age');
  const c = suppliedReaderContext(parent, root), life = c.lifecycle, w = life.during, e = c.element, gate = intentGate(life);
  const heading = e('h3', '', node.label), notice = e('p', 'iui-corrected-age-notice', 'Date arithmetic only. Use gestational age or the original due date from a qualified record. This does not assess development, determine treatment, or choose vaccination or medicine timing. Confirm clinical questions with a qualified clinician.');
  const fields = e('fieldset'), legend = e('legend', '', 'Supplied dates and units');
  const result = e('div', 'iui-corrected-age-result'), buttons = e('div', 'iui-corrected-age-actions');
  const calculate = e('button', '', node.calculateLabel ?? 'Calculate date difference'), reset = e('button', '', node.resetLabel ?? 'Reset supplied inputs');
  const basis = e('select'), birth = e('input'), observation = e('input'), due = e('input'), weeks = e('input'), days = e('input'), confirmed = e('select');
  const controls = {basis, birthDate: birth, observationDate: observation, dueDate: due, gestationalWeeks: weeks, gestationalDays: days, confirmedPreterm: confirmed};
  let draft: CorrectedAgeInput = {...node.initial}, calculated: CorrectedAgeResult | undefined, revision = 0;
  let pending = () => false;
  const rows = new Map<string, HTMLElement>();
  const labels = {basis: 'Calculation basis', birthDate: 'Birth date (YYYY-MM-DD)', observationDate: 'Observation date (YYYY-MM-DD)', dueDate: 'Original due date (YYYY-MM-DD)', gestationalWeeks: 'Completed gestational weeks at birth', gestationalDays: 'Remaining gestational days (0–6)', confirmedPreterm: 'Preterm birth explicitly confirmed in the supplied record'};
  w(() => {
    root.setAttribute('aria-label', node.label); root.setAttribute('role', 'group'); root.dir = 'auto';
    fields.append(legend); fields.disabled = node.disabled === true;
    calculate.type = reset.type = 'button'; calculate.disabled = reset.disabled = node.disabled === true;
    calculate.dataset.action = 'calculate'; reset.dataset.action = 'reset';
    result.setAttribute('role', 'status'); result.setAttribute('aria-live', 'polite'); result.setAttribute('aria-atomic', 'true');
    for (const [value, text] of [['', 'Choose a basis'], ['gestation', 'Gestational weeks and days'], ['due-date', 'Original due date']]) { const option = e('option', '', text); option.value = value; basis.append(option); }
    for (const [value, text] of [['', 'Unknown or not supplied'], ['true', 'Yes'], ['false', 'No']]) { const option = e('option', '', text); option.value = value; confirmed.append(option); }
    for (const [key, control] of Object.entries(controls)) {
      const row = e('div', 'iui-corrected-age-field'), label = e('label', '', labels[key as keyof typeof labels]);
      control.id = internalId(c, 'corrected-age-' + key); control.dataset.field = key; label.htmlFor = control.id;
      if (control.tagName === 'INPUT') { const input = control as HTMLInputElement; input.type = 'text'; input.autocomplete = 'off'; input.maxLength = key.includes('gestational') ? 2 : 10; input.inputMode = key.includes('gestational') ? 'numeric' : 'text'; }
      row.append(label, control); fields.append(row); rows.set(key, row);
    }
    buttons.append(calculate, reset); root.append(heading, notice, fields, buttons, result);
    const sources = e('p', 'iui-corrected-age-sources', 'Arithmetic reference: AAP HealthyChildren (2018). Product output window: through the original due date’s second calendar anniversary, informed by NICE NG72. Forty weeks is the subtraction reference, not a definition of full term. No clinical validation is claimed.');
    root.append(sources);
  });
  const blocked = (control: HTMLElement) => node.disabled === true || w(() => readerBlocked(root, control, life.current()));
  function paint() {
    w(() => {
      for (const [key, control] of Object.entries(controls)) {
        const value = draft[key as keyof CorrectedAgeInput]; control.value = value === null || value === undefined ? '' : String(value);
        control.setAttribute('aria-invalid', String(calculated?.status === 'invalid' && calculated.issues.some(issue => issue.field === key)));
      }
      rows.get('dueDate')!.hidden = rows.get('confirmedPreterm')!.hidden = draft.basis !== 'due-date';
      rows.get('gestationalWeeks')!.hidden = rows.get('gestationalDays')!.hidden = draft.basis !== 'gestation';
      result.replaceChildren(); root.dataset.result = calculated?.status ?? 'not-calculated';
      if (!calculated) { result.append(e('p', '', 'Supply dates and a basis, then calculate. No date is filled from the current clock.')); return; }
      switch (calculated.status) {
        case 'invalid': result.append(e('p', '', 'The supplied values cannot be calculated. Check the listed fields.')); for (const issue of calculated.issues) result.append(e('p', '', `${labels[issue.field as keyof typeof labels] ?? issue.field}: ${issue.code.replaceAll('_', ' ').toLowerCase()}.`)); break;
        case 'incomplete': result.append(e('p', '', 'Required values are missing: ' + calculated.missing.map(key => labels[key as keyof typeof labels] ?? key).join('; ') + '.')); break;
        case 'unsupported': result.append(e('p', '', calculated.reason === 'not-confirmed-preterm' ? 'Preterm birth has not been confirmed in the supplied record. No age result is shown.' : 'This calculator is limited to supplied gestation before 37 completed weeks. No age result is shown.')); break;
        case 'before-due-date': result.append(e('p', '', `${calculated.remainingDays} days remain until the supplied/arithmetic due date ${calculated.dueDate}. No negative or zero-clamped age is reported.`)); break;
        case 'outside-supported-window': result.append(e('p', '', `This observation is beyond the product’s output window ending ${calculated.windowEndDate}. No age result is shown. This does not mean follow-up should stop.`)); break;
        case 'calculated': {
          const value = e('p', 'iui-corrected-age-value', `${calculated.correctedWeeks} complete weeks and ${calculated.remainingDays} days (${calculated.correctedDays} days)`); value.dataset.value = 'corrected-days';
          result.append(value, e('p', '', `Chronological interval: ${calculated.chronologicalDays} days. Correction interval: ${calculated.correctionDays} days. Arithmetic/supplied due date: ${calculated.dueDate}.`));
          if (calculated.atWindowBoundary) result.append(e('p', '', 'This is the exact second-anniversary boundary of the product output window.'));
          result.append(e('p', '', 'A Feb 29 due date uses Feb 28 for its second anniversary in a non-leap year. This is a software convention. Weeks are not converted to calendar months.'));
        }
      }
    });
    // A reset can restore a different basis and hide the currently focused
    // input. Return only that hidden focus to the stable visible Reset action.
    if (!blocked(reset) && w(() => {
      const tree = root.getRootNode() as Document | ShadowRoot, active = tree.activeElement;
      return !!active && [...rows.values()].some(row => row.hidden && row.contains(active));
    })) w(() => reset.focus());
  }
  const freezeResult = (value: CorrectedAgeResult): CorrectedAgeResult => value.status === 'invalid' ? Object.freeze({...value, issues: Object.freeze(value.issues.map(issue => Object.freeze({...issue})))}) : value.status === 'incomplete' ? Object.freeze({...value, missing: Object.freeze([...value.missing])}) : Object.freeze({...value});
  const intent = (control: HTMLElement, event: Event, kind: CorrectedAgeDetail['intent'], update: () => void, value?: CorrectedAgeResult) => gate.run(() => {
    if (w(() => event.defaultPrevented) || pending() || blocked(control)) return;
    const ticket = revision;
    const detail: CorrectedAgeDetail = Object.freeze({id: node.id ?? null, intent: kind, ...(value ? {result: freezeResult(value)} : {})});
    const view = w(() => c.doc.defaultView); if (!view) return;
    const accepted = w(() => root.dispatchEvent(new view.CustomEvent('inform:view-corrected-age', {bubbles: true, cancelable: true, composed: false, detail})));
    if (!accepted || ticket !== revision || blocked(control)) return;
    revision++; update(); paint();
  });
  // Raw draft edits remain eligible during a host intent callback. Their
  // revision invalidates an older calculate/reset before that action commits.
  for (const [key, control] of Object.entries(controls)) c.on(control, control.tagName === 'SELECT' ? 'change' : 'input', event => {
    if (w(() => event.defaultPrevented) || blocked(control)) return;
    revision++; const raw = w(() => control.value);
    draft = {...draft, [key]: key === 'confirmedPreterm' ? raw === '' ? null : raw === 'true' : raw};
    if (key === 'basis') draft = {...draft, ...(raw === 'gestation' ? {dueDate: undefined, confirmedPreterm: undefined} : {gestationalWeeks: undefined, gestationalDays: undefined})};
    calculated = undefined; paint();
  });
  c.on(calculate, 'click', event => intent(calculate, event, 'calculate', () => { calculated = calculateCorrectedAge(draft); }, calculateCorrectedAge(draft)));
  const clear = () => { revision++; draft = {...node.initial}; calculated = undefined; paint(); };
  c.on(reset, 'click', event => intent(reset, event, 'reset', () => { draft = {...node.initial}; calculated = undefined; }));
  pending = readerNativeReset(c, root, [reset], () => revision, paint, clear, 'after-default');
  paint(); return root;
}
