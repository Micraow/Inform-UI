# Local flight discovery candidate

Inventory-confirmed IDs: flight-search-form (Flight Search Form) and flight-results (Flight Results), both Base candidates. Work is source-only and remains outside existing acceptance. No live search, provider API, booking, quote or payment behavior is intended.

Planned acceptance:
- Supplied airport choices, explicit departure/optional return date and bounded traveler count. Native local inputs preserve incomplete drafts; validation requires distinct supplied airports, real Gregorian dates, chronological return and 1–9 travelers. Frozen cancelable local search-intent detail, no implicit host action.
- Supplied multi-leg itineraries, safe sources and optional labeled prices. Carrier/stops filters, source-order or chronological sorting; price sorting only within an explicitly selected supplied currency. Unknown prices remain unknown. Stable detail disclosures and cancelable local selection event.
- Live ownership, hidden/inert/disabled controls, cancellation/repeat/reentry, custom constructor interruptions, disposal/replacement, partial-control movement and Forms exclusion covered by focused tests. Browser specs prepared separately; no browser acceptance claimed.

## Implemented contract

`flight-search-form` requires label and 2–80 unique uppercase three-letter airport choices `{code,label}`. Optional initial origin/destination must be supplied and distinct; departure/return are strict valid Gregorian dates (1000–9999), and an initial return requires a departure on or before it. Initial travelers is 1–9, default one. Optional description and disabled fieldset are supported. There is no implied current date or airport lookup.

Users can leave incomplete native drafts. Preparing checks two different supplied airports, departure, optional return and decimal whole travelers 1–9. Leading zeros and trailing `.0` digits are allowed; exponent notation and nonzero fractional tails are rejected, with a 64-character limit. Invalid preparation keeps the draft and focuses the relevant owned control. `iui:flight-search` is bubbling, cancelable and noncomposed; its frozen detail is `{componentId,origin,destination,departureDate,returnDate,travelers}`. It is only a local intent event. Cancellation/repetition/reentry and host interruption are guarded. Inputs have no names/binds and are dissociated from outer native forms; explicit reset restores initial choices.

`flight-results` requires label and 0–40 unique results `{id,label,legs,price?,note?,source?}`. Legs reuse the established bounded supplied itinerary contract, including civil/offset instant validation and chronology. The optional price uses nonnegative bounded amount and uppercase currency. No totals, fees, availability or exchange rates are computed. Results remain usable when prices are absent.

Carrier filtering includes an itinerary if any leg has the exact supplied carrier label. Stops is explicitly leg-count minus one; there is no route/provider inference. Currency filtering includes only prices in the selected exact currency. Price ordering requires that currency first; clearing it returns price ordering to supplied order. Departure sorts offset-adjusted initial instants, duration sorts final-arrival minus initial-departure minutes including connection time. Ties keep supplied order. Native detail nodes survive filtering/order changes. Ordering never reclaims rows or changes controls moved outside the component.

`iui:flight-result-select` is bubbling/cancelable/noncomposed, with frozen `{componentId,resultId}`. Accepted events update local pressed state; nothing is booked. Cancellation preserves the prior selection. Repeated explicit clicks are allowed; synchronous reentry and retired control events are ignored. Filter reset keeps local selection; valid document replacement resets local state. Native reset cancellation, revision races, partial controls and shadow-root behavior use the audited reader helper.

Safe sources are ordinary absolute HTTP(S) links with noopener/noreferrer and no referrer. Literal text is never interpreted as markup. No private assets, OpenAI runtime, remote media, API credentials or provider service are needed.

## Source map

Schema generator/subsets, `src/core/flight-discovery.ts`, `src/renderer/flight-discovery.ts`, `src/renderer/discovery-labels.ts`, standard exports/wiring/CSS, `examples/flight-discovery.json`, focused tests/public type consumer/prepared browser spec and protocol count assertions comprise the source-only patch. Generate/build/CDN must run after integration. Current protocol count is 106, not a canonical acceptance count. Separate poll ownership and people-also-ask sources remain outside this branch and need reviewed integration.

## Local verification

Initial focused flight tests: 43/43 passed. Final flight/decision-card/Forms/core run: 157/157 passed (`/tmp/inform-flight-discovery-final.log`). Build, no-emit types, public consumer types, CDN build and source-boundary passed after correcting a TypeScript tuple-union membership inference error. Prepared browser spec parses; native pointer/touch/date-picker behavior, RTL visual layout and real browser acceptance remain unexecuted. No CI or remote push was performed by this component slot. Generated artifacts remain preserved but outside the source-only commit.
Selected schema owner/closed-reference metrics, domain fixture compatibility and CDN/source identity checks: 3/3 passed (`/tmp/inform-flight-discovery-schema.log`).
