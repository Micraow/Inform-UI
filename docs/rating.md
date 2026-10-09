# Rating: finite standalone controlled input

`rating` implements the single canonical Rating component using project-owned MIT-licensed code. This is a local candidate; real-browser acceptance is pending. It is not a supplied average, online review service, verified grade, or persisted preference.

## Contract

Required fields are `label` (1–200 Unicode code points) and `bind` (a declared state key). Optional fields:

- `max`: integer 2–10, default 5
- `disabled`: an ordinary Value resolving to a boolean, default false
- `clearable`: boolean, default true
- `hint`: literal string, at most 1,000 Unicode code points

The bound state is an integer from 0 through `max`. Zero means unrated. Positive values are chosen explicitly. Fractions, strings, undeclared/computed-only bindings, and out-of-range values are rejected. The initial document, host `setState`, and declared set-button values satisfy every rating sharing the binding. A failed global transition leaves the whole state unchanged.

See the complete original [example](../examples/rating.json). A disabled rating is noninteractive but still reflects accepted host state. There is no `readOnly`, custom glyph, arbitrary HTML, `initial`, or alternate unbound protocol.

## Interaction and ownership

A fieldset/legend groups native, same-name radio inputs. Each visible star is decorative; numeric accessible labels and a visible numeric output communicate the choice. Native radio arrow/Space/Tab behavior is left to the browser. No custom keyboard handler claims Home/End behavior. Forced-colors retains native radio affordances, selected borders, and visible focus. Touch labels are at least 44 px high.

Clear writes 0. At zero it remains focusable with `aria-disabled="true"` and safely does nothing. Setting `clearable:false` removes this button; hosts may still set 0. An ordinary document reset returns the bound state to its document initial value. Rejected input restores the accepted selection/output and shows localized feedback without moving focus.

Rating is a standalone shared-state input and is rejected beneath any `form` node, including nested containers and list items (`RATING_FORM`). It does not participate in form submission, Cancel, native form-reset snapshots, required-field validation, or host action adapters. Do not mount it inside an externally owned HTML form. Ordinary disabled fieldset ancestors are honored.

All options and output DOM survive unrelated/same-value state updates. Valid `controller.update` replaces the tree; an invalid update is atomic. Disposal removes listeners so detached controls cannot change replacement state. Each widget/mount has an independent radio name and internal ID namespace, including across ownerDocuments.

## Verification boundary

Node/JSDOM tests cover public schema/types/validation, shared state, atomic rejection, disabled guards, repeated dispatch, label activation, Clear/reset, focus/DOM preservation, namespace isolation, updates/disposal, literal content, and deterministic offline compilation. JSDOM is not evidence of actual native keyboard gestures or layout.

`tests/browser/rating.spec.mjs` is prepared for the combined CI batch, covering pointer/native keys/touch, Tab group navigation, 390/768/1100 light/dark screenshots, actual RTL, forced colors, reduced motion, overflow, rejection and lifecycle. These browser tests have not been executed locally; pixel, browser, screen-reader and mobile acceptance remains pending. No network, timer, animation, storage, third-party code or remote assets are introduced.
