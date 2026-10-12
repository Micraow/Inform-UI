# Supplied match-score readers

`sports/match-scores` owns the existing `nba-scores`, `soccer-games` and `american-football-games` declarations. Shared team, score-pair, period and game fields remain one authored source. Its `travel/snapshots` dependency supplies `TravelEventSource` and exposes that dependency's nodes in the selected manifest. A selected schema is structural only: run the unchanged full `validateDocument` before mounting or compiling.

These are bounded supplied snapshots. Team/date/competition/status search and event filters, ordering, details and reset are local view state. They do not fetch scores, poll providers, execute betting actions, infer a clock or calculate winners. Sources open only on activation with the existing new-tab protections. Existing generation, ownership, cancellation and reset behavior is unchanged by source registration.

## Structure and text

Each node requires label, recognized IANA timezone, 0–100 teams and 0–100 games. A team requires id and label; its optional record is literal text up to 200 characters and may be empty. A game requires id, label, competition, nullable `startsAt`, two team IDs, status, nullable scores and an explicit outcome. Status is scheduled/live/final/postponed/cancelled/unknown; outcome is home-win/away-win/draw/unknown.

Domain IDs use strict `suppliedKey`: ASCII letter/underscore followed by up to 79 ASCII letters/digits/underscore/dot/hyphen; no final newline. Optional node IDs retain the shared 1–200-character field and document-wide uniqueness. Short text is 1–200 characters without a separate trim/nonblank check; whitespace-only labels, competition, optional period/clock/venue, soccer minute/player and source labels are structurally accepted. Description (≤3000), notes (≤2000, or ≤1000 for events) and team record may be empty. Unknown optional short values should be omitted rather than the empty string.

Scores, NBA leader points/rebounds/assists and football event points are integers 0–1,000,000 or null. NBA periods contain 0–20 rows and leaders 0–8; soccer events and football events contain 0–120 rows; football periods contain 0–24. Soccer `aggregate` and `penalties` are required, each null or a pair of nullable supplied scores. Football `possessionTeamId` and `situation` are required but nullable. A non-null situation requires nullable down (1–4), distance (0–100) and ballOn (short text). No value is reconstructed from other fields.

## Semantic checks and deliberate exceptions

- Team IDs and game IDs are unique in their own lists. Each game references two different supplied teams. NBA period IDs and leader IDs are independently unique within that game; leader team IDs must be one of its participants.
- Soccer event IDs are unique within a game. A non-null event team ID must be a participant. Minute is supplied text, not a parsed time or sort key.
- Football period IDs and event IDs are independently unique within a game. Each (kind, number) pair is unique; quarter numbers are 1–4, overtime numbers 1–20. Nullable possession/event team IDs must be participants. A non-null event period ID must reference a period in that same game.
- Non-null game starts and optional observation time must be real Gregorian minute timestamps, years 1000–9999, with `Z` or an offset through ±14:00. Seconds, fractions and final newlines are rejected. No freshness, chronological array order or observation/start relationship is required.
- Root and game sources require a label and safe absolute HTTP(S) URL. The timezone is checked even when games are empty.
- Unlike `sports/model`, these readers do not force scheduled scores to null, restrict outcomes to final games, reconcile outcome with scores, sum periods or event points, or infer overtime and scoring rules. Null, zero, inconsistent-but-supplied totals and supplied outcomes stay distinct. Team/event references and the finite ranges above still apply.

The self-contained original example is `examples/schema-modules/sports-match-scores.json`. Focused source/semantic checks are not browser, CI or real-data acceptance.
