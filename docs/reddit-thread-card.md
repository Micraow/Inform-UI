# Supplied discussion-thread reader

`reddit-thread-card` is an original read-only article over supplied literal content. Its name identifies a canonical component, not a Reddit integration. It performs no provider/account access, retrieval, posting, replies, voting, reporting, authentication, embedding or network requests. It does not infer dates, URLs, verification, popularity or omitted facts.

## Contract

Required: `title` (1–300 Unicode code points), `author` (1–200), `body` (0–6000), `source` (`label` 1–200 and optional absolute HTTP(S) `url` 1–2048), and `comments` (0–50 top-level comments). Optional: `community` (1–200), integer `score` from −1,000,000,000 through 1,000,000,000 or `null`, and `expanded` (boolean, default false). Text is literal, including line breaks and Markdown/HTML-like strings.

Each comment requires a widget-unique key `id`, `author` (1–200) and literal `body` (1–4000). Its `score` is optional with the same range/null semantics. Optional `replies` contains 0–20 comments with this same closed recursive shape. Key IDs match `^[A-Za-z_][A-Za-z0-9_.-]{0,79}$`.

Full public validation additionally limits the total to 100 comments including replies, and four comment levels below the thread root (top-level comments are level 1). A fifth level yields `THREAD_DEPTH` at the first offending comment; the 101st supplied comment in source-order traversal yields `THREAD_COUNT`. Duplicate IDs yield `DUPLICATE_ID` at the repeated ID. Unsafe URLs yield `UNSAFE_URL` at `source/url`. JSON Schema is structural; always run `validateDocument` for these semantic constraints. Existing global JSON resource budgets still apply.

Missing/null scores display “Not supplied”; zero, negative and positive supplied numbers remain numeric text without buttons or vote interpretation. Numeric negative zero displays `0`, consistently across direct mounts and JSON compilation. The explicit supplied/unverified note explains that counts describe supplied comments and replies only. Source labels without a URL remain text; authors and communities never become guessed links. Supplied links disclose a new tab and use `noopener noreferrer` plus `referrerpolicy="no-referrer"`. A reader's deliberate link activation navigates normally; no resource is preloaded.

## Native reading and lifecycle

A semantic article contains nested list-item articles. A native top-level `details` wraps nonempty comments and honors initial `expanded`; empty comments show “No comments supplied.” Nonempty replies get native disclosures initially closed. Empty reply arrays do not create empty disclosures. Content and accessible-name IDs are allocated through the mount's ownerDocument and the reserved `iui-thread-internal-${prefix}` namespace. The widget adds no inputs, bindings, action callbacks, key handlers or event listeners.

Unrelated state changes preserve the actual nodes, all open states and focus. Invalid updates preserve the complete prior UI atomically. A valid replacement uses new content and its initial expansion settings. Reading works inside authored forms and disabled fieldsets, contributes no FormData or action-snapshot fields, and does not submit a form. Native form reset leaves disclosures unchanged.

Logical, bounded indentation adapts for narrow cards and pages. All CSS is root/widget-scoped, with literal text wrapping, source-order RTL, numeric isolation and forced-colors rules.

## Example and verification status

See [the entirely fictional fixture](../examples/reddit-thread-card.json). Built-in explanatory labels support English and Chinese; unsupported host languages use English labels while supplied text remains unchanged.

Local focused schema/API/DOM/lifecycle and affected regressions, type/build/CDN/boundary checks accompany this source candidate. The prepared [browser specifications](../tests/browser/thread.spec.mjs) cover two themes at three widths, pointer/keyboard/touch disclosure, all nested levels, genuine Arabic-first long strings at 320px, forced colors, disabled forms, independent ownerDocument, atomic updates, offline behavior, and a locally intercepted source link. Those browser specifications are **unexecuted** in this isolated handoff. Runtime-browser behavior, visual fidelity and provider compatibility remain unverified; this is not a browser-accepted component or a release claim.
