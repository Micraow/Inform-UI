# Supplied credit score and factor detail views

Both views are deterministic displays of supplied fictional or host-provided information. They never calculate a credit score, rating, lending eligibility, financial recommendation or account balance. They do not retrieve a credit report, contact a creditor or send information to a financial service. Display coordinates, labels, colors and descriptions are independent inputs.

## Score overview and history

`ledger-credit-score` separates outer pending/failed resolution from `dataStatus:loading|empty|ready`. Ready data includes title, score label, bounded score position (0–100), metric list, view options, histories and labels. A null score/metric label displays the supplied unknown label; a literal zero remains zero. The supplied score position is only a meter coordinate and is never inferred from score text.

The initial view defaults to `activeView`, otherwise the first supplied option, otherwise overview. View and range buttons support native activation and modifier/IME-safe arrow/Home/End navigation, with direction-aware view/range movement. Each view/range change is cancelable. Overview shows independently supplied metric labels, values and tones. Only `detailEnabled` metrics request a factor detail, with metric ID, label and current mask flag. No telemetry is emitted.

Histories have unique IDs, labeled series and increasing supplied x positions. Point values are finite numbers or null, keyed by series; null creates a gap. Labels and accessibility descriptions are supplied, including missing/negative/zero cases. The y display domain defaults to 0–100. Explicit domains display grid/axis ticks; optional `yTicks` provides exact tick labels. Plot spacing uses x coordinates, not equal-width point indices. No values are interpolated into missing entries, and historical points never replace the separate score label. Keyboard-selectable point controls expose the supplied accessibility readout. `hasHistory:false` selects the supplied no-history state.

`masked:true` always presents the overview, substitutes masked score/metric labels, removes the position marker and historical SVG/controls, and neutralizes metric tones. Factor requests explicitly carry `masked:true`. View selection is unavailable while masked.

## Disclosure

The supplied disclosure is available in the ready score view. It opens through focus/click or an 80ms non-touch hover, supports pointer transition into the panel, and uses the existing document overlay coordinator for Escape/outside/sibling closure. Escape restores focus without reopening the panel. Hover timers belong to the shared render generation and compensate late registration after update. The optional source link emits a local cancelable request; it does not navigate. Disclosure contains no generated credit explanation.

## Factor detail

`ledger-credit-score-detail` displays an optional summary/rating, all supplied rows, optional progress widths, supplied takeaways, related creditor records and note. A zero progress width is retained; null omits the bar. Ratings and progress colors use explicit semantic tones and are never derived from labels or percentages.

Masking replaces summary, row values, takeaways, related names/details/values and their accessible value labels. It hides the rating and creditor images and renders present progress tracks as neutral full-width bars. It retains non-sensitive supplied field labels and the note. No secret values are duplicated into accessible DOM labels.

Creditor logos use original/supplied URLs and a supplied fallback glyph. Inline images may load immediately. External logos require explicit local activation before creating an image element; replacing, masking or disposing releases prior sources. No favicon lookup occurs.

## Local events and lifetime

`iui:credit-view` details are frozen, bubbling, cancelable and non-composed. Supported intents are `select-view`, `select-period`, `open-factor` and `open-disclosure-link`; applicable fields are supplied `value`, `metricId`, `query`, `masked` or `url`, together with `id` and `component`. Accepted requests only update local view selection or record a local receipt.

A visible Reset restores initial view/range and clears inspected points, disclosures and receipts. Native reset honors cancellation; newer view/range/point input wins over a queued reset. Source disabled, fieldset/first-legend, ARIA, hidden/inert, capture cancellation, reentrant admission and irreversible ownership retirement are enforced. No actual account, lending or medical decision is implemented.

The original meter artwork is not copied: the local gradient and marker are original CSS. The history plot is an original SVG presentation of supplied coordinates. Author DOM/compiler tests, browser discovery, independent consumer checks and actual native/pixel acceptance are recorded separately. Frozen unified183 assets do not acquire this source's acceptance automatically.

## Narrow-header readability follow-up

Actual Chromium screenshots at 390 pixels exposed a title squeezed to single-character lines by the supplied score and disclosure control. The local container now wraps the header below 576 pixels and gives the title its own full-width row; the wider layout is unchanged. The native composition test checks that each complete title word occupies one line box. Original screenshots and the negative geometry result are preserved; this change awaits its new exact-asset native recheck.

## Complete semantic data constraints

Full `validateDocument` checks the top-level `label`, every provided `labels` value, and overview `title` for nonblank `trim()` content (`CREDIT_TEXT`). It also checks IDs for the unique-ID lists: overview metrics, history periods and each period's points; detail rows and related items. IDs must be unique within their own list (`CREDIT_ID`). This is not a blanket nonblank rule for all credit display content. Existing structurally permitted empty/whitespace content labels, nullable score/value labels, notes, descriptions and fallback remain unchanged.

Overview view-option values must be distinct; an active view must occur in the offered options when that list is nonempty. A selected period must exist when history is nonempty. For each history, `(yMin ?? 0) < (yMax ?? 100)` is required, series keys must be unique, point x coordinates must increase strictly, and every point-value key must name a supplied series. Missing series keys and null values are not synthesized. Display coordinates are caller-supplied and do not calculate creditworthiness. Structural numeric bounds, including percent positions, remain enforced separately.

A supplied disclosure URL must pass the safe-link policy, and related-item logos the safe-image policy. A structured schema package alone does not run these relationship or URL checks; retain full validation before mounting/compiling. These rules apply to the supplied data and do not connect to credit bureaus, change an account or provide a financial recommendation.
