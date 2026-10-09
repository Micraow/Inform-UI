# Finite supplied calendar agenda

Canonical catalog item: `calendar-agenda`. Wire node: `agenda`, owned by Base.
This is an original local renderer for finite caller-supplied records. It does
not connect a calendar, request account permissions, schedule reminders, make
bookings, infer availability or consult the system date.

## Contract

- Required: `label` (1–200 Unicode code points), `events` (0–100).
- Optional: `id` (standard node ID), `description` (up to 2,000 code points).
- Every event requires unique agenda-local `id` (key syntax), `date` (literal
  Gregorian `YYYY-MM-DD`, years 0001–9999) and `title` (1–200 code points).
- Optional `start` and `end` are literal `HH:mm`, 00:00–23:59. End requires start
  and is strictly later on the same supplied date. Split overnight records into
  the appropriate supplied dates; no overnight or timezone inference is made.
- Optional `location` (up to 500), `description` (up to 2,000), `status`
  (`planned` or `cancelled`, displayed as planned when omitted) and `url`
  (1–2,048, safe absolute HTTP(S) only).
- No HTML, expression-backed labels, bindings, media, arbitrary fields, account
  IDs or calendar operations. The generator owns schema and public types;
  runtime semantic checks additionally enforce real dates, ordering, unique
  event IDs and the shared URL policy.

```json
{"type":"agenda","label":"Supplied reading sessions","events":[
  {"id":"read","date":"2024-02-29","title":"Reading","start":"09:00","end":"10:00"},
  {"id":"notes","date":"2024-03-01","title":"Notes","description":"No time was supplied."}
]}
```

## Display and local interaction

Dates sort ascending, then times sort ascending with untimed entries first.
Equal date/time keys retain input order. Input data is never mutated; absent
start/end fields are never synthesized. An untimed entry says “Time not supplied”
rather than assuming an all-day duration. Exact date/time strings remain visible
in native `time` elements. Cancelled records retain their text and receive an
explicit cancelled label.

A native select contains All dates and only the supplied distinct dates. Each
date group and event stays mounted once; filtering only changes hidden groups.
Event descriptions and locations live in native details disclosures. Unrelated
host state changes preserve filter choice, open details, DOM identity and focus.
The filter has no binding or name and contributes no form values. It inherits
fieldset/busy-form disabled state, and ignores forged change events while
disabled. An enclosing native form reset preserves the local filter so its
selected label and visible date groups stay synchronized. Links and details remain ordinary reading UI. Document replacement
creates a fresh agenda; disposal detaches listeners. Invalid updates are atomic.

All labels have English and Chinese variants through `agendaUI`. Unsupported
languages use English UI labels. Authored Arabic-first content is included in
the RTL browser scenario; a `dir` attribute alone is not treated as RTL evidence.
Internal IDs use `iui-agenda-internal-${c.prefix}...`, separate from public node
IDs. CSS is `.iui-root` scoped and uses shared tokens, logical dimensions,
wrapping and forced-colors rules. There is no animation or network operation.
External event links say they open a new tab and use `noopener noreferrer`.

## Local verification and limits

`tests/agenda.test.mjs` exercises the actual generated full/Base schemas and
public validation, mounting, state evaluation and standalone compiler. Coverage
includes bounds, Gregorian leap centuries and endpoints, exact semantic paths,
unsafe URLs, stable nonmutating order, inert adversarial strings, 0/100 records,
local filtering, disclosure/focus persistence, inherited disabled controls,
form snapshots, cancellation, atomic replacement, ownerDocument and disposal.

`tests/browser/agenda.spec.mjs` prepares 10 scenarios: light/dark at
390/768/1100, true Arabic-first RTL, forced colors plus enclosing-form keyboard,
native touch, and offline/no-network plus lifecycle. These scenarios are
prepared only, not executed or visually reviewed in this isolated delivery.
Real browser and canonical acceptance are deferred to the combined component
batch. An isolated targeted test pass is not a full aggregate or browser pass.
See `examples/agenda.json` for original Chinese examples, including empty data.
