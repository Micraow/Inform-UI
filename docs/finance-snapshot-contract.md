# Supplied finance snapshot source contract

This is the mandatory semantic contract for `finance/snapshots` and its source helper. These are the existing `finance-quote`, `finance-chart`, `finance-comparison` and `finance-heatmap` nodes. Source migration adds no market service, trade, financial recommendation or rule. Examples are original synthetic data. Run full `validateDocument` after selected structural validation; loading/error presentations do not bypass validation of supplied records.

## Source and literal text

`FinanceSource` requires `label` and `synthetic`; `url` is optional. The literal `synthetic` flag describes the supplied source, not a verified provenance claim. A nonempty URL must pass the existing safe-link policy (`UNSAFE_URL`). Omitted URL and the empty string are valid; a whitespace URL is not. There is no blanket `trim()` rule on finance display strings: schema-valid whitespace-only titles, source labels, names, symbols, range labels, sector, weightLabel, changeBasis and messages retain their existing behavior. Time zones and timestamps have the specific checks below. Do not impose the stricter label rules of later ledger display families here.

Prices, previous closes and heatmap weights are nonnegative finite numbers or explicit null. Zero is known data; null means missing. Currency is the existing three-capital-letter pattern, not a currency registry or conversion request. Optional component `id` remains a document-wide node identifier; record IDs have the collection scopes below. No new ID normalization or pattern tightening is introduced. In particular, legacy finance currency/record-key patterns retain their existing end-anchor behavior; the stricter exact-end currency/supplied-key patterns of later ledger records are not substituted here.

## Instruments, history and comparison

Instrument time zones, and optional comparison timezone, must be recognized by `Intl.DateTimeFormat` (`TIMEZONE`). Snapshot `asOf`, history `time`, comparison `baselineAt`, and range endpoints must have real Gregorian dates and a parseable explicit-offset timestamp under the existing timestamp parser (`FINANCE_DATE`, `FINANCE_ORDER`, `FINANCE_RANGE`). This is distinct from the minute-only `flightAt` contract used by later ledger records.

History has at most 500 points. Compare actual offset-adjusted instants: history is strictly increasing and unique, with no point after its instrument's `asOf`. Equal wall labels with different offsets are not necessarily equal instants. Instrument IDs are unique within the 2–6 instrument comparison, and range IDs are unique within their list (`FINANCE_ID`). Each range includes its endpoints, may have equal endpoints, and must have from <= to. `initialRange` must name a supplied range (`FINANCE_RANGE`). Empty ranges select the supplied observations without fetching more.

A comparison normalizes only against a positive supplied history price at exactly `baselineAt`. Missing, null or zero baselines remain valid but incomparable; never substitute a nearby observation. Equal offset-adjusted instants match. The baseline need not lie within the displayed range or be present in every series. A known positive previous close is required for a quote's percentage change. Derived quote and normalization percentages must stay finite (`FINANCE_VALUE`). Different currencies are not converted or placed on a common absolute-price axis.

Market status and delay are literal source declarations. No clock-driven market-status inference or real-time guarantee follows from zero declared delay. Null observations split lines. Range/series selection and cursor inspection are local; hiding a series does not remove supplied table records. An update replaces the snapshot; disposal retires its controls. These source modules do not alter that runtime.

## Heatmap

Overall timezone and `asOf` must be valid. Every cell has a unique ID (`FINANCE_ID`), valid snapshot instant no later than the overall `asOf` (`FINANCE_DATE`), and required source-declared status/delay. `initialSector` must exactly match a supplied cell sector (`FINANCE_FILTER`), including when status is loading/error.

Area uses positive known weights supplied in a common unit, not price or an inferred exchange rate. Zero/null or too-small-to-draw weights receive no fabricated area; all records remain in the table. Color uses the supplied finite `changePercent` or null, independently of weight and price. Saturation at ±10% does not change the displayed original value. Missing change and zero are neutral but distinct values. Sector filtering, keyboard inspection and table expansion are local only.

The [finance behavior guide](finance.md) and [heatmap guide](heatmap.md) provide presentation/history context. Those links do not enlarge the mandatory semantic reading set or claim a new browser, CDN or visual acceptance run.
