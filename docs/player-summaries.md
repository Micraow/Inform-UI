# Supplied player summaries

Original Sports readers for the canonical `nba-player-summary` and `tennis-player-summary` inventory entries. Both were missing from the generator and renderer before this cohort. They are local supplied-data readers, not league integrations, live player profiles, sports forecasts, calculated averages or reconstructed reference implementations. Examples contain fictional players and teams. No external assets, private runtime or OpenAI dependency is introduced.

## Contract

Each node requires a label, player name and 0–100 records. Optional description, observation timestamp and root/record sources remain literal. Record IDs are unique. Observation timestamps must be real Gregorian dates with explicit offsets. Source URLs must be safe absolute HTTP(S). Sources open only on normal user activation, in a new tab with no opener or referrer.

Basketball records require id, supplied season/period label, nullable team, scope (regular-season/playoffs/preseason/other/unknown), games and four per-game fields: minutes, points, rebounds and assists. All numeric fields require a supplied number or explicit null. Counts are nonnegative integers bounded at 1,000,000; per-game values are nonnegative numbers bounded at 10,000. The reader never divides totals, derives averages or assigns a team.

Tennis records require id, season/period label, surface (hard/clay/grass/carpet/other/unknown), matches, wins, losses, titles and rank. Counts are bounded nonnegative integers or null; rank is 1–1,000,000 or null. No ranking calculation, scoring system or wins-plus-losses consistency rule is inferred. Different supplied scopes can legitimately have different totals; callers are responsible for their source semantics. Duplicate period labels are permitted.

## Local interactions

Search matches supplied period labels, basketball teams and record notes. Period and scope/surface filters combine with search. Period choices preserve source order and use internal option IDs, so arbitrary labels cannot collide with “All”. Sorting offers source order, deterministic case-insensitive period-label text order and numeric columns. Numeric metrics sort descending except tennis rank, which sorts ascending. Missing values sort last in either direction; ties preserve source order. Period text sorting does not claim chronology. Sorting never recomputes supplied values.

Native details preserve disclosure state and DOM identity when rows move. Table column headers show the active aria-sort. Empty, missing and zero values remain distinct. Numeric precision is ordinary JavaScript number precision; formatting does not preserve trailing decimal zeros. The horizontal table scroll keeps data in a semantic table at narrow widths. Touch-sized controls, theme tokens, English/Chinese labels, direction-auto content, reduced-motion compatibility and forced-color rules are provided; actual visual/accessibility acceptance remains pending.

Filters are unnamed, local and excluded from authored Forms state. Explicit reset returns source order and clears filters; native parent-form resets reconcile only after cancellation and newer edits settle. Hidden/inert/disabled composed ancestors, moved controls, partial form ownership and disposal are handled by the shared reader controls. Rows moved out of their original tbody are neither reclaimed nor repainted, even if still within the component. There are no custom selection/action events, provider calls, clocks, alarms, media loads or background work.

## Evidence boundary

Source schema/type recognition and local interaction tests do not imply canonical or browser acceptance. Generated schema/CDN output is preserved separately from hand-authored source commits. The current formal accepted inventory remains 53/256. Browser cases are prepared for light/dark, three widths, keyboard, touch, native reset, Chinese/RTL, forced colors and offline/no-request checks. The environment’s system Chromium launch is already confirmed blocked before execution by Unix-socket permissions; it is not retried or bypassed here.

## Local source checkpoint

The focused interaction/semantic suite passes 57/57. Generation, JavaScript bundles, CDN build, no-emit TypeScript, public type consumers and source-boundary checks pass. Eight browser scenarios parse and enumerate; none is executed or accepted. Full aggregate checks run separately and are not represented by the focused pass. The hand-authored checkpoint excludes generated schema/CDN artifacts, which must be regenerated after integration.

## Recovery124 source checkpoint

NBA and tennis domain modules and schema definitions come from exact recovered130 source803b8dada4bc672656f55a8eca36cb0f103d23c7 (asset2d63ac79c00ff52d753f1b16bf2338856bab1b26). Historical examples, documentation and tests come from publicb3efe3816e875f905f7eca70983d70d54c5b3f25. Shared entry files are updated only with these two registrations. The130 direct table/body/row/header ownership corrections are included before new generation checks. No complete historical143 restoration or native visual acceptance is claimed.

The initial original57 checks passed; eight new generation/owner/reset negative controls initially failed. The restored readers now reuse a small supplied-reader lifecycle adapter extracted without behavioral changes from the finalized Ledger122 helper. Player restore, row updates/reordering and header writes use per-host generation checks with paint tickets, preserving the130 direct-parent guards. The eight negatives now pass; four additional transferred-table/late-row-append checks pass. Combined Player and Ledger checks132/132; types pass.

Read-side reentry is separately guarded: a shared input ticket prevents a stale value getter from committing after a newer event. Two Player and two Ledger getter negative controls turned green; combined affected checks137/137. This is distinct from the paint ticket that compensates late setter writes.

Final common reset integration uses the compatible readerNativeReset successorb9b68988bc2088941414f65018ed35726bacfcd6. The extracted duplicate reset body was removed; both restored domains now call the shared implementation through a re-export. Reader blocking semantics remain unchanged.

## Source-module precision

`sports/statistics` owns these two existing summary nodes together with the two consecutive boxscore declarations. Both this contract and `docs/boxscores.md` are mandatory readings. The `travel/snapshots` dependency supplies `TravelEventSource`; dependency nodes are included in the selected manifest. Selection does not replace the unchanged full `validateDocument`.

Record IDs use strict supplied keys: ASCII letter/underscore followed by up to 79 ASCII letters/digits/underscore/dot/hyphen, with no trailing newline. They are unique only within their node. Optional authored node IDs retain the shared 1–200-character field and document-wide uniqueness. Label, player, season, non-null basketball team and source label have structural length 1–200; the inspectors do not trim or impose additional nonblank checks. Whitespace-only short text therefore remains accepted. Optional description (≤3000) and record notes (≤2000) may be empty. No season-label parsing, record-time ordering or distinct-season rule is added.

Observation timestamps use the strict shared minute format: real Gregorian years 1000–9999 with `Z` or offsets through ±14:00; no seconds, fractions or final newline. Sources require safe absolute HTTP(S). All required numeric fields remain explicitly nullable with the ranges above. A tennis row may have wins plus losses unequal to matches, titles exceeding wins, or an unknown rank; basketball per-game values do not imply a minimum games count. No averages, chronology, roster membership, ranking or cross-record totals are inferred.
