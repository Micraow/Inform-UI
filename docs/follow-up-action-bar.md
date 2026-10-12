# Follow Up Action Bar

Finite caller-supplied data and local user intents. This component does not execute remote services.

## Required source-package validation

IDs are unique (`FOLLOW_UP_ACTION_ID`), action labels and any group label nonblank (`FOLLOW_UP_ACTION_LABEL`). Every supplied query must be nonblank; explicitly non-flat presentation also requires a query (`FOLLOW_UP_ACTION_QUERY`). Footer permits omitted intent or new-turn only (`FOLLOW_UP_ACTION_INTENT`); wrapped pills retain the other declared intents. iconSrc uses image policy (`FOLLOW_UP_ACTION_SOURCE`). Fallback retains structural empty-string allowance.
