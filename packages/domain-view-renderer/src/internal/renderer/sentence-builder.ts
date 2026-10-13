import type {SentenceBuilderNode} from '../core/sentence-builder.js';
import type {RendererContext} from './context.js';
import type {SentenceBuilderLabels} from './sentence-builder-labels.js';

let serial = 0;
/** Original local practice renderer. No shared state, requests, timers or persistence. */
export function renderSentenceBuilder(c: RendererContext, n: SentenceBuilderNode, t: SentenceBuilderLabels): HTMLElement {
  const e = c.element, id = `iui-sentence-builder-internal-${c.prefix}${++serial}`;
  const root = e('section', 'iui-sentence-builder');
  root.dir = 'auto'; root.dataset.component = 'learning-sentence-builder-card';
  const title = e('h2', '', n.title); title.id = `${id}-title`; // Let the authored first heading establish the section's dir=auto.
  root.setAttribute('aria-labelledby', title.id);
  const prompt = e('p', 'iui-sentence-builder-literal', n.prompt ?? ''); prompt.hidden = !n.prompt; prompt.dir = 'auto';
  const progress = e('p', 'iui-caption');
  const bankGroup = e('section', 'iui-sentence-builder-group'), bankHeading = e('h3', '', t.bank);
  bankHeading.id = `${id}-bank`; bankGroup.setAttribute('aria-labelledby', bankHeading.id);
  const bank = e('div', 'iui-sentence-builder-bank'), bankEmpty = e('p', 'iui-caption', t.bankEmpty);
  bankGroup.append(bankHeading, bank, bankEmpty);
  const chosenGroup = e('section', 'iui-sentence-builder-group'), chosenHeading = e('h3', '', t.chosen);
  chosenHeading.id = `${id}-chosen`; chosenGroup.setAttribute('aria-labelledby', chosenHeading.id);
  const chosen = e('ol', 'iui-sentence-builder-chosen'), empty = e('p', 'iui-caption', t.empty);
  chosen.setAttribute('aria-labelledby', chosenHeading.id); chosen.setAttribute('role', 'list'); const preview = e('p', 'iui-sentence-builder-literal'); preview.dir = 'auto'; preview.setAttribute('aria-label', t.preview);
  chosenGroup.append(chosenHeading, empty, chosen, preview);
  const reference = e('section', 'iui-sentence-builder-reference'), referenceHeading = e('h3', '', t.reference);
  reference.id = `${id}-reference`; referenceHeading.id = `${id}-reference-heading`; reference.setAttribute('aria-labelledby', referenceHeading.id);
  const referenceList = e('ol', 'iui-sentence-builder-reference-list'); const referencePreview = e('p', 'iui-sentence-builder-literal', n.answer.map(id => n.tokens.find(token => token.id === id)!.text).join(n.joiner ?? ' '));
  referencePreview.dir = 'auto'; referencePreview.setAttribute('aria-label', t.preview);
  reference.append(referenceHeading, e('p', 'iui-caption', t.revealed), referenceList, referencePreview); reference.hidden = true;
  const live = e('p', 'iui-sentence-builder-feedback');
  live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true');
  const explanation = e('p', 'iui-sentence-builder-literal', n.explanation ?? ''); explanation.dir = 'auto'; explanation.hidden = true;
  const action = (name: string, label: string) => {
    const button = e('button', '', label); button.type = 'button'; button.dataset.sentenceAction = name; return button;
  };
  const check = action('check', t.check), reveal = action('reveal', t.reveal), retry = action('retry', t.retry);
  reveal.setAttribute('aria-controls', reference.id); reveal.setAttribute('aria-expanded', 'false');
  const controls = e('div', 'iui-sentence-builder-controls'); controls.append(check, reveal, retry);
  root.append(title, e('p', 'iui-caption', t.kind), prompt, progress, bankGroup, chosenGroup, controls, live, reference, explanation, e('p', 'iui-caption', t.privacy));

  const order: string[] = [];
  let assisted = false;
  const entries = new Map<string, {bank: HTMLButtonElement; item: HTMLLIElement; position: HTMLElement; remove: HTMLButtonElement; earlier: HTMLButtonElement; later: HTMLButtonElement}>();
  n.tokens.forEach((token, index) => {
    const add = action('add', token.text); add.dir = 'auto'; add.dataset.tokenId = token.id;
    add.setAttribute('aria-label', t.addName(token.text, index + 1)); bank.append(add);
    const item = e('li', 'iui-sentence-builder-item'); item.dataset.tokenId = token.id;
    const position = e('span', 'iui-sentence-builder-position'); position.setAttribute('aria-hidden', 'true');
    const text = e('span', 'iui-sentence-builder-token', token.text); text.dir = 'auto';
    const buttons = e('div', 'iui-sentence-builder-item-actions');
    const remove = action('remove', t.remove), earlier = action('earlier', t.earlier), later = action('later', t.later);
    for (const button of [remove, earlier, later]) button.dataset.tokenId = token.id;
    buttons.append(earlier, later, remove); item.append(position, text, buttons);
    entries.set(token.id, {bank: add, item, position, remove, earlier, later});
  });
  for (const tokenId of n.answer) {
    const item = e('li', 'iui-sentence-builder-token', n.tokens.find(token => token.id === tokenId)!.text);
    item.dir = 'auto'; item.dataset.tokenId = tokenId; referenceList.append(item);
  }
  // Refresh only on explicit local actions; unrelated controller state updates do not touch this DOM.
  function sync() {
    const active = c.doc.activeElement as HTMLElement | null;
    const selected = new Set(order);
    n.tokens.forEach(token => {
      const entry = entries.get(token.id)!; entry.bank.hidden = selected.has(token.id);
      if (!selected.has(token.id)) entry.item.remove();
    });
    order.forEach((tokenId, index) => {
      const entry = entries.get(tokenId)!, text = n.tokens.find(token => token.id === tokenId)!.text;
      if (chosen.children[index] !== entry.item) chosen.insertBefore(entry.item, chosen.children[index] ?? null);
      entry.position.textContent = String(index + 1);
      for (const [button, label] of [[entry.remove, t.remove], [entry.earlier, t.earlier], [entry.later, t.later]] as const) {
        button.setAttribute('aria-label', t.itemAction(label, text, index + 1));
      }
      entry.earlier.setAttribute('aria-disabled', String(index === 0));
      entry.later.setAttribute('aria-disabled', String(index === order.length - 1));
    });
    preview.textContent = order.map(id => n.tokens.find(token => token.id === id)!.text).join(n.joiner ?? ' '); preview.hidden = !order.length;
    progress.textContent = t.progress(order.length, n.tokens.length);
    empty.hidden = order.length !== 0; chosen.hidden = !order.length; bankEmpty.hidden = order.length !== n.tokens.length;
    // Moving the same DOM node can blur it on some engines. Restore only that exact active control.
    if (active && root.contains(active) && !active.hidden && c.doc.activeElement !== active) active.focus();
  }
  function edited(message: string) {
    root.dataset.attempt = assisted ? 'revealed' : 'draft';
    explanation.hidden = true; live.textContent = message; sync();
  }
  c.on(root, 'click', event => {
    const target = event.target as Element;
    const button = typeof target.closest === 'function' ? target.closest<HTMLButtonElement>('button[data-sentence-action]') : null;
    if (!button || !root.contains(button) || button.disabled || button.hidden || button.getAttribute('aria-disabled') === 'true') return;
    const name = button.dataset.sentenceAction, tokenId = button.dataset.tokenId;
    if (name === 'add' && tokenId && entries.has(tokenId) && !order.includes(tokenId)) {
      order.push(tokenId); edited(t.added(order.length));
      const index = n.tokens.findIndex(token => token.id === tokenId);
      const next = [...n.tokens.slice(index + 1), ...n.tokens.slice(0, index)].find(token => !order.includes(token.id));
      (next ? entries.get(next.id)!.bank : check).focus();
    } else if (name === 'remove' && tokenId && order.includes(tokenId)) {
      order.splice(order.indexOf(tokenId), 1); edited(t.removed(n.tokens.findIndex(token => token.id === tokenId) + 1)); entries.get(tokenId)!.bank.focus();
    } else if ((name === 'earlier' || name === 'later') && tokenId) {
      const index = order.indexOf(tokenId), next = index + (name === 'earlier' ? -1 : 1);
      if (index < 0 || next < 0 || next >= order.length) return;
      [order[index], order[next]] = [order[next], order[index]]; edited(t.moved(next + 1));
    } else if (name === 'check') {
      if (order.length !== n.tokens.length) {
        root.dataset.attempt = assisted ? 'revealed' : 'draft'; live.textContent = t.incomplete; explanation.hidden = true; return;
      }
      const matches = order.every((token, index) => token === n.answer[index]);
      root.dataset.attempt = assisted ? 'revealed' : matches ? 'correct' : 'incorrect';
      live.textContent = assisted ? matches ? t.assistedMatch : t.assistedMismatch : matches ? t.correct : t.incorrect;
      explanation.hidden = !n.explanation;
    } else if (name === 'reveal') {
      assisted = true; root.dataset.attempt = 'revealed'; reference.hidden = false;
      reveal.setAttribute('aria-expanded', 'true'); explanation.hidden = !n.explanation; live.textContent = t.revealed;
    } else if (name === 'retry') {
      order.length = 0; assisted = false; reference.hidden = true; reveal.setAttribute('aria-expanded', 'false');
      edited(t.reset); entries.get(n.tokens[0].id)!.bank.focus();
    }
  });
  root.dataset.attempt = 'draft'; sync(); return root;
}
