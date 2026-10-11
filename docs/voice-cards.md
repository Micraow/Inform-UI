# Supplied voice cards

The three voice presentations use authored text, explicit capability flags and supplied phases. They emit cancelable local DOM events. They never ask for microphone access, synthesize speech, recognize a transcript, score pronunciation, start a session, or call an application service. Accepting an event changes only a local request receipt.

## Common data

`label` is the accessible group name. `status` is `resolved` (default), `pending`, or `failed`. A pending presentation contains a status placeholder without controls. Failed presentations use `fallback`, or hide when it is absent. `available: true` enables the primary request; omission is unavailable. This is a supplied capability flag, not a hardware probe. `disabled` overrides capability. Optional `unavailableLabel`, `requestedLabel`, and `cancelledLabel` supply local copy.

`learning-voice-mode-launcher-card` requires resolved `title`, `description`, `startLabel`, and `voiceSession: {id}`. `offer-voice-conversation` requires `buttonLabel`, with optional `presentation: "button" | "card"`, `description`, and `iconSrc`. A card's label and description share one native button. A supplied safe icon uses the existing owned image reader; this is the only optional external image resource. It is unrelated to voice permissions or services.

Both emit `iui:voice` with a frozen `{id, source, intent: "start", voiceSessionId?}` detail. `source` identifies the presentation; only the launcher includes the supplied session ID. The session ID is an opaque reference, never a credential.

## Speaking exercises

`learning-speak-card` requires one to thirty `exercises`. Each has a unique `id` and nonblank target `text`, with optional `language`, `sourceText`, `mode: "repeat" | "recall"`, and `phase: "idle" | "starting" | "listening" | "success" | "failure" | "error"`. The phase is controlled by document updates. Clicking Start does not manufacture a listening or successful state.

Exercise `available: false` additionally disables speaking. `playbackAvailable: true` enables local playback requests when speaking is not starting/listening; `playbackPhase` is supplied as `idle`, `playing`, or `error`. Recall additionally needs `sourceText`. Its target stays masked until supplied success/failure, except for supplied matched segments. Optional `segments: [{text, matched?}]` must reconstruct the target exactly. This renderer performs no matching or scoring.

An optional `labels` object supplies `title`, `directions`, `start`, `stop`, `retry`, `starting`, `listening`, `success`, `failure`, `error`, `play`, `stopPlayback`, `playbackError`, and `hiddenWord`. Defaults are English. `progressLabels`, when present, has exactly one label per exercise. `previousLabel`, `nextLabel`, and `doneLabel` customize navigation. Next requires the current supplied success; Finish appears at the last exercise and requires every exercise's supplied success. An accepted Finish is disabled until reset or a new document generation; a canceled Finish remains available.

Requests emit `iui:speak` with frozen `{id, exerciseId, intent, text, language?, exerciseIds?}`. `intent` is `start`, `stop`, `play`, `stop-playback`, or `finish`. Finish includes a frozen ordered `exerciseIds` snapshot. Events bubble, are cancelable, and do not cross a shadow boundary. `preventDefault()` records cancellation; it never starts an external fallback.

## Lifecycle and reset

Native reset clears the local request receipt, accepted-finish guard and page selection. It does not change supplied speech phases. Canceled resets preserve state; newer navigation wins over an already pending reset. Requests are blocked while reset reconciliation is pending. Current native/ARIA disabled state, fieldset first-legend behavior, hidden/inert ancestry, ownership loss, update and disposal are checked at delivery. Constructor reentry is serialized and ordinary errors remain observable.

The installer is `installVoiceCardsSchema({node, defs})`. Core semantic inspection is `inspectVoiceCards(node, path, add, safe)`. Rendering is `renderVoiceCard(context, node, owner, host)` with `voice-cards.css`. Registry, generated schema, exported API and bundled stylesheet wiring are owned by the central integration.
