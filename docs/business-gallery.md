# Supplied business gallery

`business-gallery` is one Base node for reading a finite supplied collection of media. It has no search, image generation, upload, provider connection, business verification, rating or account behavior. A visible note states that images and captions are supplied and unverified.

Required: `label` (1–200 characters) and `images` (1–12). Each image has a unique key `id`, `src` (1–500,000), and nonempty `alt` (1–2,000). Optional image `caption` and node `description` permit 2,000 characters. All text is literal. Unknown fields and expression objects are rejected. Local image IDs are scoped to the gallery. All lengths count Unicode code points.

`src` uses exactly the ordinary `image` node's URL policy: allowed HTTP(S) URLs or supported base64 PNG/JPEG/GIF/WebP data. SVG and HTML data, credentials, relative paths and malformed URLs stay rejected. This does not verify the destination, license or decoded bytes.

The semantic section contains an ordered list of figures, using a responsive CSS grid. Each figure invokes the shared image renderer with `fit: "contain"`. There are no thumbnails, backgrounds, preload links, carousel, autoplay, modal or lightbox. No remote `img` or `src` attribute exists until that exact image's Load control is explicitly activated. Each image has independent consent; loading one never loads another. Inline raster data needs no network consent.

The shared image renderer sets lazy loading, asynchronous decoding and `no-referrer` before assigning `src`. Its native Load button rejects inherited disabled/pending fieldsets, hidden or detached controls, synchronous reentry, and stale work after update/disposal. The per-figure caption sits outside its replaceable image content and survives loading and failure. The image retains meaningful alt text; gallery CSS reserves finite layout even for missing/error media. Only actual image load/error events update the diagnostic image status; the component never fabricates successful delivery.

There are no named controls, form values or submission actions. Unrelated state updates retain exact caption/image/consent DOM and focus. Invalid replacement is atomic. Valid replacement and disposal remove handlers. An already authorized in-flight browser image request cannot be revoked by this renderer, but old controls cannot start a deferred request after removal.

See [the original synthetic example](../examples/business-gallery.json), [focused public tests](../tests/choice-gallery.test.mjs), and [prepared browser acceptance](../tests/browser/choice-gallery.spec.mjs). The example includes an original, deterministic 2×2 PNG checker swatch generated from project-owned RGB bytes; the external hosts are synthetic `example.invalid` paths. Browser tests route those synthetic URLs locally. Browser acceptance has not been executed in this isolated candidate, and no real third-party media was requested.
