# Supplied basketball and cricket boxscores

Original Sports implementations for the previously missing `nba-game-boxscore` and `cricket-match-boxscore` canonical entries. These are local supplied-data readers, with no league feed, inferred result, totals, averages, rankings, clock, provider action or remote asset. Fictional fixture players and teams are original. The implementation does not reproduce private runtime code or claim visual equivalence to an unavailable reference.

## Shared match contract

Each node requires a label, explicit supplied status (scheduled/live/final/postponed/cancelled/unknown) and exactly two uniquely identified teams. “Live” is only a supplied string; the reader never infers or refreshes it. Optional description/statusText, observation timestamp and source remain literal. Observation timestamps require a real Gregorian date with an explicit offset. Sources must be safe absolute HTTP(S); ordinary user-activated links open in a new tab with no opener or referrer.

All counts are nonnegative integers up to 1,000,000 or explicit null. Missing and zero values remain distinct. No consistency between source rows and source totals is imposed. Precision is ordinary JavaScript number precision; trailing numeric zeros are not preserved.

## Basketball

Each team supplies id, label, nullable total score and 0–40 player rows, optionally a note. Player IDs are unique within their team; the same ID is permitted in a different team's independent source collection. Each player supplies label, starter flag (true/false/null), minutes (opaque string/null), points, rebounds, assists, steals, blocks, turnovers, and plus/minus (integer from -1,000,000 to 1,000,000 or null). Optional field-goal, three-pointer and free-throw strings are opaque supplied text, not calculated ratios. Optional note/source stay in native disclosures.

The 0–20 period records provide a label and exactly two nullable scores, in the same order as the teams. No total is summed, and the first team is not inferred to be home/away or the winner. A native period disclosure remains stable during local filters and reset.

Player search (name/team/note), team and starter-role filters combine. Every numeric player field can be sorted descending; ties retain source order and unknowns remain last. Reset clears filters and restores the original flattened team/player order. No player-selection/action event is emitted.

## Cricket

The 0–12 supplied innings have unique id, label, a supplied teamId, runs, wickets, overs, extras and 0–30 batting plus 0–30 bowling rows. The teamId must reference one of the two teams. Overs are opaque strings or null, never decimal numbers to be added or converted. No innings ordering, completion, result, legal-ball count or target is inferred.

Batting rows require id/name, nullable dismissal text, runs, balls, fours, sixes and supplied strike rate. Bowling rows require id/name, nullable overs text, maidens, runs, wickets and supplied economy. Rates are nonnegative numbers up to 1,000,000 or null. Rates are never calculated, even from zero denominators or apparently inconsistent totals. IDs are unique within each batting or bowling collection; reuse across innings or roles is allowed.

The reader defaults to the first supplied innings, preserves source ordering and exposes an explicit empty state. An innings selector, shared player/dismissal/note search and separate batting/bowling numeric sorts operate locally. Bowling runs/economy sort ascending; other numeric columns sort descending. Missing values remain last and ties remain stable. Native details and rows preserve identity when changing innings or order.

## Lifecycle and ownership

Filters are unnamed and excluded from authored Forms values. Pending Forms disable local filters. Native form reset is reconciled after cancellation and newer edits; partial control movement preserves retained local values. Shared composed-tree guards honor hidden/inert/native-disabled ancestry, shadow roots and native first-legend semantics. Disposal retires listeners and queued resets. Value restoration rechecks disposal before painting.

Sorting never reclaims or repaints rows moved out of their original tbody. The table/body/scroll ownership chain is checked, including an entire tbody moved elsewhere inside the component. A cricket innings panel moved out of its original list is also left untouched. Source text is literal; no `innerHTML` is used for record content.

Tables are semantic, include captions and active aria-sort, and use named keyboard-focusable scroll regions. Touch-sized controls, English/Chinese labels, direction-auto content, declared theme tokens and forced-color/reduced-motion compatibility are included. Browser/visual/accessibility acceptance remains pending.

## Verification boundary

This source-only cohort excludes generated schema/CDN artifacts and does not change formal accepted inventory (53/256). Run the affected boxscore, player, sports, Forms, shared-reader and core tests; schema examples/ownership, generation, build, CDN, public types and source-boundary checks accompany integration. Full aggregate verification belongs to the combined integration branch. Browser cases are prepared but are not run again after the confirmed system Chromium Unix-socket permission denial; no limitation is bypassed. No CI is launched by this cohort.

## Local source checkpoint

Affected regression run: 237/237 tests pass, covering the 71 boxscore cases plus existing player, sports, shared composed ancestry, Forms and core behavior. Targeted schema ownership/domain-example/CDN identity checks pass 3/3. Schema generation, JavaScript/CDN builds, no-emit TypeScript, public type consumers, source boundary and eight-case browser discovery pass. No full aggregate or browser execution is claimed for this cohort; final aggregate verification is intentionally deferred to the combined integration branch.
