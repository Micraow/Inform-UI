# Seven canonical candidates; no new remote acceptance

The verified total remains53/256. Seven additional canonical components have local implementation evidence and await the accumulated browser batch: base-carousel, code-block, base-pie-chart, base-checkbox, base-markdown, base-date-picker and tab-group. Seven other entries remain partial and189 unimplemented.

The source schema now has68 protocol node names. Tab-group/tab-panel describe one canonical component; Markdown/date and the earlier four extend existing vocabulary. Neither the68 names nor the482 tests represent482 components.

## Executed local evidence

- Final npm run check passed482/482 Node tests, with zero skipped/TODO tests, including generation, core/browser/standalone and CDN build, strict TypeScript, consumer declarations and source boundary.
- The first four remain the [previous local checkpoint](local-enhancements-20261009.md); their independent consumer archive passed5 new +24 prior examples,39 literal examples,79 negatives and27 historical hashes.
- New Markdown/tabs/date and Forms interaction integration passed90 focused public tests before the full run. Core/schema-subset/old-renderer regressions also passed41 focused tests.
- The old standalone Markdown maximum-emoji TODO was removed on integration:12000-codepoint public acceptance is a strict passing test.
- New form pointer-blur tests first reproduced missing protection for component buttons outside the form, then passed with protection restricted to same-root native buttons. External/disabled/default-prevented gestures and unrelated/secondary pointers cannot defer feedback; cancel, release, keyboard, page-hide and disposal paths are covered locally.

## Still pending

Prepared native browser scenarios include real clicks/taps, native date segments, transformed/RTL scrolling, code selection/copy, responsive themes, forced colors and visual screenshots. They have not run for these candidates. Native-pointer timing cannot be certified from JSDOM. Full remote CI is deferred until approximately30 actual canonical components accumulate; no check protections or security permissions were disabled.

The recommended public asset pin, CDN demo and Library file versions remain the accepted d370 batch. New source/generated assets in this checkpoint are an unaccepted backup and are not a final demo repin. Small skip-ci commits preserve reviewable source boundaries while implementation continues.

Contracts: [tabs](tabs.md), [Markdown](markdown.md), [date field](date-field.md), [forms](forms.md), [carousel](carousel.md), [code](code.md), [pie](pie.md).
