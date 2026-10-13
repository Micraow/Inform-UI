# Inform strict parser changes

Base: thesysdev/openui commit `cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7`. Exact upstream and local file digests are recorded in SOURCE.json. strict-parser.patch is the reviewable unified diff. ast.ts and tokens.ts are unchanged.

- expressions.ts: replace executable builtins import with a local finite name table (no Zod, telemetry or runtime imports); require delimiters/commas/valid atoms and whole-expression consumption; enforce a recursion ceiling of 64.
- lexer.ts: reject unknown characters, malformed/unterminated strings, unescaped single-quote-string control characters and invalid escapes; support explicit JSON-style escapes in single-quoted strings; require && / || instead of silently accepting & / |.
- statements.ts: reject invalid declaration lines and empty expressions instead of silently skipping them. Its autocloser is used only for passive preview, never final commit.
- builtin-names.ts: a new local finite name registry, not executable builtin implementations. Host action names remain recognizable so the final runtime can explicitly deny them.

The local src/index.ts interpreter validates AST/data separately and performs strict schema/semantic gating. No upstream materializeValue/evaluate/store/tool runtime is copied into that interpreter. Consult README.md for deliberate differences in arithmetic, equality, sorting, local actions and streaming.
