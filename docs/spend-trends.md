# Supplied monthly spending trends

This is an original extension to the existing category-label reader. It does not access accounts, calculate an average, accumulate a monthly total, or execute a financial action. Reference-informed functional facts are expressed through the library's independent typed contract. No captured runtime is included.

## Data

Existing `label`, `periodLabel`, `totalLabel`, and `categories` remain required. Supply `categories: []` for a trend-only document. Without `months` the original category reader remains unchanged.

`months` supplies 1–24 records, ordered newest to oldest for the `previous` comparison. Every record has `id`, `label`, `totalValue: number | null`, `totalLabel: string | null`, `dayCount` (1–31), and `points` (0–32). Each point supplies `day` (0–31), numeric `value` or null, and display `label` or null. Days must strictly increase within the supplied month. Optional `groupLabel` groups the month menu. A `current: true` record requires explicit `daysElapsed`; future observations are unavailable. Empty and null series remain unknown, while genuine zero and negative values remain visible.

Optional `averageSeries` and `previousSeries` use the same record shape. `selectedMonth` chooses a supplied ID. `comparison` is `previous`, `average`, or another supplied month ID. Previous means the next record in `months`, or the explicit `previousSeries` for the oldest record. Average requires an explicit `averageSeries`. A selected month cannot compare with itself; changing into the comparison month resets comparison to previous. IDs `previous` and `average` are reserved for those controls.

Labels and totals remain exactly supplied. For a current summary, comparison uses the exact supplied point at `daysElapsed`; for historical summaries it uses the comparison's supplied total. Missing matching days remain unknown. The optional visible difference is ordinary numeric subtraction, rounded to two decimals, without currency inference. It does not sum or interpolate display values. `previousLabel` and `averageLabel` customize control text.

## Chart and interaction

An independently implemented shape-preserving cubic curve uses actual day spacing and splits at null values. Selected data uses a green area and line; comparison data uses a neutral line, with a separate lighter future portion where applicable. The chart is235px at renderer container widths576px and above,199px below. Month and comparison selects use native keyboard behavior and supplied optgroups.

Pointer inspection selects the nearest day, preserving unknown gaps; day zero and future current-month days return to the month summary. Unmodified Left/Right/Home/End inspect valid day positions, Escape restores the summary. Modified, canceled and IME keyboard events remain host-owned. Changing either selection clears the inspected day. Privacy masking hides labels, differences and numeric geometry. This deliberate local privacy policy is stronger than hiding only axis labels.

Native form reset uses the existing shared reset lifecycle: cancellation preserves selections, and newer input takes precedence. Component ownership is permanent after an observed removal, and old controls cannot update a later mount. No new resource observer or account service is introduced.

`status` supports resolved, pending and failed; pending has a300px placeholder. Failed uses optional literal `fallback`, otherwise hides the reader. `hasConnectedAccounts: false` shows `noAccountsLabel` without offering a fictitious connection action.

## Validation boundary

This source checkpoint is tested with original supplied fixtures and DOM/geometry contracts. Reference pixels, real pointer geometry and fresh native browser execution remain separate acceptance work. The packaged CDN is still unified154 until explicitly rebuilt. Canonical promotion requires independent complete-function review.
