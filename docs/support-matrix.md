# Independent library: `iui/1` support

`iui/1` is the Intelligent-UI project's versioned document format. It is not an
OpenAI model-output protocol, a recovered private schema, or an entitlement to
ChatGPT services. The schema recognizes 46 project-defined node types, including the historical
`native` input that is explicitly rejected. New domain nodes are original contracts.

This is the support matrix for one independent, public library. The API's
`portable` backend is its main renderer, not a separate edition or an interim
OpenAI integration. No OpenAI account, service, API, or private runtime is
required. In the table below, “native” browser controls means standard HTML
controls; it is unrelated to the rejected historical `native` schema node.

This matrix describes the implementation contract, not a claim that browser,
accessibility, security, or cross-platform tests have passed. Use the actual test
results from the current revision for those claims.

## Status definitions

- **Rendered:** an original portable renderer implements the behavior below.
- **Plain-text fallback:** accepted content stays readable, with no interpretation
  of its markup. This is a deliberate limited mode, not Markdown support.
- **Rejected:** recognized for diagnostics but refused by semantic validation;
  there is no hidden download, private bridge, or silent substitution.

**Count: 44 rendered + 1 plain-text fallback + 1 rejected = 46 node types.**

| Node | Status | Portable behavior and boundary |
| --- | --- | --- |
| `text` | Rendered | Escaped text; literal or declared expression value; semantic color, weight, alignment. No inline HTML. |
| `title` | Rendered | Heading levels 1–3, with the same safe values and emphasis options. |
| `caption` | Rendered | Lower-emphasis explanatory text; no source lookup. |
| `markdown` | Plain-text fallback | Original characters are displayed as text. Formatting, embedded HTML, images, and Markdown links are not parsed. |
| `code` | Rendered | Escaped preformatted code with optional language label. No execution, syntax highlighting, copy action, or editor. |
| `math` | Rendered | KaTeX generates visible HTML plus accessible MathML with trust disabled. Unsupported syntax remains formula source with an accessibility label; offline output embeds official MIT WOFF2 fonts; CDN CSS loads the same fonts from its pinned asset directory. No remote equation service is used. |
| `badge` | Rendered | Compact text and semantic color. Size and arbitrary visual variants are not configurable. |
| `divider` | Rendered | A semantic horizontal separator. |
| `spacer` | Rendered | Bounded fixed-height spacing; not a general CSS or flex-spacer escape hatch. |
| `link` | Rendered | Validated navigation URL or document fragment; external links use isolation attributes. No automatic retrieval or preview. |
| `image` | Rendered | Validated image source, required alternative-text field, optional crop ratio and fit. Embedded raster images work offline. External image loading requires the reader to activate its load control. No search, lightbox, or image generation. |
| `box` | Rendered | Vertical grouping with bounded spacing, width, radius, alignment, and semantic backgrounds. |
| `card` | Rendered | Bordered, padded grouping using renderer-owned visual defaults. |
| `row` | Rendered | Horizontal flex grouping that can wrap; not absolute positioning. |
| `col` | Rendered | Vertical flex grouping. |
| `grid` | Rendered | One to six equal-width columns with narrow-screen reflow. No cell spanning or masonry algorithm. |
| `section` | Rendered | Optional heading followed by child nodes. |
| `figure` | Rendered | Grouped content and an optional figure caption. |
| `details` | Rendered | Native disclosure with a summary and expandable child content. Not a hover popup. |
| `carousel` | Rendered | Focusable horizontal scroll-snap collection. No autoplay, looping, or previous/next buttons. |
| `list` | Rendered | Ordered or unordered items containing safe values or supported nodes. No separate description-list schema. |
| `table` | Rendered | Column headers, caption, and rectangular rows of safe values, inside an overflow container. No merged cells, sorting, editing, or remote pagination. |
| `metric` | Rendered | Label, value, optional unit, precision, hint, and semantic color. Formatting does not establish data provenance. |
| `metric-grid` | Rendered | Compact responsive metric grouping, with one to four requested columns. |
| `steps` | Rendered | Ordered titled steps, optional explanation, and optional formula per step. No automatic algorithm execution. |
| `callout` | Rendered | Plain-text aside using neutral, informational, or caution emphasis. |
| `slider` | Rendered | Labeled native numeric range bound to declared numeric state; minimum, maximum, step, and optional marks. |
| `toggle` | Rendered | Labeled native checkbox bound to declared boolean state. |
| `select` | Rendered | Labeled native selector over declared string or numeric choices. No searchable combobox. |
| `button` | Rendered | Exactly two declarative actions: reset document state, or set one declared state value. No callbacks, network submission, clipboard, or arbitrary commands. |
| `topology` | Rendered | Original SVG node/edge diagram with optional maximum-load highlighting and a textual summary. Layout is deterministic, not a general graph-layout engine. |
| `chart` | Rendered | Line, grouped bar, scatter, area and single-series donut; explicit category/linear/time X axes, typed finite bounds, null gaps, empty/loading/error views, keyboard point readout, series switches and data table. No stacking, brush, zoom, export or chart-kind switch. See charts.md for axis rules and version boundaries. |
| `input` | Rendered | Native text/number/email with label/hint/error, required/disabled and bounded constraints. Numeric drafts preserve typed state. |
| `textarea` | Rendered | Native multiline text with label, constraints and keyboard editing. |
| `radio` / `segmented` | Rendered | Native radio options, roving browser keyboard behavior, disabled options and required selection. |
| `field` | Rendered | Native fieldset and legend with inherited disabled behavior. |
| `form` | Rendered | Local validation/submit/cancel; enabled-form-field snapshot, explicit host-action allowlist, busy deduplication, abort and stale-result guards. No implicit storage/network. |
| `weather` | Rendered | Supplied provenance/timezone/current/daily/hourly data; local date/unit/metric/chart-table controls; null, loading/empty/error states; explicit percent and DST semantics. No live provider connection. |
| `sports-schedule` / `sports-scoreboard` / `sports-standings` | Rendered | Shared supplied league/team/game/standing data; local date/team/stage/group filters, disclosures, game selection and stable standings sorting. Explicit score/status/provenance/timezone/null semantics; no live provider or ranking inference. Source increment, not yet in the fixed 7c490585 CDN. See sports.md. |
| `quiz` / `flashcards` | Rendered | Local answer checking, weighted exact-set scoring, explanations/review/retry; flashcard reveal/rating/navigation/summary. Empty/loading/error and keyboard/live feedback. Supplied answers are not secret; no storage, network grading or spaced-repetition scheduler. Source increment, not yet fixed CDN. |
| `svg` | Rendered | Validated `rect`, `line`, `circle`, `path`, `text`, `polyline`, and `polygon` shapes. Attribute restrictions apply; raw SVG markup, scripts, foreign objects, events, and arbitrary resource references are not accepted. |
| `native` | Rejected | Historical bridge-shaped input is recognized only for a clear error. It is not another product edition or a planned OpenAI adapter. Use the independently implemented nodes in this table. |

## State and calculations

`state` contains scalar strings, numbers, and booleans. `computed` and supported
value fields use declared references such as `{"$":"U2"}` and a restricted
expression tree. The available operators are `add`, `sub`, `mul`, `div`, `max`,
`min`, `round`, `abs`, `clamp`, `gt`, `lt`, `eq`, `if`, and `format`. These are data,
not JavaScript source. Semantic validation additionally checks reference
existence, dependency cycles, operator arguments, finite results, control
bindings, graph references, chart values, table shape, and unsafe resources.

The renderer owns typography, spacing tokens, light/dark theme, control styling,
responsive layout, and event handling. Model output cannot supply CSS,
HTML strings, script bodies, runtime imports, or callbacks.

## Resource policy and diagnostics

Web destinations must be absolute `http:` or `https:` URLs without credentials.
Relative URLs, whitespace/control characters, and backslashes are rejected.
Links also accept restricted document fragments, simple `mailto:` destinations
without a query or encoded line breaks, and constrained `tel:` destinations.
Image sources additionally accept base64 PNG, JPEG, GIF, or WebP; SVG data URLs
are rejected. An accepted remote image URL still requires the reader's load
action; acceptance by validation does not silently fetch it.

Validation issues have the shape `{code, path, message}`, with a JSON-pointer
path. Unsafe destinations report `UNSAFE_URL`; native bridge input reports
`UNSUPPORTED_NATIVE`; structural schema failures report `SCHEMA`. Other
semantic errors distinguish invalid references, values, limits, and bindings.
Consult the current validator for the complete error-code vocabulary.

## Original example inventory

| Fixture | Purpose | Data and expected behavior |
| --- | --- | --- |
| [`hpcc.json`](../examples/hpcc.json) | Bottleneck feedback | Original explanatory text and hypothetical loads. Initially `U2=1.2`, `Umax=1.2`, and rounded `Wnew=84.2`. At `U2=0.6`, `Umax=0.9` and rounded `Wnew=110.6`. The equation is an explicitly simplified teaching model, not a full HPCC implementation. |
| [`rtt.json`](../examples/rtt.json) | Two-series line chart | Original synthetic relative-time sequence in milliseconds. The `00:03` row has explicit nulls, requiring a visible gap. Series switches change visibility only. |
| [`wifi.json`](../examples/wifi.json) | Compact metrics | A fictional wireless snapshot with stated units. It does not read the user's device, infer current connectivity, or equate PHY rate with throughput. |
| [`shortlist.json`](../examples/shortlist.json) | Illustrated reading list | Three fictional tools, original geometric PNG thumbnails, and links to the demonstration domain `example.com`. No live recommendations, rankings, or GitHub statistics. |
| [`kitchen-sink.json`](../examples/kitchen-sink.json) | Accepted-node composition | An original synthetic sensor lesson combining the original general-purpose nodes, including the deliberate Markdown fallback. It also exercises a bar chart, selection, a boolean control, reset, and set actions. |

Example presence is coverage of input vocabulary, not proof of rendering or
interaction correctness. The rejected `native` case belongs in negative tests,
not a fixture presented as successfully portable.

For broader user-visible requirements, see the
[52-capability assessment](gallery-capabilities.md). For source and media
boundaries, see [provenance](provenance.md).

Numeric chart increment: [synthetic state fixture](../examples/numeric-charts.json), [axis contract](charts.md). Forms and weather have typed contracts and examples; browser evidence is tracked per commit. Sports schedule/scoreboard/standings are implemented in source; quiz/flashcards are implemented in source; player/event/bracket/racing variants and finance remain pending. See [sports contract](sports.md).
