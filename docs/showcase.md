# Component studio

Browse every current `iui/1` node, interact with a live example, and copy or download the complete JSON used to mount it.

## Run locally

Node.js 22 or newer is required to build the studio.

```sh
npm ci --ignore-scripts
npm run showcase
```

Open **http://127.0.0.1:4175**. Use search or a category to choose a component. Press `/` to focus search and Escape to clear it. Each component has a shareable URL fragment, light/dark preview, Reset, and an activity inspector. Reset and theme changes restore the original sample state.

The gallery includes all **218 canonical schema nodes**: **217 renderable examples** and the deliberately rejected `native` compatibility boundary. The catalog contains **90 source modules**, including shared definition-only modules. These are protocol/catalog counts, not a claim of clinical validation, connected services, or pixel equivalence with any third-party product.

## Use an example

1. Select a component and try its local controls.
2. Choose **Copy JSON** or the download button. The full mounted document includes its `version`, required state, theme and surrounding composition.
3. Validate it with `validateDocument`, then call `mount` in your app or compile it with the CLI. See the [API guide](api.md).

“Mounted JSON” shows the initial document supplied to the renderer. Live control values appear separately under **Local activity**. No schema fields are silently added by an invisible demo wrapper. Contextual nodes keep their necessary host in the displayed JSON: `grid-item` inside `grid`, `tab-panel` inside `tab-group`, and `label` alongside its target control.

**Composition** lists the owner module, declared dependencies, the actual resolved module closure for the example, and every included node type. Component contracts and schema-field lists are available beside the preview.

## Boundaries

- Samples are original, fictional demonstration content. Sample links are captured locally; the gallery does not navigate to them.
- Buttons can update local state or emit visible intent events. They do not book, pay, send messages, connect accounts or execute tasks.
- YouTube uses a fictional ID to show the on-demand control. Its load action is intercepted in the gallery; it does not attempt third-party playback. Production integration follows the [media contract](media-readers.md).
- Supplied images and audio use original repository fixtures. No private reference images, captured runtime or externally licensed photography are included.
- Calculators are bounded software demonstrations. They are not clinically validated and must not guide diagnosis or treatment.
- `native` is structurally recognized but semantically rejected. Its page displays the actual validator error rather than claiming a successful preview.

## Static build

```sh
npm run build
npm run build:showcase
```

`output/showcase/` is a self-contained static directory. Serve or copy that whole directory, including `runtime/` and its license notices, using your existing static hosting. No account setup or deployment is performed by these commands. The browser bundle is built from the same local runtime used for validation; it does not depend on a moving CDN URL.

## Checks

```sh
node --test tests/showcase.test.mjs
npx playwright install chromium
npm run test:showcase
```

The catalog test compares every entry against the canonical schema and source catalog, checks structural and semantic validation, required hosts, dependency closure and the explicit rejection. Browser tests mount every entry at 390 and 1440 pixels, compare displayed JSON with its source, test search/copy/download/reset/history, and capture light/dark views at 390, 768 and 1440 pixels. The tests live in the repository; results must be attributed to the exact version actually run.
