# Prompt Checklist

Finite caller-supplied data and local user intents. This component does not execute remote services.

## Required source-package validation

`PROMPT_CHECKLIST_TEXT` checks exactly node label, resolved data title, each task title/tryOwnPromptText, and each prompt label/promptText. Task IDs are unique across tasks; prompt IDs are unique within their task (`DUPLICATE_ID`). imageData requires inline data plus image safety (`UNSAFE_URL`). Other labels, summary, completion text and fallback retain structural constraints. The inspector adds no membership check for selected/completed/latest IDs; preserve the existing schema and renderer behavior rather than inventing a stronger restriction. Expanding/selecting never marks completion.
