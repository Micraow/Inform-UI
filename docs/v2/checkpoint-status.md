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
