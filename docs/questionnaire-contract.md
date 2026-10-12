# Declarative questionnaire

A questionnaire is caller-authored JSON. It combines bounded native fields, explicit conditions, validation and the existing safe expression language. It does not load code or medical rules from a URL. This new node does not change existing Form events.

## Drafts and visibility

Fields have stable keys. Number fields preserve the literal editing draft separately from the parsed answer. Blank is unknown; malformed, nonfinite, out-of-range and off-step values are invalid. No prior valid answer may remain visible as a current result after an invalid edit. Boolean and choice questions support an explicit unknown selection.

Each questionnaire declares a hidden-value policy for its fields: retain or clear. Retain preserves its editing draft so a returning user can recover it; clear discards it when its condition becomes false. Both policies exclude hidden answers from validation, computations and submitted answers. Hidden references resolve to null. Visibility can refer only to preceding fields. It cannot use a later field or a computed result to create a feedback loop. Hiding a focused control moves focus to the visible Reset control.

## Validation and results

Built-in required, number bounds, step and text-length rules are available. Caller-authored boolean validation expressions support cross-field constraints. Invalid or missing required active answers suppress the complete result. Computed results use the existing finite, typed, bounded expression evaluator, including lazy if and explicit division-by-zero/cycle rejection. There is no eval, JavaScript source or implicit numeric coercion.

## Submission and ownership

The local submit request carries one deeply immutable snapshot: questionnaire identifier and version, source metadata, active answers, per-field validity and computed results from the same revision. Source links identify caller-supplied provenance; they do not fetch or execute anything and are not certification.

The event is cancelable. An optional separately registered questionnaire action receives the same snapshot and an AbortSignal. No adapter means local acceptance only. A newer edit aborts pending work and retires its completion; reset, replacement and disposal do the same. New input dispatched synchronously by a request listener wins over the older request. Recursive requests are blocked. Reset cancellation retains drafts and focus; accepted native Reset settles after the browser default action. Disabled fields and fieldsets, Shadow DOM ownership and cleanup follow existing shared control rules.

No automatically generated questionnaire or formula is clinically validated by this library. Domain rules remain explicit, versioned caller data and require independent correctness review before consequential use.

## First original example

A nonmedical activity-packing questionnaire asks for attendance, packets per person and onsite/travel mode. Travel reveals a seat count. Results calculate packet count and, only for travel, spare seats. Switching to onsite retains an explicitly retained seat draft while excluding it from answers and calculations. Clearing attendance immediately suppresses the previous packet result.


## Public authoring API

Use `type: "questionnaire"` with a stable `questionnaireId`, an explicit `version`, a visible `title`, an explicit `hiddenValuePolicy` and 1–40 fields. Field IDs and computed names are distinct. Each field has `id`, `label` and `type: text|number|choice|boolean`. Sources are optional caller-provided `{title, version?, url?}` records. The complete original example is [activity packing](../examples/questionnaire/basic.json).

`createQuestionnaireDraft(node, reset?)` creates a detached local draft. `evaluateQuestionnaire(node, draft?)` returns a deeply frozen `{draft, snapshot, issues}` without DOM or external actions. The returned draft incorporates the hidden clear policy. Numeric editing accepts finite decimal/scientific notation, rejects nonzero underflow, and checks bounds and step without implicit whitespace or hexadecimal coercion. Optional unknown fields remain null and may be handled by lazy `if`; unhandled null arithmetic fails closed.

The snapshot has `questionnaireId`, `version`, `status`, `answers`, `validity`, `computed` and `sources`. Status is `ready`, `incomplete` or `invalid`. Unready computed values are an empty object. Each validity entry contains `visible`, a status (`valid`, `unknown`, `invalid`, `hidden` or `pending`), a parsed `value` and optional `message`. Active unknown/invalid/pending answers are null. Hidden answers are omitted. A validation rule waiting on an unknown visible dependency is pending even if that rule contains a null guard. All such rules must resolve before results or submission become ready.

Listen for `iui:questionnaire`: `event.detail` is deeply immutable `{intent: "submit"|"reset", snapshot}`. `preventDefault()` cancels the request. To handle asynchronous work, set the node's `action` key and pass `mount(host, document, {questionnaireActions: {save: async ({snapshot, signal}) => {/* host-owned work */}}})`. The action key must be explicitly registered; an absent adapter reports a local error. Rejections are shown locally. This adapter map is independent of legacy `actions` and `iui:submit`.

There is no automatic persistent storage, page navigation, clipboard write, fetch, remote formula loading, or domain-rule installation. The schema accepts expression data only; function bodies and arbitrary operators are rejected. Source URLs are validated links, never execution inputs.

On an unready submission, keyboard focus moves to the first visible invalid answer, unresolved field validation, or missing required answer in authored order. Optional unknown and hidden answers do not capture this focus.
