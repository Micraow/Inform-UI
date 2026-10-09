# Loading and source cards: executed 66-node batch verification

Four canonical contracts are complete in this finite batch: `base-loading`, `base-loading-block`, `citation`, and `web-link-cards`. The inventory moves from **49 to 53 of 256 functionally verified components**; 12 remain partial and 191 unimplemented. Protocol node count is a separate measure.

## Exact identity

- Runtime/CSS/schema fixed asset pin: `d370ffb2df310fce0da9299e6e254a58509ba544`.
- Final tested head: `7db01a63d18d61a59f508e11433877b073ed5a7b`.
- [Successful CI 37898154911](https://github.com/Micraow/Inform-UI/actions/runs/37898154911), completed 2026-10-09.
- Actual Actions PR merge: `f5e925da2e504a36def612e41a776743b27c0cb6`. Its tree and the tested head tree are both `37329fff017f54d66e49e5af4f46f3ead55dfbc0`, independently checked using GitHub Git commit metadata and local Git.
- `src/`, `cdn/`, and `scripts/` have zero changes between the asset pin and final tested head. Pinned shells/tests/docs do not change the published runtime. Executed CDN tests compare the rebuilt integrity manifest in its entirety against the fixed lock.

## Executed evidence

- 338/338 Node tests; strict TypeScript, public type consumer, generated schema/types/validator/styles/CDN parity, source boundary and production dependency audit.
- 241/241 Chromium browser tests. Loading covers exact raw progress, unknown versus zero, bounded placeholder shapes, reduced motion/forced colors, RTL, focus, foreign documents and atomic rejected state. Source cards cover safe literal links, visible partial ranges, keyboard/pointer/touch navigation, exact boundary no-op, RTL, resizing, foreign documents and cleanup.
- 42 prior plus 18 new standalone consumer views all passed. The new three original examples use light/dark at 390/768/1100 with real public validation/compilation and no unsolicited requests. Consumer checks use inline assets; they are not substituted for CDN tests.
- Actual cache-disabled `file://` CDN loading checks fixed bytes/SRI/MIME/CORS and current-demo interactions. Schema discovery fetches closed base/forms/time/finance/converters subsets and same-version loading/source/time/finance examples.
- Independent real HTTP responses for 11 fixed assets match SHA256 and SHA384 SRI, CORS and immutable caching: global/ESM scripts, CSS, full schema, index, and base/time/finance Document/Node schemas.

The preceding [52b3 batch run](https://github.com/Micraow/Inform-UI/actions/runs/37897007426) had 240/241 browser passes and all 60 consumer views passing. Its only failure was a test fixture: Arabic title/language metadata did not override English leading visible text under native `dir=auto`. The fixture now has real Arabic leading description and an actual-mount regression. Direction and exact scroll assertions were retained. No runtime fix or asset repin was needed.

## Visual review and delivery

Actual first-run originals were inspected for loading light-390/dark-1100, sources light-390/dark-1100 and current fixed-CDN light-390/dark-1100. A second reviewer independently inspected each new consumer at light-390/dark-1100 (six originals). Text, readouts and focus remain readable; neighboring cards intentionally clip inside their native horizontal rail. No blocking visual defect was found. The final commit changes only the RTL fixture/tests; all reviewed renderer/CSS/demo/consumer bytes are unchanged.

Evidence lives in each run's `synthetic-ui-browser-evidence` artifact, under `test-results/` and `playwright-report/` (seven-day workflow retention). Original synthetic fixtures only; no private reference captures are published.

[Current fixed-CDN HTML](../examples/browser/current-components.html) and [native JSON](../examples/current-components.json) include the four new contracts and the already-verified numeric-draft fix. Delivered HTML SHA256: `09293764b7bfe10a048190ae5932ba2a506a03914e0ce9826f765ade69cb78d8`; JSON SHA256: `2430957b3a2146b0ce9be775aaf21f11906e7ab66a6ad0b127ce3b101eb6ef44`. The HTML first load needs a network connection.

## Bounded meaning

Progress is caller-supplied, never observed network/task completion; omitted progress is unknown, not zero. Source titles, URLs, publishers, descriptions and citation numbers are supplied by the caller, not fetched or certified as evidence. Example URLs are fictional `example.invalid` data. Browser validation does not imply manual screen-reader/WCAG certification or Firefox/WebKit coverage. The 66 protocol nodes comprise 64 rendered types, explicit plain-text Markdown fallback, and rejected historical native input.

Carousel/code enhancements are later isolated work and are not included in the four completed components. Historical 6797 fixtures remain unchanged. Documentation/accounting-only commits after this head use `[skip ci]` and do not claim another runtime test run.
