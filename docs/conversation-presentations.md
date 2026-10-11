# Supplied conversation pill states

This independently authored extension fills the phase, decorative-image and local voice-intent branches of the portable suggestions contract. Existing `suggestions`/`prompt` fields and legacy event details remain valid. The code has no conversation provider, voice engine, account integration or automatic message delivery.

## Input and rendering

`status` is optional `resolved` by default, or explicitly `pending`/`failed`. Pending renders a full-width, 80-pixel loading block with no actions. Failed renders optional plain-text `fallback`; without fallback the group is hidden. An empty resolved list remains an empty group, not loading or failure.

Each of up to 12 suggestions retains its unique `id`, nonblank `label`, nonblank `prompt`, and optional disabled state. Optional `iconSrc` is validated as a safe image URL, rendered decoratively at 24×24 with contain fit, and hidden on failure without losing the text. It uses the existing supplied image reader for connection, source cleanup and retirement. Supplied images can perform their declared image request; this is not an account or voice connection.

`intent` may be `new-turn` or `start-voice`. The list is a vertical stack of content-width, 40-pixel rounded pills with 8-pixel gaps. Text is single-line with ellipsis. Labels and fallback are plain text.

## Event compatibility

`iui:conversation-suggestion` remains bubbling, cancelable and non-composed. Legacy inputs emit frozen `{id,prompt}` exactly. An explicitly supplied intent adds that field to the frozen detail. Default legacy suggestions represent a new-turn request to the host; the library never sends the prompt. A `start-voice` receipt likewise does not start a microphone or session. Cancellation permits retry. Shared ownership, intent gating, disabled behavior, form isolation and atomic replacement are retained.

## Verification

The initial source build passed 35 Conversation tests (21 existing and 14 extension cases), plus all 38 FollowUp tests, 73 total. Generate, build and TypeScript checks passed. Exact source consumers and independent review follow separately; no new CDN or native result is claimed. The canonical row remains partial until its complete functional gates are reviewed, leaving overall counts at 142 implemented, 6 partial and 108 missing.
