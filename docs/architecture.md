# Architecture

Inform UI is an independent, vendor-neutral JavaScript / TypeScript library. Browser rendering requires no OpenAI account, API, service or private runtime.

## DSL public boundary

Authored interfaces are DSL source, conventionally stored in `.openui` files. The package root, browser and core entries expose the DSL runtime, and the CLI checks, inspects and builds the same source format. There is no parallel public JSON API or legacy package-path alias.

The implementation separates five responsibilities:

1. `component-contract` defines strict ordered props, metadata, schema, generated prompts and renderer contracts.
2. `parser-runtime` parses the OpenUI-derived language and owns bounded local evaluation, state transactions, bindings and actions.
3. `src/v2/foundation` supplies theme tokens, shared controls and layout primitives.
4. `chart-extension`, `view-contracts` and `domain-view-renderer` provide charts and composed domain views.
5. `src/v2/host.ts` owns DOM lifecycle, revision-safe events and the mount / commit / dispose boundary.

The browser entry assembles a trusted profile. Authored DSL cannot provide renderers, JavaScript callbacks or automatic service permissions. See the [language contract](v2/dsl-compatibility.md).

## Internal representations and regression support

Parsing and evaluation use structured AST, IR and snapshot values internally. Generated schemas validate component contracts; JSON serialization of these structures does not make them an alternative public input format.

Historical implementations under `src/core`, `src/renderer` and `src/schema` remain available to internal adapters and regression tests. Their retained fixtures and maintenance tools do not expose the former JSON API through the public package or CLI. Schema recognition alone is not a claim of working rendering or connected services.

## Authoring and integrations

The [authoring Skill](https://github.com/Micraow/Inform-UI-skill) is a separate repository. It consumes a matching generated contract and runtime instead of duplicating the language implementation. Host applications own external data and actions; the library renders supplied data and performs bounded local interactions.

MIT-licensed public dependencies and assets retain their source and license notices. Private captures, credentials and unknown-license runtime code are excluded from the project.
