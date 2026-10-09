import type {FillBlankNode} from '../core/fill-blank.js';
import type {RendererContext} from './context.js';

let serial = 0;
type Result = 'unreviewed' | 'missing' | 'too-long' | 'correct' | 'incorrect' | 'reference';

/** Page-local practice. All text is supplied data and is rendered with safe DOM text setters. */
export function renderFillBlank(c: RendererContext, node: FillBlankNode): HTMLElement {
  const e = c.element, t = c.labels().fillBlankUI, prefix = `iui-fill-blank-internal-${c.prefix}${++serial}-`;
  const root = e('section', 'iui-fill-blank');
  const title = e('h2', 'iui-fill-blank-title', node.title);
  title.id = prefix + 'title'; root.setAttribute('aria-labelledby', title.id); root.dataset.state = 'editing';
  root.append(e('p', 'iui-caption', t.kind), title);
  if (node.description !== undefined) root.append(e('p', 'iui-fill-blank-description', node.description));
  const rules = e('p', 'iui-caption', t.rules); rules.id = prefix + 'rules'; root.append(rules);
  const passage = e('p', 'iui-fill-blank-passage'); passage.dir = 'auto';
  const feedback = e('ol', 'iui-fill-blank-feedback');
  let reference = false, reviewed = false;
  const definitions = new Map(node.blanks.map(blank => [blank.id, blank]));
  const orderedBlanks = node.parts.flatMap(part => typeof part === 'string' ? [] : [definitions.get(part.blank)!]);
  const controls = orderedBlanks.map((blank, index) => {
    const id = prefix + index, wrapper = e('span', 'iui-fill-blank-slot');
    const label = e('label', 'iui-fill-blank-sr', `${index + 1}. ${blank.label}`);
    const input = e('input', 'iui-fill-blank-input'); input.type = 'text'; input.id = id; label.htmlFor = id;
    // Native maxLength counts UTF-16 units. 400 units permit every 200-code-point answer;
    // the precise limit is checked below without truncation or replacing the user's draft.
    input.maxLength = 400; input.autocomplete = 'off'; input.spellcheck = false; input.dir = 'auto';
    input.setAttribute('aria-required', 'true');
    input.dataset.blankId = blank.id;
    const number = e('span', 'iui-fill-blank-number', index + 1); number.setAttribute('aria-hidden', 'true');
    wrapper.append(label, number, input);
    const row = e('li', 'iui-fill-blank-row'); row.dataset.blankId = blank.id; row.dataset.result = 'unreviewed';
    row.append(e('span', 'iui-fill-blank-label', blank.label));
    const message = e('p', 'iui-fill-blank-message'); message.id = id + '-feedback'; message.hidden = true;
    const explanation = e('p', 'iui-fill-blank-explanation'); explanation.hidden = true;
    const described = [rules.id, message.id];
    if (blank.hint !== undefined) {
      const hint = e('p', 'iui-caption', `${t.hint}: ${blank.hint}`); hint.id = id + '-hint'; row.append(hint); described.push(hint.id);
    }
    row.append(message, explanation); feedback.append(row); input.setAttribute('aria-describedby', described.join(' '));
    return {blank, input, wrapper, row, message, explanation, result: 'unreviewed' as Result};
  });
  const byId = new Map(controls.map(control => [control.blank.id, control]));
  for (const part of node.parts) passage.append(typeof part === 'string' ? c.doc.createTextNode(part) : byId.get(part.blank)!.wrapper);
  const action = (name: string, label: string) => { const button = e('button', '', label); button.type = 'button'; button.dataset.fillBlankAction = name; return button; };
  const actions = e('div', 'iui-fill-blank-actions'), check = action('check', t.check), reveal = action('reveal', t.reveal), retry = action('retry', t.retry);
  const live = e('p', 'iui-fill-blank-status'); live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true');
  actions.append(check, reveal, retry); root.append(passage, feedback, actions, live, e('p', 'iui-caption', t.privacy));

  function setResult(control: typeof controls[number], result: Result): void {
    control.result = result; control.row.dataset.result = result;
    const invalid = result === 'missing' || result === 'too-long' || result === 'incorrect';
    if (invalid) control.input.setAttribute('aria-invalid', 'true'); else control.input.removeAttribute('aria-invalid');
    control.message.hidden = result === 'unreviewed';
    control.message.textContent = result === 'unreviewed' ? '' : result === 'missing' ? t.required : result === 'too-long' ? t.tooLong : result === 'reference' ? `${t.reference}: ${control.blank.answers.map(answer => answer.trim()).join(' / ')}` : t[result];
    const explain = ['correct', 'incorrect', 'reference'].includes(result) && control.blank.explanation !== undefined;
    control.explanation.hidden = !explain;
    control.explanation.textContent = explain ? `${t.explanation}: ${control.blank.explanation}` : '';
  }
  function checkAll(): void {
    if (reference) return;
    let firstInvalid: HTMLInputElement | undefined;
    for (const control of controls) {
      const answer = control.input.value;
      let length = 0; for (const _point of answer) { if (++length > 200) break; }
      const result = !answer.trim() ? 'missing' : length > 200 ? 'too-long' : 'unreviewed';
      setResult(control, result);
      if (result !== 'unreviewed' && !firstInvalid) firstInvalid = control.input;
    }
    reviewed = true;
    if (firstInvalid) {
      root.dataset.state = 'incomplete'; live.textContent = t.incomplete; firstInvalid.focus(); return;
    }
    let correct = 0;
    for (const control of controls) {
      const matches = control.blank.answers.some(answer => answer.trim() === control.input.value.trim());
      if (matches) correct++;
      setResult(control, matches ? 'correct' : 'incorrect');
    }
    root.dataset.state = 'checked'; live.textContent = t.result(correct, controls.length);
  }
  for (const control of controls) {
    c.on(control.input, 'input', () => {
      if (reference) return;
      setResult(control, 'unreviewed'); root.dataset.state = 'editing';
      if (reviewed) live.textContent = t.editing;
    });
    c.on(control.input, 'keydown', event => {
      const key = event as KeyboardEvent;
      if (key.key === 'Enter' && !key.isComposing && key.keyCode !== 229) {
        key.preventDefault(); if (!key.repeat) checkAll();
      }
    });
  }
  c.on(check, 'click', checkAll);
  c.on(reveal, 'click', () => {
    if (reference) return;
    reference = true; root.dataset.state = 'reference';
    controls.forEach(control => setResult(control, 'reference'));
    live.textContent = t.revealed;
    // Move focus to the enabled next action before disabling the activated review control.
    retry.focus();
    check.disabled = true; reveal.disabled = true;
  });
  c.on(retry, 'click', () => {
    reference = false; reviewed = false; root.dataset.state = 'editing'; check.disabled = false; reveal.disabled = false;
    for (const control of controls) { control.input.value = ''; setResult(control, 'unreviewed'); }
    live.textContent = t.reset; controls[0].input.focus();
  });
  // No bind callback: unrelated host state changes must preserve drafts, DOM, selection and focus.
  // c.on owns every listener; update/dispose detaches them with the normal renderer lifecycle.
  return root;
}
