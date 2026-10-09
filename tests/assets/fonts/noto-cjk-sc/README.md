# Pinned CJK test font

This directory contains unmodified Noto Sans CJK SC Regular from the official notofonts/noto-cjk repository, release tag Sans2.004, resolved to immutable commit523d033d6cb47f4a80c58a35753646f5c3608a78. Exact source and license URLs, byte counts and SHA256 digests are in font-lock.json. OFL.txt is the complete upstream license from that same commit (the historical release keeps it at repository root). The font is distributed under SIL Open Font License1.1, not the project's MIT license. Keep the license with every redistributed copy.

This is an explicitly test-only asset, excluded by the package files list and never loaded by the public renderer/CDN. It avoids repeatedly downloading the entire system CJK package. Do not replace Chinese examples with Latin text, skip fonts, suppress glyph checks or accept generic fallback as equivalent evidence.

scripts/prepare-test-font.mjs verifies the immutable font and license bytes, parses the actual standard Unicode cmap, and checks every CJK codepoint currently used in examples, renderer labels and tests. Unknown glyphs fail closed. The Linux install mode copies the verified font into an explicit temporary directory, creates an isolated fontconfig file/cache while retaining normal system fonts, and asserts fc-match selects the exact copied font. Only that configuration path is exported to later CI browser steps. Nothing is installed into system or user font directories.

The verifier makes no network request. A cache may accelerate fontconfig in future, but would never replace hash/glyph verification. Browser screenshots still require actual execution and visual review; glyph availability alone does not certify typography or high fidelity.
