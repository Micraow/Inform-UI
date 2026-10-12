# Supplied context affordances

Three original finite views preserve their distinct presentation and local request contracts. They do not navigate, install a plugin, create a conversation, send telemetry or execute a remote service.

## Places metadata

`places-metadata-bar` displays a supplied `ratingLabel`, optional `reviewCountLabel`, and finite `items` with labels and semantic colors (`primary`, `secondary`, `positive`, `negative`, `warning`). Values are literal strings; a supplied zero remains visible and `null` rating omits the complete rating section. Separators appear only between visible pieces.

A `providerUrl` makes an existing rating section a local request button. No provider affordance is rendered without a rating. Optional `providerLabel` and `providerLogo` appear only with that provider section. The logo may be one URL or `{light,dark}`; a theme-specific asset is chosen from the current document theme, without substituting the opposite theme when missing. Height is16px and optional `providerLogoWidth` is bounded. Missing or failed media retains the supplied provider label. Pending height is20px.

## Plugin follow-up

`plugin-followup` requires an `offerId` and `actionLabel`; `pluginId` is an optional inert identifier. It is hidden unless `available:true`, and always hidden with `hidden:true`. Optional `context` appears unless streaming or `showContext:false`. The44px pill is disabled for `pending:true` or `streaming:true`; accepting it does not change either supplied state. An optional `{light,dark}` icon uses20px geometry and a local geometric fallback. Pending placeholder is180×44px.

The public finite identifiers are an original adaptation of an opaque external offer request. No external offer payload, authentication or plugin acceptance service is imported.

## Instant suggestions

`instant-suggestions` presents a title and a full-width table-like list, bounded by40rem. Empty suggestions hide the component. Each item has a unique `id`, a literal `prompt`, optional `disabled`, and optional `answerId` / `entityId`. A hint is included in the request only when both identifiers are supplied. It does not infer an answer, canonical entity or conversation history. Optional `category` is inert display metadata; no analytics are sent. Pending height is160px.

## Event and local reset

`iui:context-action` bubbles, is cancelable and is not composed. Its frozen detail contains `id`, `component` and one of:

- `open-provider`: `url`.
- `accept-plugin`: `offerId`, optional `pluginId`.
- `suggest-prompt`: `itemId`, `prompt`, optional frozen `hint:{answerId,entityId}`.

Accepted and cancelled requests only update a local receipt. The visible Reset clears that receipt, as does an accepted native form reset. Pending resets, source-disabled, capture cancellation, fieldset/first-legend, ARIA, hidden/inert and owned-generation boundaries are enforced before requests. Updates and disposal retire previous controls and resources.

## Media and evidence

Original inline PNG fixtures are generated locally. External icon or logo URLs remain inactive until their separate `Load supplied image` control is clicked; capture cancellation and disabled state prevent activation. That consent control is outside the provider/plugin button. Image loading and cleanup reuse the supplied-image implementation. Theme changes are applied through document update, which retires previous image sources.

This is an original implementation from observable presentation facts. Pixel matching and new native acceptance are separate from author DOM/standalone and schema checks. No private reference source or artwork is distributed.

## Complete semantic data constraints

Full `validateDocument` checks all supplied top-level strings except `fallback` for nonblank `trim()` content (`CONTEXT_ACTION_TEXT`); nullable labels remain null and optional omission stays distinct from whitespace. Fallback retains its original empty allowance. Metadata item labels must be nonblank. Provider URLs use the safe-link policy; provider logos, themed light/dark logos and plugin icons use the safe-image policy.

Suggestion IDs and prompts must be nonblank; violations report `CONTEXT_ACTION_TEXT`. IDs must also be unique within the suggestion list; duplicate IDs report `CONTEXT_ACTION_ID`. Optional answer/entity identifiers must be nonblank when provided, with `CONTEXT_ACTION_TEXT` for blank values. The event's paired-hint behavior remains as documented; the validator does not invent a requirement to provide both IDs. Image URL checks are not generalized into arbitrary recursive string trimming. No provider lookup or plugin installation is performed by these data checks.
