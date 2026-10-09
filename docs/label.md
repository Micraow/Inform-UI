# Additional native labels

The existing partial canonical `base-label` now has a finite standalone `label` node. This is one pending enhancement, not an alias or a new verified component. The verified component count remains unchanged pending the accumulated real-browser batch.

```json
{
  "version": "iui/1",
  "state": { "name": "" },
  "body": [
    { "type": "label", "text": "Additional name label", "target": "name-field" },
    { "type": "input", "id": "name-field", "kind": "text", "label": "Name", "bind": "name" }
  ]
}
```

Both `text` and `target` are required literal strings of 1–200 Unicode code points. `target` must match an exact authored node ID in the same document, in either forward or backward order. Supported targets are input kinds text, number, email, checkbox and date, plus textarea, slider, toggle and select. A label does not replace the target's required original label. Radio, segmented choices, groups, forms, arbitrary text and unsupported nodes are not label targets. Missing/duplicate IDs and invalid references reject the complete document before DOM replacement.

The renderer produces an actual native `label` whose `htmlFor` identifies the interactive input, textarea or select, never its wrapper. The authored wrapper ID is preserved. Existing control IDs and native labels remain intact; formerly ID-less toggle/select controls receive renderer-reserved IDs. Slider control IDs use their own reserved namespace to avoid authored-wrapper collisions. These generated IDs are internal details.

Multiple labels can name one control. Their DOM order follows the document's explicit author order, including the original field label. Assistive technology may combine these strings into the accessible name. Label text is inert and wraps in the inherited writing direction. Authors should keep extra labels concise and avoid redundant names.

Native pointer/touch label activation focuses or toggles the control according to the browser's native behavior. There is no synthetic click, focus forwarding, custom keyboard activation or extra tab stop: a native label is not a separate button contract. Labels do not open hidden panels/details, bypass disabled controls, submit forms, change drafts, or change a field's form ownership. A label inside one form may name a field outside that form, but that field does not enter the form's submit snapshot.

Each mount has a local synchronous association registry. Labels and native targets unregister on replacement/disposal. Invalid updates preserve the old associations and drafts; separate roots and ownerDocuments never share authored-ID lookups. There are no global selectors, observer/timer resolution, host binding or dynamic-label protocol.

## Verification boundary

Public-API Node/JSDOM coverage includes every supported native target variant, both target orders, multiple labels, original-label preservation, schema subsets, Unicode limits, literal injection strings, exact/missing/wrong/duplicate IDs, native checkbox label clicks, disabled controls, rejected drafts, atomic invalid updates, replacement/reused IDs, cleanup, independent roots/documents, form snapshots, hidden panels and the portable compiler.

JSDOM confirms real native associations and checkbox activation. It does not establish true pointer/touch behavior or browser text-field focus. Prepared `tests/browser/label.spec.mjs` scenarios cover light/dark themes at 390/768/1100 widths, real pointer and touch activation, native control keyboard focus and keys, disabled/hidden boundaries, lifecycle and Arabic-first RTL/forced colors. These browser scenarios have not been executed locally. No browser acceptance or count promotion is claimed.
