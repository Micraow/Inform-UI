# Supplied boxscores

`nba-game-boxscore` renders supplied teams, totals, periods and player statistics. Search, team/starter filters and numeric sorting are local. `cricket-match-boxscore` renders supplied innings, batting and bowling tables with independent sort controls. Unknown values, ties and source-provided overs/rates are preserved; no cricket arithmetic, external providers or live-score requests are inferred.

Native form resets preserve local ownership and newer edits. Shared generation scopes protect reentrant input reads and late paints. Each table separately checks its original parent chain and retires interrupted work if its body is transferred. Rows and disclosures are reused during sorting.

Examples and structural/behavior contracts are in `examples/boxscores.json`, `tests/boxscores.test.mjs`, `tests/boxscores-generation.test.mjs`, and `tests/boxscores-types-consumer.mts`. Source text, labels and CSS restore the project-owned prior implementation. Native visual acceptance is tracked separately.

## Source selection and exact data validation

`sports/statistics` contains the two existing boxscore nodes and the two player-summary nodes, keeping their consecutive authored declarations and local scalar definitions unchanged. Its mandatory readings are this contract and `docs/player-summaries.md`; `travel/snapshots` supplies `TravelEventSource` and contributes its own dependency nodes. Selection is structural only and must be followed by the unchanged full `validateDocument`.

- Both boxscores require label, a supplied status (scheduled/live/final/postponed/cancelled/unknown) and exactly two distinct team IDs. Team IDs are unique in the node. NBA teams each contain 0–40 player rows; player IDs are unique within that team, not across teams. Cricket has 0–12 uniquely identified innings, each referencing a supplied team; batting and bowling row IDs are independently unique within that innings and may recur in other collections.
- Counts and NBA team/period scores are integers 0–1,000,000 or null. NBA plusMinus is an integer from -1,000,000 to 1,000,000 or null; starter is boolean or null. Cricket strikeRate/economy are numbers 0–1,000,000 or null. Required nullable values must be present; zero and unknown remain distinct.
- Supplied minutes, dismissal, overs and optional NBA shooting fields are strings of 1–200 characters or null. They are opaque text, not decimal overs or arithmetic expressions. NBA periods number 0–20; each has a short label and exactly two nullable scores in team order. Period labels need not be unique.
- Domain IDs use strict supplied keys with no final newline. Root/team/player/innings/period labels and source labels use short text (1–200); the inspectors do not trim or add nonblank checks. Whitespace-only short text remains accepted. Description (≤3000), statusText (≤1000), and notes (≤2000) may be empty. Optional authored node IDs retain shared node-ID/document uniqueness rules.
- Optional observation time must be a real Gregorian minute timestamp, years 1000–9999, with `Z` or offset through ±14:00; no seconds, fractions or trailing newline. Root, player, innings, batting and bowling sources require safe absolute HTTP(S) URLs. The schema does not allow team-level sources.
- No status/score relationship, team/period/player sum, innings-total/extras consistency, wickets cap of ten, strike-rate/economy formula or overs parsing is imposed. This preserves the original supplied-data contract rather than introducing sport-specific rules.
