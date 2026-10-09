# Original finite sentence-embedded fill-in practice

Later local candidate for canonical `learning-fill-blank-card`; no release/pin or browser acceptance is implied. Original protocol and implementation, not a claim of private-source field compatibility.

`fill-blank` belongs to `learning`. Required `title` (1–200), `parts` (1–50), `blanks` (1–12); optional ordinary node `id` and `description` (0–2000). Each part is literal text up to 2000 Unicode code points or `{ "blank": "key" }`. Each blank is `{ id, label, answers, hint?, explanation? }`, with normal identifier syntax, label 1–200, answers 1–8 strings of 1–200, hint up to 1000, explanation up to 2000. Every definition must be referenced exactly once; no missing/duplicate/unused reference is accepted. Definition order may differ from passage order: visible numbering, field order and first-invalid focus follow the passage.

The whole document still has its shared depth/node/text budgets. All teaching text is inert. No Markdown, HTML, executable handler, regular expression or network callback is interpreted. A widget cannot appear anywhere inside an Inform form, including through lists, popovers or containers, because its local input lifecycle is separate. Independent widgets may reuse blank IDs; DOM identities are mount-scoped.

## Use and interaction

Use sentence fragments that naturally surround a blank. Each input is a native single-line textbox with an associated supplied label, required announcement, hint and feedback references. Literal text wraps; input fields remain embedded in the actual sentence. Below the sentence, an ordered list identifies each blank and its feedback. The initial status region is empty; no answer is announced on mount.

Check, including non-composing Enter inside a textbox, first validates every raw draft. Empty/whitespace-only and overlong responses are incomplete, not wrong grades. They retain their text, receive an actionable message, and the first incomplete field in passage order receives focus. Only a complete attempt gets the count of matched references. Each comparison is exactly `draft.trim() === answer.trim()`: case-sensitive, no Unicode normalization, whitespace collapse, fuzzy language matching, numerical equivalence or AI judgment. Answers must be unique and nonempty after trim; a remaining CR/LF is rejected because a native single-line textbox cannot hold it. Alternatives are explicitly supplied in `answers`.

Editing one field clears that field's prior feedback and removes the aggregate count until another Check. Repeated Check recomputes one result; it never adds points. Reference Reveal keeps the user's drafts untouched and separately displays every supplied reference. It enters clearly labeled unscored review mode and disables Check/Reveal until Retry. Retry clears drafts, all feedback and review mode and focuses the first blank. Reference answers are already present in JSON; this is not a protected exam or durable result.

The public draft cap is 200 Unicode code points. Native `maxLength=400` uses UTF-16 units so all 200-emoji answers remain enterable; the explicit Check guard enforces the exact code-point cap without truncating a too-long editable draft. IME composing Enter is left to native editing. Control buttons use native pointer/keyboard behavior, not custom click emulation.

## Lifecycle and domains

No host `bind`, hidden score state, timer, network, storage or persistence. Unrelated or same-value `setState`, shared-state reset buttons and hiding an ancestor preserve local drafts, selection and review state. Only this widget's Retry or a valid `controller.update` resets it. Invalid updates are atomic. `dispose` removes listeners; detached old controls cannot operate a new mount. Hidden tab panels may contain the widget and preserve it.

Read a same-version `base+learning` closed schema for the example. A mixed tab/time/forms document needs all its actual domains; putting a separate complete form next to the widget is allowed, putting the widget inside that form is not. Current accepted d370 URLs do not include this later node.

See `examples/fill-blank-practice.json` for the original synthetic example. The module's native browser specification is prepared, not locally run. These local checks do not prove pixels, screen-reader behavior or cross-browser acceptance.
