# Inform domain View renderer

195 concrete DOM adapters for the new DSL View contracts. This package consumes evaluated props.data, explicit child slots and runtime-issued action/binding handles. It does not accept iui/1 documents and does not include the old document mount, parser, validator or expression evaluator.

## Integration

Import createDomainViewAdapters, domainViewCSS and domainMathCSS from src/index.ts. Inject the host's createFoundationElement as createElement and a renderIcon(document, canonicalName, options) function that uses the official 755-name registry. Merge these adapters with createFoundationAdapters and pass the result to the shared contract registry.

Use the authoritative View contracts and their semantic validation before rendering. The descriptors mirror the checked contract ABI; the renderer is not a replacement for whole-document validation.

Styles must be inserted in this order: domainMathCSS, domainViewCSS, foundationCSS, migratedControlCSS. Domain CSS owns data-visualization and layout. Shared foundation owns typography, control colors, corners, spacing, hit size, focus and interaction states. 1,520 legacy control-skin declarations were removed; generated/control-skin-audit.json records each removal.

The host should provide context.theme for Lottie source selection. HTTPS images require context.allowImageURL. Remote animation JSON additionally requires context.allowAnimationURL. Both default to denial. HTMLView renders a visible host boundary and the supplied source as text; it never enables scripts or iframes. Host intent events use inform:view-* and describe a request only; the package performs no account, booking, messaging or provider service calls.

## Honest migration coverage

- 195/195 View adapters render real semantic DOM and clean up after disposal.
- 8 Views are composed through registered public foundation components: Section, Figure, GridItem, MetricGrid, Metric, TabPanel, List and Spacer.
- 187 Views reuse the original specialized DOM routines, through the new shared element/control/icon/theme bridge. This is not reported as complete public-base composition.
- 11 representative fixtures contain independent data SVG geometry; those shapes are charts or diagrams, not UI glyphs.
- The full 219-type matrix separately includes 23 foundation mappings and the deliberate Native refusal. These are not additional domain adapters.

See generated/coverage.json, coverage.csv and coverage-219.json. Each row separates actualAdapter and publicBaseComposed.

## State, ownership and boundaries

Rating and Segmented bind their value through writeBinding. Other domain interactions remain component-local and are not presented as persistent runtime state. Checklist uses private per-view local state. Form.onSubmit and Pressable.onPress dispatch only the runtime's opaque local action. Literal actionId/query/URL data does not grant execution rights.

The extracted domain routines retain listener, timer, observer, overlay, animation and cancellation ownership. Slot children are rendered through context.renderChild and disposed with their parent. Pressable waits until its cancelable intent has bubbled before local dispatch; disposal cancels the queued action. Partial rendering is a passive placeholder.

TabGroup uses initialIndex and reads labels from child.props.data. LabelView is display-only; an old authored target string cannot establish DOM identity in the new DSL.

## Verification and remaining limits

npm run build, npm run typecheck and npm test pass. Tests exercise all 195 concrete examples, binding writes, checklist selection, keyboard tabs, cancellation/disposal, passive partial rendering, HTML/SVG defenses, and remote-animation denial. npm run audit emits the per-view coverage and glyph scan.

When run inside packages/domain-view-renderer, the tests resolve the host foundation from the repository root. An isolated package can set INFORM_SOURCE to the public source checkout containing src/v2/foundation.

Browser visual QA is intentionally left to the integrating host. JSDOM cannot verify Canvas-backed initialization for LottieView and LearningVizDilView. Mount/dispose is covered, but real animation, responsive geometry, focus-visible appearance and dark-theme screenshots remain browser checks. The 187 native-domain Views still need deliberate public-component recomposition if that is the desired final architecture.
