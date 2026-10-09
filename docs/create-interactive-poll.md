# Local interactive poll composer

`create-interactive-poll` is an original bounded editor that produces a local poll draft. It is not a quiz alias, a live voting provider or a publish operation. There is no account, storage, network request, participant invitation, vote collection or result tally. Preparing a draft only emits an explicit local event to a consumer. This candidate is separate from the 97-node acceptance checkpoint and has not passed real-browser/visual acceptance.

## Initial contract

Required `label` (1–200 Unicode codepoints) and `options` (2–8). Each option requires unique `id` (bounded supplied key) and `label` (0–200 codepoints). Optional `question` (0–500), `multiple` (boolean, default false), `disabled` (boolean, default false), and `description` (2000). Blank initial question/option text is a valid incomplete draft. The schema rejects bindings, provider endpoints, action strings, extra fields, overbounds and malformed IDs. Duplicate initial IDs report `DUPLICATE_ID` at the exact option ID path.

## Local editing

Native textarea/text inputs edit the question and option text. Native buttons add up to eight options, remove down to two, or move an option up/down. Reordering keeps stable option IDs and row identity and returns focus to the same move button. Add focuses the new input; remove focuses the neighboring remaining input. Boundary actions are no-ops. Generated option IDs are unique within the current draft. Every dynamic option listener is retired when its row is removed; disposal retires remaining listeners.

The native multiple-choice checkbox only describes the prospective poll. Preview renders literal text and a numbered read-only option list. It does not simulate votes. Preview is explicitly toggled and hides after an edit so it never remains visibly stale. Reset restores the original draft and hides preview.

Inputs are not Forms bindings, have no payload names and are deliberately unassociated with outer native forms. Native external form reset leaves the local draft unchanged. Unrelated `setState` preserves local edits, focus, caret and DOM. Authored pending/disabled Forms still disable the native controls through normal fieldset inheritance.

## Preparing a draft

Prepare requires a nonblank question and nonblank options, question length <=500 codepoints, option length <=200, and distinct option labels after trimming leading/trailing whitespace for duplicate detection. Validation does not trim or replace the actual stored text. Errors focus the first invalid field. Unicode bounds are checked explicitly; native maximum UTF-16 lengths allow all valid astral-character drafts.

An explicit valid Prepare emits `iui:poll-ready`: bubbling, cancelable, noncomposed, constructed with the ownerDocument realm or fallback. Frozen detail:

- `componentId`: authored component ID or null
- `question`: exact local question text
- `options`: frozen array of frozen `{id,label}` objects in current local order
- `multiple`: current boolean setting

Cancellation retains every edit. Acceptance means only that a local draft is ready; nothing is published. A later explicit Prepare may emit again. Reentrant ready handlers cannot edit, reset or dispatch a second operation. Event constructor/getter/listener replacement or disposal cannot dispatch or repaint a retired composer. Constructor failures leave the draft retryable.

Disabled/pending, hidden/inert, detached or moved-outside-root controls cannot initiate operations. Retained input handlers and later legitimate edits never rewrite externally moved inputs or reclaim externally moved option rows. Prepare requires the question, mode and every current option input to remain owned and enabled; ownership is rechecked after event construction and dispatch, so a host interruption cannot produce a stale ready status or focus an outside invalid input. Update resets the local draft; dispose removes listeners. All preview and status content is literal text.

## Verification

Focused tests cover public schema/semantic parity, incomplete drafts, Unicode, editing/caret, add/remove/reorder, bounded identities, retired listeners, preview safety, readiness validation, frozen event order, cancellation/repeat, Forms exclusion, native reset, disabled/inert/detached controls, ownerDocument/shadow boundaries and deterministic compilation. Prepared browser tests cover actual keyboard/pointer/touch composition, light/dark widths, RTL and forced colors. Prepared specs are not browser acceptance evidence; canonical accepted counts remain unchanged.

## Ownership regression evidence

An independent combined-runtime audit reproduced eight failures involving detached or externally moved question/option/mode controls, reclaimed option rows and validation focus outside the component. The repair keeps model restoration within owned controls and rechecks all draft inputs at readiness boundaries. Dedicated regressions also cover a host moving an option during event construction or dispatch. This is a lifecycle repair within the existing candidate, not an additional canonical component.
