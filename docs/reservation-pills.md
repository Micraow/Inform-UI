# Supplied reservation pills

This independent domain has two presentations. The internal `renderReservationPills` is the reusable grouped reader; `reservation-time-pills-ref-carousel` is the canonical card collection. The card collection uses the existing finite Carousel renderer. Neither presentation is an adapter to a reservation service.

## Integration contract

- Run `installReservationPillsSchema({node, defs})` in the central schema generator. It registers only `ReservationTimePillsRefCarouselNode`; the ordinary data structure is a reusable `$defs.ReservationPillsData`, not another canonical component.
- Export the types and helpers in `src/core/reservation-pills.ts`. Connect `inspectReservationPillsCarousel(node, path, add, isSafeURL)` to canonical validation and `renderReservationPillsCarousel(context, node, owner, host)` to rendering. Include `reservation-pills.css` in the existing stylesheet build. Generated schema/types, registry, public exports and CDN wiring belong to the integrating change.
- A composite renders ordinary data with `renderReservationPills(context, data, owner, host, {id, disabled, gate})` and validates it with `inspectReservationPills(data, path, add, isSafeURL)`. Passing its existing `intentGate` shares admission with sibling controls. A nested composite must retain the real mounted owner and host for supplied image ownership.
- Bounded snapshots support up to 30 groups, 48 times per list, 12 provider choices, 8 seating choices, 12 photos and 16 carousel items. IDs are unique within each corresponding list. Visible labels must be nonblank, URLs must pass the existing safe-URL policy, and supplied timestamps must include an offset. No current time, live availability, implicit location or provider SDK is consulted.

## Complete ordinary grouped presentation

Each visible group shows the supplied date, party size and provider logos. It defaults to three groups and honors supplied initial/collapsed/expanded counts. More/Fewer dates is a local toggle. A container-width measurement and owned resize observer select the desktop or mobile slot list; an empty preferred list falls back to the other list, then the supplied `times` list. The fallback list requires each time's `timeLabel`. Slot content is shown only when both selected slots and the group's `times` are nonempty; otherwise the supplied empty message and provider retry choices appear.

Unavailable times are noninteractive. One provider acts directly; multiple providers open a labeled disclosure of native buttons, with Close, Escape-to-trigger and outside-pointer dismissal. No provider means no choice button. With seating enabled and multiple seating types, selecting a time replaces its row with a Back-to-times control and seat-specific provider choices. A single local selection is shared across groups. Changing layout, reset or Back clears it.

Party-size controls emit `change-party`; their action resolution follows the supplied ordinary provider options. A “more options” slot uses group change options, then group/slot more-times destinations. Voice-sized presentation uses the first group and up to five mobile-preferred slots; additional supplied slots can expose a more-times request. Its optional summary has a first-image thumbnail for one or two images, or a three-photo mosaic for three or more. No voice or audio capability is invoked.

## Distinct canonical card presentation

Items without a supplied `voiceCard` are omitted. Each card shows its title/action, metadata and optional decorative rating star. A mosaic appears only when at least three images exist; one or two images do not become thumbnails here. Only the first group is used. Only the first five `mobileSlots` are used, without desktop or `times` fallback, provider menus or seating selection. This preserves the separate card contract rather than wrapping the ordinary reader.

The party/date heading uses the first change option's launcher or URL; when no first option exists it can use the group's requested launcher. Heading action deliberately ignores a booking query. Card times resolve only their own booking query, launcher or URL; they never inherit a group provider. More times requires more than five mobile slots and a first-option or group requested launcher. It uses the purpose-specific more launcher when supplied. Empty mobile slots show the supplied empty state and first-option retry destination. The finite rail keeps native scrolling, snap points, previous/next controls and the existing Carousel's visible-range semantics.

## Bounded local requests

Every activation dispatches a bubbling, cancelable, non-composed `iui:reservation-pills` event. Its frozen detail includes `id`, `intent` and relevant item/reference/group/slot/seating/option IDs. Intents are `book`, `more-times`, `retry`, `change-party`, `open-card` and `view-image`. A normalized frozen action is one of:

- `{kind: 'prompt', query}`
- `{kind: 'url', url}`
- `{kind: 'provider', providerId, requestId?, selectedTime?}`
- `{kind: 'entity', entityId}`

Provider/entity capabilities must explicitly supply `available: true`. Arbitrary application URIs, raw tool payloads and executable callbacks are outside the schema. Ordinary booking resolution prefers a nonblank booking query, then a purpose-specific or ordinary launcher, then matching supplied provider inheritance, then URL. Inherited provider requests include `selectedTime` when it can be derived from an offset-bearing timestamp or formatted AM/PM time. An explicitly unavailable selected capability is not silently replaced with another destination.

An image request carries the selected index and a frozen snapshot of all supplied image descriptors. Images themselves use the existing passive, safe-URL SearchImage primitive; their source URLs may be loaded by the browser, but no booking/provider, map, location, microphone, speech, navigation or account operation is performed. A host may cancel any request. “Accepted” means only that the local event was not canceled; it is not a reservation confirmation. Cancellation keeps a provider disclosure open for correction. Accepted requests close it. Both leave supplied availability untouched.

## State, reset and ownership

Ordinary controls use native buttons and labeled disclosures, not a simulated ARIA menu requiring custom menu-key handling. The canonical unresolved states are `pending` (passive status), `failed` (supplied fallback or hidden), and default `resolved` (including a genuine empty collection).

A stable visible **Reset reservation view** button is an explicit local adaptation. It restores supplied group counts, clears seating and provider choices and local receipts; canonical reset also returns the rail to its start. Native form reset respects cancellation, matching form ownership, shadow roots, disabled fieldsets and first-legend exceptions. Pending reset blocks requests; newer local input or generation replacement wins. Per-control disabled/ARIA-disabled, hidden/inert ancestry, snapshot capability gates and irreversible owner loss are rechecked. Shared generation, owner, painter and intent-gate helpers own callbacks, resize observers, image sources and reset work. Reentrant replacement/disposal retires old requests, and ordinary errors remain observable.

## Observation and verification scope

Behavior was observed read-only from fixed reference catalog 9ed3c8626296b98932a83b86fe045157fe3caf82: the ordinary grouped presentation inside lazy module 59478 and the independent card collection in module 499797. This implementation is independently authored JavaScript/TypeScript and CSS; captured source, telemetry, runtime state and proprietary assets are not shipped. `whats-new-capability-search` and location prompts are not registered or claimed by this domain.

The focused suite executes esbuild-compiled domain modules against jsdom, including strict AJV schema checks, both presentation contracts, routing, cancellation, reset, update/dispose, reentry, late image-source compensation and resize-observer release. Native Playwright scenarios cover keyboard disclosure and focus, narrow RTL/container changes and canonical rail behavior. Browser discovery alone is not a native execution pass. The main integrator must verify generated/public-consumer wiring separately.

Focused handoff verification on the isolated domain: 36/36 compiled-module tests passed; TypeScript `--noEmit`, owned queues (174 files, 21 deferred sites, zero violations), source-boundary and whitespace checks passed. Playwright discovered three scenarios; native execution was not run in this lane. These results do not claim central registration, generated schema, public package or CDN verification.

## Source module and exact validation

`reservations/pills` owns the original installer and both its public carousel and internal grouped-data definitions. `RESERVATION_PILLS_DATA` covers the following semantic rules in addition to the structural bounds. Full `validateDocument` still checks supplied data during pending/failed states.

Every direct string on carousel, item-as-grouped-data, grouped-data, group, option/slot, seating option, launcher, logo, voice card, voice-card action and image record must be nonblank by `trim()`. This includes supplied fallback and IDs. IDs must be unique within each carousel items, groups, times, changeOptions, desktopSlots, mobileSlots, providerOptions, seatingOptions, each seating option's options, and each voice-card images list. Separate lists retain independent ID scopes. All supplied option/action destination URLs and logo/image sources must pass the corresponding safe link/image policy.

A supplied startDateTime must match an offset-bearing timestamp syntax (Z or numeric offset) and have a finite `Date.parse` result. This is the existing syntax/parse check, not an added calendar-normalization promise. Ordinary grouped data with neither nonempty desktopSlots nor nonempty mobileSlots requires a visible nonblank timeLabel for each fallback time. The canonical carousel deliberately disables that fallback-label requirement, preserving its separate mobile-card contract.

For grouped data, the effective collapsed count is `min(collapsedGroups ?? 3, groups.length)` and effective expanded count is `min(expandedGroups ?? groups.length, groups.length)`; expanded cannot be smaller. Initial group counts retain their structural bounds. Validation does not manufacture availability, a launcher or booking destination. Request resolution and explicit capability availability remain separate local interaction rules described above.
