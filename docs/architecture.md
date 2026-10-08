# ADR 001: one portable vertical slice

Status: accepted for the initial development milestone, 2026-10-08.

Use a single unpublished JS/TS package with internal layers rather than introducing empty workspace packages. Preserve the project-defined `iui/1` data contract while adding semantic rejection for unsafe/unsupported input. Generate schema, types, and CSP-safe structural validation together.

The DOM renderer owns CSS tokens, layout, controls, SVG, and MathML. The compiler packages this same runtime into deterministic inline or shared-asset HTML. CLI commands call the same core functions. No native private adapter or general JS extension API is exposed before a real capability/security contract is implemented.

Keep the authoring skill in its separate repository. It must call this validator and lock the tested core revision, rather than fork the schema or validation implementation. No npm package or release is assumed to exist.

Compatibility is explicitly documented by node and user-visible capability. Recognizing a schema node, observing a component in a screenshot, and providing a working service are different claims.
