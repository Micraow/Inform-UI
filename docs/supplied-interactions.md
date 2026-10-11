# Supplied legacy category review and river puzzle

These are two separate complete local contracts. The legacy view does not alter financial records or contact an account service. The puzzle implements the classic three-item rules locally; its follow-up requests do not start a conversation.

## Legacy category correction

`ledger-low-confidence-category-correction-legacy` has a supplied title, account-availability flag, empty text and up to100 uniquely identified transactions. Each transaction keeps its exact name, date, amount/category labels and correction query. `amountValue` only supplies the sign for positive presentation; it never rewrites the amount label. A null or omitted sign is neutral. Masking uses each supplied masked amount label and neutralizes the sign tone.

The initial list has three records. More/Less switches three/all while retaining record and media DOM identity. Hidden rows cannot dispatch requests. On collapse/reset, keyboard focus inside a newly hidden row returns to More. Empty data displays the supplied empty text. `connected:false` renders only a supplied `noAccounts` title/description/action label and finite query, not the hidden transaction list or opaque host action JSON.

Row activation requests `correct-category` with the transaction ID, exact query and title. Onboarding requests its supplied query. There is no implicit mutation, generated category, connector identifier or host system hint. Images are supplied: inline media can load immediately; external logos require an explicit sibling control outside the row's action button. Loading restores focus to the row action, and update/disposal releases media URLs. Missing logos use an original supplied glyph; source failure follows the existing image hide-on-failure contract.

## SuperbowlRiddle

`superbowl-riddle` is the finite fox/chicken/grain river-crossing puzzle. All display instructions, item/bank/boat labels, terminal messages and follow-up prompts are supplied. No reference artwork or follow-up prose is bundled. An optional initial snapshot places each of the three items exactly once across two banks and at most one cargo slot. Boat side and supplied initial outcome are explicit.

Only the current bank can be picked from. Selecting another item swaps current cargo back onto that bank. Unload returns cargo to the current bank. Cross checks the bank being left unattended: chicken with fox or grain loses. Cargo is automatically delivered on the other bank; all three safely on the right wins. Empty-boat crossings are allowed. Terminal states disable/hide game actions and expose only the appropriate supplied follow-ups plus Reset.

Reset always returns to the canonical all-left, empty-cargo, left-boat, playing arrangement, even when the initial supplied snapshot was different. This follows the observed puzzle contract. Native reset has the same target but honors cancellation and newer accepted game input. Keyboard activation uses real buttons; moving a focused item into/out of cargo restores focus to its new meaningful control. A terminal crossing restores focus to Reset.

## Requests and lifetime

`iui:supplied-interaction` details are frozen, bubbling, cancelable and non-composed. Supported intents are category/onboarding, disclosure, puzzle pick/unload/cross/reset and follow-up. Game intents expose a separately frozen proposed `next` snapshot, including frozen bank arrays. Canceling a request leaves local state unchanged. Acceptance applies only local presentation/game state or records a receipt.

A stable visible Reset anchors native form handling. Source disabled, fieldset/first-legend, ARIA, hidden/inert and capture cancellation remain effective after DOM-property tampering. Shared intent admission and generation ownership protect constructor recursion, update/disposal and same-turn ancestor removal. New local disclosure/game input can supersede a queued native reset; external-style category/follow-up requests wait until the pending reset settles.

Author DOM/compiler checks, native test discovery, independent consumers and actual browser/pixel acceptance remain separate. The distributed/native-validated unified183 assets are unchanged by this source candidate.

Accepted game reset moves focus to the visible Reset button only when the currently focused cargo, terminal action or bank item will become hidden. Cancelled reset and a newer game input retain focus and state. Existing pick/unload/cross focus destinations still take precedence. This is a local focus correction; the shared reset contract is unchanged.
