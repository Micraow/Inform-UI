# Supplied tournament and election results

Original local readers for `basketball-tournament` and `election-results`. The fixtures contain fictional teams, candidates, affiliations and locations. No live feed, provider adapter, private runtime or external image is used, and no visual equivalence to an unavailable reference is claimed.

## Shared contract

Each node requires a label and its supplied collections. Optional description, observation timestamp and source are literal source data. A timestamp must be a real Gregorian date with an explicit offset. Sources must be safe absolute HTTP(S) URLs; only user-activated links leave the page, opening a new tab without opener or referrer. Source text is created as text nodes, never interpreted as HTML.

Null is distinct from zero. Counts and percentages are not reconciled, estimated or derived. Trailing numeric zeros follow ordinary JavaScript number formatting. Search/filter/sort/reset are local reader controls, unnamed and excluded from authored Forms values. They emit no selection, voting, donation, scoring, advancement or provider action.

## Basketball tournament

The node supplies 0–128 teams and 0–12 ordered rounds, each containing 0–32 matches. Teams, rounds and matches have IDs and labels. Team IDs and round IDs are unique in their respective collections; match IDs are unique across the tournament.

A match has exactly two participant slots. A known participant references a supplied team; the same known team cannot occupy both slots. Null means an unknown participant, optionally described by a literal placeholder. Each score is an integer from 0 to 1,000,000 or explicit null. A supplied winner is a known participant's team ID or explicit null. An optional `advancesTo` references a match in a later supplied round, with no automatic propagation into that match.

Supplied statuses are scheduled, live, final, postponed, cancelled and unknown. “Live” is a source label with no polling or clock. A tied score, final status, larger score or progression pointer never establishes a winner. Winner labels remain exactly supplied even if they disagree with scores. Empty rounds and unknown later-round slots are explicit.

Search matches match labels and participant names/placeholders. Round, team and status filters combine; reset restores all matches. Native match-note disclosures preserve identity and open state. Rounds are ordered semantic sections containing match lists inside a named keyboard-focusable horizontal scroll region. The layout is an original round/card board, not a bracket-line diagram.

## Election results

The node supplies 0–40 contests, each with 0–50 candidates. Contest IDs are unique; candidate IDs are unique within each contest but may recur in a different independent contest. Each contest provides a label, status, reported percentage, total votes and candidates. Statuses are pending, counting, complete, recount and unknown.

Votes and total votes are nonnegative safe integers up to 9,007,199,254,740,991 or explicit null. Reported percentages and candidate vote shares are numbers from 0 to 100 or explicit null. A candidate supplies an outcome of elected, not-elected or unknown, separately from votes and contest status. Optional affiliation, notes, sources and observation time remain supplied text. The reader never predicts winners, adds votes, computes shares, reconciles a candidate list against a total, or converts a reported percentage to completion.

The first supplied contest is selected initially. Search matches candidate names and supplied affiliations; outcome filtering combines with the contest. Source order, name, votes and vote-share ordering are local. Numeric order is descending with unknown values last; all ties retain source order. Reset returns to the first contest and source order. Semantic tables have captions, row/column headings and active `aria-sort`; a labeled meter appears only for a supplied reported percentage. Native context disclosures and candidate rows retain identity while sorting.

## Lifecycle and accessibility boundary

Local controls honor hidden/inert composed ancestry, shadow roots, native disabled fieldsets and the first-legend exception. Native form reset waits for cancellation and newer edits, restores retained local edits if a control has moved, and retires safely on disposal. No reset callback or repaint can revive a disposed instance.

Exact toolbar/control and collection/table/row ownership is checked. Host-moved controls or collections are not reclaimed or repainted, including movement inside the original component. Native reset after partial movement preserves retained local filter values. Sorting only touches rows still in their original tbody and intact table/scroll/contest chain.

English and Chinese labels, direction-auto content, 44px controls, focus-visible outlines, declared theme tokens and forced-color styles are included. Real browser, keyboard, touch, visual and accessibility acceptance remains pending; DOM tests and prepared browser cases are not substitutes for it.

## Integration and verification

`npm run generate` owns full schema, standalone validator, public types and discovery fragments. The tournament belongs to `sports`; election results belongs to `base`. `examples/basketball-tournament.json` and `examples/election-results.json` are registered in their respective groups. This source tree recognizes 124 protocol node names; that is not 124 accepted components. Formal acceptance remains 53/256.

This cohort uses source-only local commits and preserves generated schema/CDN/dist separately for recovery. Integrators must regenerate from the final combined source, rather than overlay output from another tree. Focused gates precede one final combined aggregate check. No push or CI run is part of this cohort. Browser cases are prepared for light/dark, three widths, keyboard, touch, native reset, Chinese/RTL, forced colors and no-request operation. Browser execution is not retried after the previously confirmed system Chromium Unix-socket permission denial.

## Local source checkpoint

The focused source suite passes 87/87 tests. The affected regression run passes 313/313 tests across supplied results (86 cases before the final explicit zero-score case), boxscores, player summaries, sports, Forms, core and composed ancestry. The final zero-score case then passes in the 87-case focused rerun. CDN ESM/global entrypoints pass four additional current-fixture validation/render/filter/reset tests in JSDOM; these are not real-browser tests.

Three targeted schema ownership/domain-example/CDN identity checks and two CDN integrity/public-contract checks pass. Generation, JavaScript/CDN builds, no-emit TypeScript, public type consumers, source boundary, diff whitespace checks and discovery of eight browser scenarios pass. The prior browser startup denial remains a blocker, and no real browser result, screenshot acceptance, full aggregate, CI, publication or new canonical acceptance is claimed here.
