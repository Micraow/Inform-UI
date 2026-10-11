# Inline entity, supplied generated-image view, and speech host adapter

These are original implementations of observable presentation and interaction contracts. All examples and images are fictional. Registration is 213; these three candidates do not change the approved 205-component completion count until independent review.

## Entity

`entity` supplies an inline `value`, optional finite `action`, `detailPayload`, and metadata. Activation chooses the explicit action first, then the supplied entity detail payload, then the supplied category/query (default category `ask_sidebar`). No entity lookup occurs.

On desktop, a detail payload with metadata enables a 150 ms mouse-hover or focus preview. Touch hover is excluded. The preview presents supplied name, 96 px image, nonempty categories, one-decimal rating including zero, price and open/closed text. It offers supplied directions and website intents. An explicit website takes priority over a credential-free HTTPS legacy domain URL. Mobile retains the inline action without the desktop preview. Escape and Close restore focus without reopening the preview.

## GenImage

`gen-image` displays supplied `images`; it does not generate images. Pending frames use a 220 px default square or the supplied aspect ratio and height. Authored dimensions and resolved `frame*` overrides are supported, including an explicit null `frameMaxHeight` that removes the cap. `presentation` supplies frame, radius and minimum dimensions. Dimensions are bounded numbers or safe CSS lengths.

Only the first supplied image is shown inline. A null `onClickAction` makes it passive; an explicit action precedes `defaultAction`. Otherwise activation opens the existing local image viewer with the complete supplied list. Loading and unactivated external media cannot be opened even if a host changes the DOM disabled property. Resolved empty content can show supplied fallback text; a failed or absent resolved image without such content has zero height.

## SpeechSynthesizer

`speech-synthesizer` is a finite host adapter, defaulting to unavailable. The host supplies availability, playback status, optional error, playback speed (0.25–4), and bounded text/language/voice ID metadata. Default controls show Play for idle and Stop for other supplied statuses; custom controls show both and the supplied error.

Play and Stop emit local requests and leave playback status unchanged until the host updates the document. This library does not call browser speech synthesis, record audio, fetch media, or claim audible playback. A connected disabled adapter with an available active supplied status emits one stop request with reason `disabled`; the host may cancel or handle it. Reset clears only the local receipt, not host playback state.

## Shared contract

`iui:inline-host-media` bubbles, is cancelable and non-composed. Its frozen finite detail contains component, nullable ID and an intent (`open-url`, `new-turn`, `open-entity`, `view-images`, `play`, `stop`, `reset`). Image lists and speech source metadata are deeply frozen. URLs are validated; URL intents do not navigate automatically. Inline original raster data loads locally. External image URLs require an explicit local Load gesture, outside action buttons.

The implementation reuses shared ownership, generation, admission, reset, image-reader, overlay and viewer mechanisms. It honors supplied disabled state, DOM disabled/fieldset/first-legend, hidden/inert/ARIA and capture cancellation. Replacement or permanent removal retires old controls and image sources. Hover timer late registration is compensated using generation acquisition. Accepted native reset closes local previews/viewers; canceled reset leaves them open. Explicit local Reset controls do not submit surrounding forms.

Source tests cover real public mount and compiled standalone output. Browser tests are authored for a later grouped run; discovery does not claim native geometry, decoding, playback or reference-pixel acceptance. Initial negative logs retain the loading-button admission defect and the fixture corrections for CSS calc normalization and asynchronous first image connection.
