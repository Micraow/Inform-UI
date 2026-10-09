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
