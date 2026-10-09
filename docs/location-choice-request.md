# Supplied location choices

`location-choice-request` is one Base node for a finite supplied list and an explicit, cancelable local choice. It does not request a device location, infer coordinates or distance, display a map, navigate, search, book, persist or transmit anything.

Required: `label` (1–200 characters) and `options` (1–12). Each option has a unique key `id` and `label` (1–200); optional `address` and `description` are literal strings up to 1,000 characters. Optional node `description` permits 2,000 characters. Optional `source` has `label` (1–200) and an optional safe absolute HTTP(S) `url` (1–2,048). Unknown fields and state expressions are rejected. Local option IDs are scoped to the component. All lengths count Unicode code points.

The semantic section exposes a visible supplied-place disclosure, native pressed buttons in authored order, an explicit local selection summary and a Clear control. Clear stays focusable with `aria-disabled="true"` at the empty boundary and is then a strict no-op. Clear never emits an event. There are no radio-key shortcuts or automatic focus moves.

Each explicit option activation dispatches `iui:location-choice` from the section with bubbling, cancellation and `composed: false`. `LocationChoiceDetail` is exported from both public entries. Its frozen primitive detail has exactly:

- `componentId`: authored node ID or `null`
- `optionId`: supplied option key
- `label`: supplied option label
- `address`: supplied address or `null` when omitted

An accepted event updates the local selection. `preventDefault()` preserves the prior choice and reports non-acceptance. Repeating the selected choice is a fresh explicit request. Synchronous reentry and stale trees after update/disposal cannot dispatch or paint. Native disabled fieldsets, pending Forms and hidden ancestors block activation. Source links remain ordinary disclosed reading links.

This component may appear in Forms but adds no names, bindings, state values or submission behavior. Unrelated host-state updates and outer native form reset preserve its existing DOM, local selection and focus. Invalid replacement is atomic; valid replacement resets local state and removes old handlers.

See [the original fictional example](../examples/location-choice-request.json), [focused public tests](../tests/choice-gallery.test.mjs), and [prepared browser acceptance](../tests/browser/choice-gallery.spec.mjs). Browser acceptance is prepared, not executed in this isolated candidate. No location/provider integration or parity claim is made.
