# Local email and supplied plan review

These are two original canonical base components, not mail services or task execution.

## email-draft

Required: label (1–200 Unicode code points), subject (0–300), body (0–12000), to (0–20 literal strings, each 1–320). Optional: cc (same bounds), note (0–1000), editable (boolean, default true), standard node id.

Recipients and subject are read-only supplied metadata. Order, duplicate strings, whitespace and literal markup are preserved without address inference or delivery validation. Empty recipients have an explicit empty state. Examples use fictional example.invalid addresses only.

The Message body textarea directly composes the existing renderWriting implementation and writingUI labels. It keeps native LF newline normalization, Unicode budget, editing, selection, read-only behavior and the trusted explicit Clipboard boundary. Copy contains only the current visible body, never recipient or subject headers. The local draft is not saved, sent, exported or bound to host state. No mailto, attachments, accounts, service APIs or external app actions exist.

Authored form descendants are rejected with EMAIL_FORM, including deep/list/popover placement. External native form reset still preserves the independent local body. External disabled fieldsets suppress editing and actions. Invalid updates preserve editing and selection; valid document replacement starts a new body.

## task-expansion-card

Required: title (1–200) and steps (1–20). Optional: summary (0–2000), disabled (Value resolving strictly to boolean; default false), standard node id. Each step requires id (key pattern) and title (1–200), with optional description (0–2000), details (0–6000), reviewed (boolean, default false). Step IDs must be unique within a card; TASK_REVIEW_ID points to the duplicate.

The disabled field is an explicit integrator clarification of the draft contract, using common strict disabled evaluation and atomic host-state patch validation. Only the card fieldset is bound; review marks never enter host state.

Ordered steps show supplied text and optional initially closed native details. The native Reviewed checkboxes are local reading marks. A persistent note states that marks do not mean tasks were performed. The finite live count changes only when the review count changes. Reset review marks restores supplied flags, remains a native type=button, and is aria-disabled/no-op at the original boundary. Reset never collapses details or changes another component or form field.

Native disabled ancestors and pending Forms suppress forged input/change/reset. Checked and defaultChecked stay aligned, so an outer native form.reset cannot desynchronize local marks. Controls have no name or data-bind, do not enter FormData or Forms snapshots, and never submit. Native input/change bubbles normally; the component emits no custom host event. No schedule, deadlines, execution, storage, telemetry, timers or global resource are added.

## Verification scope

Focused public/schema/negative/lifecycle tests and affected writing/forms/core/schema tests run in the isolated source checkout, along with generator, build, type consumers, CDN contract and source boundary. Full-suite and real browser acceptance are deliberately left to the owner's grouped integration batch. tests/browser/draft-review.spec.mjs is PREPARED, UNEXECUTED, including six viewport/theme combinations, genuine native keyboard/pointer/touch, Arabic-first content, forced colors, disabled/pending forms, external reset, offline hydration, lifecycle and explicitly labelled local Clipboard stubs. Captured-handler JSDOM tests are test doubles, not proof of trusted browser input or OS Clipboard access.
