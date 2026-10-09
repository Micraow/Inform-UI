# Supplied local places

Authoritative inventory IDs are `local-business` (Local Business) and `restaurant-reviews` (Restaurant Reviews); both were listed not implemented. Both new nodes belong to Base. Their own contracts and original renderers provide distinct business-hours and dining-dimension behavior; neither is an alias or counted as accepted merely from schema presence.

## Local business

Required name, category, address and 0–7 unique supplied weekday records. Each day contains a status (`hours`, `closed`, `unknown`) and periods. Hours requires 1–4 opening intervals; closed/unknown requires an empty interval array. Times are strict HH:MM. An overnight interval requires `nextDay:true`; intervals span greater than zero and at most 24 hours and must be ordered/nonoverlapping within each supplied day. Cross-day consistency, timezone offsets, holidays and live operational status are not inferred.

The weekday select changes a retained, accessible local hours panel with split periods, explicit overnight labels, closed states and missing-day states. It defaults to the supplied initial day or first supplied record, never the computer's current day. Selecting an omitted day says hours not supplied. Phone and timezone are literal supplied labels, not dialing links or executable timezone rules. Services, accessibility and description are literal native disclosures. No calling, location access, directions, booking or external lookup is performed. Optional source is an ordinary safe HTTP(S) link.

## Restaurant reviews

Required label, restaurant name, and 0–60 unique review records with id, author, literal text and occasion (`breakfast`, `lunch`, `dinner`, `other`, `unknown`). Optional overall/food/service/atmosphere scores are supplied numbers 0–5; zero is valid, missing is unknown. Optional valid Gregorian visit date, 0–12 dish labels and per-review source preserve attribution without verifying it.

Unlike a generic review list, users choose a dining rating dimension. The visible score and minimum threshold use that chosen dimension; missing scores are excluded when any numeric threshold is active, including zero. Text search matches author, review text and supplied dish labels; occasion combines with the other filters. Source order is retained, no weighted ranking or aggregate score is invented. Native disclosures expose full review text and the individual dimensions, keeping DOM identity/open state during local filtering and unrelated state updates. Reset clears filters. No review feed, authentication, voting, posting or author verification exists.

## Lifecycle, safety and integration

Actual controls require live ownership, connection, enabled state and non-hidden/non-inert ancestry. Paint and restore skip externally moved controls/rows/scores; no outside DOM is reclaimed. Native outer resets use the previously audited revision-aware reader helper, including partial-control removal, cancellation and shadow roots. All controls omit Forms names/binds; authored pending Forms keep them disabled. Replacement/disposal retires callbacks and reset work. Text remains literal and sources require safe absolute HTTP(S), opening separately with noopener/noreferrer and no referrer. No remote media, private captures, runtime service or credentials are required.

Source map: `scripts/generate-schema.mjs`, `scripts/schema-subsets.mjs`, `src/core/local-places.ts`, `src/renderer/local-places.ts`, `src/renderer/places-labels.ts`, their standard wiring/CSS, `examples/local-places.json`, `tests/local-places.test.mjs`, public types consumer and prepared browser spec. Generate/build/CDN must run after source-only integration. Browser and visual acceptance are outstanding; this candidate does not change the frozen acceptance checkpoint. Inherited poll ownership and the separate people-also-ask source need their own reviewed integration.

## Checkpoint verification

Generation/build, CDN build, TypeScript no-emit, public type consumer, source-boundary and prepared browser-spec syntax checks passed. Initial component run: 41/41. Final component/decision-card/Forms run: 135/135 (`/tmp/inform-local-places-final.log`); separate core run: 19/19 (`/tmp/inform-local-places-core.log`). The CSS test verifies all referenced theme tokens exist and selectors use the mounted root. No browser run, screenshot approval or CI claim. Source-only commits preserve generated files unstaged for recovery; root handles remote backup and combined acceptance.
Selected schema owner/closed-reference metrics, domain fixture compatibility and CDN/source byte identity checks also passed 3/3 (`/tmp/inform-local-places-schema.log`).
