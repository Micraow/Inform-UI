# ADR 001: one independent, vendor-neutral core library

Status: accepted for the initial development milestone, 2026-10-08.

Use a single unpublished JS/TS package with internal layers rather than introducing empty workspace packages. Preserve the project-defined `iui/1` data contract while adding semantic rejection for unsafe/unsupported input. Generate schema, types, and CSP-safe structural validation together.

The DOM renderer owns CSS tokens, layout, controls, SVG, and MathML. The compiler packages this same runtime into deterministic inline or shared-asset HTML. CLI commands call the same core functions. Standalone HTML and embedded DOM are delivery methods of one library, not different product editions.

Independent, vendor-neutral operation is the permanent product direction. No OpenAI account, API, service, or runtime is required. The existing `portable` backend name remains an API implementation identifier; it does not imply a transitional or restricted product. Future visual capabilities belong in this publicly usable implementation. Historical private-runtime bridge experiments are outside the product roadmap; the `native` schema node remains only to reject old input clearly.

A general JS extension API is not exposed. Any future extension must define its security contract and remain independent of proprietary site internals. Optional application data and tool integrations are provider-neutral and do not become prerequisites for the core renderer.

Keep the authoring skill in its separate repository. It must call this validator and lock the tested core revision, rather than fork the schema or validation implementation. No npm package or release is assumed to exist.

Compatibility is explicitly documented by node and user-visible capability. Recognizing a schema node, observing a component in a screenshot, and providing a working service are different claims.
