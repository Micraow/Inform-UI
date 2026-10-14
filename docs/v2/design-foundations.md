# Design foundations: purpose before decoration

Inform UI exposes semantic color and the bundled official glyph catalog as base capabilities. They are useful without selecting a domain view.

## Real DSL contract

- `Text(content, tone?, align?, size?, weight?)`
- `Badge(label, tone?)`
- `Alert(title, description, tone?)`
- `Icon(name, label?, tone?, size?)`

Supported tones: `default`, `muted`, `info`, `success`, `warning`, `error`.
Icon sizes: `16`, `20`, `24`, `32`, `48`; the default is `20`. The first two Icon parameters retain their previous meaning. Pass `null` for the label to keep an icon decorative when a visible adjacent label already gives its meaning. A standalone meaningful icon needs a nonempty accessible label.

```text
root=Stack([
  Row([Icon("CheckCircle",null,"success",24),Badge("Saved locally","success")]),
  Alert("Draft saved","Your changes remain in this local preview.","success"),
  Row([Icon("Calendar",null,"info",20),Text("Friday at 09:00","info")])
])
```

Every name in this example is an exact, case-sensitive name in `src/icons/catalog.json`. Do not guess names such as `AlertTriangle`, copy SVG path data into a prompt, or substitute an emoji and describe it as an official glyph.

## Choosing a color

- `info`: context, guidance, a newly supplied detail
- `success`: an outcome actually confirmed by supplied data or local state
- `warning`: a caveat or detail that needs review
- `error`: an action failure or invalid value, with an explanation and useful next step
- `muted`: supporting detail with lower emphasis
- `default`: most text, navigation, and ordinary actions

Use colored backgrounds for short status surfaces, not whole pages. Keep headings, long prose, and most controls neutral. Do not infer status from a color. Accompany color with words or a recognizable glyph and words. Avoid turning every section into a card or every large interactive card into a capsule.

`Badge` and `Alert` use a paired soft background and foreground. `Text` and `Icon` use the corresponding plain foreground. Components share one semantic implementation and theme switch. Do not set arbitrary hex colors inside the DSL.

## Public source and project choices

The public reference is [OpenAI Apps SDK UI at 0f00143](https://github.com/openai/apps-sdk-ui/tree/0f00143c7a639906f1621fe58e1b6be7b5bea46d), licensed MIT:

- [Semantic variables](https://github.com/openai/apps-sdk-ui/blob/0f00143c7a639906f1621fe58e1b6be7b5bea46d/src/styles/variables-semantic.css)
- [Primitive variables](https://github.com/openai/apps-sdk-ui/blob/0f00143c7a639906f1621fe58e1b6be7b5bea46d/src/styles/variables-primitive.css)
- [Official glyph source directory](https://github.com/openai/apps-sdk-ui/tree/0f00143c7a639906f1621fe58e1b6be7b5bea46d/src/components/Icon/svg)
- [License](https://github.com/openai/apps-sdk-ui/blob/0f00143c7a639906f1621fe58e1b6be7b5bea46d/LICENSE)

The exact public mapping is `text-info → blue500 / blue200`, `text-success → green700 / green400`, `text-warning → orange700 / orange500`, and `text-danger → red700 / red500` for light/dark. Soft role surfaces and text use their separately named public variables. Inform UI's `error` tone maps to the source's `danger` concept.

Do not describe the whole library as “the OpenAI palette.” The source distinguishes public primitives, public role mappings, separately observed host-role values, and project choices. In particular, the existing link/accent/chart-blue records have their separately stated observation boundary. Other series order and domain uses are project mappings. These values do not establish complete private ChatGPT UI parity.

For normal-sized text on the checked neutral surfaces, this module deliberately makes these Inform UI substitutions:

| Role | Original source-derived value | Effective Inform UI text |
| --- | --- | --- |
| Light success on its soft surface | `#008635` | `#00692a` |
| Dark warning foreground / soft text | `#e25507` / `#fb6a22` | `#ff8549` |
| Dark error foreground / soft text | `#e02e2a` / `#fa423e` | `#ff6764` |

The replacement values are still public primitives; selecting them here is the project's accessibility decision. Source swatches remain unchanged. `link` blue300 on white is a source sample, not a general small-text recommendation. Use the readable info foreground when authoring a small-text informational link in these examples.

The test computes WCAG sRGB contrast, including alpha compositing, for each semantic role on the primary and secondary surfaces in both themes. All 16 checked foreground/soft pairs exceed 4.5:1. The lowest checked soft ratio is 4.752:1. This does not certify arbitrary nesting, user overrides, logos, disabled controls, or every upstream color combination.

## Original compositions

`showcase-next/design-examples.mjs` produces three source strings using the real registered contract:

1. **Color has a job**: information/success/warning/error side by side, both surface and plain-text use, and deliberate icon sizes.
2. **A small creative studio**: embedded original project illustration, direction selection, editable notes, local save/reset, and a confirmed-state color transition.
3. **A quieter morning**: image-led answer, schedule/reading glyphs, selectable duration, checkbox completion, and an info-to-success transition.

The images are supplied through an explicit embedded raster argument. The showcase should use its already-authored original illustration, not private screenshots. These are fictional local compositions. They do not book, send, schedule, or contact a service.

## Verification boundaries

The isolated implementation passes parser/schema checks, DOM mounting in both themes, local state interaction checks, icon compatibility/rejection tests, panel callbacks, and numeric contrast checks. Browser visual checks, 320px layout, keyboard focus, and integrated showcase regression tests must run after integration. The panel is a discovery index; it must open the actual DSL composition rather than replacing runtime capability with unrelated static markup.

## Composable surfaces, partitions, and aligned labels

Use the foundation layout primitives for diagrams made of ordinary text and
surfaces. They do not imply a specialized algorithm renderer. The original
[layered-work example](../../examples/v2/layered-work.openui) builds rows of
1, 2, 4, and 8 blocks, a level label, a right-aligned equation, and a summary.
It works with both `inform-core` and the full renderer. The component studio's
**Build with basic parts** example mounts this same DSL.

All extensions are trailing optional parameters. Old calls keep their defaults:

- `Text(content, tone?, align?, size?, weight?)`: alignment `start/center/end`;
  size `xs/sm/md/lg` = 12/14/16/18px; weight `regular/medium/semibold` = 400/500/600.
  Omitted typography inherits the surrounding context. Plain text remains literal.
- `Row(children, gap?, align?, options?)`: `options.wrap` is `wrap` (default) or
  `nowrap`; `distribution` is `natural` (default) or `equal`; `justify` is
  `start` (default), `center`, `end`, or `between`. Equal distribution overrides
  a child's preferred Box width. No-wrap keeps a single row, while a label may
  wrap within its allotted width.
- `Grid(children, columns?, gap?, responsive?)`: 1–8 equal tracks, default 2.
  `stack` (default) becomes one column at a root-container width of 480px or
  less. `preserve` retains the requested tracks. It never silently shrinks fonts.
- `Box(children, options?)`: a generic vertical-flow container, with a transparent
  background, no padding/radius/minimum height, automatic width, and `md` gap by
  default. Its options use only the tokens below.

| Box option | Values |
| --- | --- |
| `background` | `transparent`, `surface`, `info`, `success`, `warning`, `error` |
| `padding`, `gap` | `none/xs/sm/md/lg/xl` = 0/4/8/12/16/24px |
| `radius` | `none/sm/md/lg` = 0/6/10/16px |
| `width` | `auto`, `full`, `grow`, `xs/sm/md` = 48/64/96px |
| `minHeight` | `none/sm/md/lg` = 0/24/32/48px |

`grow` fills the remaining space of a Row. Fixed width tokens do not shrink or
grow in a naturally distributed Row; their max-width is the parent width.
`minHeight` is a lower bound, not clipping. Semantic backgrounds reuse existing
paired soft-surface foregrounds in both themes; neutral surfaces use normal text.
Transparent boxes inherit the surrounding foreground. Avoid overriding these
pairs with unrelated child text tones without checking their contrast.

For a compact partition row:

```text
root=Stack([Row([
  Box([Text("Level 1","muted","start","xs")],{width:"xs"}),
  Box([Grid([
    Box([Text("4","default","center","xs")],{background:"info",minHeight:"sm"}),
    Box([Text("4","default","center","xs")],{background:"info",minHeight:"sm"})
  ],2,"xs","preserve")],{width:"grow"}),
  Box([Text("2×4=8","default","end","xs")],{width:"xs"})
],"xs","center",{wrap:"nowrap"})])
```

Use short labels, low gaps, and unpadded cells when retaining eight tracks on a
small screen. Content-heavy comparisons should normally use the default
stacking Grid. A preserved grid or no-wrap row can still exceed its available
space if authored with many fixed-width children, large padding, long unbreakable
widgets, or an excessively narrow host; these options are deliberate layout
constraints, not a promise that arbitrary compositions fit. There is no free-form
HTML, CSS, color, selector, URL, absolute positioning, or arbitrary pixel input.
The 320/390/760px browser fixture checks equal block widths and shared edges,
readable unclipped labels, light/dark surfaces, and no page-level overflow.

Additional original, foundation-only compositions are available in the studio:

- [Static array](../../examples/v2/array-overview.openui): equal cells with a supplied minimum.
- [Local stepping](../../examples/v2/array-steps.openui): Previous/Next actions,
  bounded local state, active and visited colors, and changing explanations.
- [Vertical reasoning](../../examples/v2/vertical-steps.openui): aligned text and
  ordinary Unicode arrows, without a new flowchart component.
- [Document comparison](../../examples/v2/document-comparison.openui): a schematic
  thumbnail built from empty colored Boxes and a responsive two-card comparison.
  Its visual blocks are illustrative, not extracted PDF content.

### Boundaries for later extensions

These examples do not introduce raw SVG/path execution or a general vector
scene/connector API. Icons remain the trusted bundled SVG registry, and Image
continues to reject SVG data URLs. A raster screenshot cannot identify whether
its source UI used SVG, canvas, or ordinary DOM/CSS.

The foundation-only entry still has no general safe Link/download component,
inline mathematical typesetting component, or arbitrary-size monospaced text
layout. Code provides literal monospaced code; it is not a substitute for a
proportional math or digit-layout primitive. Some full-profile content views
have separately declared capabilities, but their availability must not be
assumed for the core entry. Keep new link, math, typography, and vector work
separate from these additive layout tokens.

The layered-work example uses two nested, existing `@Each` expressions over
supplied layer data. Its readable source is 990 characters and 16 component
constructor calls, compared with 2,806 characters and 65 calls when every cell
is written out (64.7% fewer characters). Both expand to the same 65-component
tree; an exact tree-equality regression test protects this. `@Each` has a named
item scope and an inline template, but no index argument, lambda, or arbitrary
JavaScript execution. Include needed indices in the data. No new loop syntax is
required for these compositions.
