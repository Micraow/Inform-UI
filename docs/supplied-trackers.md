# Supplied shipment and flight trackers

`package-tracker` and `flight-tracker` are original, distinct snapshot readers. Their local filters are implemented; real-browser/visual acceptance is still pending. They do not connect to carriers, airports or providers, poll, request notifications, save data, book, pay or track a location. Status, observations and estimates are supplied data, not verified current facts. No system clock is consulted and no progress percentage, current location, delivery guarantee, countdown or delay is inferred.

## Shared contract

Both require literal `label`, `carrier`, bounded `status`, `observedAt`, and their component-specific records. Optional `description` (2000 Unicode codepoints) and `source: {label,url}`. Short strings have 1–200 Unicode codepoints. Source URLs must be allowed absolute HTTP(S) destinations without credentials, unsafe schemes or disguised whitespace. Native links disclose new-tab opening, use `noopener noreferrer`, and suppress referrers; no prefetch or remote image is created.

Timestamps use exact minute precision: `YYYY-MM-DDTHH:mmZ` or `YYYY-MM-DDTHH:mm±HH:mm`, Gregorian years 1000–9999, offsets no greater than 14:00. Semantic validation rejects impossible dates instead of normalizing them. Supplied offsets remain visible; display never converts them using the device locale/time zone. Records remain in source order even when historical or unsorted.

## package-tracker

Required: `trackingId` (supplied literal reference), `status` in `pre-transit | in-transit | out-for-delivery | delivered | exception | unknown`, and `milestones` (0–40).

Optional `destination` and `expectedDelivery` are supplied short labels. The latter is explicitly labeled a supplied estimate, without parsing or promises.

Each milestone requires unique `id`, `label`, and `state: complete | current | pending`. Optional `occurredAt`, `location`, and `description`. At most one milestone may be marked current; zero current milestones is valid. Pending milestones cannot carry an occurrence timestamp. Complete/current milestones may omit it; no time is fabricated. Top-level status and the supplied timeline are not silently reconciled or rewritten.

The status chip and vertical timeline display explicit textual states alongside decorative markers. Native category filtering offers all/complete/current/pending. Empty input and empty filter results are different states.

## flight-tracker

Required: `flightNumber`, `status` in `scheduled | boarding | departed | landed | cancelled | diverted | unknown`, `departure`, `arrival`, and `updates` (0–40).

Both endpoints require uppercase three-letter `airport` and `scheduledAt`. Optional `name`, `estimatedAt`, `actualAt`, `terminal`, `gate`. The side-by-side route view separates scheduled, estimated and actual times and explicitly labels absent estimated/actual values as not supplied. On narrow layouts the endpoint cards stack. Arrival must be after departure for each time category when both values are supplied; categories are not mixed or substituted. A diverted status does not invent a new destination.

Each update requires unique `id`, `at`, `message`, and `kind: information | change | disruption`; optional `description`. Updates form a source-order timeline with a separate local category filter. There is no map, aircraft position, automatic freshness or current-status inference.

## Interaction and lifecycle

Filters are native labeled selects. Reset is a native, focusable button; repeated boundary activation is ignored. Filtering uses `hidden` on existing records, preserving disclosure identity and state. Unrelated `setState` does not alter filters, DOM or focus. No controls have names or Forms bindings, and snapshots/FormData exclude tracker values.

Inherited disabled/pending fieldsets, hidden/inert ancestors and detached controls block forged filter/reset actions. Native first-legend exceptions remain native. Details and source anchors are ordinary reading affordances.

External native form reset restores All only while the tracker remains enabled and active. Cancellation, newly disabled ancestors, newer explicit input and document replacement are respected. Reset reconciliation works inside shadow roots. Update resets local state; dispose removes listeners and retires queued reset work.

## Validation and verification

Structural failures report `SCHEMA`. Semantic failures use exact paths:
- `TRACKER_TIME`: observation, milestone/update or endpoint timestamp
- `TRACKER_CURRENT`: second current milestone state
- `TRACKER_PENDING`: pending milestone occurrence timestamp
- `TRACKER_ORDER`: arrival timestamp within the same time category
- `DUPLICATE_ID`: repeated local milestone/update ID
- `UNSAFE_URL`: supplied source URL

Public Node/browser validation, renderer/compiler parity, Unicode/literal text, native local controls, reset/cancel/disabled/dispose races and original synthetic fixtures have focused tests. Prepared browser specs cover real mouse/keyboard/touch, light/dark at 390/768/1100, RTL, forced colors/reduced motion, layout, focus, pending controls, safe links and absence of runtime requests. Prepared specs are not browser acceptance evidence. Neither structural node counts nor these candidates alter canonical accepted totals.
