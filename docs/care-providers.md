# Supplied care-provider views

`care-provider-results` and `care-provider-sidebar` are original directory/appointment-selection presentations. Every provider, rating, network label, date, calendar cell and slot is supplied by the caller. They do not assess symptoms, rank or recommend clinicians, calculate availability, check insurance, query providers, book appointments or transmit patient information. Examples contain fictional identities, example.test URLs and original inline images. No reference code, photographs, brand artwork, telemetry or opaque host payloads are included.

## Results

Resolved data has a resultStatus (ok/partial/empty/error), providers, initial/expanded counts, disclosure text and no-availability text. A partial notice is independent; empty/error display their supplied messages and only error offers a finite retry query. `render:false` hides the presentation. Outer pending hides, while failed uses literal fallback or hides.

Each provider has a stable ID, name/initials, optional photo and supplied metadata. Review-count text is shown only with a non-null rating; the string `0` stays real data. Optional profile and location actions are finite `{url?,query?}` requests with URL precedence. No action means plain text. Locations include supplied modality, distance, days and optional combinedDays. An explicit empty combinedDays array overrides legacy days; null or omission falls back.

One selected location/date shows that day's supplied groups. Selecting the same date again deselects. Slots with more than one option expand the supplied visit-category choices and hide peer slots only within their group; selecting again dismisses. Direct slots use their supplied URL. Selecting a date or a location request clears the choice expansion. The view first changes from providersToShow to expandedProvidersToShow using stable existing cards. Afterwards hasMoreResults requests the supplied query and exact string/null cursor, including an explicit empty string. No local result fetching is implied.

## Sidebar

The sidebar displays supplied provider identity and direct partner-logo fields (or the first provider location's partner metadata). More than one location option enables a shared-coordinator popover. Already selected options stay disabled. Selecting an alternative emits the request and closes the menu; it does not pretend that the remote location changed. Escape/outside dismissal and focus restoration use the shared overlay coordinator. Optional directions and profile links are local intents.

The calendar renders the exact weekday labels, ordered months and cells, without deriving calendar arithmetic. A month change uses its supplied firstAvailableDate. Noncurrent cells are blank; unavailable cells remain disabled even after DOM tampering. The selected day's direct slot groups appear below. Empty availability displays noAppointmentsLabel. Sidebar slots do not support the result view's visit-category submenu.

## Local contract and bounds

`iui:care-provider` is frozen, bubbling, cancelable and non-composed. Intents are open-profile, change-location, open-directions, open-booking, select-day, select-month, select-slot, dismiss-slot, show-more, request-more, retry and reset. Detail contains only finite authored IDs, URL/query, exact date, option ID, proposed month/count and cursor as appropriate. No event performs a service call. Date/month/disclosure input wins over an older queued form reset; external requests wait for pending reset to settle. Local and accepted native Reset restore the original supplied selection and counts. Focus that would become hidden moves to the stable Reset control.

The schema bounds providers (30), locations per provider (10), availability days (62), groups (8), slots (40), options (8), calendar months (24) and cells per month (42); semantic validation caps total slots/calendar cells at 2000. IDs and dates are unique in their relevant collection, available calendar cells reference supplied dates, selected-month bounds and finite request destinations are checked. Ratings/counts are display labels, never calculated.

Images use the shared image renderer; external images require explicit Load activation, inline original data images may display immediately, and failures retain supplied initials/glyphs. Request admission, lifecycle retirement, reset and overlays use existing common primitives. New native keyboard cases are discovery-only until a later batched browser run; DOM tests do not certify clinical suitability or pixel equivalence.

## Narrow-calendar readability follow-up

Actual 390-pixel screenshots exposed a supplied month name squeezed into single-character lines between the Previous/Next controls. Below a 576-pixel local component width, the month gets a complete row and the two navigation controls share the next row. Wider layout and all selection semantics are unchanged. Native word-range geometry supplements screenshot review; original negative evidence is retained.

## Complete semantic validation boundary

Use full `validateDocument` after structure validation. Care recursively checks string properties for nonblank `trim()` content (`CARE_TEXT`), except properties named `fallback`, `summary`, `subtitle`, `emptyMessage`, `errorMessage`, `partialNotice`, `photoAlt` or `nextCursor`. These named content exceptions preserve their structural empty/whitespace allowance. Every supplied `url`, `photo` and `partnerLogo` also follows safe-link or safe-image validation. A request object must provide a URL or query (`CARE_REQUEST`). No request executes a booking or medical service.

Provider IDs, each provider's location IDs, slot IDs within a group, option IDs within a slot, sidebar location-option IDs and month IDs must be nonblank and unique in their respective lists (`CARE_ID` for duplication). Results also require location IDs unique across the whole result set. Dates must be unique within each availability-day list (`CARE_DATE`); the component does not infer missing dates or clinical availability from calendar labels.

A direct slot requires its supplied URL (`CARE_BOOKING_URL`): this includes slots with fewer than two options, and every sidebar slot. Sidebar slots cannot carry options (`CARE_SIDEBAR_SLOT`). Results with `hasMoreResults` require both more-results label and query; error result status requires retry label and query (`CARE_MORE` / `CARE_RETRY`). A selected location must occur in the results (`CARE_SELECTION`). The expanded provider count must not be smaller than the initial count, using 0 for each omitted count (`CARE_COUNT`).

When sidebar months are supplied, selectedMonth (default 0) must be in range (`CARE_MONTH`). Each non-null firstAvailableDate and each current-month day marked available must reference supplied sidebar availability (`CARE_DATE`). All traversed slot entries, including combined-day views, plus calendar cells must total at most 2000 (`CARE_BUDGET`). Structural array bounds still apply. These are supplied-data consistency rules, not provider verification, triage or a medical recommendation.
