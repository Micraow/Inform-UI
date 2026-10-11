# Supplied sections and visual collections

These two original components implement observed functional branches with explicit data. They do not resolve provider records, navigate, send messages or execute entity services. They add two protocol types; canonical completion still requires independent functional review.

## Tabbed section

`tabbed-section` requires a nonblank `label` and0–24 `tabs`. Each tab has unique `id`, nonblank `label` and `title`, plain string `content` up to12000 characters, and optional `disabled`. `activeId` must name an enabled tab; otherwise the first enabled tab is selected. `vertical` selects the left-column presentation instead of the horizontal wrapping row.

The content uses the library's bounded Markdown parser with passive output: headings, emphasis, code, lists and quotes are text formatting; links become labels, HTML remains literal, and images do not fetch. The active panel alone is rendered. Tab roles, labelled panels and roving focus support Left/Right (Up/Down vertically), Home/End and native button activation. Disabled tabs are skipped. Modified or composing key events remain host-owned.

A proposed selection emits frozen `{id,index}` through the local cancelable non-composed `iui:tabbed-section-change` event. Canceling preserves the active section. It never submits an outer form. Native reset respects cancellation and later input, including when disabled sibling tabs exist. Replacement and permanent owner retirement invalidate old controls.

`status` is resolved by default, pending or failed. Pending uses a160px placeholder. Failure renders optional literal `fallback` or hides the component. An empty resolved collection remains an empty section.

## Visual card carousel

`visual-card-carousel` requires `title` and0–24 `items`. Every item has unique `id` and an accessible `label`. Optional display fields are `title`, `query`, `caption`, `subtitle`, `source`, `metadata`, `reason` and `summary`. Optional `image` is the existing supplied `SearchImageRecord`; its explicit full source is preferred by the owned image renderer. An actual image must contain an allowed content or thumbnail URL. Without an image, `imageLoading: true` shows a placeholder, otherwise an absent-image glyph is shown.

Each card is160px wide with a2:3 image slot. Its text may be passive, or request `url` / `entity: {id,kind}`. When both are supplied, the entity branch takes precedence. Activating text emits `iui:visual-card-action` with a frozen `{id,kind:'open-url',url}` or `{id,kind:'open-entity',entity}`; the nested entity record is also frozen. Both events are local, cancelable and non-composed. No URL or entity operation is automatically executed.

Activating an image emits frozen `{id,index}` through `iui:visual-card-image`. Canceling prevents a viewer. `viewer:'intent'` leaves accepted requests to the host; the default `local` uses the existing explicitly local-basic viewer with previous/next, Escape, focus return and source release. Optional `viewerImages` provides a distinct finite gallery; every illustrated item then needs a valid `imageIndex`. Without it, the gallery is the ordered set of supplied card images. Remote images are only those explicitly provided in the document; no URL discovery, analytics or inferred favicon request occurs.

The native horizontal rail preserves card DOM. Measured positions control previous/next availability; arrows and unmodified rail keyboard navigation reveal existing cards without cloning or autoplay. Home/End reach the collection edges. `mobile: true` hides arrow controls while native scrolling and keyboard access remain available. Resize uses the existing mount binding and owned listeners, not another component observer.

Pending uses a350px placeholder; failed fallback and resolved-empty are distinct. Global/item `disabled` states block requests. Images and local viewers retire with the shared generation on update, disposal and observed owner removal.

## Acceptance boundary

The source checkpoint has ordinary functional, cancellation, keyboard, reset, geometry and lifecycle tests. It is independently authored JS/TS; no private captured implementation is included. The last packaged CDN remains unified154. Real browser and reference-pixel acceptance apply only to separately fixed builds; source checks do not upgrade those results.

Query-only cards use the supplied query as visible title when title is omitted. This is an original accessibility/content completion of this API; the observed reference used query for accessible image labels, not as its visible title fallback.
