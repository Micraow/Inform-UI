# Supplied ledger history contracts

These finite views use supplied data and local selection. They do not access accounts, execute transactions, fetch prices or infer financial advice. Full `validateDocument` is required after structural validation. Source registration does not update the runtime/CDN.

## Net worth

The maintained source is `scripts/net-worth-definitions.json`. Supplied values, changes and percentages keep the declared number/null types. Null is unknown, not zero; no reconciliation or currency conversion is inferred. `NET_WORTH_LABEL` checks exactly top-level label and interval label/changeWindow for trimmed nonblank text. Other strings keep schema constraints without a blanket trim check. Interval IDs are unique; initialIntervalId must refer to a supplied interval (`NET_WORTH_INTERVAL`). Every point date must be real Gregorian input date (`NET_WORTH_DATE`); dates strictly increase without duplicates within each interval (`NET_WORTH_ORDER`). No cross-interval ordering or value monotonicity is imposed. Optional source requires absolute HTTP(S) plus core safe-link policy (`UNSAFE_URL`). Masking conceals presentation, not source data. Local interval/cursor selection does not fetch more records.

## Fee interest

The maintained source is `scripts/fee-interest-definitions.json`. Amounts, totals, dates and conversion notes remain supplied, not calculated from display strings. `FEE_INTEREST_LABEL` checks exactly top-level label/showMoreLabel/showLessLabel/maskedLabel; range label/totalPaidLabel/totalStatusLabel/conversionNote/emptyLabel; row displayName/dateLabel/categoryLabel/accountDetail/amountLabel/maskedAmountLabel. Optional omitted fields stay legal; other text keeps structural constraints. Range IDs are unique and initialRangeId must exist (`FEE_INTEREST_RANGE`). Row IDs are unique inside each range (`FEE_INTEREST_TRANSACTION`), with reuse across ranges allowed. Source needs absolute HTTP(S) plus safe-link policy; truthy logoUrl uses image safety (`UNSAFE_URL`). Selection, expansion and masking are local. No fee sum, rate, tax or account status is inferred.
