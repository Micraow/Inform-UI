# Inform UI DSL browser assets

The current prebuilt DSL runtime lives in `next/`:

- `next/inform-ui.global.js`: classic script exposing `window.InformUI`.
- `next/THIRD_PARTY_NOTICES.txt`: licenses to retain beside redistributed copies.
- `next/runtime-lock.json`: metadata for the checked-in runtime snapshot.

Use [the browser guide](../docs/cdn.md) for the current CDN URL and [the DSL quick start](../docs/v2/quick-start.md) for mounting, state and lifecycle APIs. `InformUI.mount(container, { source, theme })` accepts DSL text; the library does not automatically upload the source or state.

The rolling URL is:

```text
https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@main/cdn/next/inform-ui.global.js
```

`next/` is the current asset directory, not an alternative public API. For reproducible delivery, use a full immutable commit SHA and matching license files. A moving branch is not a version lock, and CDN caches may delay updates. Repository publication, CDN byte verification and real-browser rendering checks are separate results.

Build the DSL implementation locally with `npm ci --ignore-scripts` and `npm run build`. Generated browser files and matching notices are in `dist/v2/`. The [CLI](../docs/api.md) can build `.openui` source into HTML and copy its local runtime and notices for delivery. The package remains private and unpublished.

Other historical assets in this directory support repository regression fixtures; they are not supported public entry points. Runtime use requires no OpenAI account or service. Any permitted remote media and initial third-party CDN loading require their own network requests.
