# Prepared accumulated 115 candidate acceptance

Status: prepared only. No browser/CDN acceptance or CI success is claimed. Canonical accepted count remains 53. Protocol count 115 is not an accepted-component count.

## Exact scopes

- Runtime/CDN asset: `6bc30ab8cb15eb4351b1859dacef74e7f8a9a574`.
- Proof checks use the separate frozen asset checkout. The later core lock commit intentionally changes acceptance harness files, so it is not interchangeable with the 415-path asset snapshot.
- The immutable runtime proof is `docs/local-enhancements-115.json`: 1592/1592 full local Node tests, 284/284 focused tests, four selected schema checks, and 415 exact production/build hashes.
- The new lock is `tests/consumer/batch-lock-115.json`. It binds the final Skill commit/tree, its independent candidate115 contract, all consumer scripts/examples/languages, and the exact canonical browser inputs.
- `tests/consumer/batch-lock.json` is preserved byte-for-byte. Its historical 37-candidate group and historical Skill root97 contract/CDN results remain separate evidence. The candidate115 gate never substitutes root97 CDN results.

## Planned executions

1. One canonical Playwright run: 691 tests in 78 spec files. Discovery alone is not execution.
2. Eight original consumer groups: 62 same-byte examples, each at 390/768/1100 pixels in light/dark mode, for 372 inline views. The new group has ten documents covering 18 later canonical components and 60 of those views.
3. Current Skill tests, the strict independent candidate115 source gate, and one distinct candidate115 CDN/shell browser verifier with six views. Inline receipts cannot replace CDN evidence.

The plan explicitly retains the licensed pinned CJK font, rendered-font browser check, and native-select popup dismissal/focus/value checks. Font installation uses the committed font and license; there is no external CJK font download. The later consumer flight-reset actionability issue is fixed before pinning.

## Job budget

The contracts job has one 75-minute total budget: the observed full local Node stage took approximately 12.7 minutes, followed by 691 canonical browser tests, 372 inline consumer views and six candidate CDN views. Individual interaction/screenshot timeouts and assertions are unchanged. No automatic retries or repeated workflow launches are added.

## One eventual run

The checked-in workflow references only the new lock for this candidate. It validates the exact browser plan before expensive checks, builds the core once, proves core/asset build equivalence, and reuses those exact dist bytes. Each consumer runs once; only successful, complete, exact-input inline evidence can create the shared receipt.

After the root approves and publishes the exact core/asset/Skill commits, the workflow owns the combined execution. The following are the substantive commands after dependencies and Chromium are installed. `ASSET` and `SKILL` must be separate clean checkouts of the lock's exact revisions; `CORE` is the actual workflow checkout, including the lock-only commit.

```sh
node scripts/batch-browser-plan.mjs --lock tests/consumer/batch-lock-115.json
npm run check
node scripts/check-generated.mjs
node scripts/prepare-test-font.mjs --install "$RUNNER_TEMP/inform-ui-fonts"
export FONTCONFIG_FILE="$RUNNER_TEMP/inform-ui-fonts/fonts.conf"
npm run test:browser
mkdir -p test-results
node scripts/run-batch-consumers.mjs --core "$CORE" --asset "$ASSET" --skill "$SKILL" --revision "$(git rev-parse HEAD)" --lock tests/consumer/batch-lock-115.json --evidence "$CORE/test-results/consumer-batch"
node scripts/run-skill-acceptance.mjs --skill "$SKILL" --asset "$ASSET" --core "$CORE" --revision "$(git rev-parse HEAD)" --lock "$CORE/tests/consumer/batch-lock-115.json" --receipt "$CORE/test-results/consumer-batch/RECEIPT.json"
```

All generated screenshots and execution reports remain pending. Any failure remains a failure; no retries, reused stale output, fallback font masking, forced activation of disabled controls, or acceptance promotion is implied by this preparation.

## Single trigger and history preservation

The reviewed original PR branch is `feat/portable-core-20261008`, at the supplied remote checkpoint `654877cd72890c412d30d8d04acf89989d2fd14e`. It and the candidate descend from `a4103c139012e19bd6fcefa09791418571562e47`; neither is an ancestor of the other. The old head is an empty CI-trigger commit. A no-fast-forward merge of that checkpoint into the final candidate lock tip preserves both histories and should leave the final lock tree unchanged. Do not force-push or rewrite either history.

The root must recheck the actual remote head, review the exact asset/Skill/lock pins, and then create the final merge commit without a skip-CI marker. Push only that resulting commit to the original PR branch once. The sole workflow has `push` restricted to `main`, so this feature-branch update takes the existing PR `synchronize` path rather than also triggering a branch-push workflow. No workflow dispatch, parallel branch-trigger push, or automatic retry is part of this plan. All preparatory commits retain skip-CI markers.

## Final local pins and handoff

Skill commit: `7e1bb53842d73118eecd742b0517387e3a4bc5bd`, tree `be9eae803467f04ee305c0bfbf1cc2c7f78de9b6`. Lock SHA-256: `8c25b5988c0a40cf5fe9e2cecd6e17919acbba7a5f8db8ff9670a79a87267f3d`. Machine-readable handoff: `docs/handoff-115-acceptance.json`.

The final local lock preparation verified all 62 same-byte examples through the actual public validator and compiler, all 415 frozen asset hashes, 199 canonical-browser input hashes, and 79/79 affected acceptance-harness/recovery tests. The final exact committed Skill checkout reports 125/125 tests. These are source/local checks, not executed browser, public-CDN or CI acceptance.

The actual generated upcoming-eighteen plan also passed the final Skill receipt-manifest verifier directly. Its alphabetically ordered name/hash metadata is retained as a regression fixture in the Skill repository, so independently constructed test fixtures are not the sole integration evidence.
