# Architecture

Inform UI is an independent, vendor-neutral JavaScript / TypeScript library. Browser rendering requires no OpenAI account, API, service or private runtime.

## Inform UI 2

The DSL implementation separates five responsibilities:

1. `component-contract` defines strict ordered props, metadata, schema, generated prompts and renderer contracts.
2. `parser-runtime` parses the OpenUI-derived language and owns bounded local evaluation, state transactions, bindings and actions.
3. `src/v2/foundation` supplies theme tokens, shared controls and layout primitives.
4. `chart-extension`, `view-contracts` and `domain-view-renderer` provide charts and composed domain views.
5. `src/v2/host.ts` owns DOM lifecycle, revision-safe events and the mount / update / dispose boundary.

The browser entry assembles a trusted profile. Authored DSL cannot provide renderers, JavaScript callbacks or automatic service permissions. See the [language contract](v2/dsl-compatibility.md).

## iui/1 compatibility

The original JSON contract remains available through `src/core`, `src/renderer`, the generated schema, HTML compiler and CLI. It is a separate input format; JSON nodes are not DSL component calls.

The DOM renderer owns layout, CSS tokens, controls, SVG and MathML. The compiler packages the same implementation into standalone or shared-resource HTML. Schema recognition alone is not a claim of working rendering or connected services.

## Authoring and integrations

The [authoring Skill](https://github.com/Micraow/Inform-UI-skill) is a separate repository. It consumes a matching generated contract and runtime instead of duplicating the language implementation. Host applications own external data and actions; the core library renders supplied data and performs bounded local interactions.

MIT-licensed public dependencies and assets retain their source and license notices. Private captures, credentials and unknown-license runtime code are excluded from the project.
