# Follow Up Card Group

Finite caller-supplied data and local user intents. This component does not execute remote services.

## Required source-package validation

Full validation checks unique item IDs (`DUPLICATE_ID`), URL intents with both absolute HTTP(S) and core safe-link policy, and iconData with both inline data prefix and image policy (`UNSAFE_URL`). Query/prefill text and labels retain schema lengths without extra trim checks. Validation executes no request.
