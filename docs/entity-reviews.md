# Supplied entity reviews

`entity-reviews` is one original portable Base node for a finite collection of supplied reviews. It has no review-service integration, retrieval, posting, rating submission, voting, moderation or account operations. Example authors and records in `examples/entity-reviews.json` are explicitly fictional.

## Contract

Required: `label` (1–200 Unicode code points) and `items` (0–50 records). Optional: `description` (up to 2,000), and `source: {label, url?}` (label 1–200; URL 1–2,048).

Every record requires `id`, `author`, `body`, and `rating`. IDs are unique within the collection and use the usual ASCII key grammar (1–80 characters, letter/underscore first). Author and optional title are literal text of 1–200 code points; body is literal text of 1–4,000. Required rating is an integer 1–5 or `null`: null means not supplied, never zero. Optional date must be a real Gregorian `YYYY-MM-DD` within years 0001–9999; optional URL is 1–2,048 characters. Source and review links must be absolute core-safe HTTP(S), without credentials or unsafe characters. Structural schemas do not replace semantic `validateDocument` checks.

Unknown fields are rejected. No overall score, global review count, inferred stars, identity verification or purchase claim is generated. Links visibly disclose a new tab and set `noopener noreferrer` and `no-referrer`.

## Local presentation

- Native rating selector: All, Rated, Unrated, or exactly 5 / 4 / 3 / 2 / 1.
- Native sort selector: supplied order, newest supplied date, highest supplied rating, or lowest supplied rating. Missing values sort last, with stable original-order ties.
- Visible/total counts refer only to the supplied collection. Empty collections and empty filter results are explicit.
- Each record renders author, optional title/date, explicit rating or missing-rating text, full body in an initially closed native disclosure, and optional link.
- Filtering hides retained rows; sorting reorders the same nodes. Open disclosures and their content remain intact. No host bindings, state keys, persistence, clock, locale date interpretation or fetch is used.
- Controls have no name, contribute no FormData, and work inside author Forms. Native inherited disabled state, including pending Forms, blocks forged selector events. The current selection is also the native reset default.
- Toolbar focus remains where it is. If a host-assisted filter change hides the currently focused review link or disclosure summary, focus moves to that filter only. Otherwise focused review controls are preserved when rows move; outside focus is untouched.

## Verification scope

The focused public API tests cover schema bounds, Unicode, missing ratings, exact error paths, immutable input, sorting/filtering, retained nodes and focus, form/reset/disabled boundaries, independent documents, atomic invalid updates, cleanup, and offline deterministic compilation. The prepared Playwright file covers 390/768/1100 light/dark, genuine first-visible Arabic RTL, native keyboard/touch/disclosure, forced colors, and locally intercepted link activation. These browser tests are prepared but unexecuted in this isolated implementation. Canonical acceptance remains pending integration and later accumulated browser acceptance.
