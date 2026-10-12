# Supplied scheduled-task suggestion

This original component displays one supplied suggestion and records a local acceptance. It never creates a real task, schedules a job, sends a conversation turn, logs telemetry, or requests an account capability.

`scheduled-task-suggestion` requires nonblank `label`. Its default action is `new-turn`, which requires nonblank `creationGuidelines`. The other action is `task-opt-in-accept`. Optional `originSurface` is `chat` or `work`. `submitted` and `disabled` are literal booleans. `status` is resolved (default), pending, or failed; pending shows a 280×48 loading block; failed shows supplied `fallback` or hides.

Activation emits bubbling, cancelable, non-composed `iui:scheduled-task-accept` with frozen `{id, action, creationGuidelines?, originSurface?}`. The opt-in branch omits guidelines. Canceling preserves the operable suggestion. Accepting only changes the local clock to a check and disables further acceptance. Form reset does not undo this receipt; an explicit controller update supplies a fresh instance. The label remains literal supplied text.

Both branches are local host integration requests. An application must separately obtain any authorization required for real external effects. This library supplies no such action or credentials.

Native button semantics, supplied/native/ARIA disabled gates, fieldset first-legend behavior, constructor reentry, cancellation, update/dispose and permanent ancestor ownership retirement use existing shared lifecycle machinery. Ordinary exceptions remain observable. The observed reference's two action branches and one-shot visible state inform this finite model; no captured implementation or remote runtime is included.

Source-build tests cover both branches, cancellation/retry, submitted/reset/update, phase states, plain text, constructor errors/reentry and compiled standalone behavior. Native/pixel parity is not claimed. The packaged CDN remains the older frozen unified154 until an explicit combined asset build.

## Required source-package validation

Any supplied label, creationGuidelines or fallback must be nonblank (`SCHEDULED_SUGGESTION_TEXT`). Default status is resolved, default action new-turn: that combination requires nonblank guidelines (`SCHEDULED_SUGGESTION_GUIDELINES`). Pending/failed or task-opt-in-accept may omit them, but supplied blank still fails. Local request data is not an automatic scheduler.
