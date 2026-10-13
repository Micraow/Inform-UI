# CI coverage and historical reproduction

## Current source: automatic main and pull-request gates

Both workflows check out the event commit without a historical `ref` override. Failures remain failures; no job uses `continue-on-error`.

- `recovery-validation.yml`: complete `npm run check` (Node contracts, types, build and boundaries), generated-file check, pinned licensed font, all showcase browser checks, and the full current-source synthetic browser suite via `playwright.recovery.config.mjs`.
- `ci.yml`: builds and exercises packaging and CLI paths on Ubuntu / Node 24, Windows / Node 22, and macOS / Node 22.

The gate separation changes scheduling, not current-source assertions. All current-source tests and all three platform jobs remain automatic on main and PRs.

## Fixed baseline evidence

At `ef30d8ef6409a957234a82f78e0452fd95f5a2a4`, [current-source run 38356771848](https://github.com/Micraow/Inform-UI/actions/runs/38356771848) passed on its first attempt: 4,339/4,339 Node tests, 7/7 showcase tests (217 live examples and one explicit rejection), and 795/795 synthetic browser tests with zero retries. All three portability jobs in [run 38356772017](https://github.com/Micraow/Inform-UI/actions/runs/38356772017) also passed. These are fixed-commit results, not a claim about later commits.

## Historical prepared 115: manual, never accepted

`historical-115.yml` is a separate `workflow_dispatch` reproduction. It retains the exact source `4e13fae4bf6416865bb93aa92056df6917d231b9`, original source/asset/Skill lock bytes, canonical 691-case browser plan, original consumers, Skill/CDN checks and failure artifacts. It builds the locked source before discovery. No failed historical assertion has been deleted, skipped or relabeled as passing.

The historical source documented itself as prepared only. Two independent reproductions ([38355426924](https://github.com/Micraow/Inform-UI/actions/runs/38355426924), [38356772017](https://github.com/Micraow/Inform-UI/actions/runs/38356772017)) produced 657/691 browser passes and 34 failures; the Skill source proof also failed a `dist/browser.js` hash check, so CDN checks did not run. This snapshot has never completed acceptance.

The browser failures include a stale asset-version expectation, disabled/multi-match/hidden-element test assumptions, pointer focus-modality assumptions and one touch scenario. The corresponding current-source touch scenario passed in 477 ms in the baseline run. The historical Skill hash mismatch is an unresolved build-reproducibility result, not a current renderer failure.

Separating this reproducibility experiment avoids presenting a never-accepted frozen snapshot as a current-product gate. Its source, locks, test coverage and failed evidence remain available, and the manual workflow still reports failures honestly.
