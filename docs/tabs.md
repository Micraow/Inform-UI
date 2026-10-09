# Finite local tabs

Candidate canonical component: tab-group. Original protocol nodes tab-group and tab-panel describe one component, not two completion counts. The accepted d370 CDN does not support these nodes yet; real browser/visual acceptance is deferred to the accumulated batch.

A group requires a supplied label and1..20 direct tab-panel children. Each panel requires a globally unique authored id, label and0..500 ordinary children under the existing total resource bounds. disabled is a literal boolean. At least one panel is enabled; initial optionally names an enabled direct panel. Otherwise the first enabled panel is selected. Orphan panels, arbitrary group children and nonexistent/disabled initial selections are rejected.

Native tab buttons use one roving tab stop, aria-selected and aria-controls; panels use role=tabpanel and aria-labelledby. ArrowLeft/Right wrap through enabled tabs in physical direction, respecting RTL. Home/End select the first/last enabled authored panel. Space/Enter use native button activation. Vertical arrows and modified keys are not intercepted. The tab rail scrolls locally when needed; selecting a tab never deliberately scrolls the whole page or changes shared state.

Inactive panels are hidden, not destroyed. Numeric drafts and local widget state persist, timers continue running, and the existing overlay hidden-anchor observer closes surfaces whose triggers became hidden. Unrelated shared-state changes preserve selection, focus and rail position. A valid full update starts a new instance; invalid updates preserve it; disposal removes handlers and size observation.

Place complete forms inside individual panels. A tab-group inside an enclosing form is rejected, because required fields hidden on another panel must not strand invalid focus. This rule is checked recursively through ordinary layouts/lists.

Examples: [basic base-domain tabs](../examples/tabs.json), [forms/time/overlay composition](../examples/tabs-local-state.json). No remote loading, URL/hash synchronization, auto-rotation, lazy mounting, drag reordering, persistence or arbitrary script behavior.
