# Controlled local checklist

Original finite support for canonical `checklist`. This candidate is locally tested and awaits the larger combined real-browser acceptance batch.

`checklist` is a base-domain node with required `label` (1–200 code points) and `items` (0–50). Each item has unique `id`, literal `label`, and a unique `bind` naming declared boolean state. Optional item `hint` is at most 1000 code points; `disabled` is a boolean or expression resolving to a boolean. Overall `disabled` uses the same contract. Optional `filter` and `bulk` booleans default to true; `emptyText` is a literal at most 1000 code points.

Native checkboxes compose the established Forms field registry. The count covers all supplied items, including disabled items. An empty checklist shows zero of zero and explicit empty content, without inventing a percentage. All/Open/Done only changes visibility; item DOM and local filter survive unrelated host updates. If a focused item becomes hidden by completion, focus moves only to the next visible enabled checkbox or the filter. Outside focus is untouched.

Select all/Clear all applies one atomic state patch to enabled items only. Global derived constraints can reject that complete patch; the UI preserves all accepted values and reports rejection. The operation never claims a partially applied update. Boundary actions remain focusable with `aria-disabled` and are strict no-ops. Native disabled fieldsets and submitting forms block all interactions.

A checklist can live within a form because its native fields participate in the same submit values, disabled omission, cancel/reset snapshots and lifecycle as ordinary checkbox inputs. Its own buttons never submit the form. Full document update resets the local view only after validation succeeds. Labels, hints and state are rendered as text; no external tasks, reminders, network or persistence are provided.

See `examples/checklist.json` and `examples/checklist-form.json`. Original public validation/mount/compile tests are in `tests/checklist.test.mjs`; native pointer, keyboard and touch layouts are prepared in `tests/browser/checklist.spec.mjs` for later combined acceptance.
