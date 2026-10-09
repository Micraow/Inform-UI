# Supplied ledger records candidate

Canonical IDs: ledger-accounts and ledger-recurring-transactions, both confirmed missing in the inventory and prior schema. Ownership is Finance. Planned behavior: account/institution/type filtering and explicit local visual balance reveal; supplied recurring record cadence/status/date filters and cancelable local reviewed marks. Amounts remain exact supplied decimal strings. No accounting totals, currency conversion, recurrence calculation, provider connection, transaction, payment or financial recommendation is implemented. All examples are synthetic.

## Exact amount representation

The shared money object is `{amount,currency}`. Amount is null or a strict signed decimal string with up to18 whole digits and18 fractional digits, preserving trailing zeros and negative zero; exponent notation, separators, plus signs, surrounding whitespace and numeric JSON amounts are rejected. Currency is an uppercase three-letter supplied label, not a registry lookup. Rendering never converts to Number, rounds, sums, normalizes sign/direction, reconciles balances or infers fees. Missing money differs from supplied unknown amount/currency.

## Accounts

Required label and 0–40 unique account snapshots `{id,label,institution,kind,status}`. Kind is cash/credit/investment/loan/other/unknown; status is active/closed/unknown. Optional balance, supplied observation timestamp, literal note/source, and a 1–4 alphanumeric suffix are supported. No full account number or connection credential field exists. Records may omit balances. All dates are validated as supplied Gregorian offset timestamps, never refreshed from a provider.

Balances are visually hidden by default unless initiallyRevealed is supplied. The explicit toggle preserves exact visible decimal text and retains focus. This is visual concealment only: data remains in the supplied document and page memory, and notes are not redacted. Search matches account label/institution/type, not hidden amounts. Institution/type/status filters combine; reset clears filters while preserving reveal state and native disclosure identity. Optional details are omitted when no extra context exists.

## Recurring records

Required label and 0–60 unique records `{id,label,cadence,status,direction}`. Cadence is weekly/monthly/yearly/other/unknown; status scheduled/paused/unknown; direction incoming/outgoing/unknown. Optional counterparty, exact estimated amount, real Gregorian nextDate, observation timestamp, note/source are preserved literally. These are supplied records, not a recurrence engine, transaction instruction or forecast. No current-time/overdue classification or next-date calculation occurs.

Text/cadence/status/available-month filters and a locally-unreviewed-only checkbox combine. Missing next dates are explicit. Source order remains unchanged. Optional initialReviewedIds must be unique supplied IDs. `iui:recurring-review` has frozen `{componentId,recordId,reviewed}`, bubbles/cancels locally and is noncomposed. Accepted clicks toggle only the local reviewed set; canceled clicks preserve it. Reentry, constructor/getter/listener interruption, disposal and actual ownership are guarded. When a focused row becomes hidden by the unreviewed filter, focus moves to the owned checkbox, including within a shadow root. Filter resets preserve local reviewed marks and never change supplied financial status.

## Safety and source integration

The shared reader guard handles observable composed ancestry, including exposed slots/shadow hosts, while retaining native disabled-fieldset semantics. Native resets handle cancellation, revision races and partial control movement. Paint/restore never mutates outside-owned rows/controls/balances; replacement/disposal retires listeners and queued work. Authored Forms submit bound inputs only, not account/recurring metadata. Sources are safe ordinary HTTP(S) links with noopener/noreferrer and no referrer. No bank connector, payment, cancellation, transfer, conversion, private asset or runtime service is used.

Source map: Finance schema generator/subset examples, ledger-records core inspector/wiring, ledger-records renderer/labels/wiring/CSS, public event type export, fixture, docs, unit/type/browser preparation and protocol count assertions. Current116 protocol types are not a canonical acceptance count. Generate/build/CDN are required after source integration. Generated artifacts remain preserved unstaged. Browser/visual/accessibility acceptance is unexecuted, and no provider acceptance is claimed.

## Local checkpoint evidence

The final ledger/existing-finance/shared-guard/Forms/core run passed 192/192 tests; selected schema ownership, Finance examples and CDN/source identity checks passed 3/3. Schema generation, build, no-emit TypeScript, public type consumer, CDN build, source boundary and prepared browser-spec syntax checks passed. Browser execution and visual/accessibility acceptance remain unexecuted. This source-only checkpoint excludes generated schema/CDN artifacts and does not change canonical accepted counts.
