# Local vocabulary tools candidate

Canonical inventory IDs: word-card and copy-words, both Base candidates. This source work is independent from frozen acceptance.

Planned behavior: supplied vocabulary with reversible definition/examples and explicit local self-marking; a selectable supplied word list with separator, readonly preview, actual user-triggered clipboard write, and visible manual-copy fallback. No remote speech, model, dictionary lookup or invented assessment is intended.

The copy control will dispatch a frozen cancelable intent before using the browser clipboard. A missing/denied clipboard call will not be retried silently. Pending writes will block reentry and respect update/disposal and current DOM ownership when reporting outcomes. Focus must not be reclaimed if the user or host moved it elsewhere. No browser execution or clipboard acceptance is claimed before testing.

## Implemented contracts

`word-card` requires wordId, term (1–200 characters) and literal definition (1–5000). Optional pronunciation, part-of-speech label, translation, 0–8 supplied examples, initiallyRevealed, disabled and safe source are supported. Meaning reveal is reversible, aria-expanded/aria-controls are wired, and nested native example disclosures retain state. Known/review/unset self-mark buttons represent local user choice only. Frozen cancelable bubbling/noncomposed `iui:word-mark` detail is `{componentId,wordId,mark}`. Cancellation preserves the existing mark; repeats and synchronous reentry are handled. No mastery score or external progress is generated.

`copy-words` requires label and 0–80 unique word records `{id,text,note?}`. Each text is literal 1–200 characters; duplicate text is allowed and retained. Optional initialSelectedIds must be unique supplied IDs; omitted means all words. Optional separator is lines/comma/space (default lines), description and disabled are supported. Native checkboxes, select-all/clear controls, separator and readonly preview provide the exact source-order selection; there is no normalization, sorting, deduplication or markup interpretation. All inputs omit names/binds and are dissociated from native external forms, preserving local drafts on external reset.

On explicit copy click, `iui:words-copy` dispatches frozen `{componentId,wordIds,separator,text}` with frozen IDs, bubbling/cancelable/noncomposed. Cancellation prevents even clipboard access. After live ownership checks, the renderer calls that document's `navigator.clipboard.writeText` with the exact preview and correct receiver. Success is reported only after its promise resolves. Missing/rejected/throwing clipboard access produces a visible manual-copy instruction, without automatic retry or hidden fallback. A separate manual control selects the owned readonly preview and rechecks ownership after focus. Clipboard permission and system behavior require actual browser verification.

Pending writes block duplicate copy and local edits; update/disposal/detachment or moved controls suppress stale outcome writes. A clipboard request already issued cannot be revoked, but no retired UI is updated. The renderer never reclaims outside controls, changes external focus on async completion, uploads words or invokes speech/dictionary services. Safe source links use absolute HTTP(S), noopener/noreferrer and no referrer.

## Source recovery and integration

Source-only boundary: schema generator/subset map, vocabulary core inspector/wiring, vocabulary renderer/labels/wiring/CSS, public event exports, fixture, docs, unit/types/prepared browser specs, and protocol count assertions. Current 110 protocol types are not an accepted-component count. Rebuild schemas/declarations/CDN after source integration; generated artifacts stay preserved locally but outside the source commit. Earlier poll ownership, people-also-ask and acceptance harness work remain separate.

## Verification

Initial component suite passed 39/39. Final vocabulary/activity/Forms/core run passed 141/141 (`/tmp/inform-vocabulary-final.log`), including pending clipboard resolution/rejection, event/clipboard getter interruption, moved controls, disposal/replacement/detachment, actual writeText receiver/text, no access after canceled intent, manual selection after focus mutation, pending Forms and maximum Unicode text. The vocabulary test harness explicitly fails on uncaught host-listener errors. Native browser clipboard permissions, real system clipboard contents and visual/accessibility acceptance remain outstanding; the corresponding browser specs are prepared and syntax checked only.
Generation/build, final CDN rebuild, no-emit TypeScript, public type consumer and source-boundary passed. Selected schema ownership/closed-reference metrics, domain fixture compatibility and CDN/source identity passed 3/3 (`/tmp/inform-vocabulary-schema.log`). No browser run, CI trigger or remote push was performed by this slot. Generated artifacts remain preserved unstaged; root owns backup and acceptance.

## Manual-focus follow-up

Independent review reproduced a post-focus ownership gap: moving or disabling a selected word during preview focus still allowed native selection. Three old-code controls (moved word, disabled word, new pending clipboard operation) each reproduced unwanted select calls. The manual handler now rechecks selected-control ownership, pending state and a local draft revision after focus; a newer selection draft also aborts native selection. Final vocabulary regression suite passed 46/46 (`/tmp/inform-vocabulary-focus-guard-final.log`). No clipboard request or current107 acceptance code is changed by this follow-up.
