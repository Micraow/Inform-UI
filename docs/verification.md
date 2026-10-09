# Verification status

This first implementation is under active validation. Check the exact commit's GitHub Actions result before treating it as browser-verified.

- Fixtures are original synthetic examples; reference screenshots and private assets are not part of the repository or CI.
- Unit tests cover schema/semantics, expression evaluation, security boundaries, state changes, DOM lifecycle, compiler determinism, and CLI behavior.
- Real Chromium tests cover offline inline CSP, shared resources, interaction and chart gaps, themes and mobile widths, and update/dispose behavior.
- Browser screenshots are generated for manual visual inspection. There is no claim of pixel equivalence with the reference UI.
- Linux Node 22 is the initial CI target. Local development also uses Node 24. Windows/macOS, Firefox/WebKit, screen-reader audits, and formal performance budgets remain unverified.
- Native/private widgets and live service integrations are not implemented or included in this validation scope.

## Recorded evidence

The initial implementation commit `69484d0a1ad01eef45cb1498e2eec434515d6e0e` passed 31 Node/DOM/CLI tests and 7 Chromium test cases in [Actions run 37760721846](https://github.com/Micraow/Intelligent-UI/actions/runs/37760721846). Those browser cases cover 20 fixture/theme/width views plus interactions. Manual screenshot inspection identified compressed slider endpoint labels and insufficient prose spacing; the next revision adds geometry assertions and fixes both. Runtime dependencies were also updated to Ajv 8.20.0 and KaTeX 0.18.2; the local production-dependency audit then reported zero advisories. Consult the PR checks for the newer revision’s result.

## First domain increment — source checkpoint

Source `e6cad9c349e71af8ec64b11aa0f586612e1f08ff`, runtime asset commit `9a79f226701584fa01fd7823ae981e7a10d26c4c`: [run37806665644](https://github.com/Micraow/Intelligent-UI/actions/runs/37806665644) passed 91 Node/DOM/CLI tests and 55 Chromium tests. These include 390/768/1100 light/dark forms, numeric/time geometry, weather dates/units/DST/null data, local submission/cancel/retry lifecycle, and actual Noto CJK and KaTeX glyph use. Synthetic desktop/mobile screenshots were inspected.

The earlier six form-view failures were an ambiguous test selector matching both the form status and native slider output; they remain in run37805856285. Runtime code was unchanged by the selector correction. The full 41-node CDN composition has a separate file:// network/interaction test (`phase-one-cdn.spec.mjs`); its exact workflow result is the evidence for the promoted CDN, beyond the HTTP preflight. Sports, quiz/flashcards, finance and the complete component-gallery site are still pending.

A follow-up public-API review reproduced four supported-input edges: intermediate tick overflow for finite 1e308 spans, small y-domain labels rounded to zero, time readouts omitting DST offsets/seconds, and native string normalization differing from submitted state. These are now covered by focused regressions and corrected generically; no synthetic fixture values were changed to conceal them. The local suite now contains 95 tests.

## Inform UI: 52-node contract and heatmap input modes

Source/preview b5664a8, fixed CDN assets 4b6c1f0: [run37878019661](https://github.com/Micraow/Inform-UI/actions/runs/37878019661) passed 167 Node/DOM/CLI and 136 Chromium tests. The new Inform-UI GitHub CDN paths were fetched with exact hashes, MIME and CORS checks. Browser tests use fresh file:// pages with cache disabled and no local-runtime fallback. Converters cover nine unit categories, absolute/difference temperatures, supplied-rate snapshots and six CDN viewport/theme views. Heatmap screenshots measure all four edges at DPR1/2 and integer/fractional sizes, including keyboard-to-pointer transitions; data rectangle areas remain unchanged. Financial and converter light/dark screenshots were inspected. This is bounded functional acceptance, not a claim of complete reference-product coverage or pixel fidelity. Historical failing runs and frozen first drafts remain intact.
