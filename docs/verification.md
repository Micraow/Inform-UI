# Verification status

This first implementation is under active validation. Check the exact commit's GitHub Actions result before treating it as browser-verified.

- Fixtures are original synthetic examples; reference screenshots and private assets are not part of the repository or CI.
- Unit tests cover schema/semantics, expression evaluation, security boundaries, state changes, DOM lifecycle, compiler determinism, and CLI behavior.
- Real Chromium tests cover offline inline CSP, shared resources, interaction and chart gaps, themes and mobile widths, and update/dispose behavior.
- Browser screenshots are generated for manual visual inspection. There is no claim of pixel equivalence with the reference UI.
- Linux Node 22 is the initial CI target. Local development also uses Node 24. Windows/macOS, Firefox/WebKit, screen-reader audits, and formal performance budgets remain unverified.
- Native/private widgets and live service integrations are not implemented or included in this validation scope.
