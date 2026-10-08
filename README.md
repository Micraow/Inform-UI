# Intelligent-UI

An open, vendor-neutral JS/TS library for original scientific explanations from compact **`iui/1` JSON**. Any model, application, or person can supply the JSON; this library owns safe rendering, typography, state, equations, diagrams, charts, and responsive layout.

This is an independent project, not an official OpenAI implementation. No captured runtime, private component bundle, or original reference screenshot is distributed.

## One independent library

Intelligent-UI runs without an OpenAI account, API, service, or runtime. Independent operation is the product's long-term foundation.

There is one core library. `portable` is the existing backend's technical name in the API, not a separate edition, reduced-access tier, or temporary bridge to a future OpenAI-dependent product. Standalone HTML and embedding in another webpage are two delivery methods for the same library. Future components should extend the independent public implementation; historical private-runtime bridge experiments are outside this product's roadmap.

中文：Intelligent-UI 是一套面向所有人、可独立运行的公开库，不依赖 OpenAI。`portable` 只是现有 API 中的渲染方式名称；离线 HTML 和嵌入网页是同一套库的两种用法，不是多个产品版本。

## Start locally

Node.js 22 or newer is required for building and the CLI. This package is **not published to npm**; use this checkout. The package.json flag `private: true` only prevents accidental npm publication; it does not restrict access to this public MIT-licensed source. Generated inline HTML can be used without Node.js.

```sh
npm ci --ignore-scripts
npm run build
node bin/iui.mjs validate examples/hpcc.json
node bin/iui.mjs build examples/hpcc.json --out output/hpcc.html --lang zh-CN
```

Open the resulting HTML. Inline output is a single offline file with no remote scripts, fonts, analytics, or service dependency. External images remain placeholders until the reader explicitly loads them.

```sh
# Reuse content-hashed JS/CSS assets across documents; serve this output directory.
node bin/iui.mjs build examples/rtt.json --out output/rtt.html --assets shared
node bin/iui.mjs inspect examples/rtt.json
node bin/iui.mjs doctor
```

`validate --json` prints machine-readable results. Invalid schema/semantics exits 1; file, argument, or JSON parsing errors exit 2. `preview` is not implemented yet; use your existing local static server for shared assets.

## JavaScript API

```js
import { validateDocument, compileHtml, compileArtifact } from './dist/index.js';

const spec = {
  version: 'iui/1',
  description: 'Illustrative values, not measurements.',
  state: { load: 1.2 },
  computed: { window: { op: 'round', args: [
    { op: 'div', args: [100, { $: 'load' }] }, 1
  ] } },
  body: [
    { type: 'title', level: 1, value: 'Explore a feedback relationship' },
    { type: 'slider', label: 'Load', bind: 'load', min: 0.5, max: 1.5, step: 0.05 },
    { type: 'metric', label: 'Illustrative window', value: { $: 'window' } }
  ]
};
const result = validateDocument(spec);
if (!result.ok) throw new Error(JSON.stringify(result.issues));
const html = await compileHtml(result.document, { assets: 'inline', lang: 'en' });
// For shared assets, write html and every relative-path entry in assets:
const artifact = await compileArtifact(spec, { assets: 'shared' });
```

Successful validation returns a detached, deeply frozen document. Errors consistently expose `{code, path, message}`, with JSON Pointer paths. Both compilers validate their input and reject invalid content. `compileHtml` returns a string; `compileArtifact` returns `{html, assets}`. Output is deterministic for the same input, options, and library version.

## Browser API

```js
import { mount } from './dist/browser.js';
const controller = mount(document.querySelector('#answer'), spec);
controller.setState({ load: 0.9 });
console.log(controller.getState());
controller.update(nextDocument); // validate first, reset to the new document's state
controller.dispose();           // detach owned UI and event/resize subscriptions
```

Mount injects scoped styles by default. Supply `{styles: false}` and load `dist/style.css` yourself when the host owns stylesheet delivery. Multiple controllers keep separate state. Invalid document or state updates throw before changing the accepted data. After disposal, further state changes are rejected. API validation and rendering run synchronously; no asynchronous update queue or race-prone fetch is introduced.

See the generated [TypeScript document types](src/schema/document.d.ts), [JSON Schema](src/schema/iui.schema.json), [API/security notes](docs/security.md), and [original examples](examples).

## What is implemented

- 34 recognized node types: **32 rendered, 1 explicit plain-text fallback, 1 rejected native bridge**
- Structural Ajv 2020-12 validation and semantic checks for expressions, cycles, types, state, chart/table/topology data, URLs, and SVG attributes
- Ahead-of-time generated validator; no runtime schema compilation, `eval`, or model-written JavaScript
- Line/bar charts with missing-data gaps, series toggles, and an accessible data table
- Slider, checkbox, select, reset/set actions, and computed metrics
- KaTeX-to-MathML equations, original SVG topology, scoped light/dark styles, narrow-screen layout
- Inline/shared HTML compilation and `validate`, `build`, `inspect`, `doctor` commands

[The node matrix](docs/support-matrix.md) and [52-capability assessment](docs/gallery-capabilities.md) state exactly what is limited, rejected, or requires optional application-provided data/actions. A catalog entry is not a passing test. Scatter/pie charts, a general-purpose app sandbox, React-specific bindings, maps, live search, and media services are not implemented. Optional integrations may use any suitable provider or local data; none require OpenAI. The rejected historical `native` node is a diagnostic compatibility boundary, not another edition or a promised private adapter.

## Development and verification

```sh
npm run check             # generate, build, type-check, unit/DOM/CLI tests, source boundary
npm run test:browser      # Playwright Chromium; install its browser separately if needed
```

CI uses Node 22, Chromium, synthetic fixtures, 390px/desktop layouts, light/dark themes, CSP, repeated input/reset, chart gaps, series visibility, and lifecycle checks. Screenshots are evidence for visual review, not an automated pixel-match claim. No private reference assets are sent to CI.

Local unit/DOM tests run in Node; JSDOM is not a substitute for real-browser layout validation. Windows and macOS are not yet exercised in CI. Native MathML appearance depends on browser/platform fonts. See [verification notes](docs/verification.md) for the latest measured status.

## Architecture and license

A single package keeps the first working vertical slice small: `src/schema`, `src/core`, `src/renderer`, `src/compiler.ts`, and `bin/iui.mjs`. The [authoring skill](https://github.com/Micraow/Intelligent-UI-skill) is maintained separately and validates its examples against this library.

Original source: [MIT](LICENSE). Third-party dependencies retain their licenses; see [notices](THIRD_PARTY_NOTICES.md) and [provenance](docs/provenance.md). npm publication, formal releases, deployment, and proprietary runtime redistribution are outside this milestone.
