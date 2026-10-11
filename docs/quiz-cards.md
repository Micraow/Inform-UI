# Supplied quiz cards

These are three separate finite presentations, not aliases for the existing `quiz` node. They reuse its local exact-answer and ID-validation principles, the shared generation/ownership controls, and the existing safe `search-image` renderer. There is no quiz resolver, grading endpoint, persistence service, account integration, clipboard write, system sharing, or personality inference.

Examples: [ordinary flows](../examples/quiz-cards/basic.json), [supplied phases](../examples/quiz-cards/states.json).

## Common contract

Each node requires `label` for its accessible region name. Optional `title`, `disabled`, `resetLabel`, `requestedLabel`, `cancelledLabel`, and `emptyLabel` customize presentation. `status` is `resolved` by default; `pending` shows a waiting message and `failed` displays `fallback` or no content. Only these explicit unresolved states may omit their resolved content fields. Strings are plain text, not executable HTML or action code.

Buttons emit `iui:quiz-action`. The event bubbles, is cancelable, and is not composed across a shadow boundary. Its frozen detail contains `id`, `component`, `intent`, and `revision`, plus the relevant supplied choice, query, answer snapshot, or result text. Revision is a local action version for follow-up/multiple-choice, and the current or proposed progress version for personality-quiz. Every answer object and its snapshot array is frozen. Canceling the event preserves local state; accepted receipts mean only that the local request was accepted, not that a service saved, graded, shared, or copied anything.

The visible local `Reset quiz` button restores the initial supplied state and clears receipts. It also anchors native `form.reset()`, independently of answer, next, finish, or service capabilities. Canceled resets preserve the view; later local input wins over queued resets. Update and disposal retire previous listeners, queued work, and owned image resources. Inputs respect disabled fieldsets and their first legend, explicit control `aria-disabled`, hidden/inert ancestors, cancellation, and DOM ownership.

## `follow-up-quiz`

Resolved data requires `questions`, `submitLabel`, and `submitQueryPrefix`. Questions contain stable `id`, `prompt`, and 1–12 `choices` with `{ id, label, disabled? }`. At most 30 questions are accepted. `initialIndex` ranges from zero through the question count; `initialAnswers` contains at most one `{ questionId, choiceId }` per question, referencing supplied IDs. Skipped questions may leave gaps.

Selecting an unchecked option records it once and immediately advances. Revisiting an answered question shows locked checkboxes. Skip advances without adding an answer, and is disabled at the end. Submit is enabled after at least one answer, including before every question is visited. Its `query` is the supplied prefix followed by one `- prompt: choice label` line per answered question in question order. It does not judge answers. `skipLabel`, `previousLabel`, and `completeLabel` are optional. The Previous button is a project-local review adaptation; it preserves the original answer lock.

Intent names are `answer`, `previous`, `skip`, and `submit`. Answer/navigation events carry the proposed `currentIndex` and answer snapshot. Empty arrays show the supplied or default empty message, not a successful round.

## `multiple-choice-block-v2`

Resolved data requires `options`, each with `{ id, label, query?, disabled? }`, at most 30. A supplied `selectedChoiceId` and optional `feedback: { status?, open?, hint?, error? }` initialize selection and feedback. Status is `correct` or `incorrect`; error text takes precedence over hint text when open.

With `correctChoiceId`, choosing an option performs a local exact match against that supplied answer, emits `check` with `choiceId`, `choiceLabel`, and `correct`, and only on acceptance replaces local feedback. Previous hint/error text is cleared. The reference answer is ordinary document data, not a protected exam secret. `correctLabel` and `incorrectLabel` are optional.

Without `correctChoiceId`, every option needs a supplied `query`. Choosing emits `submit-query`; it does not invent correctness or change the supplied selection. This is intentionally different from the graded mode. Reset restores the original supplied feedback.

## `personality-quiz`

The component identifier is retained for compatibility. This renderer is an informal single-choice questionnaire. It never computes personality categories, scores, diagnoses, or sensitive traits. Any result is explicitly supplied content.

Resolved data requires `title`, `questions`, and `generationComplete`. `description`, `questionCountLabel`, and `cardSize` (`sm`/`md`/`lg`/`full`) customize the introduction. Questions use the same stable IDs with `layout: text | image-prompt | image-grid`. Text is the project default for a plain single-column presentation; image-grid uses two columns. All choices are native buttons with `aria-pressed`, usable with Enter/Space; no unimplemented radio-arrow convention is claimed. The question status and optional `questionAccessibilityLabels`/`questionProgressLabels` provide per-question accessible context.

The supplied progress fields are `started`, `initialIndex`, `initialAnswers`, `progressRevision`, and `savedRevision`. The project defaults are an unstarted first question, no answers, and revision zero. Explicit snapshots must reference a contiguous ordered prefix of the supplied questions, and cannot skip beyond unanswered content. Returning to the first question's Previous control returns to the introduction without losing answers. Choosing immediately advances; revisiting and changing a choice replaces that answer and preserves later answers. Next is available only when the current question has an answer. The last answer/Next emits `complete`, carrying the full proposed progress snapshot. Retake clears local answers, returns to the introduction, and increments progress revision.

`available: true` gates start, answer, navigation, retake, and retry requests. `generationPhase: loading | error | ready` and `generationComplete` are caller-supplied; partial generation reaching the end of available questions shows a waiting state. Empty question arrays cannot start or manufacture completion. `progressStatus: saved | pending | error` can expose a supplied save failure and `retry-progress`, but no response or save acknowledgement is simulated.

Result display requires all of the following: local completion, `resultStatus: complete`, a supplied `result`, `savedRevision` at least the current local progress revision, and matching `resultRevision`. A result contains `name`, `description`, `paragraphs`, optional `quote`, and optional media. Changed answers, navigation, or a retake cannot reveal an older revision's result. The host can replace the whole document with a new acknowledged snapshot. This is an authoritative supplied update, not an internal asynchronous server-response merger.

`resultStatus: pending | error` provides honest waiting/error content. A pending retry appears only with `resultRetryAvailable: true`; an error for the current revision permits retry when interaction is available. The project does not imitate the reference service's elapsed-time thresholds or fabricate a timed success. A visible reset and local retake remain available to leave the waiting view.

Optional capabilities are `canShare`, `canCopy`, and `canCreate`. Share also requires complete question generation and respects supplied `sharePending`. Copy requires `copyText`; create requires `createPrompt`. They produce `share-quiz`, `share-result`, `copy-result`, and `create-quiz` intents, with supplied text/query where needed. `retryQuery` is included in `retry-generation`. `sharePreview` selects the supplied retake/create wording variant. All operations stay local unless the caller explicitly implements a host action.

The `labels` object may override: `start`, `previous`, `next`, `seeResult`, `share`, `shareResult`, `retake`, `ownerRetake`, `copy`, `create`, `ownerCreate`, `loading`, `error`, `retry`, `progressError`, `resultLoading`, `resultError`, `resultRetry`, and `local`.

## Supplied media

A banner, image-prompt question, image-grid option, or result may provide `{ src?, alt, phase?, message?, retryAvailable?, retryLabel? }`. Ready media requires a safe supplied source; pending/failed media needs no URL. These phases do not start searches or provider retries. A failed-media retry emits `retry-media` with a stable `mediaId`. The caller must supply any replacement. Ready sources use the existing owned image loader, no-referrer policy, and visible failure fallback; first display is lazy by view. No image preloading, service timeout loop, or additional result-computation delay is introduced. A pending result image keeps the supplied result pending; ready or failed supplied image states do not block its text indefinitely.

## Verification and integration

`tests/quiz-cards.test.mjs` compiles the actual domain sources and validates the installer with strict AJV and strict required-property checks. It covers each distinct contract, cancellation, phase/capability gates, native/shadow reset, update/dispose, constructor reentry/errors, and late image-source acquisition. The example files are tested against this same schema and semantic inspector.

`tests/browser/quiz-cards.spec.mjs` contains native keyboard, reset, narrow/RTL and supplied-result checks. Discovery alone is not a native-browser pass. Shared registration, generated public types/schema, stylesheet inclusion, and final public mount/CDN checks belong to the integrating commit; no private capture or vendor runtime is included in this domain.
