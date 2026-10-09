# Supplied prompt suggestions and an explicit DOM handoff

`prompt-suggestions` is one canonical base node. Conversation and onboarding aliases are not separate implemented components. This original local candidate does not promote any browser-accepted component count.

## Authored contract

See the complete original [example](../examples/prompt-suggestions.json).

- Required `label`: 1–200 Unicode code points.
- Required `items`: 1–12 objects containing only `id` and `text`. IDs match `^[A-Za-z_][A-Za-z0-9_.-]{0,79}$` and must be unique. Literal text is 1–2,000 Unicode code points; repeated visible text is allowed.
- Optional `description`: at most 1,000 Unicode code points, including an empty string.
- Optional `initialVisible`: integer 1–12, default 6, clamped to the actual number of items.
- Optional ordinary node `id` identifies the component in the integration event. Missing IDs produce `componentId: null`.

No callbacks, shared-state bindings, generated text, URLs, remote source data, message submission or persisted conversation are part of this contract. Exact supplied strings are displayed as literal text, never interpreted as instructions. Global JSON, depth and text budgets still apply.

## Local interactions

Every choice is a native `type="button"` with `aria-pressed`. A persistent Show more/Show fewer button uses `aria-expanded` and `aria-controls`; it hides overflow rows without rebuilding their DOM. The selected choice remains selected when it is hidden. Hidden overflow cannot be activated until expanded. Clear selection is persistent and stays focusable with `aria-disabled="true"` when there is nothing to clear; that boundary is a strict no-op. Collapse and Clear preserve native action focus without moving it outside the action.

All actions honor native inherited disabled fieldsets, including forged click events and an enclosing document form's busy state. Choices have no `name` or `data-bind`, cannot submit a form and never enter a form's snapshot values. The component is allowed within document forms.

Unrelated `setState` changes preserve the actual DOM, local selection/expansion, focus and status text. Invalid document updates are atomic; valid replacement starts clean. Disposal removes all component listeners. English/Chinese chrome follows the nearest host language; supplied content and its original line breaks remain unchanged. Layout supports automatic content direction, wrapping, light/dark palettes and forced-color selected outlines.

## Host integration

Each explicit accepted-for-dispatch activation, including host `.click()` on a visible enabled choice, dispatches exactly one `iui:suggestion` `CustomEvent` from the component root. It bubbles, is cancelable and is non-composed. Event construction uses the component's owner document/window, including a `createEvent` fallback for documents with no default view. The shallow-frozen detail contains only primitive fields:

```ts
interface SuggestionDetail {
  readonly componentId: string | null;
  readonly suggestionId: string;
  readonly text: string;
}
```

`SuggestionDetail` is exported as a type from the main and browser entries. A complete minimal host consumer can preview the event without calling any chat service:

```js
import {mount} from '@micraow/inform-ui/browser';

const preview = document.createElement('p');
const host = document.createElement('div');
document.body.append(host, preview);
host.addEventListener('iui:suggestion', event => {
  if (event.detail.suggestionId === 'terms') {
    event.preventDefault(); // Reject only this local selection.
    return;
  }
  preview.textContent = 'Host received a local event: ' + event.detail.text;
});
const controller = mount(host, suppliedDocument);
```

Calling `preventDefault()` preserves the previous selection and reports that selection was not accepted. An uncanceled event selects locally and says any further handling belongs to the host app. The renderer never claims a message was sent. Cancellation cannot undo operations a host listener already performed, and uncanceled dispatch is not confirmation that an external operation succeeded. Consumer exceptions follow ordinary DOM event semantics. The host owns any composer insertion, external communication, authorization and error handling.

There is no event on mount, Show more/fewer, Clear or unrelated state updates. Reentrant activation and local actions are suppressed while the component's integration event is being dispatched. Synchronous consumer replacement/disposal invalidates the old renderer before post-dispatch painting, so detached or replacement content cannot be changed by a stale event. No network request, storage write, timer or chat service is implemented.

## Evidence and verification limits

Source baseline: `ba820ebf5a4effa4177c37901d3b267561dc1fa8`.

`node --test tests/suggestions.test.mjs` covers the public schema/semantic API, strict negative cases, resource budgets, frozen detail and source immutability, cancellation, ownerDocument fallback, reentrancy, update/dispose cleanup, disabled/busy forms, no-submit behavior, persistent controls, literal Unicode and deterministic compilation.

`tests/browser/suggestions.spec.mjs` is prepared but **unexecuted** in this isolated implementation. It covers native keyboard, pointer and touch at 390/768/1100 in light/dark, an actual local event consumer, Arabic-first RTL, long strings, forced colors, Chinese chrome, form and lifecycle interactions. Listed tests are not browser execution; screenshots exist only after these tests actually run. The integration owner runs the complete aggregate and accumulated browser acceptance. No push, remote CI, public acceptance or release is claimed here.
