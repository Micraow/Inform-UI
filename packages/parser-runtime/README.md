# Inform v2 language runtime prototype

This package is the framework-independent, local-only language/runtime layer for the new Inform architecture. It reuses MIT-licensed OpenUI lexer, expression AST/parser and statement splitting source from commit `cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7`, with explicit strict-parser patches. The evaluator, validation gate, budgets and transaction store are Inform code. It does not import OpenUI's forgiving materializer, tool runtime, telemetry, React or any network service.

This is a working integration increment, not a claim that the existing Inform component catalog or the full upstream chart catalog has migrated. The old iui/1-compatible adapter design is superseded.

## Integrate

Preserve the relative `src/` and `vendor/` layout. Bundle `src/index.ts` into the owner's browser entry. `dist/index.js` is also an ESM browser-target bundle for inspection. `src/types.ts` is the integration ABI.

```ts
import {createRuntime} from './language/src/index';
const runtime = createRuntime(profile); // from the trusted component registry
const result = runtime.commit(dsl);
if (result.ok) render(result.snapshot);
else showIssues(result.issues); // previous committed snapshot remains valid

const unsubscribe = runtime.subscribe(snapshot => render(snapshot));
// Renderer gets scalar props and explicit opaque handles:
runtime.setBinding(inputNode.bindings.value, input.value);
runtime.dispatchLocal(buttonNode.props.onPress);
// When host is replaced:
unsubscribe();
runtime.dispose();
```

`profile` supplies `root`, `schema`, `componentRules` and optional `dataShapeRules`. No DSL-supplied renderer, validator, module URL, callback or code is loaded. Every component and data constructor needs a trusted `validateProps` hook; there is no permissive fallback validator. Rule metadata supplies positional `orderedProps`, `childSlots`, `bindingProps` and `actionProps`.

Validation receives evaluated scalar/data props and `isActionHandle`. It returns normalized props or structured issues. It must preserve genuine action handles and child element identities. The registry's real generated Zod/semantic rules are covered by cross-package tests.

### Node and event ABI

```ts
{
  type: 'element', typeName: 'Input', partial: false,
  props: {label: 'Name', value: 'Ada'},
  bindings: {value: {kind: 'inform-binding', id: 'b1', name: '$name'}}
}
{
  type: 'element', typeName: 'Button', partial: false,
  props: {label: 'Add', onPress: {kind: 'inform-action', id: 'a2'}}
}
```

These shapes are descriptive, not authority. The exact objects must have been issued by this runtime and be in its private WeakMaps. Copies, JSON round-trips, IDs and literal lookalikes cannot authorize an event. `name` is informational, not a path-write API. Every successful commit/local update gets a new revision and invalidates old handles. The renderer must dispose old listeners and wire fresh handles, preserving input focus/selection where useful. Failed updates retain the prior tree, state and event authority.

`setState` is a trusted host API accepting a plain JSON patch with exact declared `$state` keys. It is not exposed to DSL as arbitrary path access. `getSnapshot()` and all successful snapshots are deeply frozen. `subscribe` callbacks only run after successful atomic commits. A reentrant newer update prevents further stale notifications; each caller still receives its own committed snapshot.

`Series(...)`, `Slice(...)` and `Point(...)` produce validated plain data props through `dataShapeRules`. They are not UI nodes. Only metadata-declared child slots are traversed as UI. In those slots, nested arrays from `@Each` are flattened and explicit `null` conditional children omitted. Literal objects resembling AST or UI stay data and cannot masquerade as executable UI.

## Supported local dialect

See the executable examples `examples/local-form.openui` and `examples/derived-chart.openui`.

- Newline-separated `name = expression` declarations and `$name = initialData` local state. One `root` must resolve to the configured root component. Forward references are supported. Duplicate declarations, missing refs and declaration cycles reject.
- Strings (JSON escapes, plus single quotes), finite numbers, booleans, null, arrays, objects, references, member/index access, array field plucking and ternary conditionals. `//` comments are allowed outside strings. Markdown fences, statements or arbitrary JavaScript are not accepted.
- `+ - * / %`, unary `-`, scalar `== !=`, numeric `< <= > >=`, boolean `! && ||`, grouped expressions and short-circuit branches. `+` concatenates scalar values if either operand is text; null concatenates as empty text.
- `@Count`, `@First`, `@Last`, `@Sum`, `@Avg`, `@Min`, `@Max`, `@Round`, `@Abs`, `@Floor`, `@Ceil`.
- `@Filter(array, "field.path", "operator", value)`: operators `== != > < >= <= contains`. Empty field means the item itself. `contains` is string inclusion, not arbitrary predicate execution.
- `@Sort(array, "field.path", "asc" | "desc")`: direction defaults to `asc`; returns a new array. One sort field, stable ties, consistent finite-number keys or string keys.
- `@Each(array, "item", inlineTemplate)`: maps to components or data, with nested loop scopes and captured local action item values. No lambda functions or index argument. A separately declared template does not inherit a caller's loop scope.
- A direct `$state` in a declared binding prop issues a binding handle. Assignment binding `$state = $value + 1` interprets the incoming value through the safe expression evaluator. `$value` is reserved and cannot be declared as state.
- `@Set($state, expression)`, `@Reset($one, $two, ...)`, and `Action([step, ...])` are deferred local state actions. Steps execute sequentially in a draft, then validate and commit atomically. Reset restores the original committed-program default, not a reevaluated default expression.
- A literal `null` positional argument skips an optional non-nullable field when its JSON-schema metadata is present. Required or nullable fields retain null for their validator. Extra arguments reject; no invalid values are silently dropped.

### Deliberate differences from upstream permissive evaluation

Inform rejects wrong arithmetic types, nonfinite results, division/remainder by zero, missing commas, extra tokens, invalid escapes and single-character `&`/`|`. Relational comparisons require finite numbers, boolean logic requires booleans, and equality is strict scalar identity (`Object.is`, including its distinction between 0 and -0). String sorting uses deterministic UTF-16 lexicographic ordering; it does not coerce numeric-looking strings or depend on locale. `@Round` decimals must be an integer from -12 to 12. Empty aggregates return 0; empty `@First`/`@Last` return null.

Unused declaration ASTs are checked for names, call arity, forbidden calls/keys and cycles, but their complete value/props semantics are evaluated lazily. Every rendered component, every state initializer and every executed data transform goes through the final validation/budget path. These rules must be represented in the generated Inform prompt, rather than presenting the upstream evaluator's looser behavior as identical.

## Streaming and safety

`preview(source)` returns `{phase:'preview',tree,issues,interactive:false,incomplete}`. It may auto-close incomplete strings/brackets; it never commits state or authorizes event handles. It does not promise a non-null preview for every partial chunk. Preview props may be incomplete and have not passed the complete component validator.

The host must render preview as passive text/placeholders only, without entering resource-loading or effectful DOM/React adapters. Do not fetch images, run callbacks, dispatch events, mutate local state, navigate, send messages or execute tools from a preview. Only successful `commit` enables normal component rendering and local events. On invalid final input, retain the last valid committed display and surface errors.

The interpreter uses a finite AST switch, not `eval`, `Function`, dynamic imports or generated JavaScript. It reads only own data properties and rejects `__proto__`, `prototype` and `constructor` keys. Literal data is never reparsed as AST. State accepts bounded, plain JSON data; accessors, custom prototypes, symbols, cycles, sparse arrays and nonfinite numbers reject.

`Query`, `Mutation`, `@Run`, `@OpenUrl`, `@ToAssistant` and runtime tool references fail with `HOST_CAPABILITY`. A future external-service gateway needs separate explicit capability registration, payload validation, user/host authorization, cancellation, stale-result handling and idempotency. DSL text is never authorization. This package currently executes no external action or asynchronous domain operation.

### Default budgets

| Budget | Limit |
|---|---:|
| Source UTF-16 code units | 200,000 |
| Tokens | 40,000 |
| Statements | 1,000 |
| AST nodes | 20,000 |
| Nesting/dependency depth | 64 |
| Interpreter/semantic operation units | 200,000 |
| Array length | 5,000 |
| Rendered component occurrences | 2,000 |
| Validated data values | 50,000 |
| Validated text/key UTF-16 code units | 2,000,000 |
| Local action step count | 64 |

Budgets cover syntax/data nesting, transform loops, semantic validation hooks and final output including reused component occurrences. They are operation/size ceilings, not measured milliseconds. Trusted configuration may lower/raise limits, but the vendored Pratt parser has a hard recursion ceiling of 64. `AbortSignal` is checked cooperatively. JavaScript running synchronously on the main thread cannot observe an abort scheduled in a later event-loop task until it returns. A Worker/hard wall-clock terminator is a future integration, not delivered here. Validators and renderers are trusted code and must separately obey the same bounded-data contract.

## Verification and scope

Run `npm run check` after building the sibling component-contract package. Build dependencies are ordinary pinned dev dependencies; the runtime bundle has no package/runtime imports. Tests use Zod only to construct strict test contracts. Integration tests use the actual generated component profile but deliberately mock renderer mounts. They prove parser/schema/semantics/state interaction, not browser layout or React/DOM lifecycle.

Current checks cover arithmetic/filter/sort/Each composition, data constructors, bound inputs/checks, assignment bindings, sequential actions/reset, captured loop scope, rollback, stale/forged/disposed handles, preview inertness, strict syntax, AST/UI spoofing, forbidden tool calls and prototype paths, finite types, refs/cycles, budgets, hostile state shapes, cancellation, immutable snapshots, reentrant notifications and runnable examples. A separate subprocess blocks `Function`, `eval` and `fetch` before importing parser and real registry, proving zero attempts for import/profile building and tested local interactions. The full suite also runs under Node's `--disallow-code-generation-from-strings`.

Not covered here: browser visual/accessibility QA, full host CSP policy, full chart rendering, all legacy Inform components, async host actions, Worker termination, deployment/CDN, measured tokenizer/model generation comparisons or bundle-size comparisons against competing architectures.

## Provenance

See `THIRD_PARTY_NOTICES.md`, `vendor/openui/LICENSE`, `vendor/openui/SOURCE.json`, `vendor/openui/PATCHES.md` and `vendor/openui/SHA256SUMS`. Preserve these notices in source and an appropriate bundled license notice in distributed assets.
