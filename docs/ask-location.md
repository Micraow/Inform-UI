# Supplied location request

`ask-user-location` is an original, finite implementation of the observable first-generation location-request card. It is separate from the already registered `location-choice-request` second-generation presentation. No captured implementation or artwork is included.

## Contract

Required `label` is the accessible group name. Resolved cards require supplied `title`, `description`, `learnMoreUrl`, `learnMoreLabel`, `notNowLabel` and `turnOnLabel`. Optional `dismissed` initializes local dismissal. `status: pending` presents a 130px loading area; `failed` presents the supplied `fallback` or hides the component. Every string is bounded, nonblank and rendered as text. The informational URL must pass the library's safe-link validation.

The card is stacked below a 576px component-container width and horizontal at or above that width. It contains an original generic location symbol, descriptive text, informational action and two finite actions. Fonts and colors use the library tokens; pixel equivalence to a separate product is not claimed.

All buttons have native keyboard activation and `type=button`. They dispatch a bubbling, non-composed, cancelable `iui:ask-location` event with a frozen detail:

- `{ id, intent: 'request-location-permission' }`
- `{ id, intent: 'learn-more', url }`
- `{ id, intent: 'dismiss' }`

`id` is null when omitted. Acceptance is only a local receipt. No browser permission prompt, geolocation lookup, remote request, account operation or navigation occurs. A host must separately obtain appropriate user permission for external actions. Canceling `dismiss` keeps the card visible; accepting it hides the request panel. Repeated permission requests remain possible and never fabricate a permission result.

The visible `Reset location request` control (supply `resetLabel` to change it) is an explicit local adaptation. It restores supplied initial dismissal and clears the local receipt. Its stable presence also permits native form reset after the panel is dismissed. An accepted form reset restores initial state; canceled resets preserve state; requests during a pending reset are blocked. Native form association does not cross a ShadowRoot boundary.

`disabled`, native disabled fieldsets and first legends, ARIA disabled, hidden/inert ancestors, event cancellation and generation ownership are respected. Controls cannot bypass supplied disabled by changing their DOM property. Same-turn ancestor removal permanently retires old controls until explicit controller update. Dispatch and construction use the shared exclusive intent gate. Update and dispose release listeners and suppress stale writes.

## Validation

The original example uses `https://example.test/location-help`, not a live service. Author tests exercise public Node/browser validation, pending/failed states, all three local intents, cancellation, form reset, first-legend behavior, actual recursive dispatch, update/dispose, ShadowRoot boundaries, repeated listener release and real standalone compilation. Native browser tests are provided separately; discovery is not execution.

For composed supplied views, the internal renderer accepts an optional third `{ gate }` argument reusing an existing `intentGate`. The child keeps its own owned generation and reset lifecycle; parents should preserve it rather than reconstruct it in response to unrelated native resets. Parent streaming or capability restrictions must be projected into the actual child `disabled` input.

## Complete semantic text and URL checks

Full `validateDocument` rejects every supplied top-level string that is blank after `trim()`, including optional identifiers, labels, descriptions, fallback and informational-link fields (`ASK_LOCATION_DATA`). The rule applies in all phases. Optional omission is distinct from supplying whitespace; no legacy empty-string exception is introduced for this node. `learnMoreUrl`, when present, must also pass the existing safe-link policy (`ASK_LOCATION_URL`). Structure-only selected schemas do not replace this semantic gate. The permission request remains a local intent and never grants location access by itself.
