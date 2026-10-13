# Original local video fixture

`motion-study.mp4`, its PNG poster, and its English WebVTT captions are original,
repository-owned demonstration assets under the project's MIT license. They depict
only generated geometric shapes. They contain no recording, private screenshot,
third-party footage, speech, or personal information.

Regenerate with `node scripts/generate-showcase-video.mjs`. The JavaScript script
draws 64 RGB frames at 320 × 180 and performs a bounded, single-threaded H.264 encode
using an installed FFmpeg. FFmpeg is a build tool and is not bundled with the demo.
The clip is eight seconds long and intentionally silent.

`showcase/examples/video.json` embeds the MP4, PNG and WebVTT as nonempty base64
data URIs inside the existing `html-view` contract. It introduces no `video` schema
node and does not change the `youtube` contract. Native browser video controls
provide playback, pause, seeking and captions. A transcript and explicit playback
error message remain available. Browsers without a compatible MP4 decoder may show
that fallback. The bundled fixture makes no external request and uses no cookies.

`manifest.json` records the generated media's dimensions, duration, size and digest.
