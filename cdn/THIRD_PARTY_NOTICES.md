# Third-party notices

The original project code is MIT licensed. The package lock records exact dependency versions and integrity hashes.

Runtime dependencies:

- Ajv 8.20.0, MIT, copyright Evgeny Poberezkin. Used during generation and for generated-validator helper functions. The generated validator is built from this project's schema.
- KaTeX 0.18.2, MIT, copyright Khan Academy and other contributors. Used for trusted-library visual HTML plus accessible MathML from untrusted TeX input; HTML extensions are not trusted. Official unmodified WOFF2 fonts and the required KaTeX CSS are redistributed with this MIT notice. CSS retains only the WOFF2 source from each font rule and scopes visual selectors to .iui-root; inline builds embed the same font bytes as data URLs.

Their license texts are included below. Bundled builds preserve dependency license comments. Development-only tooling retains the license included in each installed package; it is not claimed as original project code.

## Ajv

The MIT License (MIT)

Copyright (c) 2015-2021 Evgeny Poberezkin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## KaTeX

The MIT License (MIT)

Copyright (c) 2013-2020 Khan Academy and other contributors
Copyright (c) 2018 Khan Academy (KaTeX fonts)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Font provenance: pinned npm katex@0.18.2 dist/fonts, byte-for-byte copies. Upstream font project: https://github.com/KaTeX/katex-fonts (MIT, copyright 2018 Khan Academy). KaTeX browser requirements: https://katex.org/docs/browser.html.

## Public visual token reference

Selected numeric/color values were informed by OpenAI Apps SDK UI, Copyright 2025 OpenAI, MIT: https://github.com/openai/apps-sdk-ui/blob/main/LICENSE. The layout/CSS here is independently authored; no Apps SDK runtime is bundled. The MIT permission/warranty terms printed above apply to this referenced public material as well. Private captures and private font/CSS assets are not redistributed.
