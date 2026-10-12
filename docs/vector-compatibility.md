# Portable vector and compatibility contracts

## Portable SVG

`svg` supports the bounded rect/line/circle/path/text/polyline/polygon grammar, at most 150 shapes and 24 attributes per shape. It is not arbitrary SVG markup. Text remains text, with no events, external resources, links or scripts. Full semantic validation follows structural validation.

ViewBox keeps the existing four nonnegative integer-token syntax; width and height must be positive finite and their product finite (`SVG_VIEWBOX`). Numeric attributes are x/y/x1/y1/x2/y2/cx/cy/r/rx/ry/width/height/stroke-width/opacity/fill-opacity/stroke-opacity/font-size/dx/dy. They require finite unitless numeric tokens, including optional exponent form; empty or CSS-unit values fail. r/rx/ry/width/height/stroke-width/font-size cannot be negative; opacities must be in [0,1] (`SVG_NUMBER`).

Other allowed attributes are fill/stroke/stroke-dasharray/stroke-linecap/stroke-linejoin/d/points/text-anchor/dominant-baseline/font-weight/transform. Unknown names fail `SVG_ATTRIBUTE`. Paint accepts none/currentColor/transparent, black/white/red/green/blue/gray/grey/orange/purple, hex of length 3/4/6/8, and the existing numeric rgb/rgba/hsl/hsla grammar; URL paint fails `SVG_PAINT`. This is not a full CSS parser.

Path text allows M/Z/L/H/V/C/S/Q/T/A in either case plus digits/whitespace/decimal/comma/sign/exponent characters (`SVG_PATH`). Points and dash arrays are numeric lists; dasharray also permits none. Transforms allow numeric translate/scale/rotate/matrix/skewX/skewY calls (`SVG_TRANSFORM`). Numeric tokens in these lists must be finite. These checks do not claim complete geometric grammar validation.

Enum attributes are: linecap butt/round/square; linejoin miter/round/bevel; text-anchor start/middle/end; dominant-baseline auto/middle/central/hanging/text-before-edge/text-after-edge/alphabetic; font-weight normal/bold or hundreds from 100 through 900. Other values fail `SVG_ATTRIBUTE`.

## Native compatibility

`native` is recognized structurally for compatibility, but full `validateDocument` always reports `UNSUPPORTED_NATIVE`. Its minimal example demonstrates structural recognition only, not a successful portable renderer or added functionality. Use portable ordinary nodes instead.
