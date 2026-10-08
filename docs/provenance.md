# Original implementation and provenance

## What this project is

Intelligent-UI is an independently implemented JavaScript/TypeScript renderer
for the project-defined `iui/1` JSON document contract. It aims for clear,
portable scientific explanations with constrained interaction. It is not an
official OpenAI component package, a ChatGPT client, or a copy of a private
model-output protocol.

It is one public, vendor-neutral library. It requires no OpenAI account, API,
service, or runtime. The current backend's `portable` identifier is not a
separate edition or a transition toward proprietary-runtime dependence.
Historical bridge experiments are design evidence, not a product roadmap.

The public implementation uses project-owned source and explicitly declared
open-source dependencies. The schema generator, semantic checks, expression
handling, DOM/SVG rendering, styles, compiler/CLI integration, and example
content are maintained here. License terms for project source do not override
the licenses of dependencies or user-supplied content.

## Read-only design evidence

The supplied 2026-10-08 handoff was consulted to understand requirements and
compatibility boundaries. Relevant materials were its product requirements,
component/schema boundary, acceptance criteria, gallery addendum, legacy
`iui/1` schema and example documents, and 52-entry gallery catalog. The gallery
README and native-versus-simulation explanation were also reviewed.

Visual inspection included the gallery contact sheet, its desktop chart and
mobile simulator screenshots, and the supplied HPCC UI reference screenshot.
Inspection informed ordinary design decisions such as reading order, subdued
containers, clearly associated units, and a single bottleneck highlight.

The evidence is not distributed with this package. No screenshot, captured
JavaScript, captured CSS, private bridge, private font, account record, session
identifier, cookie, token, or raw capture is a runtime input or public asset.
The gallery's source implementation was not transplanted into this renderer.

## What the historical counts mean

The handoff reported 70 frontend registrations and 308 business-module names.
Those figures describe observations about a particular captured build. They
are neither this library's coverage counts nor evidence that a model can emit
all those names, that their inputs are known, or that they run without the
original host. Some business widgets depend on services, permissions, or
session data unavailable to a standalone renderer.

Keep four things separate:

1. A model's permitted output protocol, which this project does not claim to
   have recovered.
2. A frontend registry, which describes renderable names in one environment.
3. Business modules, which can depend on host state and services.
4. This project's own public `iui/1` contract, which is explicitly versioned and
   validated here.

Similarly, the gallery's 52 entries are a user-visible capability taxonomy.
The [gallery assessment](gallery-capabilities.md) names the supported subset,
extensions, external dependencies, and intentionally unavailable execution.

## Example data and media

All five example documents were written for this implementation. Their prose,
fixture organization, fictional names, and non-required sample values are
original. Each identifies its synthetic or illustrative status in rendered
content as well as document metadata.

- **HPCC:** the required compatibility scenario retains loads 0.8 / 1.2 / 0.9
  and the teaching equation `Wnew = 95 / Umax + 5`. These produce 84.2 initially
  and 110.6 after the middle load becomes 0.6, rounded to one decimal place.
  These stipulated numbers are acceptance data, not a copied experimental
  result or a claim of complete HPCC fidelity.
- **RTT:** values were invented as a short relative-time sequence. Explicit
  null samples demonstrate absent observations; no missing measurement is
  fabricated or interpolated.
- **Wi-Fi:** all metrics form a fictional snapshot. The library does not read
  an operating-system interface or know the reader's real connection.
- **Shortlist:** project names and descriptions are fictional; destinations
  use `example.com`. There are no retrieved recommendations or implied product
  endorsements.
- **Kitchen sink:** a synthetic sensor exercise composes all accepted node
  types. Its values are page-local constants and declared arithmetic.

The small PNG thumbnails embedded in the shortlist and kitchen-sink fixtures
were generated specifically for this project from simple geometric shapes,
using JavaScript and Node's compression library. They contain no photographs,
logos, stock assets, screenshot pixels, or reference-image derivatives. Their
base64 image data is original project media. The constrained SVG examples are
also original geometric descriptions.

## Dependency and distribution boundaries

Ajv provides JSON Schema validation; KaTeX provides formula parsing, visual HTML, accessible MathML and official MIT fonts
output. Build, type-generation, and test dependencies are declared separately
in the package manifest. Review the package's third-party notices and lockfile
when distributing a build; project licensing is not a substitute for those
notices. No proprietary ChatGPT runtime or font bundle is required.

The package.json `private: true` flag prevents accidental npm publication; it
does not make the source private or restrict use of the MIT-licensed library.
No npm publication
is implied or performed by the fixtures or these documents. A future release
or publish operation needs its own version, license, dependency, and artifact
review.

## Verification claims

This document records provenance and design boundaries, not completed test
evidence. Fixture coverage of node names is not proof of browser correctness.
Historical gallery test results do not apply automatically to the new library.
Report only checks actually run against the current revision, including any
untested browser, operating system, keyboard, theme, security, or mobile case.

The [support matrix](support-matrix.md) explicitly separates rendered nodes,
the deliberate Markdown plain-text fallback, and rejected native bridge input.
