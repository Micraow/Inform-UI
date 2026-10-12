# ROX: explicit-unit arithmetic and optional 2019 numerical comparison

This independently written module computes `(SpO2 percent / FiO2 fraction) / breaths per minute`. It accepts supplied measurements, not patient descriptions. It does not estimate FiO2 from oxygen flow, substitute PaO2, recommend oxygen changes or intubation, or establish clinical validity. The integrating application must verify suitability, measurement context and source version.

## Exact input and result contract

Use `calculator-rox-index-for-high-flow-nasal-cannula`, an accessible `label`, and optional `initial` values. Formula version is explicit: `rox-roca-2016-arithmetic`.

- `spo2Percent`: finite0..100, always percent. Zero is a number, not missing.
- `fio2` and `fio2Unit`: explicit `fraction` in(0,1], or `percent` in(0,100]. Percent is divided by100 exactly once. No magnitude-based unit guessing. For example,0.5 declared percent means0.005, not0.5.
- `respiratoryRate`: finite positive breaths/minute.
- `measuredHours`: optional finite nonnegative hours since HFNC initiation. No clock or default observation time is inferred.

The numeric input ranges above are software validity constraints, not proof that any measurement is physiologically plausible or clinically usable. Ordinary decimal strings, including`.5`, `1.` and`+1`, are accepted. Blank/null/absent is unknown; whitespace, hex, exponent strings, malformed values, nonfinite numbers and out-of-range values are rejected rather than coerced. Explicit invalid values take priority over other missing fields. Malformed top-level pure-function arguments return invalid(input). Zero/underflow denominators and nonfinite results never produce a displayed result.

`calculateRox` returns `invalid`, `incomplete`, `unsupported`, `uncomputable`, or `calculated`. A calculated result includes the full finite value, separate one-decimal display, normalized units, optional measured hours and comparison state. Very large values use scientific display. Comparisons use the unrounded value:4.879 and4.881 both display4.9 but lie on different sides of4.88. No output is a treatment instruction.

## Optional research-boundary comparison

The caller must explicitly provide all of:
- `comparisonVersion: "roca-2019-pneumonia-hfnc"`;
- `studyContextConfirmed: true`, a caller declaration, not software verification of eligibility;
- an exact measurement time of2,6or12 hours after HFNC initiation.

Only then does the module report a neutral numerical comparison. Lower boundaries are2.85,3.47and3.85 at the respective times; upper boundary is4.88. Lower equality belongs to the middle interval, upper equality to the upper interval. Other times, missing context or unknown comparison version return an unavailable comparison reason while retaining valid arithmetic. No nearest-time selection or default lower boundary is used.

The research context is pneumonia with acute hypoxemic respiratory failure treated with HFNC. The UI's adult-context declaration is a conservative product scope, not a claim to have revalidated all study inclusion/exclusion criteria. These observations do not establish the correctness of automatically acting on a score for a particular patient or population.

## Supplied scorecard interactions

Live output is updated on every edit; bad or unknown inputs remove any previous numeric result. The view supports supplied title/subtitle, help text, information tabs with RTL and IME-aware keyboard navigation, notes, independent `defaults` for Reset,320px pending display, failed fallback and a visible summary.

`iui:rox` requests are local, frozen, bubbling, cancelable and non-composed. They carry `reset`, `select-info` with `infoId`, or `copy-summary` with text/result. Copy never accesses the clipboard. Native Reset uses an after-default task: canceled reset preserves drafts; newer input wins; update/dispose retire the old view. Supplied disabled and native fieldset/first-legend rules apply. No network or medical service runs automatically.

## Sources, version and content rights

- Roca et al., original ROX derivation, Journal of Critical Care35(2016)200–205, DOI[10.1016/j.jcrc.2016.05.022](https://doi.org/10.1016/j.jcrc.2016.05.022). The original full methods were not obtained in this implementation pass.
- Roca et al., [2019 validation abstract](https://academic.oup.com/ajrccm/article-abstract/199/11/1368/8497973), DOI10.1164/rccm.201803-0589OC. Official abstract read2026-10-12; it fixes the formula, pneumonia/HFNC cohort context and exact time-specific numerical boundaries. This is a study-specific version, not a claim of a universal current guideline.
- Tatkov, [2019 unit analysis](https://academic.oup.com/ajrccm/article/200/1/115/8496774), DOI10.1164/rccm.201902-0376LE. Official text explicitly uses SpO2=95%, fractional FiO2 and breaths/minute.
- Roca et al., [2019 authors' reply](https://academic.oup.com/ajrccm/article/200/1/117/8496761), DOI10.1164/rccm.201903-0571LE, read for the limits of interpreting combinations and study observations.

Only independently expressed facts, original code and bibliographic links are included. No article, figure, captured code, assessment chart or protected treatment narrative is republished. Open access, including a noncommercial/no-derivatives article license, is not represented as an MIT redistribution grant. Caller responsibility does not supply missing content rights or establish clinical safety.

## Source module and document validation

`calculators/rox` uses the unchanged original installer. Full document validation rejects whitespace-only label/resetLabel/copyLabel and supplied field labels (`ROX_TEXT`). Information IDs and labels must be nonblank, IDs unique, and activeInfoId must reference a supplied section (`ROX_INFO`). Help/body/notes and other structurally allowed content retain their empty-string allowance. Initial/default raw values deliberately include invalid or incomplete drafts. Structural acceptance does not establish a calculated ratio, eligible historical comparison or clinical validity; the unchanged pure function applies the explicit units, version, measurement-time and context gates above.
