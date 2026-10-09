# Single-series supplied-value pie

The existing chart node accepts kind: pie in the next candidate. Example: [pie.json](../examples/pie.json). It uses one category X field and one series, with the existing title/status/error/height/label/unit contracts. Cartesian bounds and multiple series are rejected. This does not add a protocol node. The accepted d370 CDN does not contain this enhancement.

Values are finite nonnegative numbers or explicit null. Supplied zero and missing rows remain in the exact data table, but receive no sector. Shares use the sum of known values, with an explicit known-values denominator label; missing values are never invented as zero. A zero/all-missing dataset has an honest no-positive-values view. Positive underflow shares show <0.1%, not 0%. A single positive value fills a real full circle. An overflowing total is rejected before DOM mutation.

Pointer or touch selects sectors using the SVG's actual screen transform. Keyboard Home/End and arrows inspect all authored rows in their original order, including zero and missing rows. Selection, focused graphic and open details survive accepted state updates; invalid updates preserve state and DOM atomically. All rows remain available in the table.

The finite view reuses supplied colors, tokens and localized labels, with forced-colors outlines and responsive sizing. No remote data retrieval, sorting, exploding slices, 3-D, drilldown, animation, chart editor or inferred provenance. Local public validation/geometry tests run before the combined real-browser batch; prepared browser tests alone are not acceptance.
