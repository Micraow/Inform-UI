# Existing Markdown: bounded renderer candidate

Later independent batch only. Enhances existing `type: "markdown", value: string`; adds no protocol nodes, schema fields, state or component counts. Original implementation, not CommonMark. The current local integration includes the Unicode contract repair; public validation accepts12000 code points. Browser/visual acceptance remains pending, and the accepted d370 CDN still provides the historical plain-text fallback.

## Syntax contract

- Paragraphs preserve soft line separators; blank lines separate blocks. Native block boundaries are structural, not textContent newline characters.
- ATX headings: exactly 1–6 leading `#` followed by one space. No automatic IDs, trailing-heading-marker removal or setext headings.
- Lists: column-zero `- `, `+ `, `* ` or 1–9 digits plus `. ` / `) `. One level, one physical line per item; contiguous items of the same ordered/unordered family form one list. Ordered item numbers remain authored via native `li.value`.
- Quotes: one physical line starting `> `. Nested/indented quote syntax remains literal.
- Fences: exactly three backticks or tildes, optional literal language label containing no backtick/tilde, and exact matching standalone closing triple fence. No indentation, longer fences or executable language behavior. Language label has only outer whitespace trimmed. Contents are the original substring after the opening line separator and before closing line start, including its final LF/CRLF. No normalization, entity decoding, execution, highlighting or copy button.
- Inline code: one matching backtick pair; content is exact, including backslashes/Unicode/line endings. No multi-backtick syntax or CommonMark whitespace normalization.
- Emphasis/strong: flat matching `*` / `_` or `**` / `__`; nonempty content, no leading/trailing whitespace, no intraword or nested formatting. Unsupported runs/nested payloads remain literal. No recursive parsing.
- Explicit links: `[literal label](literal destination)` with nonempty flat label; no nested brackets, backslash escaping or formatting in labels; no parentheses/backslashes in destinations. Core `isSafeURL` alone decides safety; unsafe destinations preserve original syntax visibly. No reference links, titles or autolinks. Fragment URLs use the mount prefix; all nonfragment URLs use `_blank`, `noopener noreferrer`, no-referrer and localized accessible new-tab text (mailto/tel honestly mention a possible external app).
- Backslash escapes the next character in `\\`, backtick, `* _ [ ] ( ) ! # > + - .` outside literal/code regions. Other backslashes remain literal.
- HTML-looking lines beginning `<`, pipe-leading table rows, indented blocks, task-list syntax, images, nested blocks and unsupported fence forms remain visible literal content. No HTML parser, images, external resources, tables, task widgets, math/TeX, directives, footnotes, plugins, templates or interpolation. Unclosed triple fence preserves the entire remaining original substring. Malformed links conservatively leave the remainder literal. Unsupported text still appears in document source order.

The finite grammar may differ from Markdown editors. Use separate first-class nodes for other supported UI features.

## Deterministic resource bounds

Public schema remains 12,000 Unicode code points. Parser safety cap is 24,000 UTF-16 code units (covering that schema limit), 4,096 physical lines, 2,048 AST allocations (blocks/items/inline tokens), and 192,000 charged scan/comparison units. Every forward search charges work, including delimiter-length comparisons and failed attempts. No recursive calls; parsing depth is fixed. Exceeding any parser budget discards the partial plan and renders the complete original input as one literal paragraph, without truncation. Native render tree is bounded by the AST plus at most one hidden hint per link. Parser input over its defensive cap also uses lossless literal fallback; public validation still rejects over-schema input before mount.

Unicode is never normalized or sliced at arbitrary display limits. LF and CRLF are recognized without rewriting code or literal source. Lone CR remains literal. Code textContent is exact; native HTML line layout/CSS can differ from the raw character sequence.


Example: [markdown-subset.json](../examples/markdown-subset.json). Production uses ownerDocument native DOM with scoped CSS; code blocks have explicit native tab stops and localized labels. There are no parser-created event handlers or background activities. Source/public/compiler tests are local evidence only; original screenshots and real browser interaction remain required in the accumulated acceptance batch.
