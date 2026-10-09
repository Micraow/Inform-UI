# Local activity planning candidate

Inventory IDs: shared-activity-planner and event-sidebar. Both are original supplied-data Base candidates, not aliases. Source remains separate from earlier acceptance.

Planned contracts and acceptance:
- Shared activity planner: bounded supplied participants and candidate activities with explicit offset timestamps, optional location/source and per-participant availability. Users choose a participant and edit only a local preference matrix (yes/maybe/no/unset) without changing supplied availability. A chosen candidate can produce a frozen cancelable local planning review, with explicit unknown/missing values, no automatic attendance inference or invitations.
- Event sidebar: supplied event metadata (organizer/location/timestamps/source) and bounded agenda entries with categories; native details and category filter, local save-intent event only. No calendar write, registration, live status or map access.
- Local interaction tests cover incomplete/empty/maximum data, literal text/links, chronology, disabled/hidden/inert/retained controls, cancellation/reentry/interruption, reset/replacement/disposal, Forms exclusion and no outside-DOM writes.
- Browser specs remain prepared-only unless a separately authorized working browser becomes available. No browser or acceptance count is claimed from generated schema nodes.

## Implemented fields and semantics

`shared-activity-planner` requires label, 1–12 participants `{id,label}`, and 0–20 options. Each option contains unique id/label, valid explicit-offset start/end timestamps, optional location/plain-text description/source, and 0–12 availability entries `{participantId,status}`. Status is available/unavailable/unknown; participant references must exist and be unique within an option. Omitted availability remains unknown. End must follow start by offset-adjusted instant; different candidate activities may overlap.

The participant selector changes which person's local preference is edited. Each activity has a native unset/yes/maybe/no preference selector, a supplied availability label, local count summary and local choice button. Preferences never alter availability or imply a verified reply, consent, attendance, ranking or winning option. No option is preselected. Native outer reset preserves drafts because local inputs are dissociated; explicit reset returns all preferences to unset and clears choice. Optional disabled fieldset blocks interactions.

`iui:activity-plan` bubbles, is cancelable and noncomposed. Detail is frozen `{componentId,optionId,preferences}`; its array and each `{participantId,value}` object are frozen and preserve participant source order. Only the selected option's local preferences are included. Missing choice focuses an owned option button. Cancellation keeps drafts, repeated explicit review is allowed and synchronous reentry is ignored. Actual selected control ownership is rechecked across event getter/construction/listener boundaries.

`event-sidebar` requires eventId, label, explicit-offset start/end timestamps and 0–40 agenda entries. Optional organizer/location/description/source remain supplied. Agenda entries have unique id, label, category, start/end, optional description/speaker. Each entry must be inside the supplied overall event interval; concurrent agenda entries are allowed and source order is retained. Categories are exact supplied labels. Native disclosures retain open state during filtering. Native filter reset respects cancellation, lifecycle, revision changes and ownership.

`iui:event-review` has frozen `{componentId,eventId}`, bubbles/cancels locally and is noncomposed. It does not create or export a calendar file, RSVP, register or reserve anything. Source links are safe absolute HTTP(S) with noopener/noreferrer and no referrer. All text remains literal. Missing data is not filled from system time, geolocation or a service.

Source map: schema generator/subset map, core activity-planning inspector/wiring, renderer activity-planning/activity-labels/wiring/CSS, public event type exports, example, this document, focused tests/public types/prepared browser spec and protocol-count assertions. Rebuild schema/types/CDN after source-only integration. Existing generated files are preserved locally and excluded from source commits. Protocol count is 108, not a canonical accepted-component count; separate poll ownership and people-also-ask changes still need reviewed integration.

## Checkpoint evidence

Initial component tests: 40/40. Final activity/flight-discovery/Forms/core tests: 147/147 (`/tmp/inform-activity-planning-final.log`). Selected schema owner/closed-reference metrics, domain fixture compatibility and CDN/source byte identity: 3/3 (`/tmp/inform-activity-planning-schema.log`). Generation/build, no-emit TypeScript, public type consumer, CDN build, source-boundary and browser-spec syntax checks passed. Real browser execution, native popup/date interactions, screenshots, screen readers and visual acceptance remain outstanding. No CI or remote push was run by this component slot; root handles backup and integration.

A later cross-batch lifecycle pass covering all eight new decision/place/flight/activity components passed 193/193 (`/tmp/inform-later-local-crossbatch.log`), including four new combined-mount checks: balanced native reset listeners over ten replacements, retained/reinserted controls inert after disposal, outside action ownership under other active controls, and safe ordinary source links inside disabled fieldsets. No production changes were needed from this pass. These are still local DOM tests, not browser acceptance.
