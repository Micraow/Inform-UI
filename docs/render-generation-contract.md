# Render generation and resource contract

## Deferred queue gate

Renderer microtasks must be scheduled as `queueMicrotask(life.guard(callback))`
using an existing `RenderGeneration`, including local viewer button callbacks.
`npm run check:queues` uses TypeScript syntax and resolved signatures, follows
queue aliases/destructuring/bind/call/apply and diagnoses wrapper functions.
It only scans TypeScript below `src/renderer`, so build tools are outside this rule.
The shared native-reset outer `finally` is an exact canonical-AST fingerprint
exception: its inner reconciliation is already guarded, while pending work must
settle even after retirement. Changing or removing the call invalidates this
exception; do not add broad file or function exclusions.

This mechanical check cannot prove runtime ownership, inspect dynamically
computed property names, arbitrary runtime reassignment, or callbacks hidden in
unscanned external helpers. It is not a security boundary. Keep dynamic lifecycle
and cancellation tests; ordinary callback errors must remain observable.

## One-time connection notification

Deferred components may pass an optional third `onConnected` callback to
`suppliedReaderContext(parent, root, onConnected)` (or `ownedTree` directly).
The shared owner fixes the first connected composed ancestry before queuing
this callback once. Delivery is asynchronous and generation-guarded: disposal,
replacement, or an observed ownership loss cancels it, including same-turn
remove/restore before delivery. The callback may schedule component-specific
loading but must not create a second ownership observer or reclaim a retired
root. Existing two-argument callers have no new callback or refresh behavior.

This recovery change is based on public 115. It reconstructs the shared generation boundary; it does not claim to recover the later missing componentScope, owner observer, asynchronous scheduler, or AST gate byte-for-byte.

## Public controller transaction

- Validate/evaluate before invalidating the live generation. Invalid nested updates leave the valid outer transaction live.
- A valid new generation is published before the previous generation's cleanup. Each owns its own state, computed values, factories, root, bindings and registrations.
- Factory getters and native writes are checked before and after execution. Newer update/dispose wins. Final DOM replacement compensates a host hook that performs its native write after reentry.
- Disposal marks the owner stopped and detaches the release set before invoking callbacks. Every owned release is idempotent. Remaining resources are released even when one release throws; the original ordinary error is propagated.
- A construction failure retires its own partial candidate, including a failed initial mount that cannot return a controller. It does not retire a newer reentrant generation. If rendering and cleanup both fail, an AggregateError retains both failures; a sole ordinary failure preserves its original identity.
- Only the module-private retirement Symbol is suppressed at guarded entry points. Errors and lookalike Symbols propagate.
- Internal association IDs use one mount allocator across generations. Authored IDs retain the unchanged mount prefix. Forms, Label, Table, Overlay and Slider use that allocator.

## Component entry points

The context owns `lifecycle`, a RenderGeneration scope. Existing `c.on`, `c.bind`, and `c.cleanup` delegate to it and now return idempotent release handles; old consumers may ignore the return value.

- `c.lifecycle.during(() => hostOperation())` surrounds each reentrant constructor/getter/write that must finish before the next component side effect.
- `c.lifecycle.guard(callback)` is for deferred/callback delivery. It ignores retired work and suppresses only the exact retirement signal.
- Guard each promise continuation or check with `during` after each `await`. Wrapping an entire async function cannot automatically control its later continuations; this API does not claim to do that.
- `c.lifecycle.acquire(create, release)` registers the returned resource, including immediate compensation when `create` synchronously retires its owner. `create` must return any allocated resource; if it throws after allocating an inaccessible resource, only the factory itself can release that resource.
- `c.lifecycle.fork()` provides a replaceable component/paint scope. Dispose it before repaint; its parent registration is removed, so repeated paints do not accumulate dead cleanup closures.
- A child scope supports `listen`, `own`, `acquire`, `during`, `guard`, and another `fork`. Listener capture is a boolean; arbitrary native listener option objects are deliberately not this API's responsibility.
- Register bindings within a child using `child.own(c.bind(callback))`. Do not copy resource arrays into the component. Predicates passed to `fork` should be side-effect free.

`readerNativeReset` returns a read-only `() => boolean` pending query. Review and confirmation flows must reject actions while a matching native reset is awaiting reconciliation. Cancellation and newer input still reconcile before the query clears. Each queued job owns an idempotent settlement release: normal completion, errors, and generation disposal clear only that job, including overlapping resets. Existing callers may ignore the return value. The query does not grant reset or interaction permission; existing ownership, disabled, cancellation, and revision checks remain in force.

Generation lifetime alone does not establish DOM ancestry ownership, state-paint revision validity or native visual acceptance. Those are separate contracts. This patch does not promise to stop every legacy component's direct native timer/observer; it protects the mounted renderer's common paths and provides the module new components should use.

## Acquisition and activation boundaries

`during` prevents the *next* old-generation operation. It cannot undo a native setter that executes after the host hook has already called update/dispose. Treat source assignment that starts a load as acquisition, not just a DOM write:

```ts
life.acquire(
  () => { image.src = suppliedSource; return image; },
  owned => { if (imageBox.contains(owned)) owned.removeAttribute('src'); },
);
```

Choose the release predicate according to the component's declared ownership. For an image inserted into its original box before source assignment, the example preserves an image that was subsequently moved to another owner. If acquisition happens before insertion, use a predicate that also releases a still-unparented image; do not accidentally skip the late-setter compensation. Do not silently clear a newer owner's replacement source. Tests must interrupt the setter *before* invoking the original native setter, then verify the final resource state.

An intent's reentrancy lock must cover every host lookup and event construction, not just `dispatchEvent`. A CustomEvent constructor can synchronously activate a different control. Set the component's lock before reading/constructing the event, and release it in a `finally` surrounding the whole operation. Ordinary construction errors must remain visible and must not leave the component permanently locked. This is a local interaction contract in the present API, not an automatic promise of `guard`.

Required negative controls for resource-bearing interactive components:

- Event constructor activates a second control: exactly one original intent is emitted; a later deliberate click still works.
- Event constructor updates/disposes: no old intent escapes, and the current DOM/state agree.
- Event constructor throws an ordinary error: the error remains observable and later activation is not blocked.
- Native source setter updates/disposes and then performs its original write: the old resource is released after the late write.
- Repeated mount/update/dispose: active listener/resource counts stay bounded and return to zero.

These checks are additional to fieldset/first-legend, current-control `aria-disabled`, shadow boundaries, cancellation and ownership tests. Shared helpers do not substitute for the component's actual compiled-artifact tests.

## Required checks

`tests/renderer-generation.test.mjs` retains the six reconstructed original baseline assertions. Their restored public 115 result was 3/6. `tests/renderer-generation-boundaries.test.mjs` adds factory, final publication, resource, repeated replacement, nested and error-identity boundaries. Run relevant existing Forms, Label, Table, Overlay, Button, Checkbox, finance-list, reader interruption and time tests alongside the common suite.

Preserve failed historical logs. A successor pass does not rewrite them. Run the final unified aggregate once in the implementation lane; record native/browser tests separately.

## Shared external adapters

A deduplicated request belongs to the current subscriber set, not to the first
component that happened to start it. The YouTube API adapter therefore owns one
independent `renderGeneration` while at least one subscriber remains active.
The last unsubscribe, readiness, failure, or timeout releases it. Its timer and
error listener use `acquire`/`listen`, preserving compensation if all subscribers
retire during registration. Individual ready callbacks still enter through their
own component guards. Keep a two-owner test: retiring the first reader must not
remove the surviving reader's timeout, and retiring the final reader must remove
all pending request resources.

## Finite carousel frame registration

The shared carousel owns each pending animation frame with a child generation.
Create and record that child before invoking the host requestAnimationFrame;
register the returned ID through acquire so update/dispose inside registration
still cancels the late ID. Deliver callbacks through guard. Dispose the child
after completion or failure, and clear only that task's pending identity, so
repeated scroll measurements do not accumulate registrations or cancel a newer
task. A synchronously delivered host callback must defer child disposal until
the registration returns. Ordinary registration and measurement exceptions
remain observable. The carousel frame lifecycle and public-mount regressions
cover these boundaries; this does not add animation, autoplay or navigation.
