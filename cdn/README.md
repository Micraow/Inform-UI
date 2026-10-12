# Inform-UI browser assets

This snapshot contains 214 registered protocol nodes and 209 implemented software components. Use all JavaScript, CSS, schema, fonts and integrity metadata from the same immutable commit. The corrected-age component is bounded date arithmetic, not a clinically validated assessment or treatment tool.

- `iui.min.js`: self-contained ES module.
- `iui.global.min.js`: classic script exposing `window.IUI`.
- `iui.css`: external styles, including relative bundled KaTeX fonts.
- `iui.schema.json` and `schema/`: complete protocol and discovery subsets.
- `integrity.json`: byte lengths, SHA-256 and SHA-384 SRI for all 52 assets.

The browser API provides `validateDocument`, `mount`, update/dispose and state controls. `compileHtml` is a Node API. JSON documents are not uploaded by this library; optional supplied remote media may require explicit host permission. Initial delivery from a third-party CDN itself requires a network request.

Use a verified full commit SHA, for example `https://cdn.jsdelivr.net/gh/Micraow/Inform-UI@<full-commit>/cdn/iui.global.min.js`. Never mix assets from different commits. Repository publication and third-party CDN cache availability are separate checks.

Rebuild with the pinned lockfile: `npm ci && npm run generate && npm run build && npm run build:cdn`. JavaScript includes licensed dependencies identified in `THIRD_PARTY_NOTICES.md`; fonts and their license are bundled. The library requires no OpenAI account or service.

Validation records are version-scoped. This candidate follows the previously validated 933 snapshot and adds the two host-form reset repairs and bounded date arithmetic. For the exact 214 assets, independent validation passed all 52 byte/hash/SRI checks and 15 focused real-Chromium cases. Consumer validation passed 12 positive and 8 negative schema cases per ESM/global entry, 8 combined DOM flows, and a real standalone document. These are focused results; historical full-suite counts are not new runs.
