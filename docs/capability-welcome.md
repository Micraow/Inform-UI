# Capability welcome pills

`whats-new-capability-welcome` is a complete finite, supplied welcome-action presentation. It displays the provided items as vertically arranged pills. It is not the separate `whats-new-capability-search` composite and does not claim that component's venue, location, or reservation behavior.

[Original example and explicit phases](../examples/capability-welcome.json).

## Data and behavior

Resolved input requires `label`, `items`, and `actions`. Items contain `{ id, actionId, label, iconSrc?, fallbackSymbol?, disabled? }`; up to 20 items are permitted. Action IDs and item IDs are unique within their respective lists. The mapping is by action ID, not visible text or list position. An item with no matching action stays visible and disabled.

The finite action union is:

- `{ id, kind: "prompt", query, disabled? }`: emit a supplied-prompt intent.
- `{ id, kind: "url", url, disabled? }`: emit a safe destination intent. The component does not navigate or open a window.
- `{ id, kind: "capability", capability, available?, disabled? }`: emit an opaque capability identifier only when `available: true`. There is no raw dispatcher payload or executable action.
- `{ id, kind: "voice", available?, disabled? }`: always disabled, even if marked available. This preserves the welcome presentation's explicit exclusion of voice-start actions.

There may be up to 30 actions. Prompt/URL actions are intrinsically supported as local intents; capability actions require explicit availability. Node `disabled`, item `disabled`, and action `disabled` each independently block activation. Native fieldsets, their first-legend exception, explicit control `aria-disabled`, hidden/inert ancestors, and capture cancellation are honored before constructing an event.

`iconSrc` uses the existing safe, owned image loader at 24px with an empty alt and decorative wrapper. Failed icons show `fallbackSymbol`, or a neutral local search/image/audio glyph chosen by action ID. Items without an image use the supplied symbol or a heart. No vendor icon assets are included. Long labels truncate visually while retaining their full accessible name. Native buttons support Enter/Space and visible focus.

`status` is `resolved` by default. Explicit `pending` shows a status message; `failed` shows `fallback` or no content. Only unresolved states may omit their content arrays. Empty resolved lists show `emptyLabel` or an honest default. Optional `campaignId` is opaque supplied metadata, not a telemetry configuration.

## Local event and reset

`iui:capability-welcome` is bubbling, cancelable, and not composed across a shadow boundary. Its frozen detail contains `id`, `itemId`, `actionId`, `intent`, optional `campaignId`, and exactly the applicable `query`, `url`, or `capability`. Intent names are `submit-prompt`, `open-url`, and `open-capability`.

`preventDefault()` produces the local cancellation receipt. An accepted event produces the local acceptance receipt. `requestedLabel` and `cancelledLabel` customize those messages. Acceptance does not claim that a new conversation, page navigation, account change, permission request, image operation, or voice session happened.

The source interaction is a list of independent actions, not a next/previous tour. The project adds a visible `Reset welcome actions` button, configurable with `resetLabel`, to clear the local receipt and provide a stable native form-reset anchor. Canceled reset leaves the receipt unchanged; a pending reset blocks further action requests; update/dispose supersede queued reset work. Disabled or hidden anchors do not bypass the shared reset contract.

The component performs no telemetry, impression logging, account action, location lookup, search, clipboard operation, or permission request. Only explicitly supplied icon URLs may load through the shared image reader. Image-source assignments interrupted by update/dispose are released after late native setters, and retired DOM cannot reclaim an action handler.

## Verification and integration

`tests/capability-welcome.test.mjs` compiles the actual domain renderer and checks the installer with strict AJV and strict required-property validation. Coverage includes all action kinds, missing mapping, immutable/canceled requests, disabled and capability tampering, native/shadow reset, constructor/getter reentry, update/dispose, repeated ownership cleanup, and late icon-source setters.

`tests/browser/capability-welcome.spec.mjs` covers native keyboard/reset and narrow/RTL/disabled behavior. Test discovery is not proof of browser execution. The integrating commit owns shared registration, schema/type generation, public exports, bundled CSS, public mount and CDN checks. The independent domain contains no private reference material.
