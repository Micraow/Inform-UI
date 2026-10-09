# Supplied email preview and file navigation

`email-preview` and `file-nav-list` are original, distinct Base-domain readers. They only render document-supplied text and metadata. They do not connect to a mailbox or filesystem, mark messages read, reply/forward, upload/download automatically, fetch previews or resolve missing files. A normal source/file anchor is the only way to navigate outside the local view, and only on the user's ordinary link activation. These later candidates are separate from the frozen 97-node checkpoint and do not change canonical accepted totals.

## email-preview

Required `subject` (1–500 Unicode codepoints), `from: {address,name?}`, `to` (0–40 recipient objects), and `body` (0–20000). A supplied address is a literal string (1–320), not a verified mailbox. Names use bounded short text (1–200). Optional `cc` (0–40), `sentAt`, `quotedText` (0–20000), `attachments` (0–20), and `source: {label,url}`. HTML payloads, provider endpoints and action fields are unsupported.

The reader shows literal subject/sender/time, a native recipient disclosure preserving To/Cc order, exact plain-text body, optional native quoted-text disclosure and supplied attachment metadata. Bodies longer than 600 Unicode codepoints have an explicitly labeled shorter excerpt plus a native full/short toggle. Exact full text remains available; neither markup nor remote content is rendered. Reading state survives unrelated host state changes.

Attachments require unique local `id` and `name`; optional `sizeBytes`, `mediaType`, `description` and `url`. A native name search filters mounted attachment rows, preserving details. Search is local, case-insensitive substring matching over names, limited to 200 UTF-16 code units. Empty input, no attachments and no matches are explicit. Missing sizes/types are labeled not supplied; zero bytes remains exact zero. No image thumbnail or media player is instantiated.

## file-nav-list

Required `label` and `entries` (0–120). Optional `description`, `initialFolderId`, and `source`.

Each entry has unique `id`, `name`, `kind: folder | file`, optional `parentId` (null/absent means top-level), and optional `description`. Parent references must resolve to supplied folders. Cycles are invalid; an entry may have at most four folder ancestors. The initial folder, when provided, must resolve to a supplied folder. Names and IDs are metadata, never filesystem paths; slashes in names are not interpreted.

File entries optionally supply `category: document | image | audio | video | archive | other`, `sizeBytes`, `mediaType`, `modifiedAt` and `url`. Folder entries cannot have file size/type/time/URL fields. Categories are supplied, not guessed from file extensions or MIME labels. Missing categories have an explicit category-not-supplied filter and label. No symbolic links, filesystem mounts, paths or provider APIs exist.

The navigator keeps all bounded rows mounted, hiding those outside the selected folder/filter. Native folder buttons, breadcrumbs and parent-folder control navigate locally. Navigation clears current search/category filters and moves focus to the destination folder heading. A current-folder breadcrumb or root parent action is a no-op. Returning to a folder preserves its file-details disclosure state and row identity.

Name search only applies inside the current folder. File-category filtering affects files; folders remain available for navigation and are still subject to name search. Count text describes the current folder's supplied entries. Reset filters retains the current folder. Empty metadata, empty folders and no matches are distinct.

## Shared metadata and lifecycle

`sizeBytes` is a supplied integer from 0 through 1e12, displayed as exact bytes; missing values are never treated as zero. `sentAt`/`modifiedAt` are strict Gregorian minute timestamps, years 1000–9999, with explicit `Z` or offset up to 14:00. Impossible civil dates are rejected, and offsets are displayed literally without local-time conversion or freshness inference.

All source/file/attachment links require allowed absolute HTTP(S) URLs with no credentials or disguised unsafe schemes. They disclose new-tab opening and use `noopener noreferrer` plus `no-referrer`. There is no `download` attribute, automatic navigation or prefetch.

Controls are native and have no payload names; reader values never enter host bindings, FormData or action snapshots. Unrelated `setState` preserves local folder/filter/body/disclosure state and focus. Native outer form reset restores filters while preserving selected folder and reading disclosures, unless canceled or the controls become disabled/hidden/inert. Newer explicit input takes precedence over queued resets. If one control is detached or reparented during reset, the local model is preserved and only still-owned controls are restored, preventing display/model mismatch without writing to outside controls. Shadow-root resets are supported.

Control guards inspect their actual ancestry and ownership: disabled/pending fieldsets, hidden/inert wrappers, detached controls and controls moved outside their root cannot perform actions. Update resets local state and retires prior listeners; dispose also retires queued reset reconciliation. Ordinary native disclosures and safe anchors remain reading affordances.

## Validation and acceptance

Structural bounds/unsupported fields report `SCHEMA`. Semantic exact-path failures include `DUPLICATE_ID`, `READER_TIME`, `UNSAFE_URL`, `FILE_PARENT`, `FILE_CYCLE`, `FILE_DEPTH` and `FILE_FOLDER`.

Focused tests cover public Node/browser parity, literal hostile content, unknown/zero data, bounded records, local navigation/filtering, stable row/disclosure/focus state, native reset cancellation/newer-input races, shadow roots, inherited disabled/pending/first-legend behavior, detached controls, atomic update/disposal, deterministic compiler output and safe URLs. Browser scenarios are prepared separately for pointer/keyboard/touch, themes and widths, RTL, forced colors, and zero runtime requests. They are not browser acceptance evidence until executed and visually reviewed.

## Local checkpoint evidence

On baseline `4e246b6c3d5cd80fdf6746fd3d3c8c8dad11e733`, generation produced 100 structural node types. Build/CDN, TypeScript/public type consumers and source-boundary checks passed. Initial reader/Forms/core tests passed 78/78; selected schema-owner/closed-reference/CDN-directory checks passed 3/3. After independent review identified partial-control native-reset inconsistencies, the corrected reader/Forms guard suite passed 64/64, including both first-control and later-control detachment, outside-control nonmutation, form movement and listener balance. These runs overlap and are not a full-suite claim.

Real-browser/visual acceptance, full aggregate checks, the complete schema-subset matrix, CI and deployment remain unrun for this isolated candidate. Integrate source-only changes onto the newer reviewed combined baseline, preserving its existing fixes, and regenerate all derived artifacts before later acceptance. The frozen 97-node checkpoint is unaffected.
