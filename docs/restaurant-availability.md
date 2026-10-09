# Supplied restaurant availability

`restaurant-availability` is one original canonical Base component. It displays supplied restaurant wall-time options and records a local selection. It does not fetch availability, make reservations, initiate booking/payment/account operations, connect to a provider, or infer current availability, elapsed time, time zones, DST or instants.

## Authored fields

Required `title` and `venue` are literal strings, 1–200 Unicode code points. `partySize` is an integer, 1–20. `timeZoneLabel` is a literal string, 1–100 code points, shown exactly as authored. `slots` accepts 0–100 entries:

- `id`: a unique component-local key matching `[A-Za-z_][A-Za-z0-9_.-]{0,79}`.
- `date`: a real Gregorian `YYYY-MM-DD` date in years 0001–9999.
- `time`: strict 24-hour `HH:mm`, 00:00–23:59.
- `available`: an explicit boolean. Unavailable entries remain visible with textual status and a native disabled button.

Date/time pairs must also be unique. The caller array remains unchanged; presentation uses stable ascending date, time, then original-index order.

Optional `description` is literal text up to 2,000 code points. Optional `source` contains required `label` (1–200 code points) and optional `url` (1–2,048). Source URLs require absolute HTTP(S) plus the shared safe-URL policy. Links disclose a new tab, use `noopener noreferrer` and `no-referrer`, and remain ordinary reading links, including inside a disabled fieldset. No link is loaded automatically.

Unknown fields, nulls, expressions, binding, provider/booking actions and extra slot metadata are rejected. JSON Schema validates structure; public `validateDocument` adds real-date, uniqueness and safe-destination semantics.

## Local behavior and event contract

The native date selector offers All dates plus distinct supplied dates. Every slot retains its original mounted DOM when filtered. Visible counts include unavailable slots. Empty data is disclosed honestly. Filtering never discards a selection; its exact date, time and authored zone label remain visible even when the selected slot is hidden.

Each explicit native activation of a visible available enabled slot emits one `iui:reservation-choice` CustomEvent from the component section. It bubbles, is cancelable, and is not composed. The frozen primitive-only `ReservationChoiceDetail`, exported from the Node and browser entrypoints, contains:

`{componentId: string | null, slotId: string, date: string, time: string, partySize: number, venue: string, timeZoneLabel: string}`

`componentId` is the authored node ID, or null. It is not the renderer's generated DOM ID. The detail does not include other form/state data. Host `preventDefault()` preserves the previous local selection and reports that the local choice was not accepted. Without cancellation the component records only a local selection, never a booked or confirmed reservation. Listener exceptions follow native DOM dispatch semantics. Reentrant choice/filter/clear events are suppressed; synchronous controller replacement/disposal prevents post-dispatch writes to the old tree.

Filter, Clear, mount, host state refresh and form reset emit no choice event. Clear is always a native `type=button` with a focus-preserving `aria-disabled` no-op boundary. It does not clear the date filter. Slot and Clear buttons do not submit forms. Inherited disabled fieldsets, including pending authored forms, block slot/filter/Clear events even when forged. Explicit `.click()` on a visible enabled choice is supported. The date selector has no name or binding and maintains its current default option for native outer-form reset. Local choices never enter a form action snapshot.

## Accessibility and verification

The titled section has a persistent localized disclosure, visible selected date/time, live counts/status, native select/buttons, `aria-pressed`, exact LTR numeric time labels, scoped wrapping/RTL/forced-colors styles and 44px targets. Built-in labels are English and Chinese; other host languages fall back to English. No motion or remote assets are introduced.

`examples/restaurant-availability.json` contains original synthetic data only. Focused public/schema/negative/lifecycle tests and a public type consumer are included. `tests/browser/availability.spec.mjs` prepares genuine pointer/touch/keyboard, six theme/width combinations, Arabic-first RTL, forced colors, no unsolicited requests and lifecycle checks. Browser cases are prepared but unexecuted in this isolated handoff; integration acceptance must execute them.
