# Supplied GCS component arithmetic

This original software module accepts already-assessed component ratings. It does not assign a rating from symptoms, provide examination instructions, determine severity, or recommend treatment. The host application is responsible for suitability, assessment context and lawful use. No clinical validation is claimed. Passing software tests does not establish clinical competence.

## Version and data contract

`calculator-glasgow-coma-scale-gcs` uses explicit `initial.version: "gcs-six-motor-levels"` and `initial.population: "adult"`. It implements conventional E 1–4, V 1–5 and M 1–6 arithmetic. The sixth motor level was introduced in 1976; this is not the five-level motor version originally described in 1974. No pediatric modification, pupil response, risk band or treatment rule is included.

Inputs are numbers, `"NT"`, null or absent. Empty string is missing. Numeric strings, decimals, zero, out-of-range values and other strings are invalid, rather than coerced or clamped. JSON accepts bounded raw strings so caller errors can be displayed explicitly. No rating is preselected unless the caller supplies it. An unsupported version or `population: "other"` suppresses the total.

`calculateGcs(input)` returns the supplied component states and one status:
- `invalid`: malformed supplied fields, no total; takes priority over missing values.
- `unsupported`: another version/population, no total.
- `not-testable`: at least one NT component, no total, with all other component states still explicit.
- `incomplete`: missing required values, no total.
- `calculated`: all three integer ratings, explicit version and adult scope are valid; total is the sum, from 3 to 15.

NT is never zero or one and is never imputed. On every edit the previous total disappears immediately. A total alone must not replace the three component ratings.

## Local UI

Labeled native selects support keyboard input. The view preserves invalid initial values as visibly invalid options rather than quietly selecting a valid score. Calculate and Reset dispatch frozen, bubbling, cancelable, non-composed `iui:gcs` details `{id, intent, result?}`. Cancellation preserves local values; newer user input in a host callback wins over an older operation. Form Reset is reconciled after the actual browser default action; cancellation and subsequent input are preserved. Supplied disabled, native fieldset and first-legend boundaries remain effective. Updates/unmounts retire the old view.

The official-source link navigates only on explicit user activation. No service, analytics, microphone or image request is made by this module. The caller may override labels for the two actions; this does not change the arithmetic contract.

## Sources and originality

- [Official GCS version history](https://www.glasgowcomascale.org/gcs-aid/), checked 2026-10-12: the motor scale gained a sixth level in 1976; the structured assessment was described in 2014.
- [Official GCS FAQ](https://www.glasgowcomascale.org/faq/), checked 2026-10-12: report component states, do not replace NT with a lowest rating and do not total an assessment containing NT.
- [Official 2015 assessment aid](https://www.glasgowcomascale.org/downloads/GCS-Assessment-Aid-English.pdf?v=3), read to verify numeric ranges and NT; no diagram or response-description table is redistributed.
- [Official permissions](https://www.glasgowcomascale.org/permissions/): states clinical/research use permissions and copyright acknowledgements. It is not represented here as an MIT redistribution grant for the assessment aid.

This repository contains independently written arithmetic, validation, controls and explanatory text. It does not reproduce the protected assessment aid, its diagrams, examination instructions or response-description table. Link to the official assessment material when that material is needed. Integration of third-party assessment content requires the appropriate rights; the caller-responsibility notice does not itself supply those rights.

## Scorecard presentation

Default presentation is live: every supplied rating edit recomputes the safe arithmetic result and immediately removes a total for NT, unknown, invalid or unsupported data. `resultMode: "on-demand"` instead uses the Calculate action. Optional caller-authored `subtitle`, `notes`, `infoSections` and `activeInfoId` support the full information layout. Information tabs include keyboard navigation with modifier/IME protection. Text is literal, never executable markup.

`fields.eye/verbal/motor` can supply a label, help, selected-rating `optionHelp`, and native `select` or `segmented` radio presentation. The module's bundled choices are numeric scores, unknown and NT; no protected response-description table is included. Hosts may supply independently authored or appropriately licensed explanations.

`defaults` is an independent Reset baseline; when absent, Reset returns to `initial`. Reset leaves the current information section selected. `status: "pending"` renders a 320px placeholder; `failed` displays a supplied fallback or remains hidden. Supplied phase changes use normal atomic document updates.

A visible summary always preserves component states. Copy summary dispatches `iui:gcs` with `intent: "copy-summary"`, frozen `text` and the current result; it never writes the clipboard. Tab requests use `intent: "select-info"` and `infoId`. The host can cancel either. Protected assessment wording, risk bands and treatment suggestions from other implementations are not imported: the original output here describes input validity and arithmetic only.

## Source module and document validation

`calculators/gcs` uses the unchanged original installer. Full document validation rejects whitespace-only label, calculateLabel, resetLabel, copyLabel and scoreLabel (`GCS_TEXT`), and supplied field labels use the same code. Information section IDs and labels must be nonblank, IDs unique, and activeInfoId must name a supplied section (`GCS_INFO`). Each optionHelp key must be NT or an exact integer rating string for its component: eye 1–4, verbal 1–5, motor 1–6 (`GCS_OPTION`). Help/body/notes and other structurally allowed content retain their empty-string allowance. Raw initial/default values may represent invalid, unknown or NT input; structural acceptance never supplies a total. The unchanged pure function enforces version/population/rating gates described above.
