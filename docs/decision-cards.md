# Supplied Jobs and Product Card

Canonical inventory IDs: `jobs` (Jobs), `product-card` (Product Card). Both belong to Base. These are independent original TypeScript renderers, using supplied synthetic fixture data and native controls. The protocol now includes 102 node types; this is not a canonical acceptance count.

## Jobs

Required `label` and `jobs` (0–40 records). Each record has unique `id`, `title`, `organization`, `location`, `workplace` (`remote`, `hybrid`, `onsite`, `unknown`) and `employment` (`full-time`, `part-time`, `contract`, `internship`, `unknown`). Optional plain-text `description`, salary `{minimum,maximum,currency,period}`, Gregorian `postedDate`/`deadlineDate`, and HTTP(S) `url`. Pay bounds are 0–1e12; maximum must not be less than minimum. Currency is an uppercase three-letter supplied label, not a currency conversion. Period is hour/month/year. Deadline cannot precede posting. No current-time, expiry, eligibility, ranking or live-opening inference.

Search matches title, organization and location; workplace/employment filters combine. A local shortlist toggle dispatches frozen `iui:job-shortlist` detail `{componentId,jobId,shortlisted}`. It bubbles, is cancelable and does not cross shadow boundaries. Cancellation preserves prior local state. Accepted explicit clicks toggle the local shortlist; no application, upload, recruiting action, account, recommendation or persistence occurs. Shortlist-only view hides unsaved records and safely relocates focus when a focused record is removed. Reset clears filters, preserving the shortlist. Native external reset supports cancellation, partial-control removal and interrupted lifecycle without writing outside-owned controls.

## Product Card

Required `productId`, `name`, and supplied `availability` (`available`, `unavailable`, `unknown`). Optional brand/seller/plain-text description, price `{amount,currency}`, 0–12 unique variants `{id,label,availability,price?}`, initial variant and quantity (1–20), disabled controls, source, and embedded raster image. Initial variant must exist. Selected variant price overrides the base price; otherwise it inherits it. Unknown price/availability remain explicit.

The native variant selector, quantity input and bounded steppers drive an exact decimal item subtotal. Quantity must be a whole decimal 1–20, with optional leading zeros and trailing `.0` digits; exponent notation and nonzero fractional tails are rejected rather than silently rounded. Decimal input is capped at 64 characters. No fees, tax, shipping, discounts, exchange rates, stock verification or merchant total are inferred.

Review dispatches frozen cancelable `iui:product-choice` detail `{componentId,productId,variantId,quantity,availability,unitPrice,itemSubtotal}` with a frozen nested price. Missing variant, invalid quantity or supplied unavailable status blocks review. Unknown availability can be reviewed locally and remains unknown in the detail. Cancellation retains the draft; repeated explicit review is allowed and synchronous reentry is blocked. Reset returns to supplied initial selection. Inputs have no Form payload names/binds and are dissociated from outer native forms. There is no cart, purchase, checkout, payment, reservation, network request or provider API.

Images accept only bounded embedded base64 PNG/JPEG/WebP; remote, SVG and animated GIF sources are rejected. Failed decoding shows a local fallback. Text is literal; ordinary source links require safe absolute HTTP(S), open separately with noopener/noreferrer and no referrer. No private assets or OpenAI runtime are used.

## Lifecycle and source map

Controls require live mounted ownership, enabled state and visible/non-inert ancestors. Retained detached/reparented controls cannot activate, and paint/restore does not rewrite outside controls. Host event construction/dispatch is treated as an interruption boundary; disposal or replacement retires handlers and prevents later mutation. Unrelated state updates retain local drafts and native disclosure state; a valid document replacement rebuilds from supplied values.

- Schema source: `scripts/generate-schema.mjs`, `scripts/schema-subsets.mjs`
- Semantic validation: `src/core/decision-cards.ts`
- Renderers: `src/renderer/jobs.ts`, `src/renderer/product-card.ts`, `src/renderer/decision-labels.ts`
- Fixture: `examples/decision-cards.json`
- Unit contract: `tests/decision-cards.test.mjs`
- Public types: `tests/decision-cards-types-consumer.mts`

Browser acceptance remains unexecuted. Native popup behavior, pointer/touch, visual layout and screen-reader behavior require real browser review. Current source remains separate from the frozen 97-node acceptance checkpoint. Inherited poll code must receive the separately reviewed ownership fix before later combined acceptance.

## Local checkpoint evidence

- Generation/build, CDN build, TypeScript no-emit, public type consumer and source-boundary checks passed.
- Combined decision-card, mail/file, Forms and core run: 161/161 passed (`/tmp/inform-decision-cards-focused-final.log`).
- Final decision-card-only run after adding authored pending-Forms and shadow-root coverage: 53/53 passed (`/tmp/inform-decision-cards-contract-final.log`). Earlier failures were test-fixture mistakes (an undefined JSON property and mismatched empty-label expectation), corrected without production workaround.
- Prepared browser test syntax checked. No local browser run or CI run was attempted; no visual or browser acceptance is claimed.
- Source-only integration requires schema generation/build/CDN rebuilding. Generated artifacts are preserved locally but deliberately excluded from the source commit. Root owns remote backup and combined acceptance.

Safe source recovery consists only of the schema generator/subset map, public exports, core inspector/wiring, renderer/wiring/labels/CSS, fixture, this document, focused tests/type consumer/browser spec, and the core/schema count assertions. There are no credentials, capture files, private assets, compiled dependencies or generated CDN artifacts in the source patch.
- Selected schema owner/closed-reference metrics, domain fixture compatibility, and CDN/source byte identity checks: 3/3 passed (`/tmp/inform-decision-cards-schema.log`).
