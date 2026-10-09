import type {PromptSuggestionsNode} from '../core/suggestions.js';
import type {RendererContext} from './context.js';
import type {suggestionsEnglish} from './suggestions-labels.js';

export interface SuggestionDetail {
  readonly componentId: string | null;
  readonly suggestionId: string;
  readonly text: string;
}
let serial = 0;

/** Finite supplied choices. The only integration is a cancelable DOM event, never chat I/O. */
export function renderSuggestions(c: RendererContext, node: PromptSuggestionsNode, t: typeof suggestionsEnglish): HTMLElement {
  const e = c.element, prefix = `iui-suggestions-internal-${c.prefix}${++serial}-`;
  const root = e('section', 'iui-suggestions'); root.dir = 'auto';
  const title = e('h2', 'iui-suggestions-title', node.label); title.id = prefix + 'title';
  root.setAttribute('aria-labelledby', title.id); root.append(title);
  if (node.description !== undefined) root.append(e('p', 'iui-suggestions-description', node.description));
  const disclosure = e('p', 'iui-caption', t.disclosure); disclosure.id = prefix + 'disclosure';
  root.setAttribute('aria-describedby', disclosure.id); root.append(disclosure);
  const list = e('ul', 'iui-suggestions-list'); list.id = prefix + 'items';
  list.setAttribute('aria-labelledby', title.id);
  const initial = Math.min(node.initialVisible ?? 6, node.items.length);
  const controls = node.items.map(item => {
    const row = e('li'), button = e('button', 'iui-suggestions-choice', item.text);
    button.type = 'button'; button.dir = 'auto'; button.dataset.suggestionId = item.id;
    button.setAttribute('aria-pressed', 'false'); row.append(button); list.append(row);
    return {item, row, button};
  });
  const actions = e('div', 'iui-suggestions-actions');
  const more = e('button', '', t.more); more.type = 'button'; more.dataset.suggestionsAction = 'expand';
  more.setAttribute('aria-controls', list.id); more.setAttribute('aria-expanded', 'false'); more.hidden = initial === node.items.length;
  const clear = e('button', '', t.clear); clear.type = 'button'; clear.dataset.suggestionsAction = 'clear';
  clear.setAttribute('aria-disabled', 'true');
  const status = e('p', 'iui-suggestions-status'); status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
  actions.append(more, clear); root.append(list, actions, status);
  let selected: string | null = null, expanded = false, alive = true, dispatching = false, generation = 0;
  c.cleanup(() => { alive = false; generation++; });
  const blocked = (button: HTMLButtonElement) => !alive || dispatching || button.matches(':disabled');
  function paintSelection(): void {
    for (const control of controls) control.button.setAttribute('aria-pressed', String(control.item.id === selected));
    clear.setAttribute('aria-disabled', String(selected === null));
  }
  function paintExpansion(): void {
    controls.forEach((control, index) => { control.row.hidden = !expanded && index >= initial; });
    more.setAttribute('aria-expanded', String(expanded)); more.textContent = expanded ? t.fewer : t.more;
  }
  for (const {item, row, button} of controls) c.on(button, 'click', () => {
    if (blocked(button) || row.hidden) return;
    const detail: SuggestionDetail = Object.freeze({componentId: node.id ?? null, suggestionId: item.id, text: item.text});
    const CustomEvent = c.doc.defaultView?.CustomEvent;
    let event: CustomEvent<SuggestionDetail>;
    if (CustomEvent) event = new CustomEvent('iui:suggestion', {detail, bubbles: true, cancelable: true, composed: false});
    else { event = c.doc.createEvent('CustomEvent'); event.initCustomEvent('iui:suggestion', true, true, detail); }
    const current = ++generation;
    dispatching = true;
    let accepted: boolean;
    try { accepted = root.dispatchEvent(event); }
    finally { dispatching = false; }
    // A synchronous listener may replace/dispose this entire document. Its old
    // event must never modify a replacement or even the retained detached DOM.
    if (!alive || current !== generation) return;
    if (!accepted) { status.textContent = t.rejected; return; }
    selected = item.id; paintSelection(); status.textContent = t.accepted;
  });
  c.on(more, 'click', () => {
    if (blocked(more) || more.hidden) return;
    expanded = !expanded; paintExpansion();
    // Keep focus where the native activation put it; never move outside this action.
  });
  c.on(clear, 'click', () => {
    if (blocked(clear) || selected === null) return;
    selected = null; paintSelection(); status.textContent = t.cleared;
  });
  paintExpansion();
  // No state refresher: unrelated updates retain the exact nodes, focus and live text.
  return root;
}
