# Code: foundation code display

Use a matching source build or newly generated distributable for these defaults; older CDN pins keep their original behavior. This change does not promote the rolling CDN branch.

V2 uses `Code(data)` from `base/code`, included in the core and full bundles. `CodeView(data)` remains a compatibility alias and `CodeData(...)` remains available. Pre-migration full-profile selections of `views/content` or `viewNames: ['CodeView']` also include the new base module. New profiles should select `base/code` directly.

```text
root = Stack([Code({value: "echo hello", language: "bash"})])
```

Block code defaults to syntax highlighting, a visible language label, and one-click copy. `copy: false`, `highlight: false`, and `showLanguage: false` independently disable those features. Set all three false for the plain `<pre><code>` structure. Existing explicit `copy: false` and `highlight: false` continue to disable copying and highlighting. Omitted block options now enable the defaults, so the block root may be a wrapper rather than the old `<pre>`.

`inline: true` retains literal inline `<code>` with no header or controls. Omitted/false enhancement options are valid; true for any of the three options is rejected. The legacy `iui/1` code node supports the same options and defaults without adding a node type.

`value` is a literal string, at most 12,000 Unicode code points; `language` is 1–200 code points. Code is never executed, fetched or independently verified. Other document/parser budgets still apply.

## Highlighting

The implementation uses highlight.js 11.12.0 (BSD-3-Clause), a private core instance and only these bundled grammars: Bash, JavaScript, TypeScript, JSON, Python, CSS, XML/HTML, SQL, YAML and Markdown, including their upstream aliases. Bash supports `bash`, `sh` and `zsh`; JavaScript supports `js`; TypeScript supports `ts`. Language matching is case-insensitive but not whitespace-trimmed.

There is no automatic detection or remote grammar loading. Missing language displays “Plain text” (or “纯文本” in Chinese) and stays unhighlighted. Unknown language displays the supplied label literally and stays unhighlighted. Highlighting is a display aid, not syntax validation.

Only safe span scopes from highlight.js are converted into DOM text nodes. Source HTML never enters `innerHTML`. A round-trip check falls back to plain text if highlighting changes the original text. CRLF, tabs, Unicode, NUL and lone surrogates are preserved. Input is bounded; the regex-based highlighter is not described as linear-time. Bundled scopes use shared theme colors and include forced-colors support.

## Copy and lifecycle

Copy runs only after a trusted native pointer or keyboard button activation, on the owner document's secure-context Clipboard API. It submits the original string. It does not read clipboard contents, request permissions or copy automatically. Success appears only when `writeText` resolves; missing, insecure or denied APIs show a manual selection/copy fallback. Clipboard/OS line-ending normalization is outside the component's control.

The button retains focus while a single request is pending. Another explicit activation can retry. A stale promise after replacement, detachment or disposal cannot modify old or new UI. Synthetic `.click()` and `dispatchEvent()` do not copy.

The actual scroll/selection surface keeps `.iui-code`; enhanced blocks use `.iui-code-block`. Authors' legacy id/data-iui attributes stay on the returned root. Foundation code does not pull in the domain renderer, KaTeX, Lottie, or the full highlight.js language set.

[Legacy example](../examples/code.json) and [narrow composition](../examples/code-contained.json) remain available. Clipboard stub tests are labelled as such; they do not claim to verify writes to the operating system clipboard.
