# Control presentation and alignment scope

This project uses independently authored code. Protocol support, behavior tests and visual equivalence are different claims. The complete catalog is not a declaration that every component matches a reference product.

## Reviewed control batch

- **Rating summary:** the reference display is one solid star followed by a supplied rating label, muted review-count label, and optional source identity/link. `rating-summary` adds this read-only composition. Provider text replaces any external service logo; no service artwork or assets are copied. This batch establishes the display structure, not a pixel-identical branded rendering.
- **Rating input:** existing `rating` remains the project's editable, state-bound radio group. It is a separate extension with its original keyboard, reset and validation contract. Earlier wording implying this input was the original display Rating was incorrect.
- **Continuous slider:** original neutral geometry uses a 24 px rounded track, a 20 px circular thumb and no colored progress fill. The native range input retains keyboard and accessibility semantics. Its invisible hit area is 44 px high. A numeric `step` does not imply a stepped/dotted visual mode; this contract does not add that mode.
- **Segmented control:** the reviewed default is a neutral ghost-style pill, muted unselected text and a tertiary-surface selected pill, with no visible radio circles. Native radios stay in the accessibility tree and retain keyboard behavior. The visible selected pill is 32 px high; the project preserves its 44 px hit targets and wraps long options on narrow screens. Those accessibility/layout accommodations differ from exact source geometry.
- **Toggle:** no canonical source mapping has been established. It remains a project-local native checkbox extension. It is not advertised as a reconstructed source switch.

The gallery's component wrappers do not override renderer fonts, backgrounds or scaling. Gallery page chrome is separate presentation. The rest of the component catalog is awaiting item-by-item source and visual review; absence from this batch is not visual acceptance.

## Validation boundary

Tests cover native names and roles, keyboard arrows/Home/End/Space, state updates, legacy input compatibility, 320/390/768 px layouts, light/dark appearance, forced colors and literal labels. Automated role/name assertions are accessibility regression checks, not a claim that a human screen-reader or full WCAG audit has been completed.

Only original implementation, synthetic examples and ordinary licensed dependencies are distributed. Private capture source, private screenshots, service logos and proprietary runtime assets are not included.
