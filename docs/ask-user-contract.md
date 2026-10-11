# Local details and file requests

`ask-user-details` and `ask-user-files` preserve a supplied call-to-action presentation and emit local cancelable requests. They do not invoke a host input service, attach or upload files, read file contents, fetch data, request account access, log telemetry or ask for device location.

## CTA contract

Both have a nonblank `label`, optional `id`, `status` (`resolved` by default, `pending`, `failed`), `fallback`, `showCTA` (true by default), `enabled` and `disabled`. Pending shows an accessible 180×40 loading block; failed shows the supplied fallback or hides. `showCTA: false` hides the resolved component without actionable controls.

Details require resolved `buttonLabel`, `submitLabel` and finite `questions` (up to 20). An optional nonempty `invitation` appears above the CTA. Explicit `enabled: true` is required; unknown capability remains disabled. Each question has unique `id`, nonblank `label`, optional `kind: text | textarea | select`, `required`, `placeholder`, `initialValue`, and `maxLength` (1–4000). Select questions have finite unique `options: [{value,label}]` (1–30). These are project-owned bounded question fields, not a promise to accept arbitrary host-service question payloads.

Files require resolved `kind: file | photo | video | media`. `buttonLabel` overrides the kind-specific `fileLabel`, `photoLabel`, `videoLabel`, or `mediaLabel`, with plain local defaults. Explicit `enabled: false` disables it; unknown capability leaves the local request enabled. The enabled state is supplied, not discovered.

Without `localReview: true`, activation only emits:

- `iui:ask-user-details`: `{id, questions, submitLabel}`. Questions/options are copied and deeply frozen.
- `iui:ask-user-files`: `{id, kind}`. There is no implicit picker or upload.

Both events bubble, are cancelable and non-composed. The default CTA does not create a form or input picker. Preventing default leaves presentation unchanged.

## Optional original local-review extension

`localReview: true` opens an inline review only after an accepted request. This is a project-owned local alternative, not a reconstruction of an external upload/input service. Controls are not nested forms; text inputs have no submitted form names. Enter in a single-line question is prevented from implicitly submitting the surrounding host form. Native button Enter/Space activation remains available.

Details show the bounded text/textarea/select questions. Submit checks required fields, maximum lengths and supplied select values. A valid submission emits `iui:user-details-submit` with deeply frozen `{id, answers: [{id,value}]}`. Empty questions display `emptyLabel` or a default and cannot submit.

Files show an explicitly operated native file picker. Only `name`, `size`, `type` and `lastModified` are read into copied metadata; no File object is retained or emitted. No FileReader, text/arrayBuffer/stream call, object URL, upload, image decode or content inspection is used. At most 21 metadata entries are read; permitted `maxFiles` is at most 20. `multiple` defaults false (one file); multi-file mode defaults to five, overridable by `maxFiles`. `maxFileBytes` defaults to 10,000,000 per file. Kind checks use the browser-supplied MIME string only and are presentation validation, not content/security validation. Empty, oversized, wrong-kind or excessive selections do not submit. File paths are neither requested nor emitted.

A valid file review emits `iui:user-files-submit` with deeply frozen `{id,kind,files:[{name,size,type,lastModified}]}`. Selected filenames are displayed with text content. Empty selection displays `emptyLabel` or a default. Acceptance changes only a local status label; there is no remote side effect. Canceled submit preserves the editable review.

`iui:ask-user-cancel` contains `{id,kind}` (`details` for a details review); preventing default keeps the review open. Accepted cancel clears edited values/file metadata and collapses the review. Native form reset similarly restores initial values and collapses after shared reset reconciliation. A canceled reset or newer input wins. `cancelLabel`, `reviewLabel`, `invalidLabel`, `acceptedLabel` and `submitLabel` customize local copy.

## Ownership and integration

The shared owner, intent gate, input/paint scopes and native reset helper are reused. Disabled controls, first-legend fieldset rules, current ARIA state, hidden/inert ancestry, request cancellation, constructor reentry, newer input and update/dispose gate delivery. Ordinary errors remain observable. Generation cleanup releases reset listeners; file metadata is in-memory only.

Installer: `installAskUserSchema({node,defs})`, both in base. Core hook: `inspectAskUser(node,path,add)`. Renderer: `renderAskUser(context,node)`. Include `ask-user.css` in embedded and built styles. The shared `readerNativeReset` control type must include `HTMLTextAreaElement` alongside input/select/button; its runtime already uses their shared form/element properties. This is a type-only integration change, not a second reset mechanism.

The domain checkpoint excludes temporary shared wiring, that type-only adapter, and generated schema/types/validator. The integrator must wire and regenerate; schema registration alone is not functional acceptance. Examples use fictional labels and synthetic file fixtures only. DOM/compiled-artifact tests are distinct from native browser and pixel acceptance; browser test discovery alone is not execution.

This integrated source includes the installer, semantic/renderer dispatch, exact embedded/external CSS order and generated schema closure. The only shared reader change adds TextArea to the TypeScript control union; the runtime reader body is unchanged. The earlier domain-only checkpoint remains separately identified.
