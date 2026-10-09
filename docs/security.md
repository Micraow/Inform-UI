# API and security model

`iui/1` is data, never executable source. Content text is inserted through text nodes. The only HTML sink is KaTeX's generated visual HTML plus accessible MathML with `trust:false`, bounded expansion/size, and strict parsing; model HTML never enters that sink directly. Unsupported TeX falls back to visible source.

## Validation

The JSON Schema is generated from `scripts/generate-schema.mjs`. TypeScript declarations and the Ajv standalone validator are generated in the same step. CI rejects drift. Browser code imports the already generated validator, avoiding runtime `new Function` and allowing a script hash CSP without `unsafe-eval`.

`validateDocument(input)` returns `{ok:true,document}` or `{ok:false,issues}`. It accepts plain JSON values only; custom prototypes, accessors, cyclic objects, reserved keys, nonfinite numbers, and excessive values/text/depth are rejected before Ajv traversal. Semantics additionally reject unknown references, computed cycles, bad operator arities/types, numerical errors, duplicate IDs, unknown state bindings, broken topology endpoints, malformed table widths, invalid chart data, and unsafe resource declarations.

`evaluateValue(value,state,computed)` evaluates a constrained expression and throws on invalid input. `evaluateState(document,override)` returns validated, frozen state/computed results or issues. Controller state updates use this checked path. Numeric operators do not coerce strings. `if` is lazy at evaluation but both branches are inspected for references and types; runtime arithmetic errors still reject the state transition.

Limits include 64 JSON nesting levels, 2,000 node-like objects, 50,000 values, a two-million-UTF-16-code-unit text budget (including JSON keys, retained across merged state updates), and schema-specific row/series/child limits. These limits reduce resource exhaustion; they are not a promise of fixed latency for every valid document.

## Browser boundary

No raw HTML, CSS, JS, callback, import, network action, form submission, or arbitrary AppBlock is accepted. SVG uses a fixed shape list and numeric/color/geometry attribute allowlists. `native` is recognized solely to report `UNSUPPORTED_NATIVE`. It does not load an adapter.

Model URLs are limited to the documented link/image policy. Remote images require a reader action and use no-referrer. URLs still lead to third parties when a reader activates them; validation does not certify the destination's content or privacy. Callers handling confidential documents should avoid remote URLs altogether.

Compiled inline HTML applies a CSP containing the exact SHA-256 of its runtime. It blocks network connections, objects, forms, base URL changes, and remote scripts/fonts; font-src data: permits the bundled official WOFF2 fonts. Styles allow inline rules because the renderer writes bounded, host-owned numeric/enum properties. The host browser's CSP remains authoritative for `mount`; pass `styles:false` and serve the stylesheet when embedding under a stricter host policy.

`compileHtml(input,{assets:'inline',backend:'portable',lang})` emits one self-contained HTML file. `compileArtifact(input,{assets:'shared',assetBase:'./iui-assets/',lang})` also returns an asset map with safe relative file paths. Shared output is intended for a static HTTP server; no claim is made for every browser's file-origin shared-script policy. Both reject unsupported backends.

## Lifecycle and scope

Controllers isolate state. `update` validates the complete next document and resets state. `setState` merges a scalar patch, verifies all bindings and derived values, then updates existing nodes without replacing focused controls. `dispose` is idempotent and removes its owned elements, listeners, and resize observer. External DOM edits by the embedding host are outside this contract.

The library does not authenticate users, persist documents, store credentials, run simulations as scientific truth, fetch sources, or verify model-generated facts. Applications remain responsible for provenance, permissions, and their host threat model.

JSON Schema string `maxLength` and evaluated Value/state string maxima use Unicode code points. A Value string accepts at most 12,000 code points, including astral characters, while the independent whole-document resource budget still counts UTF-16 storage units. The resolved evaluation context (state, computed scalars and the evaluated Value) is checked against the same storage budget before DOM creation or refresh; accepted documents therefore do not defer that rejection until rendering. Native form minLength/maxLength constraints retain HTML UTF-16 semantics; they do not redefine the global string contract.
