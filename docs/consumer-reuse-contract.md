# Proposed inline-consumer reuse contract

Version1. Producer belongs to core; consumer below belongs to Skill. This is a candidate and does not enable skipping tests yet.

Trusted inputs are explicit coreRevision (the actual workflow checkout SHA), reviewed batch lock assetRevision/Skill revision, their actual git trees, and committed consumer script/example hashes and per-example locales. The receipt cannot supply its own expected revision. Both checkouts must be clean; generated artifacts remain ignored. The consumer also compares the current asset integrity/schema bytes with the lock.

Lock JSON fields:

- format: inform-ui-batch-lock/1
- assetRevision, skillRevision: exact40 hex
- assetTree, skillTree: exact40 hex
- integritySha256, schemaSha256: exact64 hex
- consumers: array of {id,script,scriptSha256,widths:[390,768,1100],themes:[light,dark],exampleLanguages:{name:en|zh-CN},examples:[{name,corePath,sha256}]}

All paths are relative POSIX paths inside their explicitly supplied repository. name is a bounded safe basename. No symlink component, absolute path, backslash or parent traversal is accepted.

Receipt JSON fields:

- format: inform-ui-consumer-reuse/1
- assetRevision/coreRevision/coreTree/skillRevision/skillTree/integritySha256/schemaSha256
- buildProofSha256: SHA256 of the adjacent fixed BUILD-EQUIVALENCE.json
- consumers: array {id,status:passed,exampleLanguages:{name:en|zh-CN},scriptSha256,evidenceDirectory,reportSha256,examples:[{name,sha256}],screenshots:{basename:sha256}}

Producer writes a record only after a script actually exits0 and its RESULTS.json declares exactly exampleCount×widthCount×themeCount passed views. Per-script evidenceDirectory is beneath the receipt's directory. RESULTS.json actual revision must equal the checked-out core revision; its widths/themes and localCompiledViews must match the locked plan. It must explicitly say publicCdn:not-run, because this is inline coverage. Every expected {example}-{theme}-{width}.png must exist, match its hash and have a PNG signature; RESULTS hash must match. This verifies evidence completeness, not manual visual acceptance.

Skill reads only committed/trusted lock fields and actual files. The skip set is an exact byte-matched intersection with Skill examples. A missing/mismatched record is a hard error, never a silent skip or implicit success. Entries cannot replace CDN shell/SRI/index-discovery checks. Current check names/branch protections remain unchanged until a reviewed workflow migration is approved.

The lock, receipt and RESULTS each carry the same exact exampleLanguages map, whose key set must equal that consumer example set. Skill compares it to its committed references/example-languages.json. Reuse is only eligible in inline mode; an exact inline receipt can never skip an existing CDN-mode example. The historical 24 examples retain their actual branch locales (20 zh-CN, 4 en).

Build equivalence compares committed src/bin and the exact build/generator/subset executable inputs, actual committed CDN bytes/SRI and both ignored dist trees. The producer rehashes both dist trees before and after each consumer and immediately before writing evidence. The receipt binds the proof bytes, and the receiver rehashes both current dist trees before allowing reuse. A tracked-clean tree does not suffice. None of this replaces real screenshot review.
