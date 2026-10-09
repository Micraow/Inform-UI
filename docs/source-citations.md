# Supplied source citation readers

Inventory candidates `code-cite` and `file-cite` are implemented as independent Base readers. Planned acceptance: literal numbered code with validated absolute cited range, reversible context and manual excerpt selection; supplied document-page excerpts with explicit page navigation and manual excerpt selection. Sources are safe ordinary links. No code execution, local file access, downloads, OCR, syntax plugin, remote preview or clipboard API is used. All displayed content comes from the supplied document.

## Code citation

Required label, fileName (literal label), startLine (1–10,000,000), and 1–120 literal lines (up to 2000 characters each). Optional language is only a supplied label, not a syntax engine. Optional citedStart/citedEnd must be supplied together, ordered and inside the supplied window; the final absolute line cannot exceed 10,000,000. Without a range all supplied lines are cited. Native ordered-list numbers preserve absolute line values even when context is hidden; blank lines stay blank and markup-looking text stays literal.

The context button reveals/hides only supplied surrounding lines while retaining DOM identity and cited highlighting. A manual-select control reveals a readonly textarea containing exactly the cited lines joined by newline, without line numbers or added characters. It focuses/selects the owned excerpt so the user can use their system copy command. No clipboard write or code execution occurs.

## File citation

Required label, fileName and 1–30 unique supplied pages `{number,text,label?,source?}`. Page numbers are positive bounded integers; optional totalPages cannot be below any supplied page. Optional initialPage must have an excerpt; otherwise the first supplied record is shown. Source order is preserved, including noncontiguous page numbers. No omitted page is generated. Optional mediaType remains a label, never a loader or decoder.

Native page selector and previous/next controls show one retained excerpt panel. Boundary buttons are inert and keep focus; native reset restores the supplied initial excerpt, with cancellation, revision and lifecycle checks. Manual selection shows exact current supplied text. Navigation hides/clears the manual preview to avoid copying stale page content. A focus listener changing page or moving controls prevents later selection through revision and ownership checks. The readonly excerpt contributes no Forms values.

## Safety and integration

All control activation checks actual connection, containment, disabled state and hidden/inert ancestry. Paint/restore never reclaims outside rows/panels/previews. Focus is a host-interruption boundary, checked before native select and before status output. Native reset uses the audited reader helper. Disposal/replacement retires handlers and queued work. Sources use safe absolute HTTP(S), noopener/noreferrer and no referrer. No runtime service, private capture, filesystem path access, remote preview or asset fetch is included.

Source map: generator/subset map, core source-citations inspector/wiring, source-citations renderer/citation-labels/wiring/CSS, example, this document, unit/type/browser preparation and protocol-count assertions. Generated files are preserved unstaged, excluded from source commits. Current112 protocol types are not canonical acceptance. Source-only integration must regenerate/build/CDN. This branch also carries the separately committed vocabulary-focus fix equivalent to2cf86f1; that fix must not be dropped when later components are integrated.

## Verification and composed-boundary follow-up

Initial citation suite: 35/35. Final citations/corrected-vocabulary/Forms/core suite: 140/140 (`/tmp/inform-source-citations-final.log`). Generation/build, no-emit types, public type consumer, CDN rebuild, source-boundary and prepared browser syntax passed. Browser text-selection and visual acceptance are unexecuted.

The shared composed-tree guard gap is fixed by source ce660c1 (carried here as3048c70). It follows observable assignedSlot/parent/shadow-host ancestry and preserves native disabled-fieldset rules. Old control suite:8pass/24fail; corrected broad reader suite:363/363. A citation-specific follow-up rechecks the now-revealed preview with that guard before focus, after focus and after selection. This prevents selection when the preview itself is moved into a hidden/inert assigned-slot wrapper, even when the action button remains visible. Final citation/shared-guard/vocabulary run:121/121 (`/tmp/inform-citation-composed-final.log`). CSS visibility and private closed-shadow slot wrappers that the platform does not expose through assignedSlot are not claimed to be inspected.
Selected schema ownership/closed-reference metrics, domain fixture compatibility and CDN/source identity checks passed 3/3 (`/tmp/inform-source-citations-schema.log`).
