# Supplied image-grid layouts and viewer

This independent extension keeps the original finite `images` API and default regular grid. It adds explicitly supplied mosaic rows, recommendation disclosure, a passive live layout, resolution/loading states, and a local-basic viewer. It does not search for images or call an external application lightbox.

## Supplied data

`presentation` is `grid` by default, `mosaic`, or `live`. `images` stays an ordered list of up to 24 unique `{id,src,alt,caption?}` records. Sources use the library's existing safe-image policy.

For a mosaic, optional `rows` contains up to 24 `{aspectRatio?,tiles}` records. Each tile has an `imageId` referencing a supplied image exactly once across authored rows, optional positive `aspectRatio`, and optional positive `flexGrow`; ratios/growth are bounded to0.1–20. Missing rows form one row from the supplied images. Row ratio defaults to16/9. Authored geometry and independent flex proportions are displayed without inferring a crop from image contents. Mosaic groups have a760px maximum width,2px row/tile gaps and16px outer radius. Legacy captions remain visible in the regular grid; the reference-informed mosaic uses image alternative text without separate captions.

Optional `recommendations` contains up to24 unique `{id,label,query,thumbnailSrc}` records with nonblank text and safe thumbnails. Below a576px renderer-container width, two recommendations are initially visible; at or above576px, three are visible. More/Fewer reveals the complete list or restores the current narrow/wide limit. It changes visibility of existing controls and images rather than destroying/recreating them. `recommendationsExpanded` selects the initial state. Container updates reuse the mount's shared resize binding and first-connection notification.

`live` shows the first four supplied images in a passive64px-high strip without opening controls, captions or recommendations.

## Resolution and loading

Optional `status` is `resolved` by default, or `pending`/`failed`. Pending renders an accessible loading message and no controls. Failed renders optional plain-text `fallback`, otherwise hides the component. A resolved empty mosaic collapses to zero height without recommendations.

The independent `loading` flag may accompany resolved content. `placeholderRows` supplies up to8 rows of positive, bounded placeholder geometry; placeholder tiles have the same optional ratio/growth fields but no image reference. Actual image rows can remain visible while these placeholders show. Recommendation placeholders use the current two/three limit and cannot send intents.

## Local intents and viewer

The existing frozen, cancelable, bubbling, non-composed `iui:image-grid-open` detail remains exactly `{id,index}`, where index is in the supplied images array, independent of authored row placement. `viewer:'intent'` keeps a host-only request. `viewer:'local'` opens the explicitly labelled local-basic viewer only after the opening event is accepted. The default is local for mosaic and intent for the legacy grid. The viewer is not a visual recreation of a private host lightbox.

The local viewer shares the document overlay coordinator. Previous/Next and unmodified arrow keys inspect adjacent supplied images; modified keys/IME are ignored. Escape or Close returns focus to the opening control when still valid. Changing the displayed image releases its prior image source; disposal or component retirement closes the viewer. Its controls and replaceable image scopes use the existing render generation, without a second observer or resource table.

Recommendations emit frozen `iui:image-grid-recommendation` details `{id,query,prompt}`, with prompt equal to `search images of ` plus the supplied query. These are cancelable local requests only. The library never sends them, navigates, or performs a search. Images still load only their explicitly supplied sources.

## Evidence and scope

The first source candidate passed43 targeted tests:19 compatibility tests and24 extension cases covering bounded data, authored geometry, disclosure identity, live mode, loading, cancellation, local viewer inspection/focus/source release, disabled controls and retirement. The five PNG fixtures are original programmatic drawings shared with the Skill consumer lane. An initial overly nested viewer ownership implementation was replaced with existing component-owned generation scopes; final targeted tests complete in seconds.

Build, types, deferred-queue and public-boundary checks pass. Packaged CDN remains the previous unified154 asset; this is a source checkpoint. Independent review and new real-browser geometry are still pending. Canonical scope remains144 implemented,4 partial,108 missing until this row is reviewed.
