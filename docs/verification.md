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
