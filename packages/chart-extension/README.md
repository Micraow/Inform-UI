# Inform chart extension

Actual MIT OpenUI React/D3 charts from revision `cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7`, adapted to the unified Inform component contract. Fourteen implementation families are included. `HorizontalBarChart` and `SingleStackedBar` are additional public names for an existing family; data constructors do not count as charts.

## Browser use

`dist/inform-charts.js` is a self-contained classic-script/IIFE bundle exposing `InformCharts.chartModules`, `chartResources` and `chartAdapters`. Include `dist/inform-charts.css`. It contains React, D3 and the actual source closure, with no CDN/network imports or telemetry. The browser user needs no bundler.

`dist/esm/inform-charts.js` is the optional split ES-module build. Its React/D3 shared chunks and per-family lazy renderers are requested only when the chart extension/profile is used. Ship its sibling `chunks` directory. The eager build is intended for single-file, offline HTML. `src/definitions.ts` has no React dependency; all schema, prompt, docs, examples and semantics derive from these definitions.

## Host integration

1. Remove the temporary `base/charts` and `base/chart-data` modules from the foundation catalog and append `chartModules`.
2. Remove the temporary `inform/charts` resource and append `chartResources`.
3. Select `base/charts` only for a chart-capable profile. The host remains owner of the sole DSL/runtime state store.
4. A chart renderer is a normal `kind: "dom"` adapter. `create(props, context)` returns `{element, dispose}`. Append the element and call `dispose()` before removing or replacing it. The bridge owns and unmounts its React root; it never creates another DSL store.
5. In the standalone source tree, the two type-only contract imports refer to the sibling contract package. Adjust those imports to the host contract path when copying the source. Tests also use sibling parser/contract packages and the host foundation tokens; these are integration fixtures, not runtime imports in emitted browser JS.

`npm run build`, `npm run typecheck`, and `node --test tests/contracts.test.mjs` build/verify the package. `node --disallow-code-generation-from-strings --test tests/contracts.test.mjs` verifies the strict-CSP no-Function path. `node scripts/build-gallery.mjs` produces an entirely self-contained offline QA gallery with the real DSL parser and contract.

## Coverage and input behavior

- AreaChart: multi-series, stacked, linear/natural/step, signed values
- BarChart: grouped/stacked, vertical/horizontal, signed values; HorizontalBarChart maps to the horizontal mode
- LineChart: multiple series, interpolation, dots/crosshair/highlight
- HeatmapChart: sequential/diverging scales, cell labels, null/missing cells
- PieChart: pie/donut, circular/semicircular, default/stacked legend
- RadialChart: circular/semicircular, default/stacked legend
- RadarChart: line/area, polygon/circle grids; non-negative values
- ScatterChart: multiple named Point datasets, signed X/Y coordinates
- CalendarHeatmap: actual date grid, sparse days, duplicate-date sums, range, thresholds and level patterns
- FunnelChart: actual upstream curved/straight funnel geometry, horizontal/vertical, staged retention
- SegmentedBar: proportional bar and default/stacked legend; SingleStackedBar is its upstream alias
- MiniAreaChart, MiniBarChart, MiniLineChart: actual upstream compact square sparkline renderers

Data constructors are `Series(name, values)`, `Slice(label, value)`, `Point(x, y)`, `ScatterSeries(name, points)` and `CalendarDay(date, value)`. They are strict data objects, never child components.

Null is accepted only as a missing HeatmapChart cell. Other charts explicitly reject null instead of allowing upstream numeric coercion to turn it into zero. Non-finite numbers, unequal series lengths, duplicate series/slice names, reserved keys, unknown props and unsupported callbacks are rejected. Pie, radial, radar, funnel, calendar and segmented magnitudes reject negative values. Empty input displays an explicit empty state. All-zero part-to-whole charts display "All values are zero" instead of invented equal shares.

All four helper chevrons use the host’s fixed official OpenAI 755-icon registry through a thin React bridge. Lucide is not bundled. Set `INFORM_ICON_ROOT` to the host canonical definitions directory for builds; the bridge never copies or redraws geometry. Helper buttons use the foundation 40/44 px dimensions and focus tokens. Upstream Button/IconButton/Separator skins are not compiled: their React nodes use the same if-button/if-divider classes as the rest of Inform, and chart data tables use if-table. Every upstream chart styling variable used for text, colors, palette, spacing, radius and shadow is bridged from the host Intelligent foundation. Set INFORM_FOUNDATION_TOKENS to that host token module for integration builds.

Every chart has a visible title and expandable keyboard-accessible table retaining all original values. Upstream default and stacked legends have a small, documented Enter/Space, role, focus and pressed-state patch. Pointer hover tooltips are not falsely claimed to provide full keyboard point navigation: the table provides equivalent values. Mini charts intentionally show the most recent values that fit their size, as upstream; their table retains the full series. Animations default off and obey reduced motion. Tooltip portals inherit resolved Inform tokens through the upstream provider without changing the page's global theme.

The DSL deliberately does not expose arbitrary colors, JavaScript formatters/callbacks, external services, shared detached legend stores, automatic downloads or the upstream print/PPTX service. These are capability boundaries, not empty wrappers.

## Provenance

`vendor/openui/SOURCE.json` records source revision, archive digest, per-file hashes and the eight official-icon, accessibility, portal-theme and foundation-class adaptations. `vendor/openui/LICENSE` preserves the upstream MIT notice. `THIRD_PARTY_NOTICES.md`, `licenses/` and the package lock cover the actual bundled dependency closure. No private screenshots, captures, credentials or internal notes are included.

This is working family coverage, not exhaustive upstream-prop parity. `generated/upstream-prop-coverage.json` lists each registered name, its source family, directly exposed options, data/option mappings, and every upstream prop not exposed. For example, arbitrary custom palettes/formatters, min/max geometry overrides, some decorative stroke/corner knobs and detached legends remain outside this bounded DSL. Unsupported options are rejected, not silently ignored.

Current automated checks cover schema/prompt/examples, real-parser integration, strict CSP, finite/null/negative/empty boundaries, 16 actual React mounts with cleanup, and keyboard legend toggles. The DOM lifecycle test uses deterministic mocked layout metrics and is not a visual-browser test. Browser results are recorded separately in `generated/browser-qa-*.json` only after actual Chromium execution.
