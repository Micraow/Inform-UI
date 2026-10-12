# Original qSOFA consensus arithmetic and local scorecard

Use `calculator-qsofa-score` with a visible `label`. This independently implemented software reports three supplied component contributions and their sum. It does not diagnose or exclude sepsis, estimate an individual outcome, infer an infection, or issue treatment instructions. The integrating application remains responsible for measurement quality, applicability and safe presentation.

## Version and numerical rules

The explicit version is `qsofa-sepsis3-2016-consensus`, with explicit `population: adult`. The 2016 context is adults with suspected infection, particularly outside intensive care. Specifying adult does not establish that an individual meets the study context. The software never infers infection from measurements or score.

`respiratoryRate` is breaths/minute; `systolicMmHg` is mmHg. No unit inference or conversion is performed. One contribution is recorded for respiratory rate at least22 and one for systolic pressure at most100. The third contribution uses one of two explicitly selected mentation inputs:

- `mentation: {mode: 'assessment', altered: true|false|null}` uses the caller's assessment; unknown is not false.
- `mentation: {mode: 'gcs', score: 3..15|'NT'|null}` requires an integer supplied GCS total. The final consensus uses GCS less than15, so14 contributes1. The derivation study's narrower GCS threshold is not substituted. NT and unknown do not supply a component value.

The input modes are mutually exclusive, including their fields. The library does not decide whether sedation, intubation, a chronic baseline or another cause makes a mental-status observation interpretable.

All three determinate components are required for a total0..3. Missing/unknown inputs return incomplete with no total. Invalid input takes precedence over missing fields. Unsupported version/population returns no score. A complete result exposes the three contributions, total, version and mentation mode, with no positive/negative diagnostic badge or treatment action.

Nonnegative finite measurements, including explicitly supplied zero, are accepted as mathematical inputs. These are software constraints and not physiological plausibility guarantees. Ordinary decimal strings are accepted for measurements, but booleans, whitespace-only, hexadecimal, exponent strings, negative and nonfinite values are rejected. GCS is an integer number, not a coerced string. Changing any input to unknown or invalid clears the previous total.

## Supplied UI and lifecycle

The original view supports live totals, title/subtitle, field label/help overrides, information tabs, notes, numeric measurements, explicit mentation mode and local summary requests. Switching mode clears the other mode's value instead of reinterpreting it. Only the active mentation field is shown. Reset restores independent `defaults` when supplied, otherwise `initial`, without changing the information tab. When a successful reset hides the focused field, focus returns to the visible Reset button. Canceled reset preserves draft and focus; a newer edit wins over pending reset.

`iui:qsofa` is a local, bubbling, cancelable, non-composed event for `reset`, `copy-summary` or `select-info`. Details and nested result contributions are frozen. Copy provides text to the caller; it does not use the clipboard. Native reset waits until the default action has completed. The view observes supplied disabled, native fieldset/first-legend, lifecycle retirement and keyboard modifier/IME rules. Pending uses a320px placeholder; failed renders supplied fallback or nothing. No service is contacted.

## Source and current limitation context

- Singer et al. [Sepsis-3 consensus, JAMA2016;315:801–810](https://jamanetwork.com/journals/jama/fullarticle/2492881), DOI10.1001/jama.2016.0287. Official publisher text checked2026-10-12 for the numerical thresholds and explicit derivation-versus-consensus mentation distinction.
- [SCCM adult sepsis guidelines2021](https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-guidelines-2021) caution against using qSOFA alone for screening.
- [SCCM adult sepsis guidelines2026](https://sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026), official page checked2026-10-12, continues to favor other specified scores over qSOFA as a single hospital sepsis-screening tool. This contextual limitation does not silently replace the explicitly versioned2016 arithmetic.

All descriptions and code here are original. No publication, figure, protected assessment table or captured implementation is redistributed. Public accessibility is not a redistribution license. Software test results do not establish clinical validity or safety for individual decisions.
