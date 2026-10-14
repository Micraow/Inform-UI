# DSL API and security model

Inform UI interprets a bounded DSL. It does not evaluate authored text as JavaScript. The public package, browser entry and CLI take DSL source; structured AST, IR, snapshots and schema metadata are internal representations or inspection output.

## Parsing and evaluation

The parser accepts declarations, component calls, constrained expressions and the documented builtins. The runtime validates names, component parameters, references and state before accepting a complete program. Only parser-created AST nodes are executable: objects that resemble AST or action records remain data and do not acquire authority.

Property access is limited to own properties. Dangerous prototype keys, non-finite results, invalid arithmetic, unknown references and declaration cycles are rejected. Parsing, evaluation, arrays, strings and rendered output have resource budgets. These limits reduce resource exhaustion; they do not promise fixed latency for every accepted program.

State updates are transactions. Failed updates do not replace the last accepted state. Bindings and local action handles belong to a specific runtime revision and become invalid when that revision is superseded or the runtime is disposed. See the [DSL contract](v2/dsl-compatibility.md) for exact syntax, limits and differences from upstream OpenUI.

## Browser and host boundary

The installed profile chooses the trusted component definitions and renderers. DSL cannot inject a renderer, validator or JavaScript callback, access arbitrary DOM objects, import modules, or call `fetch`. Query, mutation, external tool execution and message-sending instructions are not enabled merely because their names appear in authored text.

Text and code content are displayed through the components' defined rendering paths, not executed as authored JavaScript. Components that render mathematics, SVG or media apply their own bounded contracts. The embedding application remains responsible for selecting an appropriate profile and reviewing its data and resource policy.

The host may supply explicit image, animation and media URL allow callbacks. Allowing a URL can cause a request to that destination; it does not establish the destination's privacy or trustworthiness. Applications handling confidential content should avoid unnecessary remote resources. Loading a third-party CDN runtime also makes a network request to that CDN.

The host browser's Content Security Policy remains authoritative. The DSL runtime includes trusted styles and may need host CSP configuration for those styles and allowed media. Do not assume the former JSON compiler's CSP, stylesheet options or controller methods apply to this API.

## Delivery and lifecycle

`mount(container, { source })` creates a local instance. `commit(source)` submits a complete program with new initial state; `preview(source)` displays a passive partial preview with interactions disabled. `dispose()` releases the instance's runtime and owned DOM resources and can be called repeatedly.

The CLI builds `.openui` source into HTML. By default it copies the matching local runtime and license notices next to that HTML. Keep the generated files together, and verify any explicit runtime URL against the source contract used to create the page. Build output is not a hosted service or an automatic upload.

The library does not authenticate users, persist documents, store credentials, send form values, verify model-generated facts or grant permission for external actions. Applications remain responsible for data provenance, user consent, server-side validation and their host threat model. Local software demonstrations and calculator outputs do not establish scientific or clinical validity.
