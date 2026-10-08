# Assessment of the 52 gallery capabilities

The supplied gallery groups 52 **observable capabilities**. Those entries are
product requirements, not 52 private renderer tags and not a coverage score for
an OpenAI API. This document maps every catalog ID to this project's portable
implementation or a specific missing capability.

The core library is independently usable and vendor-neutral. Here “host” means
the application embedding this library, which can be any website or local app.
Optional data and action integrations may use local data or any suitable
provider; they do not require OpenAI and are not needed to run the renderer.
This matrix does not describe multiple product editions.

## Reading the status column

- **Implemented:** the stated portable subset exists. The limitation column is
  part of the claim; it does not imply full parity with every gallery interaction.
- **Extension:** additional project-owned component or interaction work is needed.
  An existing approximate presentation is identified where useful.
- **Host service:** the useful feature depends on external data, authorization,
  or a host action. Rendering a placeholder does not supply that service.
- **Unavailable:** the requested execution capability is intentionally absent
  from this release. A safe redesign would need a separate contract.

Statuses describe source-level implementation scope. They are not test results,
license grants, guarantees of host integration, or promises of future delivery.

| Catalog ID | Observable capability | Status | Mapping and boundary |
| --- | --- | --- | --- |
| cap-001 | Headings and prose | Implemented | `title`, `text`; levels 1–3 and renderer-owned spacing. |
| cap-002 | Supporting text | Implemented | `caption`, `figure.caption`, metric hints, chart notes. |
| cap-003 | Rich inline emphasis | Extension | Weight is available on text nodes; mixed inline bold/italic/underline/strike runs have no schema. |
| cap-004 | Inline code | Extension | `code` provides a block; there is no inline-code span node. |
| cap-005 | Code blocks with tooling | Extension | Escaped `code` blocks work; highlighting, copying, and editing require implementation. |
| cap-006 | Mathematical typesetting | Implemented | `math` and step formulas use KaTeX HTML plus accessible MathML and bundled official fonts; invalid or unsupported TeX falls back to source. |
| cap-007 | Quotation blocks | Extension | `callout` can emphasize text, but quotation semantics and attribution need a dedicated design. |
| cap-008 | Badges | Implemented | `badge` supports text and semantic color. Catalog size/solid/outline variants are not exposed. |
| cap-009 | Field labels and hints | Implemented | Labels are part of slider/toggle/select; captions can supply adjacent explanation. No independent form-label registry. |
| cap-010 | External navigation | Implemented | `link` validates its destination. Availability and access at the destination remain external. |
| cap-011 | Cards | Implemented | `card` offers bounded padding, radius, border, and background. No arbitrary shadow/CSS field. |
| cap-012 | Horizontal layout | Implemented | `row` supplies alignment, wrapping, and bounded gaps. |
| cap-013 | Vertical layout | Implemented | `col`, `box`, and sections establish reading order and automatic spacing. |
| cap-014 | Responsive grids | Implemented | `grid` supports equal columns and mobile reflow; spanning is not supported. |
| cap-015 | Masonry/flow layout | Extension | A responsive `grid` is available as an explicit approximation, not a masonry engine. |
| cap-016 | Dividers | Implemented | `divider` separates adjacent content groups. |
| cap-017 | Lists | Implemented | `list` supports ordered/unordered and nested node content; no dedicated description-list mode. |
| cap-018 | Carousels | Implemented | `carousel` is a scrollable collection with snapping; catalog arrow controls, looping, and autoplay are absent. |
| cap-019 | Clickable content regions | Extension | Only `link` navigation and restricted `button` actions exist; cards cannot carry arbitrary event handlers. |
| cap-020 | Popovers/tooltips | Extension | `details` is a disclosure fallback; it does not implement a hover popup or floating panel. |
| cap-021 | Spacing | Implemented | `spacer` and layout gap tokens cover bounded spacing; no free-form layout expressions. |
| cap-022 | Tables | Implemented | `table` has headers, caption, rectangular rows, and local scrolling. Grouped headers, merged cells, and interactive sorting are absent. |
| cap-023 | Buttons | Implemented | `button` supports state reset/set only; catalog disable/copy/action variants are not a general command API. |
| cap-024 | Independent boolean choices | Implemented | Multiple `toggle` nodes provide native labeled checkboxes with independent state. |
| cap-025 | Radio groups | Extension | `select` can express a single choice, but a radio-group presentation is not implemented. |
| cap-026 | Segmented controls | Extension | A `select` is a possible fallback; segmented presentation needs an extension. |
| cap-027 | Dropdown selection | Implemented | `select` supports a finite declared option set. |
| cap-028 | Text/number/email entry | Extension | Free-form input nodes and their input-validation contract are absent. A numeric slider is not equivalent. |
| cap-029 | Multiline editing | Extension | Text-area input and editing state are absent. |
| cap-030 | Date selection | Extension | No date picker, calendar, time-zone, or range-validation contract. |
| cap-031 | Sliders | Implemented | `slider` binds bounded numeric state with a step and live output. |
| cap-032 | Forms and submission | Extension | Individual controls exist; grouped validation, submission, and network actions do not. |
| cap-033 | Line charts | Implemented | `chart.kind="line"`; multiple series, null gaps, visibility switches, readable data disclosure. |
| cap-034 | Bar charts | Implemented | `chart.kind="bar"`; grouped series with a zero-aware baseline. No stacking or chart-kind switch. |
| cap-035 | Scatter plots | Extension | Not an accepted chart kind; do not relabel a line chart as scatter. |
| cap-036 | Pie charts | Extension | Not an accepted chart kind; use a table or appropriate bar comparison until implemented. |
| cap-037 | Vector diagrams | Implemented | Constrained `svg` shapes and a dedicated `topology` node; no raw SVG injection. |
| cap-038 | Statistical metrics | Implemented | `metric`, `metric-grid`; explicit units, precision, and notes. Data must be supplied. |
| cap-039 | Icon vocabulary | Extension | Authors can supply original constrained shapes or text symbols. There is no icon-name registry or bundled third-party icon set. |
| cap-040 | Service/brand icons | Host service | Requires authorized assets and provenance. `image` may display supplied media; it does not fetch or license brand marks. |
| cap-041 | Single images | Implemented | `image` handles supplied sources, alternative text, ratio, and fit. No magnifier or asset retrieval; remote loading is reader-initiated. |
| cap-042 | Image collections | Implemented | Compose `image` with `grid` or `carousel`; no dedicated lightbox or image-search backend. |
| cap-043 | Video playback | Extension | No video node or player. Any future player also needs an accessible, authorized media source. |
| cap-044 | Maps and routing | Host service | Requires map/geographic data, applicable permissions, and a host integration; `svg` drawings are not route results. |
| cap-045 | Citations and sources | Host service | Supplied source text and URLs can use `caption`/`link`. Source verification, line references, retrieval, and citation resolution are not provided. |
| cap-046 | File navigation | Host service | Requires authorized file metadata and host-open actions. Static text links do not confer file access. |
| cap-047 | Linked entities | Host service | Requires real entity records, relationships, and sources. No entity-resolution or knowledge service is bundled. |
| cap-048 | Suggested follow-up actions | Host service | Text suggestions are renderable; sending a follow-up prompt or invoking a tool requires an explicit host API. |
| cap-049 | Live specialist widgets | Host service | Weather, finance, sports, reservations, and similar data/actions are not supplied. Local arithmetic is distinct from a live service. |
| cap-050 | Arbitrary custom AppBlock execution | Unavailable | There is no model-authored JavaScript sandbox, permission broker, persistence channel, or arbitrary-code node. Existing declarative state can express only the supported interactions. |
| cap-051 | Rich writing editors | Host service | The package renders content; editing, document persistence, and writing-channel actions belong to a host editor. |
| cap-052 | Enhanced code views | Extension | Plain `code` display exists. Highlighting, copy controls, preview execution, and editor integration are not implemented. |

## Observed visual principles

The handoff contact sheet and the individual desktop chart, mobile simulator,
and HPCC reference screenshots were visually inspected. They are design
evidence only; none is included as a library asset or visual-test baseline.

The useful observations are concrete:

1. Prose explains a result before controls ask the reader to explore it. Figures
   sit in the answer's reading flow rather than dominating a dashboard shell.
2. Neutral backgrounds, subtle boundaries, and a restrained accent palette keep
   the primary explanation legible. The HPCC reference uses one contrasting
   highlight to identify the current bottleneck.
3. Units, assumptions, and source notes sit close to the relevant metric or
   figure. Color is reinforced by a label or number.
4. The chart screenshot pairs the picture with readable data and a legend.
   Our null-gap requirement is explicit; a screenshot alone cannot prove a
   missing-data policy.
5. The mobile simulator stacks controls and keeps labels attached to values.
   The portable renderer should reflow and reduce tick density rather than
   shrinking the whole desktop scene.

These are observed principles, not a pixel-matching claim. The new library's
own pages need fresh browser checks at desktop and 390px widths, in light and
dark themes, with keyboard interaction and data/label verification. Historical
gallery screenshots or its historical test report do not establish that this
new renderer passes those checks.

## Host capability boundary

Rendering a component is separate from obtaining its data or invoking a tool.
Before integrating an external capability, a host must define its input data,
source, permissions, allowed actions, error behavior, and fallback. This release
does not detect or call a ChatGPT runtime. Private site-runtime adapters are
outside the product roadmap. Prefer a supported independent composition;
if it cannot express the task, report the missing
capability rather than executing generated code.
