# Learning visualization

`learning-viz-dil` renders supplied light/dark Lottie JSON through the library's pinned official SVG engine. This is an original composition implementation with original examples. It shares the existing animation source validator, engine, generation and ownership controls; no captured code or artwork is included.

Resolved data supplies `label`, `alt`, `animated`, and `sources.light`/`sources.dark`. Both sources follow the existing bounded `LottieData` contract; expressions, external fonts, audio layers and unsafe assets are rejected. Optional `theme` is light/dark/auto (default the mount theme and then system preference). `pending` has a 300px placeholder and `failed` uses literal fallback or hides. The view is full width up to 480px, at 8:5 aspect ratio.

An animated view starts at its first connection, advances at real time, stops at `(op-ip)/fr`, and does not loop. Play/Pause captures the current position; playing from the end restarts at zero. A static view displays the initial frame and has no visible playback controls. Changing system theme replaces the engine while preserving position (clamped to the supplied new duration) and paused state. Explicit controller update begins a new component state.

A visible local Reset restores time zero and the initial autoplay policy. Accepted native form reset follows the shared cancellation/newer-input policy. This local reset control is an accessibility addition, with optional `resetLabel`. Play/pause labels are supplied through `playLabel`/`pauseLabel`. `disabled` and actual DOM/fieldset/ARIA/hidden/inert gates apply.

`iui:learning-viz` is a frozen, bubbling, cancelable, non-composed local event with `{id,intent,currentTime,duration}` and intent play/pause/restart/reset. Cancelling preserves playback. No host service is called. External bitmap assets show an explicit Load control before constructing the engine; the control is optional-label `loadImageLabel`. Inline data assets need no external request. JSON is supplied inline, so the compiler needs no broader connect-src permission.

The parent completion timer uses shared generation acquisition and is released on pause, source replacement, retirement or disposal, including a timer registration that synchronously retires its owner before returning an ID. The existing engine keeps its own established resource implementation; this component does not claim to rewrite or independently certify all engine internals.

Author DOM tests execute real SVG rendering. JSDOM uses explicit adapters only for its missing structuredClone and the engine's canvas bootstrap; this is not a native-browser result or an animation-engine mock. Native cases are discovered separately until a batched real-browser run occurs.

## Validation and shared source dependency

The source module explicitly depends on `media/lottie`; read [the complete bounded animation contract](lottie-recovery.md) as well as this component contract. Both supplied light/dark sources are checked by `lottieDataIssue`, even when a pending or failed presentation permits sources to be omitted. `LEARNING_VIZ_SOURCE` reports invalid supplied animation data. `LEARNING_VIZ_TEXT` rejects whitespace-only `label`, `playLabel`, `pauseLabel`, `resetLabel` and `loadImageLabel`. The optional `alt` and `fallback` strings retain their structural empty-string allowance; this is not a blanket trim rule. Resolved data requires both sources, alt and animated fields; no source or playback state is fabricated for missing data.
