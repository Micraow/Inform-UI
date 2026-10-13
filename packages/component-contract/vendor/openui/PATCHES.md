# Local changes from the pinned upstream source

1. `src/telemetry/runtime.ts` was replaced by unconditional no-op exports needed by prompt code. The original telemetry implementation is neither imported nor retained in this minimal source closure. This patch changes telemetry, not language parsing, signatures or schema generation.
2. No other retained upstream source file is modified. `FILES.json` records original and current SHA-256 values for each retained file.

The Inform wrapper outside this directory calls `generatePrompt` and then makes three fixed English-text replacements so upstream fallback descriptions do not contradict the strict Inform runtime:
- undeclared mutable variables are errors, instead of automatic null declarations;
- unreferenced values do not render, without promising silent content recovery;
- named/colon arguments are rejected, rather than silently breaking.

Additional local-only, finite-value and budget requirements are passed through upstream `additionalRules`. The parser/runtime package independently enforces them. Prompt text is documentation, not a security boundary.

## Host-policy prompt action filtering

`parser/prompt.ts` accepts `allowedActionSteps`. Inform passes Set/Reset so the generated prompt teaches only implemented local transactions, with no implicit assistant messages or navigation. The upstream default remains unchanged when this option is absent.
