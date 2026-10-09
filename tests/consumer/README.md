# Original Inform UI consumer browser candidate

Seven original synthetic JSON examples and a standalone local-compiled Chromium regression. No private captures, historical blind fixtures or external services are included. The script has been syntax-checked; its browser execution has not yet run.

Use a built, frozen Inform UI checkout with its locked @playwright/test 1.56.1 and installed Chromium. No package additions or copied implementation code are required. Run from any directory:

    node tests/consumer/scripts/verify-next-browser.mjs --library /absolute/path/to/core --revision ACTUAL_FULL_SHA --screenshots /absolute/path/to/test-results/skill-consumer

The script reads its seven sibling examples, checks the actual public validateDocument API, compiles inline standalone HTML with the public compileHtml API and opens local file URLs in the authorized browser runner. It requires no fixture HTTP server and performs no network requests. It rejects a checkout whose HEAD is different from --revision. Do not use it to bypass an environment where browser execution or file navigation was denied.

Expected success output: 42 local-compiled views, 7 names × 2 themes × 3 widths. Names: foundation-explainer, local-time, local-overlays, local-number-draft, timed-local-practice, local-status-primitives, primitives-with-form-and-time. Themes: light/dark. Widths: 390/768/1100. Screenshots are <name>-<theme>-<width>.png and RESULTS.json records the exact revision, browser status and outstanding review items.

Covered behavior: start/pause/reset/completion and frozen snapshot, keyboard overlay nesting and Escape, real clicking through numeric-draft validation/cancel, same-value state overwrite, document state reset preserving timer, grid reading order and table group headers, no page-wide overflow, no script errors or unsolicited requests.

This script tests local compiled assets. It is not a public-CDN/SRI verification, manual screenshot review, screen-reader test or cross-browser conformance claim. After any test fix or source change, rerun against the final frozen commit. Avoid adding its output screenshots to source control unless intentionally authorized as public project artifacts.

The two primitive examples additionally cover finite icon naming/decorative semantics, literal pulse status without autonomous transitions, reduced motion, flow reading order and form/time state isolation. They require the integrated flow/icon/pulse-indicator schema; earlier 59-node candidates reject them.
