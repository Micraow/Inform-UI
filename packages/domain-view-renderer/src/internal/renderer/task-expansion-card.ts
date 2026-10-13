import type {TaskExpansionCardNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {DraftReviewLabels} from './draft-review-labels.js';

let serial = 0;
/** Local review marks on supplied plan text. Never task execution or host state. */
export function renderTaskExpansionCard(c: RendererContext, n: TaskExpansionCardNode, t: DraftReviewLabels): HTMLElement {
  const e = c.element, id = `iui-task-review-internal-${c.prefix}${++serial}`;
  const root = e('fieldset', 'iui-task-expansion-card'); root.dir = 'auto';
  const title = e('legend', 'iui-task-review-title', n.title); root.append(title);
  c.bind(() => { root.disabled = n.disabled !== undefined && c.value(n.disabled) === true; });
  if (n.summary !== undefined) root.append(e('p', 'iui-task-review-summary', n.summary));
  const note = e('p', 'iui-task-review-note', t.reviewNote); note.id = `${id}-note`;
  root.setAttribute('aria-describedby', note.id); root.append(note);
  const count = e('p', 'iui-task-review-count'); count.id = `${id}-count`;
  count.setAttribute('role', 'status'); count.setAttribute('aria-live', 'polite'); count.setAttribute('aria-atomic', 'true');
  const list = e('ol', 'iui-task-review-steps'); root.append(count, list);
  const initial = n.steps.map(step => step.reviewed ?? false), reviewed = [...initial];
  let disposed = false;
  const live = () => !disposed && root.isConnected;
  const entries = n.steps.map((step, i) => {
    const row = e('li', 'iui-task-review-step'); row.dataset.step = step.id;
    const heading = e('h4', 'iui-task-review-step-title', step.title); heading.id = `${id}-step-${i}-title`;
    const input = e('input'); input.type = 'checkbox'; input.id = `${id}-step-${i}-reviewed`;
    input.checked = input.defaultChecked = reviewed[i];
    const label = e('label', 'iui-task-review-check'); label.htmlFor = input.id;
    const mark = e('span', '', t.reviewed); mark.id = `${id}-step-${i}-label`;
    input.setAttribute('aria-labelledby', `${mark.id} ${heading.id}`);
    label.append(input, mark); row.append(heading);
    if (step.description !== undefined) row.append(e('p', 'iui-task-review-description', step.description));
    if (step.details) {
      const disclosure = e('details', 'iui-task-review-details');
      disclosure.append(e('summary', '', t.details), e('p', '', step.details)); row.append(disclosure);
    }
    row.append(label); list.append(row);
    const change = () => {
      if (!live()) return;
      if (input.matches(':disabled')) { input.checked = input.defaultChecked = reviewed[i]; return; }
      if (reviewed[i] === input.checked) return;
      reviewed[i] = input.checked; input.defaultChecked = reviewed[i]; paint();
    };
    c.on(input, 'input', change); c.on(input, 'change', change);
    return input;
  });
  const reset = e('button', 'iui-task-review-reset', t.reset); reset.type = 'button'; root.append(reset);
  function paint() {
    const next = t.count(reviewed.filter(Boolean).length, reviewed.length);
    if (count.textContent !== next) count.textContent = next;
    reset.setAttribute('aria-disabled', String(reviewed.every((value, i) => value === initial[i])));
  }
  c.on(reset, 'click', () => {
    if (!live() || reset.matches(':disabled') || reviewed.every((value, i) => value === initial[i])) return;
    entries.forEach((input, i) => { reviewed[i] = initial[i]; input.checked = input.defaultChecked = reviewed[i]; });
    paint();
  });
  paint();
  c.cleanup(() => { disposed = true; });
  return root;
}
