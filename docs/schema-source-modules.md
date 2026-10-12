# Source-backed schema modules

This is an incremental source-maintenance pilot. It changes how definitions are maintained and selected, not the `iui/1` wire protocol. The full schema, generated TypeScript declarations, validator and historical group fragments must remain byte-for-byte equal to the pre-migration build.

## Single source and merge

`scripts/schema-source/primitives.mjs` owns common schema builders. `modules/*.mjs` owns the migrated definitions. `catalog.mjs` declares each module's providers, dependencies, category, contract and examples. The registry checks duplicate definitions/nodes, missing dependencies, dependency cycles and undeclared references. Recursive schema references such as `Value` and `Node` remain valid; they are different from module dependency cycles.

`canonical.mjs` merges the same modules at their historical positions alongside explicitly unmigrated legacy domains. `generate-schema.mjs` writes the complete WebChat schema, derived TypeScript types, CSP-safe AJV validator and compatibility artifacts. TypeScript interfaces elsewhere in the runtime are not claimed to be the source of the schema. Legacy definitions remain visible as such until they are genuinely migrated.

Selected packages execute only the requested source modules and their declared dependencies. They do not read or slice the generated full schema. Their `Node` union contains the actual included components, including all components owned by a requested family. Unused definitions are pruned from this selected-source result. No `base` mega-group is silently added. Full semantic validation is still required before mounting or compiling a document.

## Commands

- Discovery metadata: `node scripts/build-schema-selection.mjs --index --output /tmp/iui-source-index.json`
- Local form and questionnaire authoring: `node scripts/build-schema-selection.mjs --modules foundations/text,forms/fields,forms/questionnaire --output /tmp/iui-form-package.json`
- Node-root lookup only: append `--root node`; document root is the default.
- Complete WebChat schema from source: `node scripts/build-schema-selection.mjs --full --output /tmp/iui-full.json`

Full and selected schema commands also write `<output>.manifest.json`. Manifests record source identity, actual components, byte size, schema hash and per-definition hashes. The index contains metadata, not every schema body. Byte counts are measured; no model-independent character heuristic is presented as a tokenizer measurement or a quality score.

Only fixed, trusted repository modules can be selected. IDs are not import paths, source URLs do not execute, and arbitrary filenames cannot be dynamically imported through the CLI. Unknown IDs/options, conflicting providers and incomplete references fail before any schema output is written. This does not alter runtime URL, expression or semantic validation rules.

## value

`shared/value` provides the bounded scalar/reference/operator grammar shared by all trial families. It has no renderable node of its own.

## text

`foundations/text` provides text, title and caption plus text runs. It depends on the shared expression grammar.

## layout

`foundations/layout` provides the existing foundational layout, disclosure, table, link and local control block. This first migration keeps its historical definition order. Its family is intentionally reported as a family; asking for it includes all its reported nodes.

## forms

`forms/fields` provides input, textarea, radio, segmented, field and form. Required/range/date/disabled semantics and existing Form event behavior remain unchanged. A structural schema cannot replace the full validator's form ownership, binding and expression checks. Read the [form contract](forms.md) for declared bindings, invalid drafts, validation, submission and reset behavior.

## button

`foundations/button` provides the existing local button action data. It does not add arbitrary code or external action execution.

## questionnaire

`forms/questionnaire` provides the independently tested generic questionnaire. Its unknown/invalid, hidden-answer policy, immutable snapshots and cancellation contract are described in [the questionnaire contract](questionnaire-contract.md). This does not add any dedicated medical formula or revive the paused component expansion.

## charts and learning

`charts/basic` provides the existing chart node. `learning/basic` provides quiz, flashcards, fill-blank, sentence-builder and vocabulary cards. Their [chart](charts.md) and [learning](learning.md) contracts remain authoritative. Both depend on shared values and can be selected with form or text modules for a cross-family document. The catalog reports 145 migrated nodes and 73 legacy nodes; this does not change the 218-node wire union.

## content

`foundations/content` owns markdown, writing-block, email-draft, task-expansion-card, code, math, badge, divider and spacer. Load the [bounded Markdown contract](markdown.md), [local writing contract](writing-block.md) and [code contract](code.md) for their specific behavior. Those historical documents retain their original release-stage notes; selection does not claim a new browser acceptance run.

Code is displayed, never executed. Its inline branch excludes block copy/highlight controls; text is literal. Math takes authored LaTeX under the existing bounded renderer, not executable JavaScript. Badge values may use the shared expression grammar; divider and spacer are structural display nodes.

Email drafts contain caller-supplied recipients, subject and body. They provide local review/editing, not email delivery or account access. Task expansion cards display supplied steps and local reviewed state, not a task executor. Writing, Markdown and email values are literal strings rather than references to a bound answer. Full semantic validation remains required, including component restrictions inside forms. Selection does not turn local edits into a submitted answer or persist them.

## topology

`graphics/topology` owns the existing supplied topology diagram: 2–24 named nodes and 1–40 directed links. A link's `from` and `to` refer to supplied node IDs; the full validator checks IDs and endpoints. Optional load values use the shared expression grammar and must resolve to nonnegative finite numbers under semantic validation; max-load highlighting only describes the supplied data. No network graph discovery, routing, remote loading or task execution is performed. Captions and labels are supplied by the author. The selected structural schema is used with the unchanged full semantic validator.

## Time and weather

`time/controls` provides the local clock, stopwatch and timer. `weather/snapshot` provides the complete supplied weather node, including its additive presentation, labels and local intent options. Weather's extension installer is invoked only by its owning module, before that module is registered as complete; the canonical merge does not modify it afterward. Both have self-contained examples and explicit `semanticContractPaths` for their [time](time.md) and [weather](weather.md) contracts. These optional catalog paths identify required semantic reading; ordinary links in those documents remain navigation, not an instruction to import every linked release guide into a prompt. Existing `contractPath` is retained for compatibility. No timer service, weather lookup or new runtime behavior is introduced.

## Supplied onboarding, voice and task cards

`voice/cards`, `onboarding/conversation`, `onboarding/cards` and `tasks/cards` register the existing independently maintained domain installers directly. Their original schema scripts remain the only definition source; no new copy is extracted from generated JSON. Voice practice takes supplied capabilities, phases and results, while task and onboarding controls emit the existing local intents rather than running services. Each family has an isolated example and an explicit list of mandatory semantic contracts.

Every registered module now declares `semanticContractPaths`. These are the authoritative required readings, including shared expression/safety rules and cross-field constraints. A consumer should load the union for selected modules and their dependencies. Ordinary Markdown links remain navigation; they do not automatically expand the mandatory set to release guides, CDN inventories or the README. `contractPath` remains a compatible discovery entry. This runtime catalog addition does not by itself assert that a downstream consumer has adopted this loading policy.

## Request and quiz card families

`requests/user`, `requests/location`, `onboarding/welcome` and `learning/quiz-cards` register the existing single-source domain installers. They retain finite supplied input/intent and quiz-result contracts. Their explicit semantic documents include nonblank scopes, optional-empty exceptions, ID/reference constraints, source/capability rules and revision relationships. These are existing components, not additions to the paused specialized-calculator list.

## Supplied finance and context views

`finance/entry`, `context/actions`, `finance/equity-watch` and `finance/credit-display` reuse their original source installers. Their data is supplied display content and finite local intents, not bank connectivity, market retrieval, credit assessment or trading. Explicit contracts describe the actual nonblank checks and exceptions, exact supplied labels, identifier relationships and plotting domains. No numerical financial decision rule is added by this source registration.

## Supplied discovery, launchers, care and interactions

`discovery/cards`, `launchers/cards`, `care/providers` and `interactions/local` register existing independent installers. Original local card names remain compatibility identifiers; their data does not provide private service interfaces or execute account, medical, booking or partner operations. Each family retains its exact required semantic checks and explicit empty-content exceptions. No new component or rule is introduced.

## Supplied category views

`finance/category-views` registers the existing three category and recent-transaction nodes from their original installer. Its explicit required reading is [the supplied category contract](ledger-category-contract.md). Selecting this family with finance entry or text modules uses the shared value dependency once; it does not add a financial service or calculate totals.

## Media dependencies

`media/readers` and `media/lottie` register their maintained JSON definitions without changing full definition or node order. `learning/visualization` depends on `media/lottie`; `media/inline-host` depends on `media/readers`. Selecting these families includes the stated prerequisite nodes, which are visible in the selection manifest. Required semantics include the exact safe-source, ratio, bounded animation and local host-intent contracts. No full-output reverse slicing or second definition copy is maintained.

## Composed demonstrations

`learning/study-demo` selects its real quiz definition dependency. `reservations/pills` supplies the existing grouped and carousel contracts. `onboarding/search-capability` composes reservation data, location and media readers with explicit source dependencies and mandatory semantic reading. Selection manifests expose all included nodes; no provider or account runtime is added.

## Entity and automation views

`automation/views` and `entities/cards` use their original finite source installers and explicit semantic contracts. They compose with text and other selected families without adding scheduler, account or entity lookup services. Their required documentation preserves nonblank exceptions, ID scopes, phase restrictions, safe-image rules and local intent boundaries.

## Previously implemented calculation views

The four `calculators/corrected-age`, `calculators/gcs`, `calculators/rox` and `calculators/qsofa` modules register only existing authored installers. Their original formula versions, unknown/invalid draft behavior, result gates and source/rights limitations remain mandatory reading. No arithmetic or medical rule is added by source classification.

## Supplied records

`content/supplied-records` maintains the existing agenda, person profile, news article and review definitions in one source module. Shared date/time patterns remain in primitives for later domains; full output order and bytes are preserved. The four explicit contracts cover civil dates, local ID scopes, safe URLs and passive supplied-data behavior.

## Local choices and supplied gallery

`choices/local` owns the original restaurant availability, onboarding selection, draft poll, location-choice and business-gallery declarations. Shared key/date patterns stay in primitives for remaining domains. Five explicit contracts preserve finite selection boundaries, legal incomplete drafts, per-list IDs, real dates and safe source URLs. No location, reservation, polling or media discovery service is added.

## Supplied travel and tracker snapshots

`travel/snapshots` is the maintained source for the four existing flight-option, artist-event, package-tracker and flight-tracker nodes. Shared exact date/time patterns remain available to later source domains. Explicit mandatory contracts preserve real-date, offset-adjusted order, per-list IDs and finite supplied-status rules without provider access or inferred operational state.
