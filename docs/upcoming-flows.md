# Supplied upcoming flows and expansion

This independent extension fills the incoming/outgoing selection and expanded-list workflow while retaining the finite `activities` reader. Every monetary/date/account label is explicitly supplied. It performs no account access, financial arithmetic, inferred date prediction, navigation or transaction.

## Input

Existing `label`, `activities`, masking/disabled and empty-label fields remain supported. Without `flows`, resolved documents retain the original kind filter. Optional `status` (`resolved` by default, `pending`, `failed`) adds a300px loading state or plain-text `fallback`; failure without fallback hides the component. Explicit `hasConnectedAccounts:false` shows `noAccountsLabel` or a neutral no-account message, without starting a connection flow.

`flows` contains required `incoming` and `outgoing` records. Each has `items` (up to60), optional `top`, and optional `expandedItems` (up to60). Each visible list must have unique activity IDs, including its top record. The two alternative lists may reuse IDs. All records retain exact supplied title, amount and date text, with null meaning unknown.

`activeFlow` selects the initial flow (outgoing by default). `expanded` selects the initial expansion flag. `showFlowTabs:false` substitutes a static flow label. Labels may be supplied with `incomingLabel`, `outgoingLabel`, `moreLabel`, and `lessLabel`.

The top record remains first. Only when `expandedItems.length > items.length` can the list expand; expansion replaces the other items rather than appending them or duplicating the initial items. A shorter or equal expanded list is ignored. Selecting the same flow preserves expansion; changing flow collapses it. An explicit document update resets to the newly supplied initial state.

In flow mode, records may add `accountLabel`, `iconSrc`, `amountUnknown` and `detailEnabled`. Supplied safe images use the existing image reader and source lifetime. The unknown flag preserves a supplied unknown-amount label even under masking; known amounts are masked and true zero remains a known supplied value. Details are passive unless explicitly enabled. Renderer-container width576px is inclusive for the wide layout and uses the existing shared resize binding.

## Local detail and native reset

Detail-enabled flow records emit frozen cancelable, bubbling, non-composed `iui:upcoming-activity` details `{id,flow}`. Legacy detail events remain `{id}`. No sidebar service is called. Native form reset uses the shared generation-owned reset mechanism: cancellation preserves current selection/expansion, accepted reset restores supplied initial state, and newer flow or expansion input wins over an older pending reset. Detail requests are blocked while a reset decision is pending.

The common reset declaration now also accepts native HTML buttons; its runtime implementation is unchanged because it already uses the native `form` owner and blocked-control checks. Only visible reset anchors are supplied. Repeated rendering disposes the previous row generation, so old controls/images are retired rather than accumulating listeners.

## Evidence

The initial source passed42 Upcoming tests (19 compatibility and23 extension cases), plus33 common native-reset contracts,75 total. Build, type/public declarations, deferred-queue and public-boundary gates passed. Test data is an original teaching fixture shared with the consumer lane, not real account data.

This is a source checkpoint, with no fresh CDN or native claim. Independent functional review is pending; canonical scope remains144 implemented,4 partial,108 missing until that review. The earlier frozen source and CI counts remain unchanged.
