# Rating summary: supplied read-only display

`rating-summary` is an original implementation of a read-only rating-summary presentation. A single solid decorative star precedes the supplied rating label and an optional muted review-count label in one horizontal, non-wrapping row. With a provider, the whole row is a native source link. It does not collect a user's rating or verify a review service.

The separate [`rating`](rating.md) node remains a project-local controlled input extension with its existing wire contract and behavior.

## Contract

- `type`: `"rating-summary"`
- `ratingLabel`: required literal string, 1–200 Unicode code points
- `reviewCountLabel`: optional literal string, 1–200 Unicode code points
- `provider`: optional object requiring `label` (literal string, 1–200 Unicode code points) and `url` (literal string, 1–2,048 Unicode code points)
- `id`: the ordinary optional node identifier

All objects are closed. Numeric values, state expressions, `bind`, editable controls, arbitrary markup, custom star counts, provider logos, image URLs, callbacks and alternate protocols are unsupported. Labels are rendered as text, including HTML-looking text. Hosts supply punctuation and localization explicitly; the renderer does not parse, round, translate or append units to the labels.

Omitting `reviewCountLabel` omits that text entirely. An unknown count may be represented by an explicit literal such as `"Review count unavailable"`. Neither omission nor an unknown label becomes `0 reviews`. Similarly, the renderer does not invent a rating when an author supplies `"Not rated"`.

See the original [example](../examples/rating-summary.json). The isolated schema module is `content/rating-summary`; it recognizes only this node and its declared shared document dependencies.

## Link, accessibility and layout semantics

Without `provider`, the row is ordinary non-focusable text. With `provider`, one native anchor contains the star, rating, review count when supplied, and the visible provider label. It uses the browser's ordinary same-tab navigation, `rel="noreferrer"` and `referrerpolicy="no-referrer"`. The anchor's accessible name comes from all its literal text. No custom click or keyboard handler overrides native link behavior.

The provider URL must be absolute HTTP(S) and pass the shared `isSafeURL` policy. Relative, credential-bearing, script, data, browser-internal, `mailto:`, `tel:` and fragment-only destinations are rejected by full validation. Structural schema selection alone does not establish URL safety; run `validateDocument` before mounting or compiling.

The single star is hidden from assistive technology; it is not a checkbox, radio, slider, image description or numeric range. Text labels use independent bidirectional isolation, while the row follows the renderer root's resolved writing direction. The root uses its existing `dir="auto"` behavior: language metadata alone does not force RTL, and isolated labels do not determine their ancestor's direction. An RTL document can supply ordinary RTL text such as its description. Narrow containers keep one row and truncate long visible labels with ellipses. Full literal text remains in the DOM, accessible link name and each label's native title. The link has a visible keyboard-focus outline. No synthetic input, form participation, live region, state subscription or change event is introduced.

## Provenance and verification boundary

The renderer, silhouette and examples are independently authored project code. No private reference source, screenshot, provider logo or third-party brand asset is included. Provider branding via remote or inline images is not supported in this contract. The visible provider label is a plain-text attribution chosen by the document author.

Supplied ratings, review counts and provider identities are unverified author data. A source link makes no claim about accuracy, freshness, trust, an endorsement, or a successful online lookup. Mounting and offline compilation introduce no network fetch, metadata lookup, storage, timer or tracking.

`tests/rating-summary.test.mjs` covers bounded schema fields and types, exact literal rendering, missing and unknown counts, safe URLs, link semantics, accessibility structure, unchanged interactive rating behavior, lifecycle and deterministic offline compilation. `tests/browser/rating-summary.spec.mjs` is prepared for real-browser verification of native keyboard links, single-row layout, narrow containers, RTL, themes, forced colors and reduced motion. Browser, screen-reader and pixel acceptance should be claimed only after those checks have actually run.
