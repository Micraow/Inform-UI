# Source Code Pro for code and JSON

These are unmodified WOFF2 font files from Adobe's official Source Code Pro repository. They are licensed under the SIL Open Font License 1.1. The original copyright, reserved font name and full license are preserved in `LICENSE.md`; they are also embedded in generated CSS and reproduced in `THIRD_PARTY_NOTICES.md`.

Pinned upstream commit: `803b7e23ec97ae58b6232ea76519a76d428ba268`.

- Repository: https://github.com/adobe-fonts/source-code-pro/tree/803b7e23ec97ae58b6232ea76519a76d428ba268
- Regular (normal 400): https://raw.githubusercontent.com/adobe-fonts/source-code-pro/803b7e23ec97ae58b6232ea76519a76d428ba268/WOFF2/TTF/SourceCodePro-Regular.ttf.woff2
- Semibold (normal 600): https://raw.githubusercontent.com/adobe-fonts/source-code-pro/803b7e23ec97ae58b6232ea76519a76d428ba268/WOFF2/TTF/SourceCodePro-Semibold.ttf.woff2
- License: https://raw.githubusercontent.com/adobe-fonts/source-code-pro/803b7e23ec97ae58b6232ea76519a76d428ba268/LICENSE.md

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| SourceCodePro-Regular.ttf.woff2 | 74052 | 714eee29b70d191f5bf4b3a06b68f2c50522b1303d31c7d44dcefdcc5f9defd0 |
| SourceCodePro-Semibold.ttf.woff2 | 74132 | 488b2806e8a76192c2ceef29b498ba01e46b697578b200ede1b5cad855c379ba |
| LICENSE.md | 4566 | 7c940e28a5388e9bba866cf0e408edda45fe0899ba98665b8f6ab31dc5e4b8ff |

`scripts/code-font-assets.mjs` verifies the exact byte lengths and hashes before generating `src/renderer/code-font.css`. It reads only these local files, never fetches during a build, and embeds their original bytes as data URLs. Both `npm run build` and `npm run build:cdn` run the generator before bundling. The generated CSS is included in the public `styles` export, `dist/style.css`, `cdn/iui.css` and compiled offline HTML.

The source license retains its original CRLF bytes, protected by the directory’s `.gitattributes`; generated CSS and third-party notices normalize only license line endings to LF.

There is no font conversion, subsetting, modification, renaming or remotely hosted font dependency. Source Code Pro is retained as the original font family. The display stack prefers an installed Consolas, then the embedded Source Code Pro, then a system monospace fallback. Consolas is not distributed. Regular and Semibold are both upright; code comments and highlighted tokens must not introduce italic styling.

To regenerate only this small stylesheet, run `node scripts/code-font-assets.mjs`. A provenance update requires reviewing upstream licensing and explicitly updating the pinned source and hashes; mismatches fail the build.
