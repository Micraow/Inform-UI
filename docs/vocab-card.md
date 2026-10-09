# Supplied vocabulary card

Canonical target: `learning-vocab-card`. Its original public node is `vocab-card`, owned by the `learning` schema domain. This is one canonical component; `word-card`, `flashcard`, and `learning-vocab-card` are not node aliases.

## Contract

- Required `term`: 1–200 Unicode code points.
- Required `senses`: 1–10 ordered records, each with a distinct bounded key `id` and literal `meaning` of 1–2000 code points.
- Optional `languageLabel` and `partOfSpeech`: 1–200 code points. Optional `pronunciation`: 1–500 code points. Omit unknown metadata; empty values are rejected.
- Each sense may contain `translation` of 0–1000 code points and 0–5 literal `examples`, each 1–2000 code points. Empty translation and empty example arrays have no visible label or placeholder.
- The standard document limits remain in force: depth, nodes, values, and total UTF-16 text storage. Per-field schema lengths use Unicode code points, so 200 emoji are valid and 201 are rejected.
- All properties are strict. No expressions, links, HTML interpretation, external images, callbacks, state bindings, initial ratings, dictionary retrieval, media, microphone, TTS, scores, schedules, or learning persistence.

Caller order and literal Unicode remain intact. Pronunciation is caller-supplied display text, not generated or played audio. Meanings are supplied reference material, not an independently verified dictionary. Examples are not interpreted as templates.

## Interaction and accessibility

Term and available metadata are visible first. `Show meaning` / `Hide meaning` is a native button controlling one retained hidden region via `aria-expanded` and `aria-controls`. The region contains a meanings heading, ordered senses, optional translation text, ordered examples, and an explicitly labelled self-assessment group.

`Again` and `Familiar` are native toggle-state buttons: only the user's explicit choice sets `aria-pressed`. Ratings can be changed. Reveal is never a grade. Hiding and revealing preserves the current rating. A persistent note discloses supplied content, self-assessment rather than verified mastery, page-local lifetime, and absence of saved history.

`Reset review` always remains available. It clears reveal and rating, focuses its own persistent button, and announces the reset. A hide request made while focus is inside the region moves focus to the persistent reveal button before hiding. The region and all its content are built once per mount/update; they are not rebuilt by toggling, rating, resetting, or unrelated shared-state changes. The widget has no shared-state refresher subscription.

A successful public `controller.update` resets local review state through replacement. Validation failure leaves DOM, focus, and state unchanged. All listeners are owned by the controller cleanup; detached controls are inert after update or disposal. Creation and focus use the mount's `ownerDocument`. Internal IDs use a namespace outside the authored-node prefix, with authored-ID collision tests.

The card can be nested in a form. Its four controls have `type="button"`, and it introduces no inputs, names, hidden submission values, or submit ownership. It cannot invoke the containing form's action. All actions check their button's native `:disabled` state, including inherited fieldset disabling while a form is caller-disabled or awaiting an asynchronous action; forged click events cannot bypass that check.

English and Chinese labels are explicit. Unsupported host languages fall back to English labels while caller content is preserved. Component direction is automatic from the supplied term. The RTL fixture includes an actual first-visible Arabic description to establish the outer document's direction as well.

## Local verification and pending browser acceptance

`tests/vocab-renderer.test.mjs` and `tests/vocab-validation.test.mjs` exercise public mounting, validation and compilation. They are DOM/schema tests, not real browser visual or input acceptance.

`tests/browser/vocab.spec.mjs` is prepared for real Enter/Space, pointer hit-testing, touch, owner iframe, form non-submission, focus after hide/reset, atomic update/disposal, collisions, offline public compiler hydration, and screenshot coverage. The screenshot matrix includes light/dark at 390/768/1100, actual Arabic RTL, Chinese long strings, forced colors and reduced motion. These browser scenarios have not been executed locally, and no browser screenshots or visual pass are claimed. Listing the Playwright tests checks discovery only.
