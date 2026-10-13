# Third-party notices

The Inform chart extension reuses upstream implementations. It does not reimplement 14 empty wrappers.

## OpenUI

Repository: https://github.com/thesysdev/openui
Revision: cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7
License: MIT (full text in vendor/openui/LICENSE)
Source and modifications: vendor/openui/SOURCE.json. Eight source files have small official-icon, keyboard-accessibility, portal-theme or host-foundation-class adaptations; see the exact per-file modification list. All chart geometry comes from this pinned source.

## Official OpenAI icons

Four chevrons are imported from the host canonical 755-icon registry pinned at OpenAI Apps SDK UI commit 0f00143c7a639906f1621fe58e1b6be7b5bea46d. Geometry is unchanged. License: licenses/OpenAI-official-icons.txt. Lucide is not bundled.

## Bundled package dependencies

- @floating-ui/core 1.8.0: MIT. Full text: licenses/@floating-ui__core.txt
- @floating-ui/dom 1.8.0: MIT. Full text: licenses/@floating-ui__dom.txt
- @floating-ui/react-dom 2.1.6: MIT. Full text: licenses/@floating-ui__react-dom.txt
- @floating-ui/utils 0.2.12: MIT. Full text: licenses/@floating-ui__utils.txt
- @radix-ui/primitive 1.1.2: MIT. Full text: licenses/@radix-ui__primitive.txt
- @radix-ui/react-arrow 1.1.7: MIT. Full text: licenses/@radix-ui__react-arrow.txt
- @radix-ui/react-compose-refs 1.1.2: MIT. Full text: licenses/@radix-ui__react-compose-refs.txt
- @radix-ui/react-context 1.1.2: MIT. Full text: licenses/@radix-ui__react-context.txt
- @radix-ui/react-dismissable-layer 1.1.10: MIT. Full text: licenses/@radix-ui__react-dismissable-layer.txt
- @radix-ui/react-id 1.1.1: MIT. Full text: licenses/@radix-ui__react-id.txt
- @radix-ui/react-popper 1.2.7: MIT. Full text: licenses/@radix-ui__react-popper.txt
- @radix-ui/react-portal 1.1.9: MIT. Full text: licenses/@radix-ui__react-portal.txt
- @radix-ui/react-presence 1.1.4: MIT. Full text: licenses/@radix-ui__react-presence.txt
- @radix-ui/react-primitive 2.1.3: MIT. Full text: licenses/@radix-ui__react-primitive.txt
- @radix-ui/react-separator 1.1.7: MIT. Full text: licenses/@radix-ui__react-separator.txt
- @radix-ui/react-slot 1.2.4: MIT. Full text: licenses/@radix-ui__react-slot.txt
- @radix-ui/react-tooltip 1.2.7: MIT. Full text: licenses/@radix-ui__react-tooltip.txt
- @radix-ui/react-use-callback-ref 1.1.1: MIT. Full text: licenses/@radix-ui__react-use-callback-ref.txt
- @radix-ui/react-use-controllable-state 1.2.2: MIT. Full text: licenses/@radix-ui__react-use-controllable-state.txt
- @radix-ui/react-use-effect-event 0.0.2: MIT. Full text: licenses/@radix-ui__react-use-effect-event.txt
- @radix-ui/react-use-escape-keydown 1.1.1: MIT. Full text: licenses/@radix-ui__react-use-escape-keydown.txt
- @radix-ui/react-use-layout-effect 1.1.1: MIT. Full text: licenses/@radix-ui__react-use-layout-effect.txt
- @radix-ui/react-use-size 1.1.1: MIT. Full text: licenses/@radix-ui__react-use-size.txt
- @radix-ui/react-visually-hidden 1.2.3: MIT. Full text: licenses/@radix-ui__react-visually-hidden.txt
- clsx 2.1.1: MIT. Full text: licenses/clsx.txt
- d3-array 3.2.4: ISC. Full text: licenses/d3-array.txt
- d3-color 3.1.0: ISC. Full text: licenses/d3-color.txt
- d3-format 3.1.2: ISC. Full text: licenses/d3-format.txt
- d3-interpolate 3.0.1: ISC. Full text: licenses/d3-interpolate.txt
- d3-path 3.1.0: ISC. Full text: licenses/d3-path.txt
- d3-scale 4.0.2: ISC. Full text: licenses/d3-scale.txt
- d3-selection 3.0.0: ISC. Full text: licenses/d3-selection.txt
- d3-shape 3.2.0: ISC. Full text: licenses/d3-shape.txt
- d3-time 3.1.0: ISC. Full text: licenses/d3-time.txt
- d3-time-format 4.1.0: ISC. Full text: licenses/d3-time-format.txt
- internmap 2.0.3: ISC. Full text: licenses/internmap.txt
- react 19.1.1: MIT. Full text: licenses/react.txt
- react-dom 19.1.1: MIT. Full text: licenses/react-dom.txt
- scheduler 0.26.0: MIT. Full text: licenses/scheduler.txt
- zod 4.1.12: MIT. Full text: licenses/zod.txt
- zustand 5.0.8: MIT. Full text: licenses/zustand.txt

Only these actual runtime dependencies are included in the browser artifact. Build/test-only dependencies remain recorded in package-lock.json and are not shipped. Neither OpenUI headless chat services nor its model API integration is included.
