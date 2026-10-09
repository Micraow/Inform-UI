# Original finite sentence builder

Canonical audit identity: `learning-sentence-builder-card`. The public protocol node is `sentence-builder`, owned by the `learning` schema domain. This is a local original implementation candidate, not a browser-accepted component count or a release claim.

## Authored contract

```json
{
  "type": "sentence-builder",
  "title": "Build the supplied sentence",
  "prompt": "Choose every token, then check the order.",
  "tokens": [
    { "id": "second", "text": "I" },
    { "id": "verb", "text": "am" },
    { "id": "first", "text": "I" }
  ],
  "answer": ["first", "verb", "second"],
  "joiner": " ",
  "explanation": "Repeated text still represents separate authored token identities."
}
```

- `title`: required literal string, 1–200 Unicode code points.
- `prompt`: optional literal string, at most 2,000 code points.
- `tokens`: 1–30 `{id,text}` objects. IDs use the existing 1–80-character identifier pattern and must be unique. Text is 1–200 code points; duplicate visible text is allowed.
- `answer`: every supplied token ID exactly once, in the author's intended order.
- `joiner`: optional, exactly a space or an empty string, default space. It controls the separate text previews only. Individual tokens keep their original strings. There is no inferred tokenization, grammar, punctuation, translation or language-specific spacing.
- `explanation`: optional literal string, at most 2,000 code points.

Unknown fields, shared-state bindings, arbitrary callbacks, scoring weights, media, remote answers and alternative grading algorithms are unsupported. Schema bounds and shared JSON resource budgets apply. Semantic validation additionally checks identities/permutation and rejects the widget anywhere inside a protocol `form`, including through layouts and lists. A sibling form is allowed. The combined implementation may place it in a tab panel; hidden DOM retains its session.

## Local practice behavior

The token bank retains the author's order. A native button appends one available identity. Chosen items provide Move earlier, Move later and Remove, with labels containing original text and current position. Boundary controls stay focusable with `aria-disabled="true"` and are strict no-ops. Remove restores the corresponding original bank position and focuses its button. Adding advances focus to the next available bank control, or Check when the last identity is selected. Reordering retains the actual token/control DOM and restores the same focused control only if moving it caused a browser blur.

Check on an incomplete answer asks the reader to choose every token; it does not label the answer wrong. Complete answers compare only exact identity order. A later edit clears stale judgement. Reveal shows the reference separately without changing the user's arrangement. A visible qualification remains while the reference is shown; subsequent matching checks are still assisted, never independently correct. Retry clears the arrangement, reference and old judgement, starts a fresh attempt and focuses the first bank button.

The component has one polite status region. Changes occur only on local actions. Unrelated or same-value `controller.setState` does not modify this widget's DOM, selection, focus, answer or announcement. A validated `controller.update` starts a new session; an invalid update leaves the old session intact. `dispose` removes its delegated listener. Native buttons have `type="button"`; they do not submit an enclosing external author form.

Answers are visible supplied document content, not protected exam secrets. No grades, verified learning outcomes or account state are saved. No network request, timer, storage, external service or host callback is used.

## Validation evidence and limits

Source baseline: `ed3c64c4253dc77b7db1ca1bec67d7a270b1a8bd`. Run the public focused suite with `node --test tests/sentence-builder.test.mjs`, and the full local aggregate with `npm run check`. Invalid fixtures are under `tests/fixtures/sentence-builder-invalid/`; they are deliberately excluded from legal examples.

`tests/browser/sentence-builder.spec.mjs` prepares native keyboard/pointer tests at 390/768/1100 in light/dark, touch, Arabic-leading RTL, long tokens, forced colors/reduced motion, browser form submission, exact owner/control lifetime and hidden tab reuse. It is **unexecuted** in the isolated implementation environment. The tab case explicitly skips on the exact ed3 baseline because that baseline does not contain tabs; it must run in the combined integration. Listing test cases is not browser execution. No remote CI or public acceptance claim is made here.
