# Native official icon data

All 755 icon sources from OpenAI Apps SDK UI at commit 0f00143c7a639906f1621fe58e1b6be7b5bea46d, adapted as static SVG data under the included MIT LICENSE.

- Public API and complete canonical list: [docs/icons.md](../../docs/icons.md)
- Machine-readable selection metadata: [catalog.json](./catalog.json)
- Original per-file Git blob SHA-1 and SHA-256: [manifest.json](./manifest.json)
- Literal per-icon modules: definitions/<OfficialName>.ts
- Exact inert upstream sources: upstream/<OfficialName>.tsx.txt
- Regeneration/check: node scripts/build-icon-catalog.mjs [--check] [--measure]

Use a single definition plus createIcon for a lean bundle. all.ts is an explicit opt-in full registry. Do not compile or execute the upstream React snapshots, change geometry by hand, or replace the original license.
