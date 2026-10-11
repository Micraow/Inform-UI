# Supplied equity and watchlist tables

`ledger-equity-updates` and `ledger-watchlist` are original read-only supplied-label views. They do not fetch prices, calculate returns, infer directions or colors, connect accounts, place orders or send financial data to a service.

## Shared data and presentation

Resolved views require `title`, `asOfLabel`, `emptyLabel`, `rows`, `labels` and the view's explicit data-availability flag. Every row has a unique `id`, literal `ticker` / `name`, and independently supplied `priceLabel` / `percentLabel`. Equity also requires `valueLabel`. Labels can be null, which renders `unknownLabel` or the default Unknown. A literal zero string remains zero. Optional directions (`up`, `down`, `flat`) select supplied label prefixes; colors (`primary`, `secondary`, `positive`, `negative`) are independent semantic presentation fields. No sign is inferred from numeric-looking text.

Headers, up/down indicators, Show more/less and masked text are supplied in `labels`. Table order remains source order. Existing row nodes are retained across local disclosure. A576px container breakpoint changes spacing and typography; equity uses local horizontal scrolling with readable minimum columns on narrow hosts. No page-wide horizontal layout is requested.

## Equity updates

- Initial visible row count is always five.
- `hasPositions:false` renders the supplied empty state even when rows are present in input.
- `connected:false` renders only `noAccounts:{title,description,actionLabel,query}`, never the supplied rows or header amounts.
- Optional `conversionNote` is literal text; currencies are not converted.
- `masked:true` masks only absolute value changes, removing their direction prefix and semantic tone. Price and percentage labels remain visible. Hidden or collapsed absolute values use the same mask.
- More/less is present only when the supplied row count exceeds five; it switches five/all.
- Pending placeholder height is340px.

## Watchlist

`hasEntries:false` selects the empty state. `rowsToShow` supplies the initial count, default five; zero is meaningful. The observed transition is retained exactly: when the current count is five, activation shows all; for every other count, activation shows five. Thus an initial two becomes five, then all. Local/native Reset restores the supplied initial count. The button is present only for more than five supplied rows. Pending placeholder height is320px.

## Local requests and reset

`iui:equity-watch` is frozen, bubbling, cancelable and non-composed. It contains `id`, `component`, and either `show-more` / `show-less` plus `visibleCount`, or `request-onboarding` plus the supplied `query`. Cancellation leaves disclosure unchanged. Acceptance only changes local row visibility or records a local receipt. There are no row-level trading or quote requests.

A visible Reset restores disclosure and clears receipts. Native reset honors cancellation and pending/revision protection. Source disabled, capture cancellation, fieldset/first-legend, ARIA, hidden/inert and generation ownership are checked before events. Updates/disposal retire listeners and prior controls. Rows do not create image/network resources.

## Small shared style successor

This source also corrects FinanceEntry and ContextAction CSS references from component-local-only `--iui-border` / `--iui-text` to established global `--iui-line` / `--iui-ink`. Prior pins remain unchanged. This is an explicit two-stylesheet correction, not a claim that prior pixel acceptance existed. Their original behavior tests are rerun with the combined source.
