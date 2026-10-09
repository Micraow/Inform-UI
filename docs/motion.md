# Explicit bounded motion

`animate` and `celebration` are original base-group portable nodes. Their controls require an explicit native activation, including host `.click()`. Mount, state updates and document loading never start a preview.

- `animate`: required literal `label` (1–200 Unicode code points) and `children` (0–50). Optional `effect`: `fade` (default) or `rise`; integer `duration`: 100–1000 ms (default 300); literal boolean `disabled` (default false).
- `celebration`: required literal `label` (1–200) and `message` (1–1000). Optional integer `duration`: 300–1800 ms (default 900); literal boolean `disabled` (default false). The localized supplied-message disclosure makes no achievement or completion claim.

Preview and Stop stay mounted and focusable, with `aria-disabled` no-op states for playing/idle. Native node/fieldset disabling is honored even for forged events. Empty animate children have an empty label and no controls. Preview controls are unbound `type=button` controls, never form values.

Animate applies one finite WAAPI effect to a persistent content surface. Celebration uses six fixed original shapes inside a separate clipped decorative strip. Reading content and focus outlines are never clipped by the strip. There is no autoplay, loop, audio, whole-page particles, arbitrary CSS/keyframes, host callback or network/storage access.

The owning window's reduced-motion preference produces an honest static state and cancels active motion when it changes. Missing animation support produces a static unavailable message. Missing `matchMedia` means ordinary bounded motion, not an inferred preference. No timer or frame-loop fallback is provided. All previews end through WAAPI completion promises; stop/update/dispose release their handles and media listeners. Unrelated state updates retain DOM, nested drafts, tabs, timers and in-progress previews.

Run `npm run generate && npm run build`, then `node --test tests/motion.test.mjs`, `npm run typecheck`, `npm run test:types`, `npm run build:cdn` and `npm run check:boundary`. The focused jsdom suite uses labeled WAAPI/media/clock test doubles and is not browser acceptance. `tests/browser/motion.spec.mjs` is prepared for real browser coverage but has not been executed. No existing browser-verified component counts are changed by this candidate.
