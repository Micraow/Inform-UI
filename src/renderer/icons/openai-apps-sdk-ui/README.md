# OpenAI Apps SDK UI icon subset

This directory vendors only the icon files used by Inform UI from the official
[OpenAI Apps SDK UI repository](https://github.com/openai/apps-sdk-ui).
Pinned commit: `0f00143c7a639906f1621fe58e1b6be7b5bea46d`.

Upstream directory:
https://github.com/openai/apps-sdk-ui/tree/0f00143c7a639906f1621fe58e1b6be7b5bea46d/src/components/Icon/svg

The full upstream MIT license is preserved in `LICENSE`. Copyright 2025 OpenAI.
`upstream/*.tsx.txt` retain exact upstream file bytes, without making React a
build or runtime dependency. `manifest.json` pins each original Git blob SHA-1.
`generate.mjs` checks the source and license blob hashes before producing native
SVG geometry in `geometry.ts`; it does not download or execute upstream code.
The generated module includes the complete license in a legal comment, retained
by the default esbuild legal-comment handling in distributed JavaScript bundles.

Regenerate from this repository's root:

    node src/renderer/icons/openai-apps-sdk-ui/generate.mjs

Verify the generated geometry without writing:

    node src/renderer/icons/openai-apps-sdk-ui/generate.mjs --check

The adapter `../../official-icons.ts` creates SVG elements using the renderer's
owner-document factory. Path coordinates, fill and clip rules, and the official
24-by-24 viewBox are unchanged. React props are replaced by finite native options
for dimensions, classes and accessible labels. Unlabelled icons are decorative;
all icons have `focusable=false`, and none add a tab stop. Physical left/right
icons are not automatically mirrored in RTL. Components with semantic previous
or next actions must choose their directional icon explicitly.

The source subset also preserves the official Indicator/LoadingIndicator CSS
in `upstream/LoadingIndicator.module.css.txt`, verified by its manifest blob
hash. Its ring, gradient mask, cap and rotation are adapted in `automation.css`
with scoped selectors, a 20px default, noninteractive pointer behavior and
reduced-motion/forced-colors support. This is the actual SDK loading indicator;
the unrelated official `Spin` icon is not substituted for it. Automation step
markers remain read-only status displays; the two existing disclosure controls
retain their original behavior.

The public primitive keeps its existing ten names, 16/20/24 pixel sizes, tones,
labels and stable DOM behavior. This initial subset is not a claim that every
component icon has been migrated. Author-supplied SVG graphics, images, logos,
emoji, scientific plots and mathematical notation are not library-owned icons.
