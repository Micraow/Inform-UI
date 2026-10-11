# Supplied Link family

Three canonical presentations share an original local intent contract: `link`, `link-card`, and `recommendation-link-card`. The first extends an existing protocol node; only the other two add registered types, bringing the protocol registry from154 to156. This does not automatically change canonical completion counts.

## Compatibility and supplied data

The original `link` shape `{value, href}` retains its native anchor and existing navigation policy. It is a distinct variant and cannot mix the new fields. New supplied links use `url` and optional `title` (defaults to the URL), `id`, `disabled`, `status` (resolved by default, pending or failed), and literal `fallback`. A resolved link requires an allowed explicit URL. Unsafe schemes and images are rejected before mounting. Failure without fallback is hidden; pending displays a loading state. The recommendation placeholder is128px high.

Cards additionally display optional `source` and `snippet`. Supplied `faviconSrc` and recommendation `imageSrc` are optional. There is no inferred favicon, metadata fetch, account/provider lookup or impression logging. Inline allowed raster data renders directly. A remote supplied image stays unloaded until the user activates its separate `Load supplied image` button; `loadImageLabel` customizes the label. The existing owned image renderer then handles load/error, hide-on-failure and source release.

Inline `link` can have0–32 passive `children`. It reuses the library's existing passive-content contract, rejects nested interactions and consent-gated remote image children, and keeps an explicit accessible link label. `mobile: true` omits the desktop preview. `hostLink: true` uses the simple host-link presentation without the decorative external arrow or preview. Neither flag enables navigation in the new supplied variant.

## Local host integration

Native buttons with link semantics support keyboard activation. An open action emits `iui:link-open`; the preview copy action emits `iui:link-copy`. Both carry a frozen `{id: string | null, url: string}`, bubble, are cancelable, and do not cross a ShadowRoot boundary. The library never navigates, writes clipboard contents or sends telemetry. A consuming host can explicitly handle an accepted request.

On non-mobile HTTP(S) inline links, focus immediately opens an accessible URL/copy disclosure and pointer hover opens it after150ms. Touch hover does not open it. The exact destination remains accessible even when display text is truncated. Copy has its own local intent; `copyLabel` customizes its text. Escape dismisses the topmost disclosure and restores trigger focus, outside interaction dismisses it, and a shared coordinator prevents unrelated open previews from accumulating. No extra network request is made to create a preview.

Timers, images and handlers belong to the existing render generation. Admission is exclusive before open/copy host reads, events are constructor-safe, and old controls retire on replacement or observed owner removal. Disabled controls, inherited disabled fieldsets and capture cancellation are respected.

## Evidence boundary

The implementation is independently authored JS/TS from observed functional facts. It contains no private captured runtime or reference images. Local tests and source-built consumer checks are distinct from future native/pixel review. The packaged CDN stays on unified154 until a separately identified asset build; current source can be rebuilt with `npm run generate && npm run build`.
