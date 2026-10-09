# Native date field

Original project-owned MIT implementation, extending the existing Forms lifecycle. No additional dependencies or third-party calendar code.

Use `{ "type": "input", "kind": "date", "label": "Practice date", "bind": "day", "minDate": "2024-01-01", "maxDate": "2024-12-31" }` with a string state value such as `"2024-02-29"` or `""`. See `examples/date-practice.json`.

- Values are real Gregorian `YYYY-MM-DD` strings in years 0001–9999. Year 0000, impossible dates, whitespace, timestamps and nonstrings are rejected before host-state/DOM mutation. No time zone or timestamp is stored or inferred.
- Optional bounds are literal date strings, inclusive and ordered. The public validator also checks actual Gregorian validity; JSON Schema structure alone is not a semantic-validation substitute.
- Date fields forbid `placeholder`, numeric `min`/`max`/`step`, and text `minLength`/`maxLength`. Other input kinds forbid `minDate`/`maxDate`. Generated TypeScript declarations preserve these date/non-date branches.
- Initial and host-written valid date strings may be empty or outside field bounds. Submission validates the visible control. User out-of-range, required-empty or incomplete native edits remain local drafts and do not change shared state. Optional deliberate clearing accepts `""`.
- Hints, errors, first-invalid focus, fieldsets, disabled/busy controls, same-value overwrite, cancel/reset, abort, immutable submission snapshots and disposal use the existing Forms machinery. No second form registry or data store is introduced.
- The browser owns the date control, picker, visible format and localized segment order. Inform UI keeps label associations, native keyboard behavior, and date-specific English/Chinese validation errors. Native popup layout and calendar screenshots are not portable contracts.
- No date range picker, time-of-day, recurrence, unavailable-day provider, calendar service, reservation, reminder, network action or persistence is included.

## Verification boundary

`tests/date.test.mjs` executes the production mount/validation/standalone compiler in JSDOM. Native value sanitization is tested separately from mocked partial-segment validity because JSDOM cannot type real date segments. `tests/browser/date.spec.mjs` prepares actual native keyboard editing, label focus, first-click submission, range/required drafts, optional clear, snapshots, busy/cancel, RTL, forced colors, responsive light/dark UI and no network traffic.

The browser tests are prepared but unexecuted locally, by the combined-CI batching policy. They are not a browser pass, cross-browser certification, pixel-equivalence claim, or acceptance-count change.
