# Third-party notices

## OpenUI Lang core

- Source: https://github.com/thesysdev/openui
- Fixed revision: `cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7`
- License: MIT. Copyright (c) 2011–2024 Thesys Inc.
- License text: `vendor/openui/LICENSE` (preserved verbatim).
- Original path: `packages/lang-core/src/`.
- Vendored scope: minimal recursive source closure of `library.ts`, `parser/prompt.ts` and `reactive.ts`, including their type dependencies. This is not a complete OpenUI checkout, default component set or runtime distribution.
- Provenance and per-file hashes: `vendor/openui/SOURCE.json` and `vendor/openui/FILES.json`.
- Deliberate patch: `vendor/openui/src/telemetry/runtime.ts` is replaced by unconditional no-op telemetry exports. No telemetry endpoint, environment-based enablement, install script or networking capability is retained in the contract bundle. See `vendor/openui/PATCHES.md`.

The wrapper calls the upstream `defineComponent`, `createLibrary`, `generatePrompt`, `schemaSignature`, `tagSchemaId` and `markReactive` implementations. The wrapper adds Inform metadata, strict validation and dependency checks; it does not define a second DSL grammar.

## Zod

- Dependency: `zod` 4.1.12, pinned in package.json and package-lock.json.
- Source: https://github.com/colinhacks/zod
- License: MIT. See `vendor/ZOD-LICENSE`.
- Zod code is bundled in `dist/index.mjs`; retain this notice and license when distributing that bundle.

Build-only and test-only dependencies do not ship in the browser bundle. Their licenses remain in their installed packages.
