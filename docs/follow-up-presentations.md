# Follow-up presentations

This is an independent extension of the portable follow-up action contract. It keeps the earlier finite `flat` form compatible while adding two explicit layouts and supplied resolution states. It does not execute a conversation, voice session, composer, navigation, or telemetry service.

## Data

- `presentation`: `flat` (default for existing documents), `footer`, or `wrapped_pills`.
- `status`: `resolved` (default), `pending`, or `failed`.
- `fallback`: optional plain text shown only in the failed state. Without it, failure is hidden.
- `actions`: the existing ordered list of up to 12 items. An empty resolved list is hidden.
- Each action retains `id`, `label`, and optional `disabled`. It may additionally supply a nonblank `query` (at most 2,000 characters), `intent` (`new-turn`, `start-voice`, or `open-image-composer`), and a safe decorative `iconSrc`.
- Both explicit reference-informed layouts require supplied queries. Footer actions accept only `new-turn`; wrapped pills allow all three intent branches.

The pending state has a full-width, 64-pixel loading block and no controls. The footer shows the first one, two, or three actions at renderer-container widths below 380, from 380 through 575, and at least 576 pixels respectively. The existing mount-level ResizeObserver refreshes the shared binding when the renderer container changes, including narrow embeds in a wide window. Changes preserve existing button identity; hidden choices cannot emit requests. Wrapped pills show every supplied action, use 40-pixel controls, and reserve 24 pixels for an optional image which hides on failure.

## Local intent

The existing cancellable, bubbling, non-composed `iui:follow-up-action` event is retained. Old actions without new fields still produce exactly frozen `{id}`. Supplied-query actions produce frozen `{id, query, intent}`, defaulting to `new-turn`. Accepting the event records only an action request. It never performs the host operation. Cancelling records cancellation and permits a later retry. Labels and queries are text, never HTML.

The implementation reuses the shared generation owner, single-flight intent gate, native disabled checks, and supplied image reader. Disposal and replacement release observers/listeners/image sources through their existing owners.

## Verification and scope

The initial extension passed 38 targeted tests: the original 18 finite-contract tests plus 20 presentation/state/intent tests. Generate, build, and TypeScript checks passed. These are local source-build results; native geometry and reference-level styling remain unverified for this extension. Canonical counts remain 142 implemented, 6 partial, and 108 missing pending independent review of the remaining complete contract. No private captured source or application runtime is shipped.
