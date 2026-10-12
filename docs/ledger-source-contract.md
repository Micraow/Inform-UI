# Supplied ledger source contracts

These existing nodes display supplied records and bounded local review state. They do not connect accounts, transfer funds, charge, reconcile balances, infer schedules or convert currencies. Examples contain original fictional data. Selected structural schemas still require unchanged full `validateDocument`; component IDs are unique across the document, while record IDs use the scopes below.

## Source

`LedgerSource` is `{label,url}`. Its URL must pass the shared safe-link policy and be an absolute HTTP(S) destination (`UNSAFE_URL`); empty, relative, credential-bearing or unsafe destinations fail. Source labels keep their structural minimum length without an additional whitespace trim rule. The source object has no credential, provider endpoint or connection capability.

## Numeric lists

`asset-distribution` accepts 0–40 accounts with numeric nonnegative amounts <= 1e12 or null. `transaction-list` accepts 0–100 transactions with nonnegative numeric amounts <= 1e12, a supplied debit/credit direction and optional posted/pending status. Their currency labels are exactly three uppercase ASCII letters, with no trailing newline. IDs must be unique within the selected account/transaction list (`LEDGER_ID`), but may be reused in another component.

Transaction dates must be real Gregorian YYYY-MM-DD dates in years 1000–9999 (`LEDGER_DATE`). Asset `observedAt` is only supplied display text, not a timestamp parser input. Description, label, name, category, counterparty, note and source label have their structural string constraints only; these older lists do not add `trim()` nonblank checks. An optional empty description/note remains legal where its schema permits it. Numeric zero and null amounts differ. Assets are grouped by their exact currency label; presentation subtotals add only known bounded values within that currency using their shortest supplied decimal representations. Missing values stay unknown, with no exchange conversion, accounting reconciliation or inferred amount.

## Exact money

`LedgerExactMoney` is `{amount,currency}`. Amount is null or a signed decimal string: up to 18 whole digits and 18 fractional digits, an optional leading minus, no exponent, plus, separator, leading integer zeros, surrounding whitespace or newline. JSON numbers are rejected. The integer zero and negative zero are legal; trailing decimal zeros remain exact. Currency is exactly three uppercase ASCII letters, not a registry lookup. No rounding, arithmetic, sign/direction inference or conversion is performed on these strings. An omitted money object is different from a present money object with unknown amount.

## Exact records

`ledger-accounts` accepts 0–40 account snapshots. `ledger-recurring-transactions` accepts 0–60 supplied records. IDs are unique within each list (`LEDGER_RECORD_ID`); account and recurring lists may reuse an ID. Optional observation timestamps use the minute-only explicit-offset `flightAt` syntax with real Gregorian dates (`LEDGER_OBSERVATION`). Optional recurring `nextDate` is a real supplied date (`RECURRING_DATE`). No ordering between observations and next dates, current-time status or recurrence calculation is imposed. Optional `initialReviewedIds` must be unique and refer to supplied recurring IDs (`LEDGER_RECORD_ID`, `RECURRING_REVIEW_ID`).

Top-level and per-record sources obey the Source section. All label/institution/counterparty/note fields keep their structural constraints, without an added trim check. Account suffix is only 1–4 ASCII letters/digits; it is not a full account-number field. Missing balance, next date and observation remain missing.

Accounts visually hide balances by default. Reveal is local visual concealment only, not encryption or removal from the document. Search does not match hidden amounts. Filtering preserves supplied order; native reset clears filters while preserving reveal or local reviewed marks. The recurring reviewed control emits frozen, bubbling, cancelable, non-composed `iui:recurring-review` detail `{componentId,recordId,reviewed}`. Acceptance changes only its local reviewed set, never the supplied financial status. Cancellation preserves that set. Shared generation/ownership guards retire old controls on replacement/disposal; native-reset cancellation and newer input take precedence. Forms submit their bound fields, not these supplied financial records.

## Category correction

`ledger-low-confidence-category-correction` is the existing explicit review flow, not the distinct legacy correction display. It accepts a supplied snapshot ID, up to 40 categories and 60 transactions. Category IDs and transaction IDs are each unique within their own list (`CORRECTION_ID`); the two namespaces may reuse a value. Non-null original/suggested category IDs must refer to a supplied category (`CORRECTION_CATEGORY`). Transaction date is null or a real Gregorian supplied date (`CORRECTION_DATE`). Confidence is independently supplied 0–1 or null; it is not computed or used to auto-select a category. Money uses Exact money. Labels and notes keep structural constraints, with no extra trim rule.

Selection creates a local draft. Choosing the existing category makes no change; undo/reset clear local choices. Review shows an explicit preview; edits invalidate the reviewed revision. Confirm emits a frozen, bubbling, cancelable, non-composed `iui:ledger-category-correction` detail `{componentId,snapshotId,changes}`; each change is `{transactionId,fromCategoryId,toCategoryId}`. Cancellation preserves the draft; an accepted revision is acknowledged locally and not re-emitted until a newer reviewed draft exists. Nothing is saved to an account. Close preserves the draft. Reset cancellation, newer input, disabled/hidden/inert controls and ownership/generation boundaries retain the existing runtime guards.

[Record presentation history](ledger-records.md) is supplemental, not a new CI/browser acceptance statement.
