# Supplied media readers

`media/readers` owns the existing SearchImage and YouTube schemas in `scripts/media-reader-definitions.json`. Other media families depend on this source module explicitly. Structural schema validation is necessary; use full `validateDocument` for the following semantic checks and the common expression and URL policies.

## Search image

`search-image` displays a supplied `searchImage` record, its loading/error state and bounded layout. It does not search or discover images. The content and thumbnail URLs, when supplied, must pass the safe image policy: absolute credential-free HTTP(S), or supported inline raster data. The renderer selects the supplied source and honors fit, crop metadata and fallback. Resource assignment and release follow the shared generation/ownership contract. Direct image rendering can load a supplied remote image; this primitive alone does not promise a click-to-load gate. Higher-level components may impose an explicit activation gate.

`SEARCH_IMAGE_RATIO` requires a supplied numeric ratio, or parsed colon/slash ratio, to be finite, positive and at most 1000. `containOutsideAspectRatio.min` must be strictly less than `max`; the structural schema also bounds their individual values. `SEARCH_IMAGE_POSITION` requires both supplied percentage coordinates to be at most 100, in addition to the schema's nonnegative two-percentage syntax. Crop centers are supplied fractions or percentages; rendering clamps them and does not infer a subject. URL failures report `UNSAFE_URL`. No additional blanket nonblank-label rule is introduced for this record.

## YouTube

`youtube` accepts a supplied, structurally bounded video ID and label, optional start time, caption, fullscreen and disabled settings. `YOUTUBE_LABEL` rejects whitespace-only labels. There is no URL discovery, metadata lookup or provider SDK. The fixed iframe uses youtube-nocookie.com with autoplay off and standard controls; embedding still contacts that external service.

The default load mode is direct, scheduled after admission. Explicit `loadMode: "on-demand"` shows a local load control first. Unload, replacement and disposal revoke the owned iframe source. Disabled and actual DOM admission gates apply. Do not describe direct mode as offline or as requiring an activation click. Compiled HTML must retain the existing fixed iframe CSP policy.
