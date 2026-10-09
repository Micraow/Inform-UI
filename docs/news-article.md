# Supplied news article

`news-article` is one original Base node for a finite article supplied by the document author. It does not fetch, scrape, update, rank or verify news. Content and provenance are explicitly labelled unverified. Examples are original synthetic stories.

Required: `headline` (1–300 Unicode code points), `source: {label, url?}` (label 1–200; URL 1–2048). Optional: `summary` (0–4000), `author` (1–200), `published` (a real floating Gregorian YYYY-MM-DD date, years 0001–9999), `paragraphs` (0–30 strings, each 1–4000), `expanded` (boolean; defaults false), and `tags` (0–8 strings, each 1–40). All text is literal, never expressions or HTML. The existing whole-document budgets still apply. Unknown fields are rejected.

The semantic article contains a headline, supplied metadata, an unverified-content note, optional tags and summary. Nonempty paragraphs appear in one native `details` disclosure; all supplied paragraphs are present in their original order without truncation. Missing or empty paragraphs create no disclosure or invented body. Source URLs are safe absolute HTTP(S) only and use a native new-tab link with a visible context hint, `noopener noreferrer` and `no-referrer`. Merely mounting or opening article text makes no network request.

The browser owns the disclosure. It has no custom click or keyboard handler, state binding, form field, host action, storage, timer or refresh subscription. Unrelated `setState` calls preserve its DOM, open state and focus. A valid controller `update` replaces the document and applies `expanded` again; invalid updates remain atomic. Article disclosures remain readable inside disabled/busy forms and never enter form snapshots. Disposal removes the mounted tree; detached native details may still toggle themselves, without changing the controller or another root.

There are no feeds, images, live/breaking/trending claims, recommendations, credibility scores, relative dates, account/save/share/provider actions or remote ingestion. Supplied links do not establish trust. Generated full and official Base schemas describe the same node; callers must use public `validateDocument` for date and URL semantics.

Browser acceptance cases are prepared in `tests/browser/news.spec.mjs` for six width/theme views, real keyboard/pointer/touch disclosure, intercepted source navigation, Arabic-first RTL, forced colors and lifecycle. They are not executed by the isolated implementation pass; combined integration acceptance owns screenshots and browser results.
