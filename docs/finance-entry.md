# Supplied finance entry presentations

These three original components render finite supplied data. No bank credentials, account connection, financial action, navigation, composer mutation, new conversation, analytics or service call is performed. An accepted event records a local receipt only.

## Complete finite presentation contracts

- `ledger-repair-bank-connection`: supplied title and description; a CTA exists only when both `ctaLabel` and `linkId` are supplied. `initializing:true` displays a busy disabled CTA without claiming success. Otherwise an accessible static warning is shown. Pending placeholder height is100px.
- `ledger-finance-onboarding`: a124px minimum-height whole-card action, supplied title (one line), description (two lines), and24px icon or literal fallback symbol. A supplied `action:{kind,value}` takes priority over `prompt`. Optional `threadMode` and `systemHint` are passed as inert supplied strings.
- `finance-onboarding-suggestions`: heading, finite `items` and an independent `followUp`. Cards use one column below576px container width and three columns at/above576px, with132/150px minimum heights. Prefill is enabled only when `prefillAvailable:true`; the follow-up is independently enabled. The overall view has a40rem maximum width. Pending placeholder height is180px.

All accept `label`, `status` (`resolved`, `pending`, `failed`), `fallback`, `disabled`, `resetLabel`, `requestedLabel` and `cancelledLabel`. Resolved title/description or heading/items/followUp are mandatory. The onboarding card requires an action or prompt. Empty suggestion arrays are supported. IDs, labels and queries are nonblank, bounded text; item IDs must be unique. No field is interpreted as HTML or a financial calculation.

## Local event

`iui:finance-entry` bubbles, is cancelable and is not composed across a ShadowRoot. Its frozen detail contains `id`, `component`, `intent`, and only the supplied fields for that request:

- `repair-bank-connection`: `title`, `linkId`, optional `query` and `systemHint`.
- `open-finance-onboarding`: `title`, `action` or `query`, optional `threadMode` and `systemHint`. The nested action is frozen too.
- `prefill`: `itemId`, `query`.
- `follow-up`: `query`, optional `event`.

Consumers must explicitly decide what to do with these requests. There is no default external action. Preventing the event only displays a local cancellation receipt; it does not initiate a service operation.

## Images and lifecycle

Inline images render locally. External supplied icon URLs create only a separate `Load supplied icon` button (`loadImageLabel` can customize it); an image request begins only after a permitted click. This button is outside the whole-card button. Capture cancellation, source-disabled, fieldset, ARIA, hidden/inert, ownership retirement and pending-reset barriers apply before activation. Image events and source release reuse the shared supplied-image lifecycle.

A visible local Reset clears receipts. A native form reset is cancelable and uses the shared pending/revision checks. It never resets an account or a conversation. Updates/disposal retire old controls, listeners and images. Supplied loading and completion states are never inferred from elapsed time or local acceptance.

## Evidence boundary

The finite presentation and request distinctions were implemented from observable behavior, with new source and fictional fixtures. This is not an implementation of an external financial provider or proprietary action payload. Author Node/standalone tests are reported separately from independent acceptance and native/pixel checks.

## Complete semantic data constraints

Full `validateDocument` checks each supplied top-level string except `fallback` for nonblank `trim()` content (`FINANCE_ENTRY_TEXT`). Empty/whitespace fallback retains its existing allowance. On suggestion lists, item IDs must be unique and nonblank; item labels and queries and any follow-up label/query must be nonblank. On the other two cards, an `action.value` must be nonblank, and an icon source must pass the existing safe-image policy. These checks apply to supplied fields regardless of phase; they do not invent a recursive trim rule or retrieve/validate any account. Structural schema validation alone does not enforce these constraints.
