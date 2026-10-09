# Supplied ledger views

`asset-distribution` and `transaction-list` are bounded local views in the finance schema domain. They render supplied literal records. They do not connect to an account, fetch data, trade, transfer funds, pay, infer settlement, provide financial advice, or convert currencies. Currency codes are exactly three uppercase ASCII letters treated as supplied display labels, not verified currency metadata. Example: [original synthetic fixture](../examples/finance-lists.json).

## Asset distribution

Required `label` (1–200 characters) and `accounts` (0–40). Optional `description` (up to 2000), `observedAt` (1–200, exact supplied observation label, not interpreted as a date), and `source: {label, url}`. Each account has unique `id`, `name`, required `amount` (`null` or a finite number from 0 to 1e12) and `currency`; optional `category` and `note` (up to 2000).

Currency groups and records keep first-encounter/source order. Each group has an accessible exact-value table, supplied account count, unknown count, and known-only subtotal. Unknown amounts remain visible and are excluded from subtotal arithmetic and decorative shares. All-unknown subtotal is unavailable. Known zeros remain zero; all-zero groups have no fabricated percentage distribution. There is no cross-currency total. Multiple currencies enable a native local currency selector; a single currency does not need one.

Raw values use the supplied number's shortest JavaScript decimal representation; negative zero is displayed as zero. The subtotal adds those decimal representations without introducing a rounding-to-cents policy. Scientific notation and tiny positive values remain valid. This is display arithmetic, not accounting-grade reconciliation. Decorative widths normalize positive known amounts by their maximum first, so subnormal values and maximum inputs do not cause nonfinite geometry. Labels and the complete exact-value table carry the meaning independently of colors or bar width. No percentage is assigned to missing values.

## Transaction list

Required `label` and `transactions` (0–100). Optional `description` and `source`. Each transaction has unique `id`, real Gregorian `date` (`YYYY-MM-DD`, years 1000–9999), `description` (1–1000), nonnegative finite `amount` (0–1e12), `currency`, and `direction: "debit" | "credit"`. Optional `status: "pending" | "posted"`, `counterparty`, and `note`.

Dates remain exact strings; amounts are magnitudes with a separate explicit direction. Absent status is labeled as not supplied. There is no inferred sign, running balance, total across currencies, time-zone conversion, clock-dependent state, sorting, or provider search. Repeated dates/descriptions/amounts are valid. Optional supplied counterparty/note values use native details disclosures. Status is only a supplied label, never a settlement guarantee.

Direction and month selectors jointly hide mounted rows. Month options retain encounter order. Counts report visible/supplied records, and no-match/empty states are explicit. Reset filters is a native button that keeps focus at the All boundary. Tables are contained in labeled, keyboard-focusable horizontal scroll regions at narrow widths; the page does not require horizontal scrolling.

## Lifecycle, accessibility and external forms

Controls have native labels and no names or Forms bindings. Filtering preserves row/disclosure identity, open details and focused controls. Unrelated state updates preserve local choices; document replacement resets them. Inherited disabled and pending-form fieldsets, hidden and inert ancestors block forged filter/reset actions, while details and safe source links remain reading affordances. Form snapshots and native FormData contain no ledger fields.

An ordinary containing native form reset returns filters to All and synchronizes visibility after the browser's default action. Cancelled resets retain the current filters. If a filter is disabled, reset retains the prior local filter and restores matching native values. The owner-document reset capture listener is removed on update/dispose; queued resets check that the original component remains live and contained. No timers, storage, network access, mutation observers, host events or callbacks are used.

All content is literal text. Source links pass structural and semantic HTTP(S) URL validation, open in a new tab with `noopener noreferrer`, and use `no-referrer`. Internal IDs are generated outside the authored namespace. English/Chinese labels, logical CSS, forced-colors fallback, reduced-motion-compatible static content and explicit missing/direction/status text are included.

## Verification scope

Node/JSDOM public, schema-negative, lifecycle, exact-decimal, grouping, Forms, safe-link and owner-document tests are executable in `tests/finance-lists.test.mjs`; public type checks are in `tests/finance-lists-types-consumer.mts`. Browser acceptance scenarios in `tests/browser/finance-lists.spec.mjs` are **prepared, unexecuted** in this isolated handoff. They cover light/dark 390/768/1100 widths, native pointer/keyboard/touch, repeat reset boundary, offline behavior, RTL, forced colors, scrolling, pending Forms and lifecycle. No real-browser, visual, screen-reader or provider behavior is claimed by these prepared specifications.
