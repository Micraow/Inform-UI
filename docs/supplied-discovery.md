# Supplied Bento, OpenDetail and organization views

These original views use supplied data and local cancelable requests. They do not navigate, fill a real conversation, open host sidebars, fetch favicons or emit impression analytics. The `openai` protocol name identifies the observed component family, not an endorsement or live account integration. Its example uses a fictional studio and original artwork.

## Bento

`bento` requires `largeCard`, `smallCardA`, `smallCardB` and `mediumCard`. The large card requests its supplied detail query/context and displays an image or supplied status text. Each support card supplies title/body and a URL or query/context; URL takes priority when both exist. Medium URL cards can include a literal source host and explicit supplied icon. There is no inferred favicon request.

At a container width below576px, the large3:2 tile appears above the support group, with two small cards stacked beside the medium card. At576px the layout becomes two columns with5:4 large/support areas; the small cards share the upper support row. At768px the medium description allowance grows. Titles have two-line limits; body-as-title text is not clamped; ordinary medium descriptions allow seven, three or six lines by layout. CSS container queries respond to the actual component container. These source checks do not constitute native geometry or reference-pixel acceptance.

## OpenDetail

`open-detail` has a supplied title, finite action name and up to100 uniquely identified actions. Initial visibility is four; More/Less changes between four and all while retaining row identity. Labels remain literal. `payload:null` or omitted falls back to the label; an explicit empty payload remains empty. Each row requests `request-action` with `action`, `itemId` and exact `query`. Show-more/less is itself cancelable and reports the proposed visible count.

## Openai organization card

`openai` requires a supplied name, tagline, image, website URL and more prompt. It presents the image in a260×70 area and the card up to320px wide. Website requests `open-url`; Ask more requests `fill-prompt`. Button labels and image alt text are supplied or use documented neutral defaults. Acceptance does not navigate or write into any external composer.

## Images, events and lifetime

Inline images can render immediately. External images and source icons require an explicit local Load activation before their image element is created. Load controls sit outside action buttons, avoiding nested controls; activation restores keyboard focus to the labeled root. Existing safe-image resources handle failure and update/disposal cleanup.

All `iui:supplied-discovery` details are frozen, bubbling, cancelable and non-composed, with `id`, `component`, `intent` and only applicable supplied fields. `open-url`, `open-detail`, `request-action`, `fill-prompt`, `show-more` and `show-less` do not execute host work. Reset clears receipts and collapses OpenDetail; accepted native reset honors cancellation and revision protection. Source-disabled, fieldset/first-legend, ARIA, capture cancellation, hidden/inert and shared generation ownership gate every action. Updating or disposing retires previous listeners and media. Outer pending/failed phases are supplied-only.

The author suite checks actual public mount and standalone output with original fixtures. Browser discovery is recorded separately from actual native execution. Frozen unified183 assets retain their prior scope until a later unified release is explicitly generated and accepted.

## Complete semantic validation boundary

Full `validateDocument` checks all supplied top-level strings for nonblank `trim()` content except `fallback`, `tagline` and `imageAlt` (`DISCOVERY_TEXT`). Those content exceptions keep their structural allowance. Bento's large-card query must be nonblank when supplied and its image URL safe. Each supplied small/medium support card has a nonblank title and any query, while body/context may be empty; URL and icon source must satisfy safe-link/image rules, and at least a URL or detail query must be supplied (`DISCOVERY_ACTION`). These are direct, explicitly selected string checks, not a recursive ban on all nested content.

Open-detail action IDs and labels must be nonblank; action IDs must be unique (`DISCOVERY_ID` for duplication, `DISCOVERY_TEXT` for blank text). Organization-card image and website destinations must be safe image/link URLs. These structural-plus-semantic checks do not fetch a provider or infer an action from prose.
