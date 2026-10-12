# Supplied study demonstrations

`conversational-onboarding-study` is an original three-tab implementation combining an explicit orbit toy, the existing local quiz, and an explicit numeric line chart. The reference supplied the observable three-tab interaction; no captured implementation or artwork is distributed.

Resolved documents provide `visual`, `quiz`, and `mathGraph`. Pending and failed states need only a label, with optional failure text. Every tab provides its visible label and question. Local `iui:onboarding-tab` events are frozen, bubbling, cancelable and non-composed, with `{id,kind,tab,previousTab}`. Canceling keeps the selected tab. Disabled, fieldset, hidden, inert and ownership restrictions remain effective.

The visual toy takes one to eight explicit orbit records: unique ID, label, radius, period, size, RGB color and optional ring. The day slider is 0–3650 in increments of five. Reset returns it to zero; native form reset restores its supplied initial day. The cycle label divides day by supplied `yearLength` (default 365). These are supplied illustrative parameters, not an astronomy model or a scientific accuracy claim.

The quiz uses the library's real `QuizQuestion` contract: choices, supplied correct IDs, explanation and optional points. Checking, feedback, score/review and restarting stay local. Switching tabs retains quiz work; an accepted native form reset rebuilds the initial quiz. Later local input wins over queued reset. No remote grading or score persistence is performed.

The chart takes increasing explicit numeric x values and nullable y values. Zero and negative values remain numeric; null creates a gap. Actual x spacing, series visibility, keyboard readout and the accessible data table use the existing chart renderer. No fitted values or interpolation are manufactured.

The three tabs support roving keyboard focus, RTL arrows, Home/End and cancellation. Modifier and composition keys do not navigate. Retirement and update use the shared generation lifecycle. The embedded quiz and chart are kept mounted across tab selection, while replaced generations release listeners.

Validation: 10 new source-build contracts and 55 combined study/advice/learning/core tests passed. Native browser scenarios are supplied separately and remain unexecuted for this source. The last frozen CDN is unified164; registering this source is not CDN/native acceptance or canonical promotion.

A later local integration fix rebuilds both embedded quiz and chart on accepted native reset. The original chart checkbox/visible-series mismatch is preserved as a negative control; 11 domain checks now include canceled reset and newer chart input.

## Source module and semantic checks

`learning/study-demo` depends on the maintained `learning/basic` source module for `QuizQuestion`. Read its quiz contract and the chart rendering contract alongside this page. Full `validateDocument` checks present data even when a pending/failed presentation permits a section to be absent.

`STUDY_TEXT` rejects whitespace-only top-level label, each supplied visual/quiz/mathGraph section label and question, and each orbit label. This precise list does not impose a new trim rule on other structurally valid captions, fallback or descriptions. `STUDY_ORBIT` rejects duplicate orbit IDs. Embedded quiz questions reuse `LEARNING_ID` uniqueness checks and `QUIZ_ANSWER` requirements: no repeated correct IDs, every correct ID names a supplied choice, and single-choice questions have exactly one correct ID. `STUDY_GRAPH` requires strictly increasing x values, including across null-y gaps; data is not sorted or interpolated. Structural limits additionally constrain orbit geometry, day steps, array sizes and numeric ranges.
