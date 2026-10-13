# Design foundations: purpose before decoration

Inform UI exposes semantic color and the bundled official glyph catalog as base capabilities. They are useful without selecting a domain view.

## Real DSL contract

- `Text(content, tone?)`
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
