# Native button actions (local candidate, not browser-accepted)

`button` remains the single canonical base node. This enhancement adds no button aliases or new canonical components. Its existing `label` and `action` are required. Optional fields are `disabled: Value` (must evaluate to a boolean), `tone: "default" | "primary" | "danger"` (default `default`), and literal `hint` (at most 1,000 Unicode code points). Labels remain bounded to 200 code points. Unknown fields are rejected.

## Exact action branches

- `{ "kind": "set", "bind": "count", "value": 2 }`: `bind` and scalar `value` are required; the binding must be declared and preserve its initial scalar type. Uses the existing Forms `replace` draft policy, including same-value overwrites.
- `{ "kind": "reset" }`: no other fields. Restores initial declared document state through the existing Forms `reset` policy, including field drafts.
- `{ "kind": "host", "name": "run" }`: `name` is required and matches `[A-Za-z_][A-Za-z0-9_.-]{0,79}`. `bind`, `value`, callbacks, code and URLs are forbidden in this branch.

Malformed actions are structurally rejected by the generated full schema, subset schemas and generated public types. A valid host name does not establish runtime handler availability or successful external behavior.

## Explicit host configuration

```js
const controller = mount(container, document, {
  actions: {
    run: async ({ values, signal }) => {
      // Your explicitly configured application operation.
      // Decide what information may leave your application here.
      await applicationAction(values, { signal });
    }
  }
});
```

The handler has the existing exported `FormAction` signature: `(context: FormActionContext) => void | Promise<void>`. Only an own, function-valued property of `options.actions` can be selected. A missing adapter reports unavailable after activation; there is no simulated success. A synchronous exception or rejected promise reports failure and permits retry. Resolved/rejected thenables are safely assimilated, including throwing `then` getters. A synchronous void return completes immediately.

`values` is a frozen, fresh snapshot of **all declared current state**, including keys that are unrelated to the button, disabled controls or an enclosing form. It excludes computed values and uncommitted field drafts. This differs from form submission's subset of enabled valid controls. Later state changes do not mutate the snapshot. The context wrapper is also frozen. The signal is created in the mounted element's actual owner window. The library does not make network, storage, clipboard or navigation calls for the action. The host owns any such behavior, consent, validation, privacy decisions and result integrity.

The button uses native `type="button"` activation: pointer, touch and the browser's Enter/Space click synthesis. Standard host-driven `.click()` and synthetic click events are supported, as with existing Forms; this is **not** an `event.isTrusted` permission boundary. A host should expose only appropriately authorized handlers. There is no mount-time, refresh-time, keydown-only or automatic retry invocation.

## Pending, cancellation and state changes

Only the activated button blocks duplicate invocation while its own action is pending. Other buttons and state controls remain available. Pending uses `aria-disabled` plus an event guard while retaining the native main button's focus; ordinary document `disabled` uses native `disabled` and a guard. A disabled ancestor fieldset is respected too.

A separate native Cancel action button appears while pending. Cancellation invalidates the request before aborting its signal, then makes a new explicit request possible. It does not reset shared state or drafts. Cancellation is cooperative: work already performed by the host may not be undone, and the UI never promises remote rollback. The host must honor `signal` if it needs to stop its own work. Stale resolution/rejection after cancel, restart, update or dispose cannot paint a replacement UI or launch another request.

A successful callback reports completion only when current declared state still equals that request's snapshot. If it changed, the button returns to idle without a completion claim. Later state changes clear an existing success message. An invalid document update is atomic and leaves the pending request intact; a valid update or dispose aborts it and removes old listeners.

An enclosing form is independent: host activation does not submit it, does not perform its field validation, and Cancel does not cancel/reset the form. Form-level disabling can disable descendant native buttons. A pending button does not disable the entire document or enclosing form.

Starting an action never moves focus. If Cancel held focus when it disappears on cancellation/completion, focus returns to the enabled main button, or to the stable status region if the main button is actually disabled (including a disabled fieldset). Outside focus is never reclaimed. Update/dispose does not attempt to focus detached or replacement controls.

## DOM compatibility and accessibility

Existing set/reset variants still return the native button itself, keeping authored `id`, `data-iui="button"` and `.click()` consumers compatible. An optional hint is a plain internal span, with an explicit authored-label accessible name and an `aria-describedby` reference.

Only the new host branch returns a wrapper carrying authored `id` and `data-iui="button"`; its main control is `.iui-button`. Cancel and status are siblings, never descendants of that button. Internal main/Cancel/hint/status IDs live in a namespace distinct from authored IDs. Status is a polite, atomic live region. All controls are scoped by `.iui-root`, with light/dark tokens, wrapping, logical layout and forced-colors rules. English and Chinese labels are selected through `buttonUI`.

`examples/button-actions.json` is a synthetic, self-contained example. Its host action honestly reports unavailable in compiler-generated standalone HTML, which cannot serialize a handler. Applications may supply one through `mount`.

## Verification scope

Public API/schema/compiler/JSDOM lifecycle and impacted Forms/core/renderer regressions are local checks, not real-browser acceptance. `tests/browser/button.spec.mjs` is prepared but **not executed**. It covers real pointer/touch/keyboard activation, repeated busy activation, cancellation, focus, narrow layouts, themes, RTL and forced colors using explicit local adapter stubs. No external action is exercised, no publication or component-count promotion is implied, and aggregate full-suite validation is owned by the integrator once per integration group.
