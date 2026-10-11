# Supplied boxscores

`nba-game-boxscore` renders supplied teams, totals, periods and player statistics. Search, team/starter filters and numeric sorting are local. `cricket-match-boxscore` renders supplied innings, batting and bowling tables with independent sort controls. Unknown values, ties and source-provided overs/rates are preserved; no cricket arithmetic, external providers or live-score requests are inferred.

Native form resets preserve local ownership and newer edits. Shared generation scopes protect reentrant input reads and late paints. Each table separately checks its original parent chain and retires interrupted work if its body is transferred. Rows and disclosures are reused during sorting.

Examples and structural/behavior contracts are in `examples/boxscores.json`, `tests/boxscores.test.mjs`, `tests/boxscores-generation.test.mjs`, and `tests/boxscores-types-consumer.mts`. Source text, labels and CSS restore the project-owned prior implementation. Native visual acceptance is tracked separately.
