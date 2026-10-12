# Existing media and collection semantics

These modules maintain existing components, without adding wire types or runtime services. Full `validateDocument` remains necessary after selected structural validation. Loading/failed states do not exempt supplied hidden/inactive data from checks. Component IDs are document-wide; other ID scopes are specified below. Shared expression and safe-URL contracts remain mandatory.

## Pressable

`foundations/pressable` explicitly depends on `foundations/text`, adding the minimal text/title/caption leaves to its manifest. It does not silently select the whole layout family. Other passive content requires explicit source composition.

The original JSON requires actionId and 1–30 children. The exact recursive passive allowlist is text, title, caption, badge, icon, divider, spacer, box, card, row, col, grid, grid-item, flow, section, figure, metric, image and svg (`PRESSABLE_CONTENT`). Text-run href is forbidden (`PRESSABLE_INTERACTIVE`). Image children require inline allowed raster data; remote consent-gated images are rejected (`PRESSABLE_EXTERNAL_MEDIA`). Ordinary image safety still applies.

Disabled is a shared Value that must resolve to boolean (`INPUT_TYPE`); references use declared state/computed names. Label/description retain structural bounds with no additional trim rule; description may be empty. A native button emits frozen, bubbling, cancelable, non-composed `iui:press` `{componentId,actionId}`. No host action runs automatically. Existing intent admission, disabled/fieldset, ownership and disposal guards remain unchanged.

## Html view

`content/html-view` reads the original JSON definition. Selection/cloning/validation does not parse HTML as schema, mount a frame or evaluate supplied scripts. Empty HTML and structurally valid whitespace-only titles remain accepted; width/height and additional-property rules are unchanged.

At runtime html-view is scriptable author content in opaque-origin srcdoc with sandbox `allow-scripts`; it is not sanitized text. Same-origin, form submission, popups and top navigation are not granted. Frame CSP precedes authored bytes; referrer policy is no-referrer. The exact resource roles remain in src/core/html-view.ts. Scripts permit inline authored code plus cdn.jsdelivr.net, unpkg.com, esm.sh, cdn.skypack.dev, cdnjs.cloudflare.com and cdn.tailwindcss.com. Styles permit inline rules plus cdn.jsdelivr.net, unpkg.com, cdnjs.cloudflare.com and fonts.googleapis.com. Fonts permit data plus fonts.gstatic.com, cdn.jsdelivr.net and cdnjs.cloudflare.com. Connect permits the script origins except cdn.tailwindcss.com. Images/media permit data, blob and HTTPS; workers permit blob. Default, base, objects, form actions and nested frames are denied. These are fixed permissions, not author-expandable policy fields. Schema validity establishes neither safe execution, network isolation nor proof of execution. Source selection does not execute the HTML. The Node compiler uses its existing parse5 parser to hash browser-normalized inline scripts and event handlers, admitting those hashes only for validated rendered HTML-view content. Ordinary documents retain their restrictive policy. Compiled/frame policies remain active constraints; structural validation does not sanitize the content. Replacement or owner retirement removes the owned iframe and srcdoc.

## Async images

`media/async-images` depends on media/readers and its shared Value source. The original JSON's historical SearchImage* and Value copies must exactly equal those dependencies; only AsyncImageGroupNode and AsyncImageNode are newly installed. Definition order remains group then single; node order remains single then group. The manifest includes search-image/youtube as real prerequisites, without reverse slicing a generated schema.

Images is a required 0–20 list. Supplied truthy content_url/thumbnail_url must satisfy safe-image policy (`UNSAFE_URL`), including hidden records. Both sources may be omitted: this is a legal unresolved/failed presentation, unlike Visual cards. No extra title/alt/fallback trim or record uniqueness check is added. Empty display strings stay legal where structurally allowed.

Status defaults to resolved; an explicit Value must evaluate to pending/resolved/failed (`ASYNC_IMAGE_STATUS`). Null is invalid, not omission. Numeric or colon/slash aspectRatio must be finite, positive and <= 1000 (`ASYNC_IMAGE_RATIO`); zero denominators and excessive parsed ratios fail.

Single presentation uses its first record; groups filter records without a source. Owned SearchImage may load supplied images directly. Interactive false removes opening controls, not source loading. Deeply frozen, bubbling, cancelable, composed `iui:image-open` detail is `{images,index,component}`. Accepted activation opens the local-basic viewer; cancellation prevents it. Composed is intentionally true. Existing updates, source retirement and owner/disposal guards remain.

## Async video

`media/async-video` preserves the original async-video-carousel definition. Absent items imply pending by default; present items, including [], imply resolved. Explicit Value status must evaluate to pending/resolved/failed (`ASYNC_VIDEO_STATUS`); null is invalid. Fallback may be empty. Supplied records are checked even when failed/pending.

Each title must be nonblank after trim (`ASYNC_VIDEO_TITLE`). YouTube IDs use 11 ASCII alphanumeric/underscore/hyphen characters; TikTok uses 1–30 digits (`ASYNC_VIDEO_ID`). A safe URL must be HTTPS, without credentials or nondefault port, and match the provider/literal ID (`ASYNC_VIDEO_URL`): youtu.be/ID; youtube.com/www.youtube.com/m.youtube.com with /watch and exactly one matching v parameter, or /shorts/ID; tiktok.com/www.tiktok.com with /@name/video/ID and optional final slash. Other query parameters are not newly forbidden; duplicate records are not given an added uniqueness rule.

Only TikTok accepts thumbnailUrl and it must be a safe raster source (`ASYNC_VIDEO_THUMBNAIL`). YouTube uses fixed public thumbnails. Validation does not establish availability or media rights. Frozen, bubbling, cancelable, composed `iui:video-open` detail is `{video,videos,index,component}`. The accepted-action fallback opens its canonical supplied URL in a new tab; cancellation prevents it. HoverPreview false disables hover playback, not thumbnails or fixed official SDK requests. YouTube preview uses the external fixed SDK/nocookie iframe. Source selection/validation does not fetch providers or run playback.

## Tabbed section

`content/tabbed-section` owns SuppliedSectionTab and its node. Group label and tab label/title must be nonblank (`SECTION_TEXT`); content may be empty/whitespace, and optional fallback has no additional trim rule. Tab IDs are list-local and unique (`SECTION_ID`). Explicit activeId must name an enabled tab (`SECTION_ACTIVE`); omission chooses the first enabled tab. Empty/all-disabled lists without activeId remain legal.

Content uses passive bounded Markdown: links become text, HTML stays literal and images do not load. Selection emits frozen, bubbling, cancelable, non-composed `iui:tabbed-section-change` `{id,index}`; cancellation preserves selection. The [section behavior](tabbed-visual.md) remains mandatory for roving focus, disabled skipping, native-reset cancellation/newer input and permanent owner retirement. No service or navigation runs from tab content.

## Visual cards

`content/visual-cards` depends on media/readers for SearchImageRecord; its manifest includes search-image/youtube. Collection title and item label require nonblank text (`VISUAL_TEXT`); IDs are unique within items (`VISUAL_ID`). Optional title/query/caption/subtitle/source/metadata/reason/summary/fallback have no added trim checks beyond structure. Supplied entity id/kind must both be nonblank (`VISUAL_ENTITY`).

Each supplied item image or viewerImages record needs at least one content/thumbnail source, and every supplied source must be safe (`VISUAL_IMAGE`). This is stricter source presence than standalone SearchImage. ImageLoading does not bypass it. Metadata titles, record uniqueness and filenames receive no extra checks. Optional url follows general safe-link policy (`VISUAL_URL`), including its permitted non-HTTP forms. ImageIndex must be within explicit viewerImages bounds. If viewerImages exists, illustrated items require imageIndex (`VISUAL_INDEX`); source equality is not required.

Text activation emits frozen, bubbling, cancelable, non-composed `iui:visual-card-action` with open-url/open-entity detail; entity takes precedence. No operation automatically follows. Image activation emits `iui:visual-card-image` `{id,index}`; cancellation prevents a viewer, viewer:intent is host-only, and the default local viewer uses supplied images only. Direct images can load before activation. [Visual behavior](tabbed-visual.md) remains mandatory for gallery, scrolling, row identity and lifecycle rules.

## Link cards

`content/link-cards` imports the original suppliedLinkProps builder from foundations/layout. It neither copies those properties nor selects the full layout family: the builder has no definition references. Only link-card and recommendation-link-card are owned here; original link variants are unchanged.

Resolved cards require an explicit safe URL; pending/failed may omit it, but supplied URLs are always checked (`LINK_URL`). General safe-link policy includes allowed fragment/mailto/tel, not just HTTP(S). Exactly title, source, snippet, fallback, copyLabel and loadImageLabel receive trim nonblank checks when supplied (`LINK_TEXT`). Omission is legal; blank strings are not. Supplied faviconSrc/imageSrc must pass image policy (`LINK_IMAGE`).

No metadata or favicon is inferred. Inline raster data renders directly; remote images remain behind their separate local load action. Open/copy emit frozen, bubbling, cancelable, non-composed iui:link-open/iui:link-copy `{id,url}`. The library does not navigate or write the clipboard for these cards. [Supplied-link behavior](supplied-links.md) is mandatory for disabled, admission, image and overlay lifecycles.

## Image grid

`media/image-grid` has no schema-level SearchImageRecord dependency. Image IDs are list-local and unique (`IMAGE_GRID_ID`), alt must be nonblank (`IMAGE_GRID_ALT`), and src must be safe (`IMAGE_GRID_SOURCE`). Group label/caption and optional presentation labels have structural bounds only, without added trim. Image/recommendation IDs are separate namespaces.

Each authored tile names an existing image at most once across rows (`IMAGE_GRID_ROW_IMAGE`); rows need not cover all images and [] is allowed. Recommendations have locally unique IDs (`IMAGE_GRID_RECOMMENDATION_ID`), nonblank label/query (`IMAGE_GRID_RECOMMENDATION_TEXT`) and safe thumbnailSrc (`IMAGE_GRID_SOURCE`). Inactive recommendations and rows are still checked. Schema independently bounds ratio/growth; placeholders have no image references.

Existing grid/mosaic/live, loading/failed states and disclosures use supplied data. Images may load directly; no search/upload occurs. Frozen, bubbling, cancelable, non-composed iui:image-grid-open remains `{id,index}`, indexing the supplied image array. Default viewer is intent for grid, local for mosaic; explicit viewer overrides it. Acceptance opens the local-basic viewer only when selected. Recommendation intent stays `{id,query,prompt}`, where prompt is `search images of ` plus query; it is not sent automatically. [Layout/viewer behavior](image-grid-presentations.md) remains mandatory. Source checks do not establish browser decoding, visual parity or native acceptance.
