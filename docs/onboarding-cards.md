# Finite onboarding cards

These three presentations consume explicit data and emit cancelable local requests. They do not install or connect an app, open a client modal, change account settings, submit a conversation turn, create a task, request a site preview, or send analytics. Accepted requests change only a local receipt and, for selection cards, the local choice.

## Shared contract

Every node needs an accessible `label`. `status` is `resolved` (default), `pending`, or `failed`. Pending nodes show a loading status without actionable controls. Failed nodes use `fallback` or hide if no fallback is supplied. `disabled` rejects all action requests even if a host tampers with a button's disabled property. Optional `requestedLabel`, `cancelledLabel`, and `emptyLabel` customize copy.

Image fields are safe supplied `imageSrc` and/or `darkImageSrc`. The renderer chooses one image for the current theme and uses the existing owned image reader. Artwork is decorative beside meaningful supplied text. No icon lookup or image search occurs. Ordinary external image loading is the only optional remote resource in these components.

## Feature collection

`onboarding-feature-card` requires `title`, `features`, and `benefits`. Up to twelve features have unique `id`, `featureId`, `title`, and `description`, with optional artwork, `artworkLabel`, `tooltip`, and `disabled`. The shared finite carousel preserves native scrolling and accessible controls.

Up to twenty benefit rows have unique `id`, `title`, and `description`, with optional short `symbol` and `featureId`. A benefit with no feature ID is static. `welcomeHeading` and `welcomeBody` are optional. The body uses the project's finite Markdown parser for text formatting; links become text and inline images do not load.

Feature and benefit controls emit `iui:onboarding-feature` with frozen `{id, target, itemId, featureId, intent, tooltip?}`. `target` is `feature` or `benefit`. Featured `intelligence` requests `set-thinking-effort`, featured `images` requests `open-image-composer`, and other features or benefit rows request `open-feature`. These are local intent names, never calls to an application API.

## Plugin suggestions

`onboarding-plugin-suggestions` requires `title` and `plugins`. Each plugin has a unique `id`, `label`, and supplied `status: "available" | "connected" | "unavailable"`. It may include `description`, `statusLabel`, `connectLabel`, artwork, and `disabled`. Only the first four supplied entries are displayed and actionable. Up to thirty may be supplied; hidden entries cannot emit requests.

`canBrowse: true` requires `browseLabel` and exposes Browse. `canConnect: true` exposes Connect only for available entries. Missing capabilities hide those controls. Connected/unavailable labels remain supplied presentation, and an accepted Connect request never fabricates a connected state.

Controls emit `iui:onboarding-plugin` with frozen `{id, intent: "browse" | "connect", pluginId?, position?}`. Connect includes the plugin ID and its one-based visible position. No credentials, login flow, installation status mutation or telemetry is included.

## Starter tasks

`onboarding-starter-tasks` requires `heading` and up to twenty `tasks`. Each task needs a unique `id` and `label`; optional fields include `description`, artwork, short `symbol`, `completed`, and `disabled`.

- `variant: "pills"` (default) is a wrapping collection of prompt buttons.
- `variant: "cards"` shows artwork, label, description and a separate button. `actionLabel` supplies its visible action text.
- `variant: "selection"` is a responsive pressed-button grid with a local reset button. Optional `selectedTaskId` must name a supplied task. `resetLabel` customizes reset copy.

Pills/cards require nonblank `prompt` text per task and optionally `starterPromptId`. A task with `requiresSitePreview: true` is disabled unless `canRequestSitePreview: true` is supplied. Completion styling is supplied and does not disable an otherwise supported prompt. Selection tasks do not accept prompt/preview payloads.

Controls emit `iui:onboarding-task`. Prompt detail is frozen `{id, intent: "submit-prompt", taskId, prompt, starterPromptId?, requiresSitePreview}`. Selection detail is frozen `{id, intent: "select", taskId}`. A canceled selection retains the previous choice. A later accepted selection updates only local `aria-pressed` state.

## Lifecycle and reset

All events bubble, are cancelable, and do not cross shadow boundaries. Constructor reentry is serialized; ordinary errors remain observable and release the admission lock. Current native/ARIA disabled state, first-legend fieldset behavior, hidden/inert ancestry, ownership loss, update and disposal are checked before and after delivery.

Native reset clears receipts and restores the initial local selection. Canceling reset preserves current state. A new selection is local input and supersedes an already queued reset; other request intents wait until reset reconciliation settles. Document updates replace all local state with the newest supplied data. Image resources, carousel resources and reset listeners are generation-owned and released on disposal.

Integration entry points are `installOnboardingCardsSchema({node, defs})`, `inspectOnboardingCards(node, path, add, safe)`, and `renderOnboardingCards(context, node, owner, host)`, with `onboarding-cards.css`. The central integration owns registry, generated schema, API exports and bundled stylesheets.

## Required nonblank semantic checks

Full `validateDocument` rejects every supplied top-level string that is blank after `trim()` on these three nodes, including labels, titles, optional IDs, welcome content, fallback and action/receipt labels. It likewise checks every direct string property in each supplied `features[]`, `benefits[]`, `plugins[]` or `tasks[]` record. This covers IDs, descriptions, prompts and optional image-source strings; image URLs must additionally pass the existing safe-image validator. Failures use `ONBOARDING_CARD_DATA`. These checks apply even to provided fields in pending/failed phases. Optional fields may be omitted; supplied whitespace is not a default.

IDs must be unique within each list. Browse capability requires a nonblank `browseLabel`. Non-selection task presentations require a nonblank prompt for every task and cannot supply `selectedTaskId`. Selection presentation requires any selected ID to identify a supplied task and rejects task prompt, starter-prompt and site-preview payloads. Do not broaden the direct-property check into an invented recursive prohibition on every possible nested value.
