# Conversation Suggestions

Finite caller-supplied data and local user intents. This component does not execute remote services.

## Required source-package validation

IDs are unique (`CONVERSATION_SUGGESTION_ID`). Action labels and optional group label are nonblank (`CONVERSATION_SUGGESTION_LABEL`), as are prompts (`CONVERSATION_SUGGESTION_PROMPT`). iconSrc uses core image policy (`CONVERSATION_SUGGESTION_SOURCE`). No extra trim applies to fallback or IDs. Hidden/pending data is still checked.
