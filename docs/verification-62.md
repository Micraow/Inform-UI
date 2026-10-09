# 62-node component batch: executed verification

This record describes the finite public contracts in foundations, time, overlays and primitives. Protocol node count is not component completion count.

## Frozen identity

- Runtime/CSS/schema asset pin: `01ae9d870b221208b31e9da437ae87fdef265cec`.
- Acceptance head: `3d2c0ce23dd1532f2a6acd7f2c5ac6c697d08323`.
- [Successful CI 37892705931](https://github.com/Micraow/Inform-UI/actions/runs/37892705931), completed 2026-10-09 06:21 UTC.
- GitHub tested PR merge: `48d0701d9727bc7cd7bb2609264ddf1c7b7d4495`. Its tree and the acceptance head tree are both `7611b19c6a80704ff9922eb82db9aecb62fb7646`, verified through GitHub's Git commit API and local Git.
- Asset pin to acceptance head changes contain no `src/`, `cdn/` or `scripts/` changes. The acceptance commit adds pinned shells, tests and documentation. The rebuilt CDN manifest is compared in its entirety against `cdn-lock.json` by the executed browser suite.

The consumer RESULTS.json retains the actual merge SHA; it has not been rewritten to the asset or acceptance SHA.

## Executed checks

- 292/292 Node tests, strict TypeScript and consumer types, deterministic schema/standalone-validator/styles/CDN regeneration, source boundary, and production dependency audit.
- 216/216 Chromium Playwright tests, including the four new touch cases: repeated tap and Escape, real drag-out, native pointer cancellation, and independent mounts. Existing focus, keyboard, hover, nested popover, retained child state and lifecycle cases also passed.
- 42/42 standalone consumer views: seven original JSON examples × light/dark × 390/768/1100. These use the public validator/compiler and local inline assets, with no network requests. They are additional consumer checks, not a second claim of CDN coverage.
- Actual fixed-CDN file-page loading and interaction: fresh cache-disabled contexts, SRI, hash/MIME/CORS checks, no injected local styles, four current-component views and the existing CDN regression suites. The current demo checks valid numeric state, min/max/step/empty drafts, actual Submit/Cancel clicks, popover focus, stopwatch actions and snapshot time.
- Actual HTTP bytes of 11 assets were independently compared with locked SHA256 and SHA384 SRI: global/ESM scripts, CSS, complete schema, discovery index, and base/time/finance Document and Node subsets. All returned HTTP 200, correct CORS and immutable caching. The browser discovery regression also fetched closed forms/converters subsets and same-version time/finance examples.

## Visual review

Actual successful-run screenshots were inspected for current CDN light-1100/dark-390, primitives light-390/dark-1100, time dark-390/light-1100, foundations light-390/dark-1100, structured tables light-390/dark-1100 and overlays light-1100/dark-390. Text, controls and keyboard focus are readable; narrow tables/code keep their intended local scroll surfaces, with no whole-page overflow. Dark embedded test roots intentionally do not repaint an unrelated host page.

A separate reviewer also inspected all seven consumer examples at light-390 and dark-1100 (14 original screenshots), and confirmed their input JSON is byte-identical to the delivered consumer examples. Closed-overlay screenshots do not substitute for the open-panel screenshots and interaction regressions above.

Original synthetic evidence is in the run's `synthetic-ui-browser-evidence` artifact (`test-results/` and `playwright-report/`, seven-day workflow retention). Private/reference runtime captures are not part of this repository or this artifact.

## Component accounting

The following 13 canonical entries move from implemented-pending to functionally verified: `base-blockquote`, `base-code`, `base-grid`, `base-table`, `base-text`, `clock`, `digital-stopwatch`, `digital-timer`, `base-tooltip`, `base-popover`, `base-flow`, `base-icon`, `base-pulse-indicator`.

The fixed 256-entry inventory is now **49 functionally verified, 14 partial, 0 implemented-pending, 193 not implemented**. The 62 schema nodes comprise 60 rendered node types, an explicit Markdown plain-text fallback, and rejected historical `native` input. These are different denominators.

## Limits and historical fixtures

This is functional Chromium acceptance, not full pixel equivalence, all-browser coverage, a manual screen-reader audit, or a WCAG certification. Finite icon names, local-only time controls and caller-authored literal status remain explicit in their component contracts. Standalone table null values intentionally render empty; zero remains zero. Numeric field constraints govern user drafts; host state still follows the separate documented global validation contract.

Historical 6797 blind HTML/JSON remain byte-identical and use their own frozen delivery lock; their old numeric behavior is not represented as repaired. Use [current-components.html](../examples/browser/current-components.html) and [current-components.json](../examples/current-components.json) for the corrected current example. Loading placeholders and source/link cards are separate later work, not included in this count or asset pin.

Evidence-only documentation/accounting updates after the tested acceptance head may use `[skip ci]`; they do not change source, generated assets or the fixed asset pin and do not claim a new code test run.
