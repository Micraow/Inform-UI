# Supplied motorsport candidate

The authoritative 256-item inventory lists f1-races and f1-standings as missing. These two original Sports nodes implement supplied timetable exploration and rank-table reading. They do not connect to Formula 1 or any other provider, import private assets, infer scoring systems, decide winners, calculate standings or infer current/live status. The fixture uses fictional people, teams and places.

## Timetables

f1-races takes label, optional description/disabled and 0–80 races. Each unique race ID has label, season (1900–9999), round (1–1000), circuit, location and 0–20 sessions. Season/round pairs must be unique. Session IDs are unique within their race. A session has label, kind (practice/qualifying/sprint/race/other), supplied status (scheduled/complete/cancelled/postponed/unknown), nullable startsAt and optional endsAt/note. Timestamps are real Gregorian dates with explicit offsets; endsAt requires a start and must be later. Unknown schedules remain unknown. Source order remains unchanged.

Text/season/session-kind/status filters combine. Search covers race name, circuit, location and season. Session filters hide nonmatching sessions and weekends; a race with no supplied sessions remains visible without session filters. Native disclosures keep identity. Selecting a session emits frozen, cancelable, bubbling and noncomposed iui:motorsport-session with componentId/raceId/sessionId. Clearing uses both null. Repeated selection is supported. Accepted selection is local only; canceled or interrupted events cannot change it. Selection persists through filter resets, with a note when filtered out. No alarm, calendar, ticket or provider action occurs.

## Standings

f1-standings takes label, season, optional supplied observedAt/description and 0–100 unique records. A record has label, kind (driver/constructor), rank (1–1000 or null) and points (-1,000,000 to 1,000,000 or null), optional team, wins (0–10,000 or null), note/source. Numeric points may be fractional or negative, and are displayed as supplied JSON numbers. Precision beyond JavaScript numeric representation and trailing decimal zeros are not promised. Points are never inferred from wins or events; ties and missing values are preserved. No rank consistency or season scoring rules are invented.

The reader separates driver and constructor records. It defaults to drivers when any are supplied, otherwise constructors. Search matches name/team. Display order can be supplied order, rank ascending, points descending or deterministic case-insensitive code-unit name order. Missing ranks/points sort last; all ties retain source order. Sorting does not recompute ranks. The semantic table exposes active aria-sort, supplied values, native context disclosures and sources. Reset restores the initial category and source order.

## Ownership and evidence boundaries

Controls are local and unnamed, outside authored Forms data. Shared native-reset and composed-ancestry guards handle actual ownership, cancellation, hidden/inert/disabled ancestors, newer input, disposal and moved controls. A moved row is not reclaimed by sorting. All text is literal. Optional sources require ordinary safe absolute HTTP(S), opening with noopener/noreferrer and no referrer. There are no images, remote fetches, clocks or timers.

Source map: motorsport schema definitions/Sports example subset; core semantic inspector; renderer/English-Chinese labels/CSS; public event type export; fixture; unit/type tests and prepared browser spec. Generated Schema/CDN artifacts are preserved separately. Protocol node totals are not canonical acceptance totals. Browser execution, screenshots, visual/accessibility and real-provider acceptance are unexecuted.

## Source checkpoint

The supplied motorsport interaction/semantic suite passes 70 tests, including exact session/race/list ownership before and after dispatch, canceled/reset revisions, disposal, shadow-root boundaries, stable numeric ties, missing values, and declared theme tokens. TypeScript no-emit, public type consumers, source boundary and seven-case browser test discovery pass. Full local aggregate validation is recorded separately after the cohort. The bundled browser executable is absent; a system Chromium launch stops before page execution with a sandbox Unix-socket permission error. No browser, screenshot, visual, accessibility or canonical acceptance is claimed. Formal accepted inventory remains 53/256.
