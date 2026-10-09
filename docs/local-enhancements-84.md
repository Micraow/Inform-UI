# Twenty-four distinct local canonical candidates

Verified coverage remains 53/256. Twenty-four distinct canonical components are implemented pending the accumulated browser acceptance; five remain partial and 174 unimplemented. The preceding 20 are recorded in [their source checkpoint](local-enhancements-80.md). This group adds news-article, entity-reviews, restaurant-availability and reddit-thread-card. Animation/celebration and later cards are outside this freeze.

There are 84 protocol node types: 83 finite rendered contracts and the explicitly rejected historical native input. Neither the protocol count nor the test count represents canonical component completion.

## Local verification

The full integrated Node attempt ran 808 tests: 807 passed, one failed, and none were skipped or TODO. The sole failure was an exact primitive CSS selector assertion that still named four contained flow children after the thread renderer added the fifth. The assertion now requires all original four plus thread, with the same `min(20rem, 100%)` basis; the complete 16-test primitive suite passed. No production source or generated artifact changed after that full run. This is an aggregate run plus a test-only correction and focused recheck, not a claim that one uninterrupted `npm run check` exited successfully.

Schema generation, production build, CDN build and strict typecheck passed in the aggregate chain. Public consumer types and source-boundary checks, which follow Node tests in that chain, then passed explicitly. The machine-readable [stage evidence](local-enhancements-84.json) records the distinction. Prepared Playwright discovery lists 526 cases in 58 files; no new browser or screenshot result is claimed.

Integration review fixed these bounded issues before acceptance:

- Review sorting/filtering may explicitly restore or relocate a currently affected focus. If that focus callback replaces/disposes the mount, old count/empty output is no longer changed afterward.
- Availability checks lifecycle again after accessing/constructing its owner-window event; a synchronous host replacement cannot emit a stale reservation-choice event. This remains a local intent signal, never a reservation request or confirmation.
- Thread numeric negative zero now displays0 both in actual mount and compiled JSON transport without changing caller input; negative nonzero and missing scores remain distinct.
- The new inline-size-contained thread surface receives the same bounded basis as other contained components when it is a direct flow child, preventing zero-content intrinsic sizing. A strict local source/DOM check and three prepared actual-layout cases cover that integration boundary.
- A source-boundary news test initially inspected the entire stylesheet tail, accidentally matching an unrelated later component's no-motion declaration. The test now examines every actual news selector across the whole stylesheet; all original forbidden clipping/animation/transition assertions remain. The complete16-test news suite passed after that test correction.

## Scope

- [News](news-article.md): supplied literal source/byline/date/article paragraphs and native disclosure, not ingestion or credibility verification.
- [Reviews](entity-reviews.md): nullable supplied scores, stable native filters/sort and preserved details, not posting or inferred ratings.
- [Availability](restaurant-availability.md): supplied floating wall-time options and explicit cancelable local handoff, not provider availability or a booking.
- [Discussion](reddit-thread-card.md): a finite supplied comment tree with exact scores and native nested reading, not a remote thread embed or voting UI.

No accepted asset pin, Library demo or53-component browser result is changed. This is a skip-ci source/generated-asset checkpoint. Full remote acceptance remains reserved for approximately30 actual canonical candidates, with shared same-version consumers deduplicated and required security/platform checks retained.
