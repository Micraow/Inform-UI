# Next architecture checkpoint — 2026-10-13

This development branch preserves the new no-build DSL architecture and the complete official 755-icon catalog. It is not a release acceptance claim.

## Included
- Strict component definitions, local expression/state runtime, generated prompts, shared foundation theme and controls.
- 233 registered components: 21 foundations, 16 chart names, one weather composition and 195 migrated Views. Views include 8 public foundation compositions and 187 shared-primitive domain renderers; deep composition is still in progress.
- All 233 showcase examples passed actual runtime commit validation.
- MIT-licensed OpenUI parser/prompt and chart sources, official MIT OpenAI icons, required dependency licenses and OFL font notices.

## Known acceptance gaps
The first concentrated Chromium pass found horizontal overflow for HorizontalBarChart at 390px. The 1440px traversal crashed at WeatherCard; the cause has not been established. The run stops at its first failing assertion, so it does not establish full browser coverage. Three Skill answer browser tests have not yet run.

Build with npm ci, npm run build:next and npm run showcase:next. The self-contained showcase is generated into output/next/Inform-UI-Next-All-Components.html. Legacy main and its CDN artifacts remain unchanged by this checkpoint.

## Layout follow-up — 14:11 UTC
Shared chart typography now uses foundation caption/small/base roles and waits for the actual host theme before chart geometry mounts. Long component titles wrap without forcing a flex min-content overflow. The showcase selects only catalog modules and View schemas needed by the current DSL, reducing unnecessary full-profile allocation. Seven focused Node checks pass. The two recorded browser failures are still awaiting the concentrated rerun; their causes are not all established.

## Interaction and design checkpoint — 14:35 UTC
- Slider updates retain the range and layout ancestor DOM and refresh revision-safe binding capabilities; integrated type checking and 18 focused Node tests pass.
- Showcase shell selectors are scoped; migrated domain buttons receive shared roles; semantic information/success/warning/error colors and Icon label/tone/size contracts are integrated.
- Three original design/composition examples are included without changing the 233 runtime-component count or 755 official-icon count.
- Earlier real HTTP pointer evidence showed 16–35 trusted input events per gesture with retained DOM. The final integrated HTTP chart/state probe and full 233-component browser visual/interaction batch are pending. Do not treat this checkpoint as full visual acceptance.
- The aggregate Next tests have two known stale assertions (prompt deny-list text and showcase script count), still under review.

## Browser and example follow-up — 15:20 UTC
The integrated single-file artifact passed all four real HTTP Slider/Answer pointer cases at 390px and 1440px, including derived chart data matching, trusted continuous input, original DOM/focus retention and keyboard checks. A broad browser pass reached 697 of 944 planned sample/theme/width cases (233 components plus three compositions); it recorded no page-width overflow or JavaScript errors before later renderer crashes. Some interaction probes incorrectly selected aria-disabled controls and must be repeated. This is not a complete visual/interaction acceptance result.

Inspection of the rendered contact sheets found missing migrated chart-series CSS aliases, producing black FinanceHeatmap tiles. Shared foundation palette aliases now cover all six series. The CodeView gallery sample now demonstrates real multiline JavaScript, syntax tokens and exact-source copying rather than a long placeholder string. Integrated Next build and type checking pass; focused browser follow-up is still pending.

The separately pinned WebChat runtime remains commit 675c6659b40becce1b1ed2d6383d2dee852e8a14. Its HTTP status, JavaScript MIME type, CORS and downloaded byte hash are verified. An attempted direct external-script browser pass timed out or crashed before recording a CDN response, so external-script browser execution is not yet accepted.

## Root-cause follow-up — 16:05 UTC
The 944 unique sample/theme/width render cases were visited, with fresh-browser retries for 24 inconclusive cases. The remaining four EntityOverview probes hit a metadata overlay instead of the intended action area; this is not an assertion that every component interaction is correct. Contact sheets and targeted screenshots were inspected. Shared palette aliases, field grid geometry, and pending-image aspect-ratio geometry were repaired rather than hiding the failures in sample data.

An actual supplied answer reproduced per-keystroke input replacement, chart remounting and an edge-clipped scatter marker. Input/Textarea now retain native elements and avoid value replacement or binding writes during composition; composition end commits once. Select, Checkbox, Switch and RadioGroup retain their controls and refresh current binding capabilities. Shared foundation and composed View ancestors retain children; charts retain their React roots and skip rendering unchanged props. Scatter coordinate ranges reserve pixel space for marker paint and edge labels without changing the supplied data domain.

At 390px and 1440px, the original answer loaded through local HTTP with only its runtime-script URL replaced: the previous runtime lost input identity and all 10 chart SVGs on typing; the candidate retained the input, focus, caret and all 10 SVGs. CDP composition changed from an incorrect extra pre-edit fragment to the intended committed Chinese character. All seven scatter markers now fit inside the SVG. These tests do not verify an operating-system IME candidate popup. Twenty-two focused Node host/foundation/editing/Slider checks passed before the additional DetailsView regression.

The rolling public runtime currently resolves through the `web-chat-latest` branch, with browser/shared CDN caches; the new source fixes require a subsequent bundle publication. HTTP GET/MIME/CORS/hash were verified for its prior bytes. Chromium's direct CDN request separately failed with `net::ERR_CONNECTION_REFUSED`; local-HTTP execution does not establish external-CDN browser acceptance. Do not claim every domain-specific editor or container has full composition continuity.

## Published aligned runtime — 16:19 UTC
`web-chat-latest` now points to `c5b5fc7663c8c97d368768ad27dabb3279dd9898`. An actual GET of the rolling URL returned HTTP 200, JavaScript MIME, CORS `*`, and SHA256 `bd2815aa1901b70c1ccef1541778b8a1888ffd0e66217480a9ae0f12c5967a16`, matching the tested browser bundle. Shared/browser cache lifetimes remain as documented.

The final bundle passed the original-answer local-HTTP comparison at both widths, retaining input and all ten chart SVGs, completing CDP composition correctly, and keeping all seven scatter markers inside the plot. The regenerated 233-component/755-icon standalone showcase passed all four trusted pointer/keyboard Slider/Answer cases. Its 11 MB response exceeded Chromium inspector body retention; the test records an explicit independent HTTP GET for artifact byte-hash verification before continuing the real browser interactions.

Fifty-five integrated contract/editing regressions and five independent domain-child lifecycle tests passed. Details preserves native open state, optional Section headings keep stable child slots, stale Figure accessible names are removed, and discarded/aborted child handles are retired promptly. Native OS IME candidate-window behavior, external-CDN browser execution, and every domain-specific editor remain outside these acceptance claims.

## Shared control and local-state follow-up — 16:40 UTC
Four previously inconclusive EntityOverview action probes now pass real Enter and pointer activation at both widths/themes. The center-point locator was hitting an intentional overlay/metadata layer; no component change was needed for that probe.

A separate real-browser check demonstrated that a Checklist selection was lost after typing in an unrelated Input. A conservative `retainUnchanged` adapter contract now preserves unchanged data-only Views while the host still refreshes their revision. Both the descriptor and host prohibit this shortcut for bindings, actions, slots or actual child records; update-capable renderers retain priority. Changed data, source commits and previews continue to retire old local state. Seventeen targeted regressions cover retained selection/filter/tab/scroll state and capability/lifecycle boundaries; this is not acceptance of all eligible Views.

Shared control migration styles also overrode checkbox grid layout with generic field-column styles and missed explicit primary/secondary button roles. The bridge now restores control/label geometry, visible checked contrast and semantic action variants; Forms and Checklist use those shared roles. Before the final list-indent adjustment, real 390/1440 light/dark checks confirmed grid alignment, visible checkmarks, primary/secondary contrast and no page overflow. The final integrated runtime still awaits its subsequent publication and focused browser rerun.

The 16:45 integrated follow-up build and typecheck passed, as did 43 serial Node regressions. Actual 390/1440 browser tests now keep Checklist selection and its `done` filter through unrelated Input edits. Both themes/widths confirm checkbox label alignment, visible checked contrast, 40px primary/secondary Form actions and no page overflow. Final standalone Slider/Answer pointer and keyboard checks pass 4/4. The adapter shortcut does not claim continuity for slotted or capability-bearing domain Views.
