# Supplied tournament and election results

`results/supplied` owns the existing `basketball-tournament` and `election-results` declarations. It depends on `travel/snapshots` for `TravelEventSource`; selected manifests expose that dependency's nodes. The tournament keeps its historical sports output group and election its historical base group. The source module category does not change those wire groups. Run the unchanged full `validateDocument` after selected structural validation.

These are local supplied-data readers with search, filters, details and stable supplied-value ordering. They do not run elections, predict outcomes, fetch results, calculate vote shares, determine winners or advance a bracket. Local controls and reset preserve existing shared reader lifecycle/ownership behavior. Source links are passive until activation.

## Common fields

Root label and optional short labels (including party, participant placeholder and source label) are structurally 1–200 characters. The domain inspectors do not trim or add a nonblank requirement, so whitespace-only short values remain accepted. Optional descriptions (≤3000) and notes (≤2000) may be empty. Domain IDs use strict supplied keys: ASCII letter/underscore, then up to 79 ASCII letters/digits/underscore/dot/hyphen, no trailing newline. Optional node IDs use the shared node-ID field and document-wide uniqueness.

Every supplied source requires a label and safe absolute HTTP(S) URL. Optional root/contest observation times and match starts must be real Gregorian minute timestamps, years 1000–9999, with `Z` or offset up to ±14:00. Seconds/fractions/newlines are rejected. No observation/start freshness or ordering rule is added.

## Basketball tournament

- 0–128 teams and 0–12 rounds, each with 0–32 matches. Each match has exactly two participants, status and a required nullable winner. Participant team ID and score are required but nullable; score is an integer 0–1,000,000 or null. A placeholder is optional even when the participant is unknown.
- Team IDs and round IDs are unique within their lists. Match IDs are unique across all rounds. Known participant IDs must name supplied teams and may not repeat within a match; both participant slots may be unknown.
- A non-null winner must be one of the known participants. It need not be a final match, have the larger score or have known scores: those inferences are intentionally absent.
- Optional `advancesTo` must name a match in a strictly later supplied round. It cannot name a match in the same/earlier round or a missing match. It does not populate that target, require adjacent rounds, limit incoming edges or verify a winner/target participant relationship.

## Election results

- 0–40 contests and 0–50 candidates per contest. Contest IDs are unique within the node; candidate IDs are unique only within their contest and may recur elsewhere.
- Contest status is pending/counting/complete/recount/unknown. Reported percent and total votes are required, each nullable. Candidate votes, vote share and outcome are required; outcome is elected/not-elected/unknown.
- Counts are integers 0–9,007,199,254,740,991 or null. Percentages are numbers 0–100 or null. Fractions are allowed for percentages, not vote counts.
- Candidate vote sums, share sums, total-vote reconciliation, status/completeness relationships and elected counts are not validated or inferred. A declared complete contest can still contain unknown totals. Roots, contests and candidates each retain independently supplied sources.

`examples/schema-modules/supplied-results.json` is original fictional data. Source-module checks are not election-source verification, CI or native/browser acceptance.
