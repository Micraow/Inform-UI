# Inform View contracts

New OpenUI DSL contracts for the public Inform 219-node baseline. This package owns definitions, strict supplied data, slots, local action/binding declarations, pure domain validation, and generated examples. It does not implement renderers or an old document compatibility runtime.

## Inventory

- 219 unique old-type decisions: 23 map to existing base component contracts, 174 become domain/content Views, 21 become policy-gated host-boundary Views, and `native` is refused.
- 195 new View definitions, 195 strict named data constructors, eight `views/*` modules.
- 195 complete example programs pass the same new-DSL parser/runtime as production.
- 101 public Inform pure inspector/helper source files preserve domain constraints. The old document validator, expression parser, state owner, and renderer are absent.
- Actual adapter binding, real-browser checks, and public-base decomposition are separate evidence fields. This contract-only package claims zero completed renderers and zero completed decompositions.

## Integration

Copy this package to `packages/view-contracts`. Resolve `@inform/component-contract` to the sibling `component-contract/src/index.ts`, and `@inform/component-contract/zod` to its `src/zod.ts`. Both must share the same physical dependency and Zod metadata registry as the host. Do not combine independently bundled copies of the contract library: that loses metadata used to export conditional JSON Schema.

Use `createViewModules({ adapters })` with adapters keyed by each new DSL name. Append those modules to the base/chart modules, and append `viewResources` to runtime resources. The shared `buildProfile` rejects every unbound adapter. `includeHost: false` excludes the 21 host-boundary Views; `names` provides explicit component selection.

Each View takes `data` first. The strict data constructor is optional syntax: an equivalent literal record is validated identically. A child `children` array is a real DSL slot, never embedded old document JSON. Exact positional order, module, data schema, slots, actions, and bindings are in `generated/migration-map.json` and `generated/signatures.json`.

`viewExamples[name]` includes a complete program, pure display props, and any local action expressions. Do not pass the action-expression strings as runtime handles. Commit the program to obtain genuine revision-owned handles. `ComponentDefinition.examples[0].source` is the same generated program, rather than a second handwritten sample.

## Deliberate contract changes

- Old `type`/`id` envelope, state-name `bind`, and embedded `{$: ...}`/`{op,args}` expressions are not accepted. Expressions belong to the OpenUI DSL and arrive as evaluated data.
- `RatingView.value` and `SegmentedView.value` are the two verified writable View binding props. Other initial/expanded/masked fields remain supplied data; intrinsic local interactions are not presented as externally writable bindings.
- `ChecklistView.data.items[].bind` becomes optional boolean `checked`.
- `FormView.onSubmit` and `PressableView.onPress` are runtime-issued local actions. Their old action-name fields are removed. Other query/action identifiers inside data are inert descriptions and never grant host authority.
- `TabGroupView.data.initial` becomes integer `initialIndex`; it must select an enabled panel in the real child slot.
- `LabelView.data.target` is a display-only supplied association label. It cannot resolve an old authored DOM ID.
- Mixed old list items become scalar `data.items` plus an explicit component `children` slot.
- Embedded domain snapshots are supplied records, not renderer nodes. The semantics adapter supplies only a transient validation descriptor; it does not build another state store.
- Comment recursion is bounded to six recursive data levels; animation JSON is bounded to eight. All validation and parsing also retain global resource budgets.
- The old generic `chart` maps by kind to new base chart contracts with new native props. `BarChart` in the migration row is a representative target, not a converter for all old chart shapes.
- A host-boundary definition does not imply a working service, account mutation, upload, voice call, location grant, external request, or active HTML renderer. The host decides capabilities and permissions explicitly.

## Artifacts and verification

`npm run check` runs strict TypeScript, the whole regression suite, the same suite under `--disallow-code-generation-from-strings`, then generation. The suite includes 195 runtime commits, unknown/legacy data rejection, action forgery, binding rollback, conditional schemas, unsafe URLs/SVG, and cross-field domain constraints. Node test isolation is disabled because the execution sandbox's child test-process path terminates without a test diagnostic; the identical tests pass in the main process.

Generated JSON Schema preserves `oneOf` and `if`/`then`/`else` using the same data definitions' metadata, while the strict Zod record and bounded interpreter enforce them at runtime. Pure domain inspectors additionally enforce constraints that cannot be expressed as JSON Schema. Running a generic JSON Schema validator alone is not a substitute for the complete profile's semantics.

The full artifact profile uses explicitly named non-rendering registration fixtures. It has one placeholder icon only and is not a production profile. The integration writer must generate its final prompt/schema/manifest from the actual selected bases, charts, 755 canonical icons, and bound View adapters. `createMigrationCoverage(evidence)` accepts integration receipts without inferring completion from registration.

No browser run is claimed by this package. Run the integrated full gallery and interaction suite once after all packages are combined.

## Provenance

Only public MIT Inform schema, pure source inspectors, and synthetic examples are included. The source hashes are in the migration map and `generated/semantic-provenance.json`. The verified YouTube example references the public OpenAI video at https://www.youtube.com/watch?v=DQacCB9tDaw; no video or thumbnail bytes are copied. See `THIRD_PARTY_NOTICES.md`.
