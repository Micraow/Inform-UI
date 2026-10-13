import {renderOfficialIcon} from './official-icons.js';
import type { ScheduledTaskSuggestionNode } from '../schema/document.js';
import type { RendererContext } from './context.js';
import { suppliedReaderContext, suppliedReaderPainter } from './supplied-reader-lifecycle.js';
import { intentGate } from './intent-gate.js';
import { readerBlocked } from './reader-controls.js';

/** A local acceptance receipt, never a scheduler or conversation operation. */
export function renderScheduledSuggestion(parent: RendererContext, node: ScheduledTaskSuggestionNode): HTMLElement {
  const root = parent.element('section', 'iui-scheduled-suggestion');
  const c = suppliedReaderContext(parent, root), life = c.lifecycle, gate = intentGate(life), paint = suppliedReaderPainter(c);
  root.setAttribute('aria-label', node.label);
  root.dataset.phase = node.status ?? 'resolved';
  if (node.status === 'pending') {
    root.setAttribute('aria-busy', 'true');
    const loading = c.element('div', 'iui-scheduled-suggestion-loading');
    loading.setAttribute('role', 'status'); loading.setAttribute('aria-label', node.label); root.append(loading); return root;
  }
  if (node.status === 'failed') {
    if (node.fallback) root.append(c.element('p', '', node.fallback)); else root.hidden = true;
    return root;
  }
  let submitted = node.submitted === true;
  const button = c.element('button', 'iui-scheduled-suggestion-button'), icon = c.element('span', 'iui-scheduled-suggestion-icon'), label = c.element('span', 'iui-scheduled-suggestion-label', node.label);
  button.type = 'button'; icon.setAttribute('aria-hidden', 'true'); button.append(icon, label); root.append(button);
  const refresh = () => paint(scope => {
    scope.during(() => { button.disabled = submitted || node.disabled === true; });
    scope.during(() => { icon.replaceChildren(renderOfficialIcon(c,submitted?'Check':'Clock',{size:20})); });
    scope.during(() => { root.dataset.submitted = String(submitted); });
  });
  c.on(button, 'click', event => gate.run(() => {
    const allowed = () => life.during(() => !submitted && !node.disabled && !event.defaultPrevented && !readerBlocked(root, button, true));
    if (!allowed()) return;
    const Constructor = life.during(() => c.doc.defaultView?.CustomEvent); if (!Constructor) return;
    const action = node.action ?? 'new-turn';
    const detail = Object.freeze({id: node.id ?? null, action, ...(action === 'new-turn' ? {creationGuidelines: node.creationGuidelines!} : {}), ...(node.originSurface ? {originSurface: node.originSurface} : {})});
    const intent = life.during(() => new Constructor('inform:view-scheduled-task-accept', {detail, bubbles: true, cancelable: true, composed: false}));
    if (!allowed() || !life.during(() => root.dispatchEvent(intent)) || !allowed()) return;
    submitted = true; refresh();
  }));
  refresh(); return root;
}
