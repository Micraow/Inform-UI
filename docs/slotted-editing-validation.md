# Form and Tab editing continuity

Source checkpoint: `50eef3c64209d73d03d183903c7820e68c56e4bc`.
Runtime checkpoint: `6aa7fd40512e0d75518bf5c2f8d6626512e577fc`.
Browser bundle SHA-256: `a42e274e04f738050b25a8d9cc33973def39f6d16abb570b959490688d7dc6ee`.

FormView and TabGroupView explicitly update their current child slots and current opaque actions. Stable editors stay mounted. A changed slot structure retires its lifecycle and children. Form validation, pending submissions, cancellation, and tab selection retain their existing semantics. The host's capability safety checks are unchanged.

## Reproduce

After `npm run build:next`, run:

```sh
node --test --test-concurrency=1 tests/v2/domain-slotted-editing-continuity.test.mjs tests/v2/domain-editing-continuity.test.mjs tests/v2/domain-local-state-continuity.test.mjs tests/v2/domain-child-lifecycle.test.mjs tests/v2/editing-continuity.test.mjs
node --test tests/v2/slider-continuity.test.mjs
node scripts/slotted-editing-browser-regression.mjs
```

The browser script uses installed Playwright and `/usr/bin/chromium`, a local HTTP server (port 4181, configurable with `INFORM_TEST_PORT`), and synthetic data. Its optional first argument selects the JSON result path. A complete Form must be inside a tab panel: putting one Form around a TabGroup is intentionally rejected by the runtime's `TAB_FORM` rule.

## Recorded checks

- 44 focused Node regressions passed, including 16 new Form/Tab cases.
- Seven foundation Slider regressions passed.
- The build passed. A TypeScript check rooted in the three changed source files reported zero diagnostics. The complete typecheck was terminated with exit 137; it is incomplete, not passing.
- Real HTTP Chromium checks passed at widths 390 and 1440: trusted typing, CDP composition, stable input/focus/caret, tab switching, exactly one submit, and no page overflow or application errors.
- The lifecycle tests include 100 stable refreshes and 60 structural changes, with bounded ownership and complete disposal.

CDP composition is not an operating-system IME candidate-window test. These focused results do not establish exhaustive interaction or visual acceptance of all 233 components. A Git rolling ref update does not prove that CDN caches or previously loaded pages use its newest bytes.
