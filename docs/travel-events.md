# Supplied travel and artist events

These are original limited `iui/1` contracts, independent of private runtime fields. Both belong to Base. Recognition in a generated schema is not a claim of browser acceptance or canonical component completion. Examples contain explicitly illustrative records, not actual itineraries, live fares, verified performances, or tickets.

## `flight-option`

Required: `label` (1–200 Unicode codepoints), `optionId` (key), `legs` (1–8). Optional: `description` and `note` (up to 2000 codepoints), `price: {amount, currency}`, `source: {label, url}`. Amount is a finite number from 0 through 1e12; currency is exactly three uppercase ASCII letters, displayed as supplied without verification, exchange conversion, rounding, or inferred validity.

Each leg has unique `id`, supplied `carrier`, flight `number`, `departure`, `arrival`, and optional `cabin`. Each endpoint contains a three-letter uppercase `airport`, `at`, and optional `name`. Short text is 1–200 codepoints. IDs match the existing key grammar and cannot have a trailing newline.

`at` is exactly `YYYY-MM-DDTHH:mmZ` or `YYYY-MM-DDTHH:mm±HH:mm`, Gregorian years 1000–9999, hours 00–23, minutes 00–59, and offsets no greater than ±14:00. No seconds, fractional seconds, floating times, timezone database names or permissive date normalization. Real civil fields are validated before calculating an instant. Arrival must be strictly later than departure; each later departure may equal but never precede the prior arrival. Input order is preserved. Endpoint timestamps, including their offsets, stay visible; native details expose the extra leg facts. Durations use the validated instants only.

Native Select/Clear buttons operate only on the local component. No initial choice, `bind`, form value, persistence, provider, account, search, navigation, checkout or reservation exists. Both selection and clear emit `iui:flight-choice` with a frozen primitive detail `{id: node.id ?? null, optionId: selectedOptionIdOrNull}`. The event bubbles, is cancelable and is not composed. Its constructor comes from the container's ownerDocument with a native fallback. `preventDefault()` preserves the prior choice. Already-selected Select and already-clear Clear do nothing; those boundary buttons retain keyboard focus via `aria-disabled`. Host exceptions follow ordinary DOM event semantics and never imply a successful booking.

Unrelated `setState` preserves local selection, focus, disclosure state and element identity. `update` replaces the component and resets selection; `dispose` retires handlers. Disabled fieldsets and pending/disabled authored Forms block even forged activation. Synchronous event getter, constructor or listener retirement is checked before any later dispatch or paint; a synchronous disable also suppresses committing the change. Reading details and source links remains ordinary reading.

## `artist-upcoming-events`

Required: `artist` (1–200 codepoints), `events` (0–40). Optional: `label` (default localized “Supplied events”), `description` (2000), `source: {label, url}`. Each event has unique `id`, `title`, Gregorian `date` (`YYYY-MM-DD`, years 1000–9999), and `venue`; optional `start` (`HH:mm`), `timeZoneLabel`, `location`, `description` and `url`.

Supplied order is preserved. Repeated dates and venues are legal. Historical dates and distant dates are retained. There is no system-clock test, inference that an event is upcoming/current/available/verified, or conversion of a literal timezone label. Dates, venues, times and labels are explicitly disclosed as supplied data.

When more than one distinct `YYYY-MM` occurs, a labeled native select offers All and each month in encounter order. Filtering is exact, local and unbound; it emits no host event, performs no request, does not move focus and updates a visible count/empty state. Rows and details stay mounted with `hidden`, preserving disclosure state. An unrelated `setState` does not change the filter. `update` resets to All. External native form reset restores All after its default action when controls remain enabled; disabled/pending, hidden, or inert controls preserve their filter. Reconciliation occurs in a microtask so canceled resets and newly disabled ancestors are respected. A canceled authored Forms reset retains the local filter. Shadow-tree forms are supported. A queued reset never paints a retired tree or overwrites a newer explicit filter change. Filter controls do not contribute to FormData or host action snapshots. Forged filter changes while disabled/pending/hidden/inert are ignored and the visible native value is restored.

All sources/event links require explicit absolute HTTP(S) URLs accepted by the existing core URL policy: no credentials, whitespace, control characters or unsafe schemes. Ordinary anchors disclose new-tab navigation and use `target="_blank"`, `rel="noopener noreferrer"`, and `referrerpolicy="no-referrer"`. They never prefetch, request images or initiate ticketing.

## Examples and validation

- `examples/flight-option.json`: complete original supplied-flight document.
- `examples/artist-upcoming-events.json`: complete supplied events and empty-state document.
- Public semantic validation is required even after a structural schema passes.
- Invalid civil endpoint: `FLIGHT_TIME` at `/body/0/legs/0/departure/at` or `/arrival/at`.
- Non-increasing arrival: `FLIGHT_ORDER` at `/body/0/legs/0/arrival/at`.
- Overlapping next leg: `FLIGHT_ORDER` at `/body/0/legs/1/departure/at`.
- Duplicate IDs: `DUPLICATE_ID` at the later leg/event `/id`.
- Invalid event civil date: `ARTIST_EVENT_DATE` at `/body/0/events/0/date`.
- Unsafe links: `UNSAFE_URL` at `/source/url` or `/events/N/url`.
- Malformed timestamp/offset/airport and unsupported fields are rejected structurally at their exact schema paths.

Internal IDs are reserved `iui-flight-internal-…` and `iui-events-internal-…`; styles are scoped to `.iui-root`, use logical dimensions and visible focus, and support narrow layouts/forced colors without motion. English and Chinese labels are provided; authored RTL text is rendered literally with direction isolation for timestamps and routes.

Focused public/schema/negative/lifecycle tests and type consumers are supplied. `tests/browser/travel-events.spec.mjs` is a prepared real input/layout acceptance suite, not evidence of an executed browser pass. The handoff report records exactly which checks ran. The current frozen 30-candidate acceptance scope remains unchanged.
