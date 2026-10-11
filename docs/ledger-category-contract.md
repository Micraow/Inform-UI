# Supplied category views

Three original finite views consume already-supplied records: `ledger-spend-by-category`, `ledger-spend-by-category-detail`, and `ledger-spend-by-category-recent-transactions`. They never contact an account, calculate financial totals, categorize a purchase, or fetch transactions.

## Overview

Supply up to60 months, each with an ID, display label, nullable total label, independent stack segments, topCategories and complete categories. Each category includes a display amount, percent label, finite0–100 bar value, safe color, and optional detail capability. Months can have an option label and option group. The selected month defaults to the first; its supplied ID must exist. More replaces the top list with the complete list, Less restores it, and changing months collapses expansion. A native parent form reset restores the initial month and collapsed list; cancelled resets and newer input win.

Segments use independently supplied nonnegative weights. Neither weights, bars nor category amounts determine the displayed total. Unknown labels are explicit null and remain distinct from supplied zero. With sensitiveValuesHidden, the total uses the masked label while category amounts are replaced by their supplied percentage labels; bar geometry remains visible.

A category with detailEnabled emits a frozen, bubbling, cancelable, non-composed `iui:category-detail` request containing id, monthId, categoryKey, label, totalLabel, optional top-detail labels and explicit masking/reference flags. Acceptance performs no external action. Repeating a cancelled request remains possible. No implicit navigation, account operation or network action follows the event.

The576px inclusive breakpoint is measured from the renderer wrapper, not the viewport. It changes the heading presentation without replacing category rows. Select is shown only when there are multiple months. Empty supplied lists have an explicit no-spending state.

## Detail and recent transactions

Detail renders supplied group labels, nullable subtotal labels and percentage bars. Recent transactions render supplied title/date/amount labels, optional safe logo and fallback glyph. They are passive views; no transaction action is inferred. Images reuse the library's owned image reader and release their sources when replaced or retired.

All three views support pending, failed fallback, resolved empty, and disconnected-account presentations. The overview pending block is380px high; detail and recent presentations have two skeleton groups. These are original CSS implementations from observable presentation facts; reference pixel equivalence has not been established.

## Bounds and ownership

Months are bounded at60, category/group/transaction/segment arrays at100. IDs are unique within each list; totals and text are display strings, not numbers to parse. Colors are six fixed color roles or exact six-digit hex. Safe image URL policy and shared generation/owner, input, intent and native-reset facilities are reused. Every replaceable row generation owns its handlers. Same-turn owner removal permanently retires old controls; an explicit controller update creates the new view.

The three schemas being registered is not canonical completion. Independent functional review, native execution and reference pixel acceptance are recorded separately.
