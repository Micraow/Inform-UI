# Inform UI 2 component contract

This is an integration-ready contract prototype for the OpenUI-based Inform UI rewrite. It has no `iui/1` compatibility layer. End-user delivery remains a prebuilt browser bundle plus authored DSL; package installation is a maintainer workflow.

## What is implemented

- One trusted `ComponentDefinition` relates an ordered strict Zod schema, renderer adapter, pure semantics, docs, validated supplied-data fixtures, DSL examples and capability limits.
- A closed profile is assembled by `buildProfile`. It rejects duplicate/reserved names, parameter-order drift, loose object schemas, unknown/cyclic dependencies, base-to-domain dependency inversion, dangling schema references and unbound selected renderers.
- Schema and runtime-resource dependency closures are separate. Layout slots are compiled against the selected profile, so a base layout does not depend on every domain module.
- Upstream OpenUI `defineComponent`, `createLibrary`, `toJSONSchema`, `generatePrompt`, `schemaSignature`, `tagSchemaId` and `markReactive` are directly reused from the pinned source. `orderedProps` checks Zod property order; it does not define another DSL or parser.
- `componentRules` exports ordered props, bounded child slots, binding props, action props and complete-value validation to the parser/state owner.
- `Series`, `Slice` and `Point` are data constructors in `$defs`. They have their own validators, never appear in `schema.properties`, and cannot be rendered as UI children.
- Build-time artifact generation emits schema, prompt, signature metadata, docs and a SHA-256-linked manifest from the same selected profile.
- 22 component definitions are supplied. This package provides two actual DOM adapters, Text and BarChart. The foundation integration must supply the other adapters. Registration-only adapters in tests are explicitly unusable for rendering and are never generated or published.

## Entry points

- `src/types.ts`: framework-neutral contract and narrow renderer context.
- `src/catalog.ts`: base/layout/control/chart/domain definitions and resources.
- `src/registry.ts`: dependency closure, upstream library assembly, strict rules and prompt.
- `src/representative-adapters.ts`: real Text and BarChart DOM adapters.
- `scripts/artifacts.mjs`: `generateArtifacts(profile)` returns generated file contents for a trusted, fully bound profile.

Typical integration:

```ts
const modules = createCatalog({ adapters: foundationAdapters, iconNames: bundledIconNames });
const profile = buildProfile({
  id: 'inform/default-v2',
  root: 'Stack',
  modules,
  resources,
  select: ['base/layout', 'base/controls', 'base/icon', 'base/media', 'base/charts', 'domain/weather'],
});
// The parser owns state and lifecycle. It accepts profile.schema,
// profile.componentRules and profile.dataShapeRules directly.
```

No document can supply a renderer, resource URL, schema implementation, validation hook, module factory or loader. Those are trusted build-time JavaScript. This metadata is not a sandbox for malicious JavaScript plugins.

## State, bindings and action ownership

There is exactly one state owner, the strict parser/runtime package. The component contract does not instantiate a store.

- Evaluated props contain ordinary scalar/array/object values.
- `ElementNode.bindings[prop]` contains a runtime-issued opaque binding handle. A renderer calls `context.writeBinding(prop, value)`; it must not guess a path from displayed strings.
- Action props contain runtime-issued opaque handles. `validateProps` requires `options.isActionHandle(handle)` for every action field and otherwise fails closed. Only the runtime's private identity registry can answer this check. Matching an object shape or copying an ID is insufficient.
- Every state transaction evaluates and validates the entire next snapshot before commit. Failed updates roll back; the renderer preserves local draft/focus state as appropriate.
- Partial previews cannot change state, dispatch actions, create network requests or commit a tree.
- `StatePort` is a host-internal capability interface, not a document API. Do not expose direct state paths to generated content or use it to bypass runtime validation.

A DOM adapter returns `{element, dispose}`. A React adapter can supply `{kind:'react', key, component}` to the same registration system; a trusted React root adapter must mount it, use the same evaluated props and dispose it with the owning generation. This prototype does not include the React mounting bridge or pretend an upstream React chart is a DOM renderer.

## Validation and CSP

The parser must preserve and reject syntax errors, incomplete input, excess args and unknown names before materialization can discard information. This package deliberately does not wrap upstream's permissive materializer and claim that validating its cleaned result is enough.

`validateProps` validates complete evaluated values. It rejects unknown keys, dangerous prototype keys, getters, non-JSON values, finite-number violations, invalid child slots and semantic cross-field failures. Static semantics also run on evaluated validation. The final tree validator is a display-data utility; authenticated action trees should be validated by the runtime, using each component rule with its private action verifier.

Validation walks use a shared operation budget. `createBudget` is a validation budget, not a replacement for parser/evaluator limits, output-size limits or worker termination. Individual prop schemas are bounded. The runtime must budget expression steps, loop iterations, copies, comparisons and output growth separately.

`src/zod.ts` executes `z.config({jitless:true})` before schema creation. Calls to `safeParse` also explicitly pass `{jitless:true}`. The CSP test imports the bundle and creates schema/prompt/validators with Function and eval disabled, and asserts zero dynamic-code attempts. This is an interpreted strict validator, not an ahead-of-time generated standalone validator. Keep this initialization and the test when integrating with other schema packages.

## Prompt behavior

The upstream prompt generator is used with `toolCalls:false`, `bindings:true`, and `builtinFunctions:true`. Local security rules are supplied through its normal `additionalRules` hook. Three upstream prose statements about permissive fallbacks are corrected to match the strict Inform runtime. There are no registered tool providers or automatic host-service permissions.

The language grammar is upstream OpenUI. Inform's strict runtime deliberately rejects undeclared state, malformed syntax, non-finite arithmetic, division by zero, prototype access and unsupported external actions. Equality/inequality use strict scalar comparison; logical operands are booleans. String sorting is deterministic and numeric/string sort keys cannot be mixed. Filter relational operators use numbers. `@Each` has a named item and inline template, without an index or JavaScript lambda. `$value` is reserved for assignment-binding input. It does not silently inherit upstream's permissive numeric coercion or content pruning. These are documented semantic restrictions, not an unrelated same-named DSL.

## Coverage and deliberate gaps

Implemented definition groups:

- base: Text, Heading, Badge, Divider, Alert, Table, Icon, Image
- layout: Stack, Row, Grid, Card
- control: Button, Input, Textarea, Select, RadioGroup, Checkbox, Switch, Slider
- chart: BarChart
- domain: WeatherCard

The representative BarChart draws finite positive, negative and zero values with a zero baseline, SVG labels/tooltips and an accessible data table. It is an Inform adapter, not copied OpenUI React chart rendering code. Browser visual/responsive/interaction QA belongs to the integrated foundation bundle, and is not claimed by the JSDOM tests here.

The other OpenUI chart families and condensed variants are intentionally absent from this package until their real adapters and contracts are supplied. The chart-extension package can replace `base/charts` atomically, reuse or extend `base/chart-data`, and pass its real DOM/React adapters. Never register placeholder charts to inflate coverage. `Slice` and `Point` being available as data does not imply Pie or Scatter renderers exist.

The generated `inform/representative-2` profile contains only two bound renderers. It is proof of same-source generation, not the full product release or a published CDN asset.

Not included here: browser host/mount lifecycle, parser/expression interpreter, production React bridge, network services, runtime code-splitting, full 219-node migration, no-build HTML-shell delivery or AOT validator output.

## Checks

```sh
npm ci --ignore-scripts
npm run check
```

Dependencies are pinned. Installation scripts are disabled; upstream telemetry is an unconditional no-op in the retained source closure. `npm run check` runs strict TypeScript, Node contract/CSP tests, real Text/BarChart JSDOM checks and representative artifact generation. Read `THIRD_PARTY_NOTICES.md` before distribution.
