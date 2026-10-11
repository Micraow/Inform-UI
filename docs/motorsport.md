# Supplied motorsport readers

`f1-races` renders supplied race weekends and their finite session lists. Search, season, session kind and status filters are local. Selecting or clearing a session emits a bubbling, cancelable, non-composed `iui:motorsport-session` event with frozen `{componentId, raceId, sessionId}`; IDs are null on clear. No provider requests, automatic navigation or live results are inferred.

`f1-standings` displays supplied driver or constructor records. Search and source/rank/points/name sorting preserve stable rows and disclosures. Unknown ranks and points remain explicit; negative supplied points and ties are preserved. Sources are safe user-supplied links with new-tab protections.

Both readers isolate native form reset, stale generations, reentrant getters and late paint setters. A transferred row/table is not reclaimed; transferred whole component owners retire. Native visual and same-turn ancestor removal acceptance remain separate checks.

See `examples/motorsport.json`, `tests/motorsport.test.mjs`, `tests/motorsport-generation.test.mjs` and the browser suite for executable contracts. The project-owned core, labels and stylesheet are restored from the prior implementation; runtime integration adds shared lifecycle guards.
