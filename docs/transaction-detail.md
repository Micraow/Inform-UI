# Transaction Detail

Finite caller-supplied data and local user intents. This component does not execute remote services.

## Required source-package validation

`TRANSACTION_DETAIL_LABEL` checks node label and each related actionLabel for nonblank trimmed text. Supplied data is validated even when its phase hides it: related IDs are unique (`DUPLICATE_ID`), and main/related logos use core image safety (`UNSAFE_URL`). Other display strings retain structural lengths without blanket trim. Related pending:true requires pendingLabel structurally. Missing data is allowed. Amount/date/account labels are never parsed as financial values.
