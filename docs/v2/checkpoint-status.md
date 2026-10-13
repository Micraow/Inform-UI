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
