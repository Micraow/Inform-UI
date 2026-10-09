# Four local enhancements awaiting combined acceptance

This is a local implementation checkpoint, not a new browser/CDN acceptance. The verified total remains53/256; four canonical components are implemented pending verification, eight remain partial and191 unimplemented. There are still66 protocol node names: these changes extend existing carousel/code/chart/input nodes.

- base-carousel: bounded native navigation and stable child DOM/state. [Contract](carousel.md).
- code-block: explicit trusted copy, original finite highlighting and exact source text. [Contract](code.md).
- base-pie-chart: single-series solid sectors, known-value percentages and zero/null exact rows. [Contract](pie.md).
- base-checkbox: native boolean field using the existing complete Forms lifecycle. [Contract](forms.md).

The same checkpoint aligns all12000-character value limits with JSON Schema Unicode code points. Whole-document and resolved-evaluator budgets remain at two million UTF-16 units; oversized updates reject atomically. Native HTML minLength/maxLength remains a separate UTF-16 field constraint.

## Local evidence

Final integrated npm run check passed:439/439 Node tests, canonical generation, core/browser/standalone and CDN build, strict TypeScript, consumer declarations and source-boundary checks. The independent original12000-codepoint failure control was rerun unchanged apart from module paths and now passes. The first integrated run caught one newly added test selecting the plain code block instead of the enhanced block; the corrected focused6 tests passed. No runtime workaround or weakened assertion was used.

Prepared browser inventory:294 cases. Five original consumers add30 light/dark views at390/768/1100; scripts and JSON were copied with exact SHA256 checks. These have not been executed in a browser. Existing verified53 and their historical run results remain separate.

Remote full CI is deliberately deferred until approximately30 actual canonical components accumulate. Small local freeze/skip-ci commits remain useful for review and rollback. No current CDN URL, SRI lock, final demo or Library delivery was repinned for these candidates. Native layout, pointer/touch/keyboard behavior and original screenshots still require the final combined browser/visual acceptance.
