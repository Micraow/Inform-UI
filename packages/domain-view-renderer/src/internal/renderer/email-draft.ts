import type {EmailDraftNode} from '../schema/document.js';
import type {RendererContext} from './context.js';
import type {DraftReviewLabels} from './draft-review-labels.js';
import type {WritingLabels} from './writing-labels.js';
import {renderWriting} from './writing.js';

let serial = 0;
/** Literal authored envelope plus the existing independent local writing editor. */
export function renderEmailDraft(c: RendererContext, n: EmailDraftNode, t: DraftReviewLabels, writing: WritingLabels): HTMLElement {
  const e = c.element, id = `iui-email-internal-${c.prefix}${++serial}`;
  const root = e('section', 'iui-email-draft');
  root.dir = 'auto';
  const title = e('h3', 'iui-email-title', n.label);
  title.id = `${id}-title`; root.setAttribute('aria-labelledby', title.id);
  const metadata = e('dl', 'iui-email-metadata');
  const subject = e('dd', 'iui-email-subject', n.subject); subject.dir = 'auto';
  metadata.append(e('dt', '', t.subject), subject);
  function recipients(label: string, supplied: readonly string[]) {
    const content = e('dd');
    if (!supplied.length) content.append(e('p', 'iui-email-empty', t.noRecipients));
    else {
      const list = e('ol', 'iui-email-recipients');
      for (const value of supplied) { const item = e('li', '', value); item.dir = 'auto'; list.append(item); }
      content.append(list);
    }
    metadata.append(e('dt', '', label), content);
  }
  recipients(t.to, n.to);
  if (n.cc !== undefined) recipients(t.cc, n.cc);
  const note = e('p', 'iui-email-disclosure', t.recipientsNote);
  note.id = `${id}-recipients-note`; root.setAttribute('aria-describedby', note.id);
  // Reuse all writing behavior and labels, including its trusted Clipboard boundary.
  const body = renderWriting(c, {type: 'writing-block', label: t.body, value: n.body,
    ...(n.editable === undefined ? {} : {editable: n.editable}),
    ...(n.note === undefined ? {} : {note: n.note})}, writing);
  root.append(title, metadata, note, body);
  return root;
}
