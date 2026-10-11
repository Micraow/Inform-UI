# Supplied advice and writing demonstrations

These two original views present complete finite demonstrations supplied by the author. They do not generate advice, translate, compose or send messages, register accounts, collect analytics, or fetch example content.

`conversational-onboarding-advice` has exactly three named presentations: step-by-step (question, optional supplied image, title, diagnostic explanation and numbered steps), recipe (question, name and passive Markdown), and quick-fix (question, title, diagnostic question and next step). No branded reference image or canned reference answer is bundled.

`conversational-onboarding-writing` has translation (source and translated text with preserved whitespace), professional-email (subject and passive Markdown draft), and birthday-message (passive Markdown). The examples are fictional supplied text, not messages to actual people.

Every tab has its own supplied label and question. activeTab selects a known initial presentation. Labels, text and arrays are bounded. The common status is resolved/pending/failed; pending heights are420px for advice and220px for writing. Failure displays a supplied fallback or hides the component. disabled prevents transitions.

## Local transitions

Tabs are native buttons with tablist/tabpanel relationships and stable internal IDs. Left/Right follow direction, Home/End select ends, and modifier/IME input is ignored. A change emits frozen, bubbling, cancelable, non-composed `iui:onboarding-tab` detail `{id,kind,tab,previousTab}`. Cancellation preserves the old presentation. Acceptance changes only the local selection. A native parent form reset restores the initial tab; cancelled reset and newer input keep their current state.

The tab-change event and native reset are explicit portable-library adaptations. External reference telemetry is not reproduced. No next/back/registration service is invented where the observed demonstration only switches tabs.

A replaceable child generation owns the selected content and image resources. Switching away releases the image source; update/dispose and same-turn ancestor removal retire old controls. Passive Markdown uses the existing non-interactive renderer. The only image source is explicitly supplied and validated by the current image policy.

## Scope

Advice and Writing are separate canonical candidates. Search and Study have additional weather/stock/news and orbit/chart/quiz contracts and are not represented by these two tabbed demonstrations. Schema registration alone does not establish completed functionality. Native and reference-pixel results are recorded separately from Node/DOM checks.
