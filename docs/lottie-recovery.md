# Lottie SVG animation

This restoration uses the official full lottie-web5.13.0 engine, not a custom placeholder renderer. The generator verifies the exact upstream engine SHA256134b7463eec8de573fb3c6778c3c13368fb89f336b1b905e752f0be80de6a4c9, disables automatic document scanning and executable animation expressions, and binds resources to the supplied owner document. Upstream license text is included in THIRD_PARTY_NOTICES.md.

Run npm ci, npm run generate, and npm run build. The build regenerates src/renderer/lottie-player.generated.js from the fixed dependency. Preserve the generator, its declaration file, the schema input and package lock; the generated engine file is reproducible and ignored by Git.

The example is an original moving square. Tests exercise actual SVG path generation and seek transforms, paused/running state, first connection and disposal. JSDOM needs a minimal canvas bootstrap adapter for the upstream engine's transparent helper canvas; this does not establish native pixel rendering, animation timing, or external fetch success.

Only explicit supplied JSON/bitmap sources are accepted. Executable expressions, unbounded compositions and unsupported external assets are rejected. The compiler adds only the exact required remote JSON origin. No provider discovery or account integration exists.

## Complete bounded source contract

`media/lottie` registers the original `scripts/lottie-definitions.json` directly. The JSON is the maintained definition source, not a selection extracted from the full output. Use full `validateDocument` for source validation; structural schemas alone do not establish these relational and resource limits.

An inline animation requires a nonempty version string of at most 200 characters; integer width/height 1–4096; finite frame rate 1–240; frame start at least 0 and at most 864000; end at most 864000 and strictly above start; and duration `(op-ip)/fr` at most 3600 seconds. Root layers and assets are each limited to 100. Nonempty external segments and asset slots are unsupported. Font lists must be well formed and may not contain a nonempty external fPath.

Asset IDs are unique strings. A composition asset supplies layers without image path/base path or sid; an image asset supplies a string path, optional string base path and no sid. Its combined source must be an allowed absolute HTTP(S) source or inline PNG/JPEG/WebP/AVIF raster data. Unknown asset references, composition cycles, duplicate layer indices, missing parents and parent cycles are rejected. Supported layer type codes are numeric 0 through 5; strings, null, booleans and other coercible values are invalid rather than silently converted; audio/camera capabilities are rejected. Expanded nested composition cost is at most 2000 layers.

The complete data walk limits visits to 20000, nesting depth to 32, individual arrays to 500 values, string length to 200000 Unicode code points and absolute finite numeric magnitude to 1e9. It rejects cyclic data, reserved object keys, and string-valued executable expressions under `x`. Repeaters require finite copy counts 0–100, with the product of maximum copy counts across encountered repeaters at most 100. These constraints are resource limits, not a claim to support every animation feature.

A source string is limited to 2000000 characters. Supported inline raster data can render directly; supported JSON data URLs must decode and parse and then pass the same data checks. HTTP(S) sources require a bounded CSP-compatible hostname with no credential-bearing or unsupported source scheme. The hostname has at most 253 characters and dot-separated labels of at most 63 ASCII alphanumeric/hyphen characters, starting and ending alphanumeric; numeric IPv4 hosts other than 127.0.0.1 are rejected by this CSP policy, as are IPv6 literals. Remote JSON is fetched and validated through the existing loader; no arbitrary code or external fonts are enabled. Errors use `LOTTIE_SOURCE`, `LOTTIE_DATA` or `UNSAFE_URL` according to the failed source stage.

Expression-valued currentTime must resolve to a finite number within -3600 to 3600; advanceRate within -16 to 16 (`LOTTIE_TIME`). These signed bounds are preserved, not narrowed to positive-only playback. Theme-specific LearningViz sources reuse this contract and add their own field requirements. Resource disposal and compiler CSP policies remain required alongside schema validation.
