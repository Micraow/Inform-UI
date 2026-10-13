import type {VocabCardNode} from '../core/vocab.js';
import type {RendererContext} from './context.js';
import type {VocabLabels} from './vocab-labels.js';

let serial = 0;

/** A finite supplied reference. No answer evaluation, network or durable state. */
export function renderVocabCard(c:RendererContext, node:VocabCardNode, labels:VocabLabels):HTMLElement {
  const e = c.element, id = `iui-vocab-internal-${c.prefix}${++serial}`;
  const root = e('section', 'iui-vocab-card');
  root.dir = 'auto';
  const term = e('h2', 'iui-vocab-term', node.term);
  term.id = `${id}-term`;
  root.setAttribute('aria-labelledby', term.id);
  root.append(term);

  const metadata = e('dl', 'iui-vocab-metadata');
  for (const [key, label] of [['languageLabel', labels.language], ['pronunciation', labels.pronunciation], ['partOfSpeech', labels.partOfSpeech]] as const) {
    const value = node[key];
    if (value === undefined) continue;
    const entry = e('div', 'iui-vocab-meta');
    const name = e('dt', '', label), text = e('dd', '', value);
    name.dir = 'auto'; text.dir = 'auto'; text.dataset.vocabMetadata = key;
    entry.append(name, text); metadata.append(entry);
  }
  if (metadata.childElementCount) root.append(metadata);

  const action = (name:string, label:string) => {
    const button = e('button', '', label);
    button.type = 'button'; button.dataset.vocabAction = name; button.dir = 'auto';
    return button;
  };
  const reveal = action('reveal', labels.show), reset = action('reset', labels.reset);
  const toolbar = e('div', 'iui-vocab-actions');
  toolbar.append(reveal, reset); root.append(toolbar);

  // Build once, then retain the entire subtree across reveal/hide/rate/reset.
  const details = e('div', 'iui-vocab-details');
  details.id = `${id}-details`; details.hidden = true;
  details.setAttribute('role', 'region');
  const heading = e('h3', '', labels.meanings);
  heading.id = `${id}-meanings`; heading.dir = 'auto';
  details.setAttribute('aria-labelledby', heading.id);
  reveal.setAttribute('aria-controls', details.id);
  reveal.setAttribute('aria-expanded', 'false');
  const senses = e('ol', 'iui-vocab-senses');
  for (const sense of node.senses) {
    const item = e('li', 'iui-vocab-sense');
    item.dataset.vocabSense = sense.id;
    const meaning = e('p', 'iui-vocab-meaning', sense.meaning);
    meaning.dir = 'auto'; item.append(meaning);
    if (sense.translation) {
      const translation = e('p', 'iui-vocab-translation');
      translation.dir = 'auto';
      const name = e('span', 'iui-vocab-label', labels.translation + ': ');
      const text = e('bdi', '', sense.translation);
      translation.append(name, text); item.append(translation);
    }
    if (sense.examples?.length) {
      const title = e('h4', 'iui-vocab-examples-title', labels.examples);
      title.dir = 'auto'; item.append(title);
      const examples = e('ol', 'iui-vocab-examples');
      for (const example of sense.examples) {
        const text = e('li', '', example); text.dir = 'auto'; examples.append(text);
      }
      item.append(examples);
    }
    senses.append(item);
  }
  details.append(heading, senses);
  const ratings = e('div', 'iui-vocab-rating');
  ratings.setAttribute('role', 'group'); ratings.setAttribute('aria-labelledby', `${id}-assessment`);
  const assessment = e('p', 'iui-vocab-label', labels.assessment);
  assessment.id = `${id}-assessment`; assessment.dir = 'auto';
  const ratingButtons = e('div', 'iui-vocab-actions');
  const again = action('again', labels.again), familiar = action('familiar', labels.familiar);
  again.setAttribute('aria-pressed', 'false'); familiar.setAttribute('aria-pressed', 'false');
  ratingButtons.append(again, familiar); ratings.append(assessment, ratingButtons);
  details.append(ratings); root.append(details);
  const status = e('p', 'iui-vocab-status');
  status.dir = 'auto'; status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
  const note = e('p', 'iui-vocab-note', labels.note); note.dir = 'auto';
  root.append(status, note);

  let revealed = false;
  let rating:'again'|'familiar'|undefined;
  function show(value:boolean) {
    // A synthetic activation may hide the region while focus is still inside it.
    if (!value && details.contains(c.doc.activeElement)) reveal.focus();
    revealed = value; details.hidden = !value;
    reveal.setAttribute('aria-expanded', String(value));
    reveal.textContent = value ? labels.hide : labels.show;
  }
  function rate(value:'again'|'familiar') {
    if (!revealed) return;
    rating = value;
    again.setAttribute('aria-pressed', String(rating === 'again'));
    familiar.setAttribute('aria-pressed', String(rating === 'familiar'));
    status.textContent = value === 'again' ? labels.againStatus : labels.familiarStatus;
  }
  // Native fieldset disabling also applies to forged/programmatic click events.
  const onAction = (button:HTMLButtonElement, run:()=>void) => c.on(button, 'click', () => {
    if (!button.matches(':disabled')) run();
  });
  onAction(reveal, () => show(!revealed));
  onAction(again, () => rate('again'));
  onAction(familiar, () => rate('familiar'));
  onAction(reset, () => {
    // Reset remains connected and visible before any focused child is hidden.
    reset.focus(); show(false); rating = undefined;
    again.setAttribute('aria-pressed', 'false'); familiar.setAttribute('aria-pressed', 'false');
    status.textContent = labels.resetStatus;
  });
  // No c.bind: unrelated state/resize refreshes never repaint local study state.
  // All four listeners use the owning controller's registered cleanup.
  return root;
}
