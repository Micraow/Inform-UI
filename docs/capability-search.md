# Supplied search capability examples

`whats-new-capability-search` is a complete supplied composition: all examples are visible together, with explanatory notes, venue information, source requests, optional location request and the reusable ordinary reservation reader. It is separate from the tab-switching conversational onboarding search component.

## Integration and dependencies

The domain depends on the independently implemented ReservationPills domain (`aa2ddaa581482cc2904940c7801ad79db054e477`) and original AskUserLocation V1 (`60154c7f384d09f724b1481f4adadce9247053d5`). Those domains own their existing renderers, inspectors, schemas, reset behavior and CSS. This change does not reimplement or duplicate them.

- Register `installCapabilitySearchSchema({node, defs})` alongside the existing ReservationPills, AskLocation and SearchImage definitions. It adds `WhatsNewCapabilitySearchNode` and its bounded data definitions.
- Export the domain's core types, `capabilitySearchAction`, `capabilitySearchVenueAction` and `inspectCapabilitySearch`. Add `inspectCapabilitySearch(node, path, add, isSafeURL)` to validation; it directly calls both child semantic inspectors and the SearchImage inspector.
- Render with `renderCapabilitySearch(context, node, owner, host)`. Include `capability-search.css` alongside the existing child styles. The real mounted owner and host are retained for passive supplied images.
- Central registration, generated schema/types, public exports, package/CDN builds and progress accounting belong to the integrating change. The source-domain tests do not claim that those public integration steps have run.

## Data and presentation

A resolved node supplies `label` and `examples`. The authored `examples` array corresponds to the observed all-at-once content list, not tabs: there is no selected index, tablist, hidden example panel or synthesized search operation. Up to 24 examples are accepted; each has unique `id`, `title`, `notes` and `sources`. Each example has up to 30 notes and 30 uniquely identified sources. Optional narrative strings can be empty; interactive labels and destinations must be nonblank. URL and nested child safety checks are mandatory.

The introduction is shown when nonempty. For examples without a venue, the title and optional example label appear above a numbered notes list. A notes CTA appears only when notes are nonempty and `ctaPrompt` is supplied. Non-venue footers appear after sources.

A venue shows its supplied name/action, detail and address. The title button is disabled when its action is absent or its capability is unavailable. An 80-pixel supplied image or neutral local placeholder appears unless `nativeMap` is true and `showSourceImage` is false. A requested native map is represented by the supplied unavailable message; no map renderer, tile request, place lookup or geolocation runs.

The default venue CTA appears only when both `reservationWidget` and `enrichmentPending` are absent/false. A widget shell `{}` deliberately suppresses that CTA even when no child data has arrived. When `reservationWidget.data` exists, the real `renderReservationPills` is embedded with its complete date/provider/seating/responsive contract. The child's local request ID is the venue's `referenceId`, or the example ID when no reference is supplied; `data-search-example-id` retains the enclosing example identity.

Enrichment pending shows a passive status and suppresses the venue footer. A settled venue footer appears before source buttons. Sources always use their supplied labels and safe URLs and do not navigate automatically. Missing live enrichment does not fabricate venue data or successful availability.

## Location variants and streaming

The location line appears when `locationPrompt` is nonempty or `offerPreciseLocation` is true. Button mode shows `searchLocation` when supplied, otherwise the prompt. The inline request is enabled only when `locationAvailable: true`, the node is enabled and it is not streaming.

Widget mode uses the original AskUserLocation V1 renderer when a `locationWidget` exists and the parent permits a local request. The V1 keeps its own informational link, cancellation-aware dismissal, local permission intent, stable reset control and phase handling. When widget data or permission capability is unavailable, the inline choice is shown instead. Omitting `locationVariant` uses the inline presentation. No browser permission prompt is opened.

`streaming: true` disables parent and reservation actions through their actual supplied disabled state. A widget location request becomes the disabled inline location choice. When there are no examples, a passive streaming status is shown; an empty settled list has its own supplied empty message. New data arrives only through the ordinary document-update mechanism. `pending` uses a passive 100-pixel presentation; `failed` shows its supplied fallback or hides itself.

Optional reveal motion is a short local opacity/position transition. It does not reorder or defer examples and is disabled by the reduced-motion preference.

## Local request API

Parent controls dispatch a frozen, bubbling, cancelable, non-composed `iui:capability-search` event. Detail contains the node `id`, an intent and relevant `exampleId` / `sourceId`:

- `example-prompt`: the notes CTA's supplied prompt
- `venue-action`: the explicit supplied venue-title action
- `venue-cta`: venue URL first, otherwise the example prompt
- `open-source`: the selected source URL
- `request-location`: a request without coordinates or a permission API call

A normalized frozen `action`, when applicable, is `{kind: 'prompt', query}`, `{kind: 'url', url}`, `{kind: 'entity', entityId}` or `{kind: 'capability', capabilityId}`. Entity and generic capability actions require explicit `available: true`. No arbitrary handler name, raw runtime/tool payload, executable callback or service credential is accepted. Unavailable capabilities remain disabled even if a consumer tampers with the DOM button's disabled property.

The child event namespaces remain `iui:reservation-pills` and `iui:ask-location`; they are not redispatched under a second parent event. All three readers share one intent gate, so reentrant construction cannot activate a sibling reader. “Accepted” confirms only an uncanceled local event. It does not mean that a search, booking, login, map, location or voice operation occurred. Supplied images can load their explicit safe URLs through the existing passive image reader, with source release on retirement.

## Reset and ownership

The parent's visible **Reset search requests** control clears only its local receipt. It never rebuilds either child, resets their current selection, or changes supplied data. Each child retains its own visible reset control. A real form reset is independently reconciled by the parent and child readers, respecting cancellation, pending admission, disabled fieldsets and first-legend rules, shadow ownership and newer input. A child interaction that occurs after a reset was queued, including during parent reset painting, keeps its current state.

Shared lifecycle, irreversible owner tracking, guarded painting and the shared intent gate handle update/dispose, parent removal, host-constructor reentry, errors and pending work. Hidden/inert ancestry, per-control ARIA-disabled, snapshot disabled state and supplied capability availability are checked before dispatch. The child renderers retain their own resource management; the parent does not duplicate it.

## Observation and verification

The ordinary contract was observed read-only in module 59478 from fixed reference catalog `9ed3c8626296b98932a83b86fe045157fe3caf82`, including its complete final search composition. Code, fixtures and CSS here are independently authored. The reference's private runtime, captured code/assets, telemetry and client-service dispatch machinery are not shipped.

Focused tests execute esbuild-compiled modules and strict AJV validation with the actual child definitions. They cover both location branches, notes/default CTA distinctions, widget shells, all-at-once rendering, image/map/enrichment/source behavior, streaming, parent/child cancellation, shared-gate reentry, newer child input during reset, update/dispose and source compensation. Playwright scenarios cover keyboard controls, the real nested children, streaming replacement, narrow RTL and reduced motion. Discovery is not a native execution result.

Isolated handoff verification: 35/35 compiled-module tests passed with the unchanged four AskLocation source/schema dependencies from `60154c7`; strict AJV, TypeScript `--noEmit`, owned queues (176 renderer files, 21 deferred sites, zero violations), source boundary and whitespace checks passed. Four Playwright scenarios were discovered; native execution was not run in this lane.

## Source dependencies and semantic checks

`onboarding/search-capability` explicitly depends on `reservations/pills`, `requests/location` and `media/readers`. Their mandatory contracts remain part of the selected package: nested ordinary reservation data, location widget and search images are passed through their unchanged semantic inspectors.

`CAPABILITY_SEARCH_DATA` rejects whitespace-only top-level id, label, inlineLocationLabel, nativeMapUnavailableLabel, streamingLabel, enrichmentLabel, resetLabel, requestedLabel, cancelledLabel and emptyLabel. For every example, IDs and titles, supplied prompt/ctaPrompt/ctaLabel, every note, source IDs/labels, venue name/referenceId and all direct string fields of a venueAction must be nonblank. Example IDs are unique in the document's examples list; source IDs are unique within each example. Source URLs, supplied venue URL and URL-kind venueAction destinations require the safe link policy. Other structurally valid content fields, such as intro, locationPrompt, searchLocation, fallback, footer, venue detail/address and exampleLabel, retain their existing empty/whitespace allowances.

An empty reservationWidget shell is valid and intentionally has different CTA behavior from absence. Only its supplied data is inspected. Sources and child references are never inferred from text. Pending/failed/streaming presentation does not bypass validation of fields that are present. The shared location and image rules, and the ordinary reservation fallback-time-label rule, therefore remain necessary alongside this parent page.
