# Supplied homework, image-result and partner views

These three original finite views expose local user requests and supplied state. They do not create conversations, record audio, generate images, open applications or call partner services.

## HomeworkHelperV2

`homework-helper-v2` requires a question, up to twelve uniquely valued options and a submit label. `selectedValue` is optional and nullable. Each option has literal text and optional disabled state. Real buttons expose `aria-pressed` and support native Enter/Space activation. Selection is a cancelable `select-homework-mode` request; accepting it changes only local selection.

Only `guided`, `show_answer`, `quiz_me` and `voice` permit submission. Other supplied choices remain displayable and selectable, but cannot submit. The three text modes emit `submit-homework-mode` with the exact selected label as `prompt`; voice emits `request-voice` without starting a microphone or session. Accepted voice submission is single-use for that mounted generation. Text modes remain usable when `preventRepeatedSubmission` is false. With that flag true, supplied or locally accepted `submitted` state disables choices and submission.

Local/native Reset clears receipts and restores the initial selection, but does not unlock an accepted submission latch. Explicit document update starts a new generation from the supplied state. Canceled requests never acquire that latch. A new accepted choice after native reset wins over the queued reset; submission waits until the reset queue settles.

## ImageGen

`image-gen` is a supplied result view, distinct from the separate `gen-image` component. Resolved outer status requires `imageStatus`: waiting renders a 300px placeholder, failed displays the supplied error or a failure fallback, and succeeded displays a supplied URL. Succeeded without a URL is hidden. It does not infer success or generate an image.

Inline images may render immediately. External URLs require explicit local Load activation before the image element is created. Existing safe image loading, error fallback, source cleanup and ownership behavior are reused. The root receives focus when keyboard activation retires its Load button. No image-generation request is sent.

## InternalPartnerApp

`internal-partner-app` displays a supplied title, optional provider logo and button label in a responsive card up to 476px wide. Its optional finite `launcher` contains `appId`, optional `viewId` and `query`. Absence disables the request, including after DOM disabled-property tampering. This explicit public adapter does not expose opaque host launcher payloads. A `launch-partner` request contains a separately frozen launcher object. Acceptance only records a local receipt.

Provider logos follow the same explicit external-image activation rule; the Load control is outside the small logo frame. Reset clears the receipt. It does not change account or application state.

## Shared contract and evidence

`iui:supplied-launcher` is bubbling, cancelable and non-composed. Its frozen detail includes `id`, `component`, `intent` and only the intent's supplied fields. Source disabled, fieldset/first-legend, ARIA, inert/hidden and capture cancellation are honored. Shared generation ownership, intent admission and native-reset handling prevent stale controls and reentrant requests from acting after update or disposal.

Pending and failed outer phases render supplied placeholders/fallbacks without active domain controls. All examples and their PNG are original fixtures. Author DOM/compiler checks and browser discovery are separate from actual native-browser or reference-pixel acceptance. Distributed assets remain the earlier unified183 release until a later unified build is explicitly frozen.

## Complete semantic validation boundary

Full `validateDocument` checks supplied top-level strings for nonblank `trim()` content except `fallback`, `error` and `alt` (`SUPPLIED_LAUNCHER_TEXT`). The exceptions retain their existing content allowance. Homework option values and labels must be nonblank; option values must be unique (`SUPPLIED_LAUNCHER_ID` for duplication). Image-gen URL and partner logo use the safe-image policy. Each supplied direct string in a partner `launcher` record must be nonblank. These checks apply to supplied values regardless of phase and do not turn the launcher payload into an executable callback, private API request or external service connection.
