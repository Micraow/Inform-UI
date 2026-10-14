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

The implementation uses highlight.js 11.12.0 (BSD-3-Clause) in a private core instance. These 26 grammars are bundled; the complete upstream language collection is not imported. Language matching is case-insensitive but not whitespace-trimmed. Every listed name and alias has an original exact-text regression sample.

| Grammar name | Accepted aliases |
| --- | --- |
| `bash` | `sh`, `zsh` |
| `javascript` | `js`, `jsx`, `mjs`, `cjs` |
| `typescript` | `ts`, `tsx`, `mts`, `cts` |
| `json` | `jsonc`, `json5` |
| `python` | `py`, `gyp`, `ipython` |
| `css` | — |
| `xml` | `html`, `xhtml`, `rss`, `atom`, `xjb`, `xsd`, `xsl`, `plist`, `wsf`, `svg` |
| `sql` | — |
| `yaml` | `yml` |
| `markdown` | `md`, `mkdown`, `mkd` |
| `c` | `h` |
| `cpp` | `cc`, `c++`, `h++`, `hpp`, `hh`, `hxx`, `cxx` |
| `java` | `jsp` |
| `rust` | `rs` |
| `go` | `golang` |
| `csharp` | `cs`, `c#` |
| `kotlin` | `kt`, `kts`, `ktm`, `ktx` |
| `swift` | — |
| `ruby` | `rb`, `gemspec`, `podspec`, `thor`, `irb` |
| `php` | — |
| `dockerfile` | `docker` |
| `powershell` | `pwsh`, `ps`, `ps1` |
| `shell` | `console`, `shellsession` |
| `ini` | `toml` |
| `diff` | `patch` |
| `graphql` | `gql` |

Use `bash` / `sh` for shell scripts and `shell` / `console` / `shellsession` for terminal transcripts with prompts. `powershell` is separate. HTML is an alias of `xml`; `svg` means displayed source, never live SVG. `ini` also handles TOML. Embedded Bash in Dockerfile, Ruby in YAML, and GraphQL in JS/TS use the same bundled grammars. PHP source uses `php`; mixed PHP/HTML templates and languages outside this table are not promised. Highlighting does not execute code, and source text and copied text remain unchanged.

There is no automatic detection or remote grammar loading. Missing language displays “Plain text” (or “纯文本” in Chinese) and stays unhighlighted. Unknown language displays the supplied label literally and stays unhighlighted. Highlighting is a display aid, not syntax validation.

Only safe span scopes from highlight.js are converted into DOM text nodes. Source HTML never enters `innerHTML`. A round-trip check falls back to plain text if highlighting changes the original text. CRLF, tabs, Unicode, NUL and lone surrogates are preserved. Input is bounded; the regex-based highlighter is not described as linear-time. Bundled scopes use shared theme colors and include forced-colors support.

## Copy and lifecycle

Copy runs only after a trusted native pointer or keyboard button activation, on the owner document's secure-context Clipboard API. It submits the original string. It does not read clipboard contents, request permissions or copy automatically. Success appears only when `writeText` resolves; missing, insecure or denied APIs show a manual selection/copy fallback. Clipboard/OS line-ending normalization is outside the component's control.

The integrated header uses accessible icon-only controls. Its wrap toggle switches between horizontal scrolling and visual wrapping, exposes aria-pressed, and leaves the source and copied text unchanged. Wrapping is local display state and survives unrelated local edits; a new code value resets it. The copy button retains focus while a single request is pending. Another explicit activation can retry. A stale promise after replacement, detachment or disposal cannot modify old or new UI. Synthetic `.click()` and `dispatchEvent()` do not copy.

The actual scroll/selection surface keeps `.iui-code`; enhanced blocks use `.iui-code-block`. Authors' legacy id/data-iui attributes stay on the returned root. Foundation code does not pull in the domain renderer, KaTeX, Lottie, or the full highlight.js language set.

[Legacy example](../examples/code.json) and [narrow composition](../examples/code-contained.json) remain available. Clipboard stub tests are labelled as such; they do not claim to verify writes to the operating system clipboard.
