# Supplied related questions

The inventory-confirmed `sidebar-people-also-ask` candidate is an original supplied-question reader. It does not discover popular questions, rank relevance, search the web, generate answers, verify truth or fetch sources. The author supplies every question, answer and source. It is a distinct structured contract with explicit missing-answer semantics and per-answer provenance, not a generic accordion alias.

## Contract

Required `label` (1–200 Unicode codepoints) and `items` (0–40). Optional `description` (0–2000) and `expanded` (0–40 unique supplied question IDs). Each item requires a unique `id`, `question` (1–500) and `answer` (0–10000 codepoints or null). Null explicitly means no answer was supplied; an empty string remains an exactly empty supplied answer. IDs are bounded local keys, not paths. Optional `sources` contains at most five `{label,url}` records. Source labels are 1–200 codepoints; URLs must be allowed absolute HTTP(S), without credentials. Relative, executable, data and filesystem URLs are rejected. No HTML, bindings, providers or action fields are supported.

Expanded IDs must refer to supplied questions. Exact-path semantic issues are `DUPLICATE_ID`, `QUESTION_REFERENCE` and `UNSAFE_URL`; unsupported fields and structural bounds report `SCHEMA`. Questions, answers and source order are preserved exactly. There is no freshness or authority inference.

## Reading and local controls

Native details/summary disclosures expose the literal answer and optional source links. Multiple questions may stay open. An initial expanded list is applied only on mounting/updating. Search filters question and answer text by case-insensitive substring, retaining all bounded rows and their disclosure state. The search limit is 200 UTF-16 code units; oversized forged input is rejected without replacing the accepted query. Clear restores all rows and preserves disclosure state. Empty collection, no matches, missing answer and missing source are distinct states.

Native source anchors disclose opening a new tab, use `noopener noreferrer` and `no-referrer`, and perform no prefetch or automatic navigation. No hidden media, script, remote preview, answer request or generated link is rendered.

Search has an explicit native label. A polite status reports the visible match count. Long text wraps, answers preserve line breaks, source labels can wrap, and the component follows document language/theme and logical layout direction. Native disclosures and ordinary safe links remain reading affordances inside disabled Forms; search and Clear are guarded interactive controls.

Controls have no payload names or bindings and do not enter host FormData or action snapshots. Unrelated `setState` preserves query, focus, row identity and disclosures. Native outer form reset clears only the search, retaining reading state. Cancellation, disabled/hidden/inert ancestry, newer input, moved controls, update and disposal follow the shared reviewed reader lifecycle. Actual control ancestry and root ownership are checked; a retained moved input cannot change the model or be overwritten by its blocked handler. First-legend native exceptions and shadow-root resets are supported.

## Acceptance boundary

This candidate lives in a separate tree from the running 37-candidate batch and the jobs/product-card worker. The accepted canonical total remains 53; no completed count is inferred from the 101-node schema. Prepared browser cases cover keyboard/pointer/touch, source behavior, responsive light/dark views, RTL, forced colors and absence of runtime requests. They require actual execution and screenshot review before browser or visual acceptance. Current acceptance locks refer to older immutable assets and must not be reused for this candidate.

## Local checkpoint evidence

The initial related-question/public/core run passed 42/42 tests. After adding extra pending-Forms, moved-control, overlength-input and listener-retirement cases, the focused related-question/Forms run passed 37/37, with zero failures or skips. The runs overlap and are not a full aggregate claim. Build, CDN, TypeScript and public type consumers, and source-boundary checks passed. Browser discovery found 639 cases in 70 files, including eight newly prepared cases; none was executed locally. A final theme-token-only search-input style update is separately rebuilt before packaging.
