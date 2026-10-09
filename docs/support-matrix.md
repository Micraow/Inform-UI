# Independent library: `iui/1` support

`iui/1` is the Inform UI project's versioned document format. It is not an
OpenAI model-output protocol, a recovered private schema, or an entitlement to
ChatGPT services. The working schema recognizes 75 project-defined node types, including the historical
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

**Working candidate source: 74 rendered + 1 rejected =75 node types.** The recommended fixed CDN is the verified 66-node d370 batch, including loading and source-link nodes. See [executed 66-node evidence](verification-66.md). Carousel/code/pie/checkbox/Markdown/date enhancements and the one tabs component remain later candidates pending combined browser/CDN acceptance. Tabs adds two structural node names for one canonical component.

| Node | Status | Portable behavior and boundary |
| --- | --- | --- |
| `text` | Rendered | Escaped value or explicit rich-text runs, safe inline links/code, semantic color/weight/alignment and decoration. No inline HTML. |
| `title` | Rendered | Heading levels 1–3, with the same safe values and emphasis options. |
| `caption` | Rendered | Lower-emphasis explanatory text; no source lookup. |
| `markdown` | Rendered candidate | Bounded original paragraphs/headings/lists/quotes/fences/flat inline formatting and core-policy links. Unsupported syntax stays literal; no raw HTML execution, fetched images or full CommonMark claim. The accepted d370 version retains its historical plain-text fallback. [Contract](markdown.md). |
| `code` | Rendered | Escaped preformatted or inline code; later candidate adds explicit trusted copy action and finite syntax highlighting for non-inline code only. No execution or editor. See [code contract](code.md). |
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
| `grid` | Rendered | One to six equal-width columns; desktop/mobile grid-item spans and explicit narrow-screen columns. No dense reorder or masonry. |
| `grid-item` | Rendered | Direct grid child with validated desktop/mobile column span and desktop row span. |
| `blockquote` | Rendered | Safe child content, supplied attribution and validated citation URL. No source retrieval. |
| `section` | Rendered | Optional heading followed by child nodes. |
| `figure` | Rendered | Grouped content and an optional figure caption. |
| `details` | Rendered | Native disclosure with a summary and expandable child content. Not a hover popup. |
| `tab-group` / `tab-panel` | Rendered candidate | Native roving tab buttons and persistent hidden panels; RTL keys, local overflow and complete forms within individual panels. No lazy loading, automatic rotation or cross-panel form. One canonical component. [Contract](tabs.md). |
| `carousel` | Rendered | Finite native scrolling with optional label/previous-next controls; exact boundary no-op, retained child state. No autoplay, looping or cloning. Later candidate, browser acceptance pending. |
| `list` | Rendered | Ordered or unordered items containing safe values or supported nodes. No separate description-list schema. |
| `table` | Rendered | Native multi-section and merged-cell tables with shared occupancy validation, explicit header associations and local keyboard scroll. Legacy rows preserved. No sorting, editing or remote pagination. |
| `metric` | Rendered | Label, value, optional unit, precision, hint, and semantic color. Formatting does not establish data provenance. |
| `metric-grid` | Rendered | Compact responsive metric grouping, with one to four requested columns. |
| `steps` | Rendered | Ordered titled steps, optional explanation, and optional formula per step. No automatic algorithm execution. |
| `callout` | Rendered | Plain-text aside using neutral, informational, or caution emphasis. |
| `slider` | Rendered | Labeled native numeric range bound to declared numeric state; minimum, maximum, step, and optional marks. |
| `toggle` | Rendered | Labeled native checkbox bound to declared boolean state. |
| `select` | Rendered | Labeled native selector over declared string or numeric choices. No searchable combobox. |
| `button` | Rendered | Reset/set retain their native button and field-draft semantics. Candidate adds an explicitly configured host action with whole-state snapshot, busy/cancel/retry and stale-result guards; the library performs no network or arbitrary JSON code. See [contract](button-actions.md). |
| `topology` | Rendered | Original SVG node/edge diagram with optional maximum-load highlighting and a textual summary. Layout is deterministic, not a general graph-layout engine. |
| `chart` | Rendered | Line, grouped bar, scatter, area and single-series donut; later candidate adds solid single-series pie ([contract](pie.md)); explicit category/linear/time X axes, typed finite bounds, null gaps, empty/loading/error views, keyboard point readout, series switches and data table. No stacking, brush, zoom, export or chart-kind switch. See charts.md for axis rules and version boundaries. |
| `input` | Rendered | Native text/number/email with label/hint/error, required/disabled and bounded constraints. Numeric drafts preserve typed state; later checkbox and date candidates bind native boolean/date-only controls through the same form lifecycle. |
| `textarea` | Rendered | Native multiline text with label, constraints and keyboard editing. |
| `radio` / `segmented` | Rendered | Native radio options, roving browser keyboard behavior, disabled options and required selection. |
| `field` | Rendered | Native fieldset and legend with inherited disabled behavior. |
| `form` | Rendered | Local validation/submit/cancel; enabled-form-field snapshot, explicit host-action allowlist, busy deduplication, abort and stale-result guards. No implicit storage/network. |
| `weather` | Rendered | Supplied provenance/timezone/current/daily/hourly data; local date/unit/metric/chart-table controls; null, loading/empty/error states; explicit percent and DST semantics. No live provider connection. |
| `sports-schedule` / `sports-scoreboard` / `sports-standings` | Rendered | Shared supplied league/team/game/standing data; local date/team/stage/group filters, disclosures, game selection and stable standings sorting. Explicit score/status/provenance/timezone/null semantics; no live provider or ranking inference. Available in the fixed 52-node CDN; the older 7c490585 pin does not contain these nodes. See sports.md. |
| `favicon` | Rendered candidate | Supplied image or local fallback, explicit remote-load action, native error/retry and no icon discovery service. See [contract](favicon.md). |
| `agenda` | Rendered candidate | Strict supplied floating date/time labels, stable date groups and native date filtering. No calendar service or timezone conversion. See [contract](agenda.md). |
| `rating` | Rendered candidate | Native integer0..max controlled radio rating with atomic bounds; standalone and explicitly excluded from Forms ownership. See [contract](rating.md). |
| `vocab-card` | Rendered candidate | Supplied meanings/examples, retained reveal and explicit local self-assessment. No dictionary or verified mastery. See [contract](vocab-card.md). |
| `checklist` | Rendered candidate | Controlled native checkboxes through the same Forms registry; local All/Open/Done filtering and atomic enabled-item bulk updates. No task provider, reminders or persistence. See [contract](checklist.md). |
| `fill-blank` / `sentence-builder` | Rendered candidates | Supplied public teaching answers, exact local checking, explicit reference review/retry and retained DOM. No remote grading, hidden answers or form nesting. These are two canonical learning components awaiting combined browser acceptance. |
| `quiz` / `flashcards` | Rendered | Local answer checking, weighted exact-set scoring, explanations/review/retry; flashcard reveal/rating/navigation/summary. Empty/loading/error and keyboard/live feedback. Supplied answers are not secret; no storage, network grading or spaced-repetition scheduler. Available in the fixed 52-node CDN. |
| `finance-quote` / `finance-chart` / `finance-comparison` | Rendered | Supplied quote/time/status/delay; local history ranges, actual time axes, null gaps and exact common-baseline percentage comparison across currencies. No FX conversion, provider, trading or wall-clock inference. Source/browser verified at 55bfa57; included in fixed 52-node CDN. |
| `finance-heatmap` | Rendered | Exact supplied weight areas, signed change colors, sector filter, keyboard item detail and full data table; zero/missing weights never receive fabricated area. Source/browser verified at 8e8908d, included in fixed 52-node CDN. |
| `unit-converter` / `currency-converter` | Rendered | Nine unit categories, absolute/difference temperature, local draft validation/swap/reset; supplied FX snapshots with explicit missing values, exact source/time and stable extreme ratios. No live provider or transaction. Nine source browser scenarios and six fresh file:// CDN views passed in run37878019661; included in the fixed 52-node CDN. See converters.md. |
| `clock` / `stopwatch` / `timer` | Rendered | Explicit live/snapshot time zones and local monotonic duration controls with pause/resume/reset, bounded laps and one completion status. No OS alarm, notification, persistence or time service. See [time contract](time.md). |
| `tooltip` / `popover` | Rendered | Inert text tips and nonmodal child panels; keyboard, dismiss/return-focus, viewport-aware native top layer or explicit inline fallback. See [overlay contract](overlays.md). |
| `flow` / `icon` / `pulse-indicator` | Rendered | DOM-order wrapping, ten finite original semantic glyphs, supplied explicit status with reduced motion. No arbitrary icon loading or inferred service status. See [primitive contract](primitives.md); [batch acceptance passed](verification-62.md). |
| `loading` / `loading-block` | Rendered | Explicit supplied progress or honestly indeterminate spinner; finite text/card/circle placeholders, no network/task observation or live/busy claims. Dynamic range validation is atomic. See [loading contract](loading.md) and [executed evidence](verification-66.md). |
| `citation` / `web-link-cards` | Rendered | Caller-authored literal references and secure native HTTP(S) links; finite cards with bounded previous/next scrolling, RTL normalization and stable focus. No retrieval, ranking or support verification. See [source contract](source-cards.md) and [executed evidence](verification-66.md). |
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
| [`kitchen-sink.json`](../examples/kitchen-sink.json) | Accepted-node composition | An original synthetic sensor lesson combining the original general-purpose nodes, including bounded Markdown in the candidate (plain-text fallback in older fixed assets). It also exercises a bar chart, selection, a boolean control, reset, and set actions. |

Example presence is coverage of input vocabulary, not proof of rendering or
interaction correctness. The rejected `native` case belongs in negative tests,
not a fixture presented as successfully portable.

For broader user-visible requirements, see the
[52-capability assessment](gallery-capabilities.md). For source and media
boundaries, see [provenance](provenance.md).

Numeric chart increment: [synthetic state fixture](../examples/numeric-charts.json), [axis contract](charts.md). Forms and weather have typed contracts and examples; browser evidence is tracked per commit. Sports schedule/scoreboard/standings are implemented in source; quiz/flashcards are implemented in source; finance quote/history/comparison have source/browser acceptance; heatmap also has source/browser acceptance; player/event/bracket/racing variants remain pending. See [sports contract](sports.md).
