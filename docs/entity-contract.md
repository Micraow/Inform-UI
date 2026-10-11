# Supplied entity cards and overviews

`entity-card` and `entity-overview` are finite, authored presentations. They do not discover entities, infer facts, resolve accounts, execute arbitrary action payloads, navigate, send telemetry or perform domain-specific medical/account work. URLs are only used for explicitly supplied images under the consent boundary below.

## Data

Both require a nonblank accessible `label`; accept optional `id`, `disabled`, `status` (`resolved` by default, `pending`, `failed`), `fallback`, and `loadImageLabel`. Pending shows an accessible loading block; failed displays `fallback` or hides the component. Active image/action/item data is rejected in unresolved states.

- `entity-card`: required resolved `title`; optional `subtitle`, `image: {src,alt?}` or null, `actionId` and `actionLabel`. Missing/null image preserves the 4:3 placeholder. Title and subtitle use bounded visual line clamping; complete text remains in the DOM.
- `entity-overview`, default `variant: single`: required `item: {id,title,images,metadata,description?,actionId?,actionLabel?,disabled?}`. Metadata records are literal `{label,value}` strings. Empty metadata and missing description omit their sections. Zero images omit the mosaic; one fills it; two share it; three or more display only the first three as one large/two small. Supplied images are capped at 12 and metadata at 20. The single card is capped at 362 CSS pixels and metadata can scroll horizontally.
- `entity-overview`, `variant: carousel`: requires `items` instead of `item`, maximum 50 with unique IDs. Reuses the existing carousel renderer. Each tile uses up to the first two supplied images, a 180-pixel mosaic and desktop width 360 pixels, with 84% narrow/mobile presentation. Optional `title` captions the collection; empty items display `emptyLabel` or “No entities”. `mobile` is a supplied layout hint, not device detection.

No arbitrary user child tree is accepted. All generated card content is passive text and layout; action and image-consent buttons are siblings, never nested controls. Metadata content is rendered as a definition list, not interpreted as HTML. Unknown action payloads and linked/nested interactive child nodes are rejected structurally.

## Actions and image permission

An `actionId` adds a native button with supplied `actionLabel` or an accessible title-derived label. Activation emits `iui:entity-action` with frozen detail `{id,entityId,actionId}`. `id` is the component ID or null; card `entityId` is its supplied ID or null, overview `entityId` is the item ID. The event bubbles, is cancelable and is not composed. There is no default remote effect or navigation, whether accepted or canceled. Passive metadata/background clicks use the same single intent.

Allowed inline raster data images load locally. HTTP(S) images initially show a separate consent button and do not assign any image source. Consent emits cancelable, non-composed, bubbling `iui:entity-image-request` with frozen `{id,entityId,src}`. Only an accepted, still-current request starts that exact image using the shared supplied-image renderer. Preventing default leaves it unloaded. This does not activate the entity action. SVG data and unsafe schemes are rejected. Failed bitmaps hide; replacement/disposal clears owned sources. No image lookup, original-resolution discovery or account request occurs.

Supplied/current disabled state, first-legend fieldset rules, hidden/inert ancestry, canceled activation, permanent ownership retirement and update/dispose are honored. A shared per-component intent gate covers event-constructor reentry. Errors remain observable. A native form reset emits neither action nor image consent; the component has no form-edited data to reset.

## Integration and verification limits

Installer: `installEntitySchema({node,defs})` in `scripts/entity-schema.mjs`; both canonical nodes belong to the base group. Semantic hook: `inspectEntity(node,path,add,isSafeURL)`. Rendering: `renderEntity(context,node,root,container)` where root/container are the same mounted owner/host supplied to the existing image/link renderers. Add `entity.css` to both embedded renderer styles and build output.

The domain-only checkpoint excludes temporary shared dispatch/style/generator/build wiring and generated schemas. Regenerate with the project generator after serial integration; a domain-only commit alone is not protocol availability. No captured resources are part of this implementation.

Tests exercise validation, finite variants, empty/null/failure, image consent cancellation, passive structure, literal metadata, local actions, disabled/fieldset gates, constructor reentry/errors, update/dispose, image late-source-setter compensation, ordinary carousel resize and repeated resource cleanup, ownership removal and compiled standalone execution. Browser suites define actual keyboard/scroll/narrow-layout checks; discovery is not native execution or pixel acceptance.

A separate adversarial probe identified an inherited shared-carousel limitation: a requestAnimationFrame registration that synchronously replaces the mount before returning its frame ID does not cancel that late ID on the older shared implementation. Ordinary update/dispose cleanup passes; this late-registration case needs a shared-carousel fix and retest before broad lifecycle acceptance. The entity domain does not duplicate or replace the shared carousel's resource machinery.

The original late requestAnimationFrame ID registration failure is retained as negative evidence. The shared47c1d8 lifecycle repair was applied in this integration; the author independently replayed the same actual mount probe and observed cancellation of the late909 ID. Original entity domain files alone did not include that repair.
