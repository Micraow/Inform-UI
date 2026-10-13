# Third-party notices

This package adapts original MIT-licensed Inform-UI renderer routines. Its public source baseline is recorded in generated/provenance.json. The new adapter, state, lifecycle, resource-policy and shared-foundation bridges are original project code under the same MIT license. No private captures, user data, service credentials or internal working notes are included.

- OpenAI Apps SDK UI official icon geometry is supplied by the host's pinned 755-icon catalog. This package selects canonical names and does not contain a substitute icon font or hand-drawn UI glyph set. Copyright 2025 OpenAI; MIT license in vendor/OPENAI-APPS-SDK-UI-LICENSE.
- KaTeX 0.18.2 is used with trust:false, strict:error and bounded expansion for math display. Official CSS and unmodified WOFF2 fonts are embedded in src/math.css; selectors are scoped to .if-domain-view. Copyright Khan Academy and contributors. MIT license in vendor/KATEX-LICENSE.
- lottie-web 5.13.0, Copyright Airbnb, is vendored in src/internal/renderer/lottie-player.generated.js. The original wrapper disables expressions, auto-loading of segments and autoplay, owns animation resources, and has been extended with explicit host URL gates. MIT license in vendor/LOTTIE-WEB-LICENSE.

The host supplies its shared typography, control primitives and icon catalog. Their licenses remain in the host distribution. Dependency versions are pinned in package.json; development tools retain their upstream licenses.
