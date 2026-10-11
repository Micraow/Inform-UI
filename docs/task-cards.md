# Supplied notification and task cards

Three independently specified finite contracts share only their owned lifecycle and local event helper. Their interface and presentation are original implementations of observable behavior; no private captured code, artwork, dispatcher or telemetry is included.

## PushDripSeriesIntro

`push-drip-series-intro` displays supplied `introPrefix`, an inline underlined `introLinkLabel`, and `introSuffix`. Activation expands or collapses a confirmation card. `confirming` initializes this local state. `stopped: true` displays only `stoppedLabel`. Pending content is48px high; failed content uses the optional fallback or is hidden.

## StopPushDripSeries

`stop-push-drip-series` displays supplied `actionLabel`, then its confirmation content when expanded. Cancellation returns to the trigger. `confirmationLayout` is `inline` or `card`; `actionStyle` is `text-links`, `outline-keep`, `red`, or `solid`, with text links the default. Stopped state displays only supplied `stoppedLabel`. Pending content is180×24px with a container-width limit.

Both series views require `confirmationTitle`, `confirmationMessage`, `confirmLabel` and `cancelLabel` when resolved and not stopped. The confirm control is intentionally always disabled, matching the available observable contract. It has no activation handler and cannot stop a service even if someone removes its DOM disabled property. `unavailableLabel` explains that the service action is unavailable. No local interaction manufactures a stopped result. There is no subscription action or notification permission prompt.

## TaskAutopauseCard

`task-autopause-card` requires supplied `taskId`, `taskTitle`, `prompt` and `continueLabel`. Optional `showBody` controls the supplied `body`; `body` is required when shown. Continue, settings and deletion controls send only finite local requests. Accessible `settingsLabel` and `deleteLabel` can be supplied. Pending content is220px high. The title header, content and three actions are distinct from the series confirmation layouts.

## Local intent and reset

The bubbling, non-composed, cancelable event is `iui:task-card`. Its frozen detail contains `{ id, component, intent }`, plus `taskId` only for TaskAutopauseCard. The ID is null when omitted. Intents are `expand`, `collapse`, `cancel`, `resume`, `settings` and `delete`. No confirm/stop event exists for the unavailable series control. Canceling expand/collapse/cancel preserves local state. Receipt text reports only whether a local request was accepted; it does not report remote task success. A host must separately obtain any required permission before an external action.

All resolved interactive cards have a visible local Reset control, an explicit adaptation for repeatable demonstrations. `resetLabel` changes its text. It restores the supplied initial confirmation state and clears local receipt text. Native form reset is canceled or reconciled using the existing shared reset lifecycle. Pending reset blocks stale intent delivery. Native form association respects ShadowRoot boundaries.

Supplied disabled, native fieldsets/first legends, ARIA, hidden/inert ancestry, capture cancellation and permanent owner retirement are enforced. A shared exclusive gate precedes host reads and event construction. Update/dispose during a request prevents old writes. All data is bounded and rendered literally. There are no service calls, account changes, notifications, analytics, real deletions or fabricated backend completion.

## Validation boundary

Original examples use a fictional task identifier. Author tests cover strict public Node/browser schemas, each presentation and supplied phase, cancellation, unavailable confirmation, three task intents, native reset, disabled/first-legend behavior, real dispatch reentry, replacement/disposal, listener release, ShadowRoot events and executable standalone compilation. Native cases are provided separately; discovery is not a passing browser run.

Accepted cancellation restores focus to the opening control only when focus was inside the confirmation panel. A cancelled intent or an action invoked while focus is elsewhere does not move focus. The original source checkpoint lacked this focus return; its independent failing case is retained separately.
