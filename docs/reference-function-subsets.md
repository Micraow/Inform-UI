# Late-family reference contracts still incomplete

The project registers 154 protocol node types. Following the two supplied-presentation
extensions and independent functional review, canonical coverage is **144 implemented
(53 historical acceptances plus 91 pending full acceptance), 4 partial, and 108 missing**.
Follow-up action bar and Conversation suggestions have moved to implemented-pending;
new native and reference-pixel acceptance remains separate. Image grid, Upcoming,
Spend, and the pre-existing weather row remain partial. Historical subset identities
and the original functional gates are retained below for traceability.

## Follow-up action bar

The newer source extension documents Footer/wrapped layouts, container-width selection,
64-pixel pending state, fallback and distinct local intent branches in
[follow-up presentations](follow-up-presentations.md). Its exact `7b5e55b` source
passed 38 local tests and a separate eight-flow consumer. Independent ordinary functional review passed on the combined `342bc8f` source;
the canonical row is now implemented-pending, with native/pixel acceptance still open. The original
subset identity and the gaps which motivated this extension are retained here.

- Current candidate: `e2d4a0261ac0b40d1abc69e6c811b9208100efb1`.
- Present subset: up to 12 supplied action labels, disabled state and a frozen,
  cancelable local `{id}` intent. No external action is performed.
- Missing reference contract: separate Footer and `wrapped_pills` presentations,
  responsive item selection, and the distinct new-turn/voice/composer intent
  branches. The new flat list cannot stand in for those branches.
- Functional gates: verify the original input mapping before extending the schema;
  exercise container widths 379, 380, 575 and 576, with the recorded 1/2/3 Footer
  item limits; distinguish Footer new-turn intent from wrapped voice/composer
  intents; preserve cancellation, disabled controls and native keyboard activation.
  Host services remain optional explicit integrations, never fabricated execution.

## Conversation suggestions

A source extension now adds pending/resolved/failed states, decorative images and
explicit local voice/new-turn requests while retaining the old API. See
[conversation presentations](conversation-presentations.md). Initial source tests and independent ordinary functional review
cover the new branches; the canonical row is now implemented-pending, with new
native and reference-pixel acceptance still open. The original subset and gap inventory follows.

- Current subset was first consumed in the fixed `a3345630f7683db5b7ae77d729ecc000abab65d3`
  integration. Its `suggestions`/`prompt` API is an original limited contract.
- Present subset: up to 12 supplied labels/prompts and a cancelable local intent.
- Missing reference contract: pending/resolved/failed rendering, optional icon/image
  content and the recorded reference presentation. Adding CSS to the current
  buttons would not restore the absent states or input variants.
- Functional gates: recover or independently verify the input fields and defaults;
  test omission versus explicit null, all three phases, empty/fallback handling,
  icon success/failure and stale image release, cancellation and replacement during
  intent delivery. No automatic message or provider request is implied.

## Image grid

The current source extension adds supplied mosaic geometry, More/Fewer with stable
image nodes, passive live mode, resolution/placeholder states and a local-basic
viewer. See [image-grid presentations](image-grid-presentations.md). Its43 local
contract tests pass; independent complete-contract review remains pending, so this
row remains partial. The initial subset and the original gates follow.

- Current candidate: `a3345630f7683db5b7ae77d729ecc000abab65d3`.
- Present subset: up to 24 images, a regular 1–4-column grid, captions and an
  `{id,index}` opening intent. There is no local viewer or recommendation mode.
- Missing reference contract: authored row aspect ratios and per-item flex growth,
  recommendation rows with More/Fewer, the live-activity presentation, and viewer
  behavior. A regular square grid is a different layout/data contract.
- Functional gates: validate row-to-image mapping and bounded geometry; verify
  More/Fewer keeps image DOM and active requests rather than rebuilding them;
  exercise narrow/wide recommendation limits and the first-four-image live view;
  implement an explicitly identified local viewer or approved host integration,
  then test previous/next, cancellation, Escape, focus return and retirement.
  Reference geometry checks include the recorded 760px maximum, 2px row/column
  gaps, 16px outer radius and 64px live view, independently of ordinary grid tests.

## Upcoming activity

- Current candidate: `d8aba54dfdb8262e0eb9232daae0daa8426c359b`.
- Present subset: exact supplied amount/date labels, a kind filter, shared native
  reset behavior and local ID intents.
- Missing reference contract: incoming/outgoing flow selection, expansion state and
  conditional `expandedItems` replacement. A kind filter is not the same workflow.
- Functional gates: same-flow selection retains expansion, changing flow collapses;
  expanded items replace the initial list only when longer; known/null amounts and
  supplied metadata remain exact; verify the recorded 576px container boundary and
  bounded resize delivery. Cover canceled reset and newer input during reset,
  repeated expansion without listener growth, and local detail intent cancellation.

## Spend so far this month

- Current candidate: `b1f736daee2bb321a4eedf3fb6901713e654a3bb`.
- Present subset: supplied total/category labels and independent category-share
  bars, including zero/null and masked states.
- Missing reference contract: monthly temporal series, month/comparison controls,
  the recorded trend curve and point inspection. Category-share bars are not a
  substitute for the original monthly trend reader.
- Functional gates: restore the verified temporal-series input contract; test
  month and comparison changes, irregular time spacing, null discontinuities,
  curve geometry without overshoot, and pointer/keyboard inspection. Modified
  navigation and IME/keyCode 229 must not change the selected readout. Verify
  masking, unknown values, responsive layout and native reset without inventing
  monetary arithmetic or account/provider access.

## Evidence and promotion rules

These gaps derive from previously reviewed reference contracts and preserved QA
history; the complete late source trees have not been recovered. This document is
not proof of a byte-identical historical checkout. When exact source becomes
available, reconcile the input contracts before adapting it to the current shared
lifecycle mechanisms. Keep the original subset tests as compatibility checks.

Promote each canonical row independently after its functional gates pass on an
exact source/asset identity. Report native execution and reference visual fidelity
separately. Native geometry, focus, keyboard, decoding and screenshots must come
from a real browser; a CSSOM resolver or SDK adapter is not such evidence.
