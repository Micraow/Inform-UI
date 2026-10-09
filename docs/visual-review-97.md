# Pending visual review: combined 97-node batch

**Not reviewed.** A passing browser suite is necessary but does not establish visual fidelity or complete acceptance. Review only screenshots from the single run whose core, asset and Skill revisions match its exact batch lock and receipt. Never substitute old-run images, generated mockups or private reference captures for actual rendered evidence.

The workflow's always-upload artifact, `synthetic-ui-browser-evidence`, already retains `library/test-results/`, the Playwright report and `skill/artifacts/`. Preserve the entire artifact before its retention window expires. Keep run URL, artifact ID, core/asset/Skill revisions and screenshot paths with the review. A failed or canceled run may contain partial evidence; missing images remain unreviewed.

## Representative canonical screenshots

Paths below are relative to `library/test-results/`. `**/` means Playwright's per-test output directory, not an old artifact. Start with light narrow and dark wide, then inspect the corresponding other theme/width when a defect or uncertainty appears.

| Area | Narrow light | Wide dark | Extra states |
| --- | --- | --- | --- |
| Asset distribution + transaction list | `ledger-light-390.png` | `ledger-dark-1100.png` | `ledger-rtl-390.png`, `ledger-forced-colors.png` |
| Flight option + artist events | `travel-events-light-390.png` | `travel-events-dark-1100.png` | `travel-events-rtl-390.png`, `travel-events-forced-colors.png` |
| Onboarding selection | `onboarding-selected-light-390.png` | `onboarding-selected-dark-1100.png` | Compare `onboarding-light-390.png` after reset |
| Package + flight trackers | `trackers-light-390.png` | `trackers-dark-1100.png` | `trackers-rtl-forced-colors.png` |
| Repaired motion | `**/motion-light-320.png` | `**/motion-dark-1100.png` | `motion-animate-controlled-midphase.png`, `motion-celebration-controlled-midphase.png` |
| Repaired carousel | `**/carousel-light-390.png` | `**/carousel-dark-1100.png` | `carousel-nested-open.png`, `**/carousel-contained-narrow.png` |
| Repaired agenda | `agenda-light-390.png` | `agenda-dark-1100.png` | `agenda-rtl-390.png`, `agenda-forced-colors.png` |
| Repaired suggestions | `suggestions-event-consumer-light-390.png` | `suggestions-event-consumer-dark-1100.png` | `suggestions-rtl-forced-colors.png`, `suggestions-touch-light-390.png` |

Motion midphase screenshots use the real paused browser Animation at the midpoint of its declared duration; they are explicit controlled visual checkpoints. They do not replace the separate natural-completion test or establish perceived animation quality by themselves. The static reduced-motion screenshots remain required.

## Original consumer cross-check

Use `consumer-batch/pending/<example>-<theme>-<width>.png`, beginning with each new fixture at light-390 and dark-1100:

- `finance-lists`
- `flight-option`
- `artist-upcoming-events`
- `onboarding-selection`
- `supplied-trackers`

Also compare repaired `motion`, `carousel`, `agenda`, and `prompt-suggestions` consumer examples when their exact names are present in the receipt. The receipt, rather than an assumed filename, is authoritative. Inspect the current Skill/CDN screenshots under `skill/artifacts/examples/` to establish that the public entrypoint matches the same theme and layout; do not treat inline evidence alone as CDN acceptance.

## Human inspection checklist

Open actual image pixels at readable scale. For each reviewed area/state, record `pass`, `fix needed`, or `not reviewed`, with the exact screenshot path and observations.

- Typography: text hierarchy, line-height, long supplied strings, Chinese/Arabic glyphs, visible timestamp offsets and numeric alignment.
- Layout: narrow wrapping, spacing, card boundaries, table/rail-local scrolling, no document-wide overflow, no clipped controls or hidden focus indicators.
- Themes: surface/border/text distinction in light and dark; selected, disabled, pending and reset states remain distinguishable.
- Accessibility presentation: visible keyboard focus, 44px control geometry, RTL reading order, LTR numeric/time islands and forced-colors readability. Screenshots do not constitute assistive-technology testing or a WCAG certification.
- Lifecycle states: nested overlay stays in the viewport/top layer while open; selection and clear/reset states are visibly distinct; the agenda capture has no stray native menu; suggestions host text wraps without changing literal content.
- Supplied-data honesty: disclosures remain legible; unknown/zero values are distinguishable; timelines and prices do not visually imply live verification or completed external actions.
- Fidelity: compare against the agreed design requirements and authorized references if available. Without a reference, report layout/readability quality, not pixel-identical fidelity to an unavailable original.

Do not advance accepted counts solely because tests are green. Close browser, original-consumer, exact CDN, screenshot review and any requested assistive-technology gates separately, and retain unresolved differences explicitly.
