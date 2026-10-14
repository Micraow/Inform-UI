# Changelog

## 2.0.0-alpha.1 — source preview

- Add a compact OpenUI-derived DSL with strict local evaluation, transactional state, bindings and actions.
- Share component definitions across validation, generated prompts and renderer adapters.
- Integrate 233 registered components, theme-aware foundations, charts and domain views.
- Include 755 MIT-licensed glyphs, semantic colors and original composition examples.
- Preserve native controls and supported view state during bound updates; improve chart geometry and input continuity.
- Add a self-contained DSL showcase with editable source and light/dark themes.
- Keep the existing `iui/1` API, CLI, examples and browser assets available.

This is an unpublished development preview. Component counts describe the registry, not external-service coverage or complete browser acceptance. See [development](docs/development.md) for the supported checks and [DSL compatibility](docs/v2/dsl-compatibility.md) for language boundaries.

## iui/1

The original JSON-based renderer includes schema and semantic validation, DOM/SVG/MathML rendering, local interactions, a standalone HTML compiler and CLI. The gallery contains 219 protocol nodes: 218 renderable examples and the explicitly rejected `native` compatibility node.

Earlier incremental development records remain available in [Git history](https://github.com/Micraow/Inform-UI/commits/main/).
