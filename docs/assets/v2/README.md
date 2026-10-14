# Original V2 screenshots

These five PNG files are unmodified Chromium captures of original Inform UI
examples. They contain synthetic labels, numbers and code, with no account UI,
third-party reference screenshot pixels, or user documents.

| File | Original input | Capture |
| --- | --- | --- |
| `code-light.png`, `code-dark.png` | [`code-bash.openui`](../../../examples/v2/code-bash.openui) | Foundation Code, light/dark, 744 × 416 pixels at 2× device scale |
| `layered-work-light.png` | [`layered-work.openui`](../../../examples/v2/layered-work.openui) | 760px viewport, light |
| `array-steps-light.png` | [`array-steps.openui`](../../../examples/v2/array-steps.openui) | 390px viewport, actual step 3 of 5 after keyboard/mouse interaction |
| `document-comparison-dark.png` | [`document-comparison.openui`](../../../examples/v2/document-comparison.openui) | 390px viewport, dark; the thumbnail consists of ordinary Box components |

The last three captures were produced by the project's
[`foundation-layout.spec.mjs`](../../../tests/browser/foundation-layout.spec.mjs)
at source `dc3361d64fc2ff650c34633f35b484406a6817a3`.
The Code captures show the same original Bash text included in `code-bash.openui`;
copy and wrap behavior is tested separately by
[`code-foundation.spec.mjs`](../../../tests/browser/code-foundation.spec.mjs).
These screenshots predate the later Text whitespace-wrap fix and are examples,
not a claim that every library composition has been visually accepted.

SHA-256 hashes, byte counts and dimensions are recorded in `manifest.json`.
The screenshots and original example content use the repository's MIT license.
Declared dependency and font licenses remain as documented by the project.
