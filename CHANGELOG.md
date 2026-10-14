# Changelog

## 2.0.0-alpha.1 — source preview

- **Breaking:** Make DSL source the only public input. Package root, browser and core exports use the DSL runtime; the CLI checks, inspects and builds `.openui` files. Remove the public JSON API and legacy package subpaths without compatibility aliases.
- Build HTML with matching local runtime and license files by default. The package remains private and unpublished.

- Add a compact OpenUI-derived DSL with strict local evaluation, transactional state, bindings and actions.
- Share component definitions across validation, generated prompts and renderer adapters.
- Integrate 233 registered components, theme-aware foundations, charts and domain views.
- Include 755 MIT-licensed glyphs, semantic colors and original composition examples.
- Preserve native controls and supported view state during bound updates; improve chart geometry and input continuity.
- Add a self-contained DSL showcase with editable source and light/dark themes.
- Retain historical renderer fixtures and implementation only for internal regression coverage.

This is an unpublished development preview. Component counts describe the registry, not external-service coverage or complete browser acceptance. See [development](docs/development.md) for the supported checks and [DSL compatibility](docs/v2/dsl-compatibility.md) for language boundaries.

Earlier incremental development records remain available in [Git history](https://github.com/Micraow/Inform-UI/commits/main/).
