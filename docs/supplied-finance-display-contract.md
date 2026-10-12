# Supplied income, spending and upcoming contracts

These existing finite readers display caller-supplied text and local selections. They do not fetch accounts, predict payments, execute transactions or interpret display labels as monetary amounts or dates. Examples are original fictional data. Always run the unchanged full `validateDocument` after structural selection. Loading/failed/disconnected presentations do not bypass validation of fields that are present. Global component IDs remain document-wide; all other ID scopes are stated below.

## Income

`ledger-income-tracker` requires `label` and `hasIncome`. When `hasIncome` is true, `estimatedMonthlyIncomeLabel` and `incomeSourcesLabel` must also be present. `INCOME_LABEL` applies `trim()` nonblank checks exactly to supplied `label`, `subtitle`, `estimatedMonthlyIncomeLabel`, `incomeSourcesLabel`, `emptyLabel`, `maskedLabel`, `estimatedLabel`, `nextPaycheckLabel`, `recurringIncomeLabel`, `noUpcomingLabel`, and `dateUnavailableLabel`. Optional fields may be omitted, but supplied empty/whitespace values fail. A false `hasIncome` does not exempt supplied invalid fields.

`nextPaycheck` may be omitted, null, or an object with no required fields. Each supplied non-null `name`, `amountLabel`, `nextPayment`, `frequency`, and `accountDetail` must be nonblank (`INCOME_LABEL`); null and omission remain unknown, including an empty object. `logoUrl` must satisfy the safe-image policy for absolute HTTP(S) or supported inline raster images (`UNSAFE_URL`), even if the no-income presentation would hide it. Optional source follows the [ledger source contract](ledger-source-contract.md#source); source label is not part of the income trim list.

Labels remain exact, with no income sum, amount rounding or date parsing. A null next paycheck displays no-upcoming text; missing/null next-payment text uses date-unavailable text. `hasIncome:false` renders its no-income message without estimating anything. Masking visually replaces known amounts, while a null paycheck amount remains absent. The supplied document still contains its data. This reader emits no financial operation; optional images use the existing owned image lifecycle.

## Spending

`ledger-spend-so-far-this-month` requires label, periodLabel, totalLabel (text or null), and 0–24 categories. `SPEND_LABEL` checks only top-level `label`, `periodLabel`, non-null `totalLabel`; each category `label` and non-null `amountLabel`; each supplied series `label`; and each non-null point `label`. This is not a blanket trim rule: optional comparison/fallback/masking/control labels, series `totalLabel` and `groupLabel` retain their structural constraints without an added trim check. Null display amounts remain unknown, not zero.

Category IDs are unique within categories (`SPEND_ID`). Fractions independently range 0–1 or null and need not sum to one; totals and display labels are never derived from category bars. Masking hides known amounts and numeric geometry; null and genuine zero stay distinct. Local category activation emits frozen, bubbling, cancelable, non-composed `iui:spend-category` detail `{id}`, without navigation or account operations.

Optional months contain 1–24 supplied records. Month IDs are unique and may not be `previous` or `average` (`SPEND_MONTH_ID`). `selectedMonth` must name one (`SPEND_MONTH`). `comparison` must name a supplied month, `previous`, or `average`; average requires `averageSeries`, and the selected/default-first month cannot compare with itself (`SPEND_COMPARISON`). Previous without a supplied predecessor is legal and remains unavailable. Helper series IDs are not checked against the months list; there is no extra global series-ID uniqueness rule.

Each series has dayCount 1–31, up to 32 points and independently supplied finite numeric values/totals or null. Point days strictly increase and cannot exceed dayCount; day zero is legal. `current:true` requires daysElapsed, which cannot exceed dayCount (`SPEND_DAY`). Future points after daysElapsed may still be supplied; the display treats them as unavailable rather than rejecting the schema. No monotonicity, sum, sign or consistency relation between numeric values and display labels is imposed. Current comparisons use an exact supplied point at daysElapsed, historical comparisons use supplied total values; missing points stay unknown, with no interpolation of display values or calculated average. A displayed difference uses the existing numeric subtraction/rounding behavior, not parsed money labels.

Local month/comparison controls and pointer/keyboard inspection preserve the existing behavior. Native reset restores supplied initial selection unless cancelled or superseded by newer input. Pending/failed/disconnected states remain supplied presentation data, not provider connection state.

## Upcoming

`ledger-upcoming-activity` requires a nonblank group label and 0–60 activities. `UPCOMING_LABEL` applies `trim()` to exactly that label and each supplied record's title, non-null amountLabel/dateLabel and optional accountLabel. Optional empty/masked/flow/expansion/fallback/no-account labels have only their structural constraints. Dates and amounts are literal labels, not parsed dates or calculated values. Null remains unknown; `amountUnknown` can explicitly preserve a supplied unknown label under masking. Safe supplied `iconSrc` uses the image policy (`UPCOMING_SOURCE`).

`UPCOMING_ID` checks activities locally. With flows, incoming and outgoing are separate; in each flow the top record cannot duplicate an ID in items or expandedItems, and each list itself must have unique IDs. IDs may repeat between items and expandedItems, between incoming and outgoing, or between legacy activities and flow lists. All supplied lists are checked, including inactive, collapsed, pending or failed data.

Flows require incoming/outgoing, each with items and optional top/expandedItems. Top stays first. Expansion replaces items only if expandedItems is longer; it never concatenates lists. A shorter/equal expanded list is ignored for display but still validated. The same-flow selection preserves expansion, changing flow collapses it, and update restores supplied initial state. Without flows, the original kind filter remains local.

Legacy detail emits frozen, bubbling, cancelable, non-composed `iui:upcoming-activity` `{id}`. Flow detail requires detailEnabled and emits `{id,flow}`. Acceptance does not execute a financial action. Native-reset cancellation and newer flow/expansion input win; detail is blocked while reset admission is pending. Owned images and row handlers retire with replacement/disposal. Masking is presentation concealment, not removal of the supplied data.

[Trend presentation](spend-trends.md) and [flow presentation](upcoming-flows.md) are supplemental. Source migration is not a new browser, CDN or visual acceptance claim.
