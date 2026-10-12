# Recommendation Card

Finite caller-supplied data and local user intents. This component does not execute remote services.

## Required source-package validation

`RECOMMENDATION_LABEL` requires nonblank trimmed label in all phases. Resolved data adds nonblank title (`RECOMMENDATION_TITLE`) and inline data plus core image policy for iconData (`UNSAFE_URL`). Description/fallback/emoji/conversationId have structural constraints only, without a blanket trim rule. Pending/failed variants structurally prohibit resolved data.
