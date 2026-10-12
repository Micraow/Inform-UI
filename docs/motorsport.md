# Supplied motorsport readers

`f1-races` renders supplied race weekends and their finite session lists. Search, season, session kind and status filters are local. Selecting or clearing a session emits a bubbling, cancelable, non-composed `iui:motorsport-session` event with frozen `{componentId, raceId, sessionId}`; IDs are null on clear. No provider requests, automatic navigation or live results are inferred.

`f1-standings` displays supplied driver or constructor records. Search and source/rank/points/name sorting preserve stable rows and disclosures. Unknown ranks and points remain explicit; negative supplied points and ties are preserved. Sources are safe user-supplied links with new-tab protections.

Both readers isolate native form reset, stale generations, reentrant getters and late paint setters. A transferred row/table is not reclaimed; transferred whole component owners retire. Native visual and same-turn ancestor removal acceptance remain separate checks.

See `examples/motorsport.json`, `tests/motorsport.test.mjs`, `tests/motorsport-generation.test.mjs` and the browser suite for executable contracts. The project-owned core, labels and stylesheet are restored from the prior implementation; runtime integration adds shared lifecycle guards.

## Source selection and exact validation boundary

`sports/motorsport` owns only the two existing motorsport nodes and the session, race and standing definitions. It requires `travel/snapshots` for the shared `TravelEventSource`; dependency nodes are therefore visible in a selection manifest. The selected structural schema must still be followed by the unchanged full `validateDocument` before mounting or compiling.

- A race list contains 0–80 races, each with 0–20 sessions. Seasons are integers 1900–9999 and rounds 1–1000. Race IDs are unique within the node; season/round pairs are also unique. Session IDs are unique within their race, so a session ID can recur in another race.
- Standings contain 0–100 rows with unique IDs. Rank is an integer 1–1000 or null; points are any number from -1,000,000 to 1,000,000 or null; optional wins are an integer 0–10,000 or null. Repeated ranks, mixed driver/constructor rows, fractional or negative points and unknown values are not reconciled or inferred.
- Domain IDs use the strict supplied-key pattern: an ASCII letter or underscore, then up to 79 ASCII letters, digits, underscores, dots or hyphens, with no trailing line terminator. Optional authored node IDs instead use the shared 1–200-character node-ID field and document-wide uniqueness rules.
- Short labels, circuit, location, optional team and source label have structural length 1–200. These inspectors do not trim or impose a separate nonblank rule; whitespace-only short text remains accepted. Descriptions (up to 3000 characters) and notes (up to 2000) may be empty. This source migration does not tighten that existing contract.
- Session `startsAt` is required but may be null. Every non-null start and optional standings `observedAt` must be a real Gregorian minute timestamp, years 1000–9999, with `Z` or an offset no greater than 14:00. Seconds, fractions, missing offsets and trailing newlines are not accepted. An optional `endsAt` requires a valid non-null start and a strictly later offset-adjusted instant; equal instants written with different offsets are rejected.
- Race and standing sources require a label and safe absolute HTTP(S) URL. No race chronology, standings freshness, season/year alignment, status/time relationship, rank uniqueness or scoring formula is enforced beyond the checks above.
