# Supplied facts and entity thumbnails candidate

Inventory IDs: sidebar-fact-table and entity-thumbnail-list, confirmed absent from the prior schema and listed not implemented. Both are Base candidates. Planned acceptance: literal attributed fact table with local text/group filters and context disclosures; supplied entity thumbnails with text/category filtering, cancelable local detail selection and embedded-raster fallback. No remote lookup, inferred facts, identity recognition, file access or remote preview fetch. This tree inherits the reviewed observable composed-ancestry and manual-selection guards.

## Fact table contract

Required label and 0–80 unique facts `{id,label,value}`. Values are literal strings (including an explicitly empty string) or null. Numeric/date-like labels are never reformatted, parsed or computed; null displays not supplied, empty string displays empty value supplied. Optional unit is separately labeled, group remains exact, note is a native disclosure, observedAt is a validated supplied Gregorian offset timestamp, and source is a safe attributed link. No fact or source is independently verified or refreshed.

A native text filter matches supplied field/value/unit/group, combined with exact group selection. Ungrouped rows have an explicit local filter choice. Encoded group-control values avoid collisions with supplied labels. Table headers retain semantic scope/caption; note disclosures keep identity/open state through filtering and unrelated state changes. Reset clears filters; native reset respects cancellation, revision, partial-control movement and composed ancestry.

## Entity thumbnail contract

Required label and 0–24 unique entities `{id,label,category}`. Optional description, up to8 literal label/value fields, source and embedded image are supported. Image src accepts bounded base64 PNG/JPEG/WebP only, with required supplied alt; remote/SVG/GIF are rejected. The example reuses this project's original deterministic2×2 checker swatch, not a private asset. Missing images have a neutral placeholder; decode failure shows an owned fallback without a remote request.

Text/category filters combine. Native thumbnail buttons choose a retained detail panel; cancelable bubbling/noncomposed `iui:entity-select` carries frozen `{componentId,entityId}`. Clear selection uses null. Cancellation preserves prior selection, repeated explicit selection is allowed and synchronous reentry is blocked. Constructor/getter/listener interruption and actual control ownership are rechecked. Optional initialSelectedId must exist. Filtering does not silently clear selection: an explicit note explains when the selected detail is outside the filters. Reset clears filters and retains selection; explicit clear changes selection. Optional disabled fieldset suppresses interaction while source links remain ordinary reading links.

## Boundaries and recovery

Controls use the reviewed observable composed-ancestry reader guard, including exposed assigned slots and shadow hosts, while retaining native fieldset semantics. Private closed-shadow slot wrappers and arbitrary computed CSS visibility are not claimed to be inspectable. Paint/restore skips outside controls, rows, panels and images; disposal/replacement retires listeners and queued native reset work. Authored Forms receive no fact/entity data because these controls have no names/binds. No lookup, recognition, external images, remote API, private capture or OpenAI runtime is used.

Source map: generator/subset map, entity-facts core inspector/wiring, entity-facts renderer/labels/wiring/CSS, public event export, fixture, documentation, focused tests/public types/prepared browser spec and protocol count assertions. Current114 protocol types are not a canonical acceptance count. Source-only integration must regenerate declarations/schemas/CDN; generated files are preserved unstaged for recovery. Browser pointer/touch, native menus, actual image decoding, screenshots and accessibility acceptance remain unexecuted.

## Checkpoint verification

Initial component tests:39/39. Final facts/entities/citations/shared-guard/Forms/core tests:174/174 (`/tmp/inform-entity-facts-final.log`). Selected schema ownership/closed-reference metrics, domain fixture compatibility and CDN/source identity:3/3 (`/tmp/inform-entity-facts-schema.log`). Generation/build, no-emit types, public type consumer, CDN build, source-boundary and prepared browser syntax checks passed. No uncaught host-listener errors appeared in the final suite. Browser/image-decoding/visual acceptance remains outstanding. No CI or remote push was performed by this component slot; root owns source backup and cohort acceptance.
