# Ten local canonical candidates, browser acceptance pending

The verified count remains53/256. Ten additional canonical components have local implementation evidence; seven other entries remain partial and186 unimplemented. The previous seven are recorded in [the earlier local checkpoint](local-enhancements-68.md). This checkpoint adds three actual contracts: checklist, learning-fill-blank-card and learning-sentence-builder-card. The source schema has71 nodes; this is a separate protocol inventory, not71 verified components.

## Executed evidence

- Final `npm run check` passed531/531 Node tests, with no skips/TODOs. Generation, core/browser/standalone and CDN builds, strict TypeScript, consumer declarations and source boundary all passed.
- The two supplied learning modules passed52 focused integration/regression tests with the existing learning and tabs implementations.
- Checklist and cross-learning boundary tests passed18/18 through the actual public Schema, validation, mount and compiler APIs. An initial test-fixture path error was corrected to read the canonical generated node-owner index; production assertions were retained.
- Independent isolated learning handoffs passed455 and454 tests respectively before integration. Their source-only changes were reconciled with the newer tabs/date/Markdown and Forms safeguards rather than replacing shared files.
- Integration reproduced duplicate label IDs against each original learning handoff when the author chose a matching node ID. Both modules now use reserved internal namespaces. Public tests verify unique IDs and labels that resolve inside the right component.
- New sentence-builder CSS is host-scoped. Its tab-preservation browser scenario now asserts integrated tab support instead of retaining the isolated-baseline skip.

## Functional scope

The [checklist](checklist.md) reuses the established checkbox/Forms registry, including submit snapshots, disabled omission and cancel/reset. Bulk selection is one atomic patch, including the case where separate intermediate changes would violate a global constraint. Local filters retain each item; hidden active controls get a minimal visible focus fallback.

[Fill-blank](fill-blank.md) preserves typed drafts, checks only trimmed exact answers and makes reference review explicit. [Sentence-builder](sentence-builder.md) compares authored token identities, retains native reorder controls and never reclassifies an assisted attempt as independent correctness. Both reject nested form ownership, preserve local state in hidden tabs and render supplied text inertly.

## Deferred verification

Playwright discovery lists355 scenarios in44 files. These new candidates have not run in a real browser. Pointer/touch activation, native navigation, visual layouts, responsive themes and forced-color screenshots await the accumulated approximately30-canonical batch. Discovery and JSDOM are not browser or visual acceptance.

This is a skip-ci source/generated-asset backup. The recommended d370 CDN, delivered demo and verified53 count are unchanged. No branch protection, permission or mandatory security checks were disabled.
