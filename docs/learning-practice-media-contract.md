# Supplied learning practice media

`learning/practice-media` owns the existing audio-label, image-choice and image-label cards through the original `scripts/learning-media-definitions.json`. No speech recognition, model grading, media discovery or answer transmission is introduced. Examples use original programmatically authored inline PNG and silent WAV data. Selected structural validation still requires unchanged full `validateDocument` and shared safe-URL/expression checks before mounting.

## Answers and text

Image-choice options have locally unique IDs (`DUPLICATE_ID`), and answerId must reference an option (`LEARNING_ANSWER_REFERENCE`). A label card's answers are trimmed for nonblank checks (`LEARNING_ANSWER_EMPTY`) and duplicate detection (`DUPLICATE_ANSWER`). Runtime matching is trimmed and case-sensitive: blue and Blue remain distinct. There is no accent folding, synonym inference or fuzzy matching.

No extra `trim()` rule applies to label, prompt, explanation, option label, image alt/caption or audio transcript. Their structural length bounds remain; empty explanation/caption and structurally valid whitespace-only minimum-length fields retain their existing behavior. Display markup is literal text. Component IDs are document-wide; option IDs belong only to their list. The schema bounds choice options at 2–8 and accepted answers at 1–12.

Blank learner input is missing, rather than an incorrect answer. Check, reveal and retry change local state only. Unnamed controls do not enter enclosing FormData. Native-reset cancellation and newer input retain precedence; disabled and ownership/generation guards retire old controls after replacement/disposal.

## Media

Images require safe credential-free absolute HTTP(S) or nonempty base64 PNG/JPEG/GIF/WebP (`UNSAFE_URL`). Relative, SVG-data, blob and executable URLs fail. Remote images require an explicit local load action; inline raster data can render immediately. Alternatives remain available before loading and after failure.

Audio requires a supplied transcript, and either nonempty base64 WAV/MPEG/OGG/MP4/WebM or safe absolute HTTP(S) with a bounded DNS host or the specific IPv4 loopback `127.0.0.1`. Wildcard/delimiter hosts, trailing dots, DNS labels over 63 characters, hosts over 253 characters, non-loopback IPv4 and IPv6 literals fail (`UNSAFE_URL`). This preserves a valid CSP host token. URL validation does not prove existence, decoding or transcript accuracy. Remote audio is assigned only after explicit loading; inline audio uses native controls and preload none. Playback is not automatically started.

Shared ownership releases media and stale callbacks on retirement. Source selection and contract tests do not perform media retrieval, actual playback or native browser acceptance.
