# DSL component showcase

Browse the registered DSL components, try original compositions, edit their source and download `.openui` examples.

## Run locally

Node.js 22 or newer is required:

```sh
npm ci --ignore-scripts
npm run showcase:next
```

Open `output/next/Inform-UI-Next-All-Components.html` directly. This generated file embeds the runtime, styles, sample data and license notices; it does not need a local server or a moving CDN URL.

## Explore and edit

1. Search for a component or select a composition from the sidebar.
2. Choose **Show DSL** to inspect and edit the source.
3. Choose **Run** to commit the complete source, or **Preview** for a passive partial preview with interactions disabled.
4. Choose **Reset** to restore that example's original source and state.
5. Use **Download DSL** to save the source as an `.openui` file.

The light/dark control switches the current theme. The **Icons** panel searches the bundled glyph catalog and copies an `Icon(...)` snippet. **Agent prompt** displays authoring instructions generated from the same component definitions used by the runtime.

The evaluated tree and downloadable Schema JSON are inspection aids, not alternative public input formats. Use the DSL source for new interfaces. Check or build a downloaded file with the [CLI](api.md), or embed it using [the browser API](v2/quick-start.md).

## Boundaries

- Component and icon counts describe registered catalogs; they are not a promise that every combination has passed browser acceptance.
- Examples use original, illustrative content and supplied data. Their local actions do not book, pay, send messages, connect accounts or execute tasks.
- The bundled native video is original repository media. Service-reference components do not grant third-party playback or account access.
- Medical and scientific examples are bounded software demonstrations and must not guide diagnosis or treatment.
- Downloaded source does not include a live session's current state unless that state was explicitly written into the DSL.

The historical studio and JSON fixtures elsewhere in the repository are retained for internal renderer regressions. They are not the public authoring workflow.

## Checks and source

`showcase-next/` owns the showcase UI and compositions. `scripts/build-v2-showcase.mjs` validates the example DSL with the selected profile before writing the standalone file. Integration tests live under `tests/v2/`; see [development](development.md) for the full check commands.

Parser, Node and DOM checks do not replace actual browser interaction, accessibility or visual review. Attribute verification results to the exact commit and scenarios that were run. Original public screenshot provenance is recorded in [the asset notes](assets/v2/README.md).
