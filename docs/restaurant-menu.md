# Supplied restaurant menu

`restaurant-menu` is one original finite Base-domain node. It browses supplied data locally; it does not fetch restaurant information, verify availability, establish dietary safety, order food, reserve tables or process payments. The example is synthetic and original.

## Data contract

- Required `title`: 1–200 Unicode code points; `currency`: exactly three uppercase ASCII letters; `sections`: 0–20.
- Optional `description`: at most 2,000 code points; `source`: required `label` (1–200), optional allowed absolute HTTP(S) `url` (1–2,048).
- A section has `id` (the shared key shape), `title` (1–200), and `items` (0–40).
- An item has `id`, `name` (1–200), and required `price`: a finite nonnegative number or `null`. Optional `description` (≤2,000), `tags` (0–8 strings of 1–40), and `status` (`available` or `unavailable`).
- Section IDs are unique within the menu. Item IDs are unique across all its sections. Those two namespaces are separate; independent menu nodes can reuse IDs. Total items ≤200. Shared document budgets also apply.
- Every object rejects unknown fields. No media, callback, binding, storage or transaction fields are supported. `MENU_ID`, `MENU_LIMIT`, `MENU_FORM` and `UNSAFE_URL` identify semantic violations; shape errors use the normal `SCHEMA` code.

Currency is a supplied label, not independently verified ISO currency data. Prices use their exact JavaScript numeric string and the supplied code, including scientific notation when necessary; there is no rounding to two decimal places, currency-symbol lookup, conversion or total. `0` is shown as an explicit zero; `null` is “Price not supplied.” Missing status is labelled “Status not supplied.” Tags and statuses are literal supplied claims, never recommendations or safety certifications. As with all JSON numbers, serialization cannot retain lexical notation or precision already lost by the caller.

## Local interaction

Native search and section controls filter existing item DOM, preserving supplied order. Query matching is `trim().toLowerCase()` plus literal substring against each name, description or tag; no normalization, fuzzy matching or semantic search is performed. A query and category are intersected. Sections with no matching items are hidden while controls remain available. Count announces actual visible/total items, with separate empty-menu and no-match messages.

The query limit is 200 Unicode code points. Overlong pasted drafts are never truncated. They retain the last valid search results and show explicit limit feedback; a changed section still intersects that last valid search. Correcting the draft resumes matching. Clear search clears both query and section and focuses the search control. It does not collapse native descriptions.

Descriptions longer than 200 code points use native `details`/`summary`. All items remain mounted. Open disclosures, input selection, DOM identity and focus survive unrelated host state changes, including host reset actions and temporarily hidden ancestors. This component has no state binding. A successful full document update resets local state; an invalid update leaves the old tree intact. Disposal/update detaches component listeners. Internal IDs sit outside the authored ID namespace and elements come from the mount’s owner document.

Menu nodes are rejected anywhere under an authored document form, including nested layouts, lists and disclosures (`MENU_FORM`). When the host itself lives inside an external native form, search cancels only unmodified, noncomposing Enter (also respecting IME key code 229); modified Enter and native arrow navigation are untouched. Controls have no names and do not enter form data. Their defaults track the current local values so an external form reset stays synchronized. An external disabled fieldset suppresses both native interaction and forged input/change/click events.

English and Chinese interface labels follow the mount’s existing language convention. Titles appear before interface text to support genuine Arabic-first `dir=auto`; unsupported interface languages use English. Scoped CSS uses existing theme tokens, native visible focus, responsive wrapping and forced-color borders with no animation.

## Verification status

`tests/menu.test.mjs` covers public schema and semantic validation, finite bounds, exact values, search/filter/reset, Unicode, native key boundaries, form ownership, disabled controls, retained details/focus, owner-document isolation, atomic update/disposal, source safety, literal text and deterministic compilation. `tests/types-menu.mts` verifies the public generated node union.

`tests/browser/menu.spec.mjs` is prepared for the combined acceptance batch. It is explicitly unexecuted in this component handoff. It covers real keyboard, pointer and touch interactions, 390/768/1100 light/dark layouts, Arabic-first RTL, forced colors, exact price display, focus/disclosure retention, external form submission, disabled fields and lifecycle. No browser/visual pass or aggregate canonical acceptance is claimed here.

Numeric negative zero is displayed as `0`, matching JSON compilation; no nonzero price is rounded. Source links announce their new-tab context and suppress referrer information.
