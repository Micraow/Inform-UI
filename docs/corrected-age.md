# Corrected age: proposed bounded arithmetic contract

Status: original source candidate. The pure arithmetic and local UI have author tests; independent runtime acceptance is pending and no component count has changed. This is an original date/unit calculation, not a clinical assessment or a reproduction of a captured implementation.

## Verified facts and source limits

1. AAP HealthyChildren, “Corrected Age For Preemies”, updated 2018-12-10, gives elapsed age minus the difference between supplied gestational age and 40 weeks. Its public example supports subtraction in weeks. The implementation will use integer days and will never equate four weeks with a calendar month.
   https://www.healthychildren.org/English/ages-stages/baby/preemie/Pages/Corrected-Age-For-Preemies.aspx
2. NICE NG72 recommendations 1.1.13 and 1.3.7 describe corrected age from the original due date and adjustment during early developmental follow-up. Recommendation 1.3.11 identifies assessment at two corrected years. This library will implement no assessment, milestone, screening or referral logic. The cited recommendation facts were checked against official indexed text; no guideline body text is included.
   https://www.nice.org.uk/guidance/ng72/chapter/Recommendations
3. WHO defines preterm birth before 37 completed gestational weeks. This describes the input applicability check, not a viability or outcome judgment.
   https://www.who.int/news-room/fact-sheets/detail/preterm-birth

These sources do not license copying their article text, diagrams, questionnaires or UI. The code, prose and test data will be original; only factual equations and bibliographic links are used. No claim of clinical validation, guideline endorsement or worldwide permission to reproduce source materials is made. Source text and assets will not be bundled.

## Inputs and determinism

- A supplied birth date and observation date, each exact Gregorian YYYY-MM-DD. Never substitute today's date or infer missing values.
- Exactly one basis: supplied original due date; or completed gestational weeks plus remaining days (integer, days0..6). Blank, null and malformed values are unavailable/invalid, never zero.
- Weeks-to-days: gestationDays=7*weeks+days. Validate units first (nonnegative integral completed weeks bounded to two input digits, days0..6; a total of zero is invalid). After valid units, any gestation at/above259 days is outside this preterm calculator's supported applicability and produces no corrected-age result, including40+0 and later gestations. Only positive totals below259 enter the arithmetic. The two-digit input bound is a software limit, not a clinical threshold. This is not a plausibility/viability assessment of smaller values; user-facing text states supplied gestation must come from a qualified record.
- Due-date basis requires an explicit supplied confirmation of preterm birth; the date gap itself does not diagnose prematurity. The due date must be22..279 days after the birth date. A1..21day interval with the explicit preterm confirmation is rejected as inconsistent with this product's equivalent gestation basis (37weeks or later), not used to diagnose prematurity. These are arithmetic consistency bounds, not a clinical gestational-age estimate.
- Date parsing will reject impossible dates, overflow normalization, times and time-zone suffixes. A documented software input range1900..2199 bounds supplied dates. Internal arithmetic must also correctly handle derived due dates and second anniversaries through2202; derived dates are never clamped or wrapped into the input range. Cross-basis equivalence tests require both sets of supplied dates to lie in their supported input range.
- If both bases are supplied, schema/semantics rejects the ambiguity rather than silently selecting one. If cross-check data is added later, disagreement must be explicit; that is not in this first contract.

## Arithmetic and outcomes

Gestation basis: correctionDays=280-gestationDays; inferredArithmeticDueDate=birthDate+correctionDays. Due-date basis: correctionDays=dueDate-birthDate. ChronologicalDays=observationDate-birthDate. CorrectedDays=chronologicalDays-correctionDays, equivalently observationDate-dueDate.

Integer civil-day arithmetic makes daylight-saving/time-zone differences irrelevant. Display nonnegative durations as complete weeks and remaining days, with the exact day count. Never round weeks or render approximate months as calendar months.

Status precedence:
1. Parse every supplied nonblank field. Impossible dates, invalid integer/day units, observation before birth or an inconsistent basis are invalid; identify all affected fields and show no numeric result. Missing another field must not hide a supplied invalid value.
2. If supplied fields are valid but required fields are missing: incomplete, no numeric result.
3. Not confirmed preterm or gestation>=37 weeks: unsupported applicability, no corrected-age result.
4. Observation before due date: before-due-date, show days until the supplied/arithmetic due date, not a negative developmental age or a zero-age clamp.
5. Observation after the due-date second calendar anniversary: outside-supported-window, return only the reason and window-end date, with no corrected duration or other age-result fields. Exactly the anniversary returns arithmetic values with an explicit boundary flag. This is a product output window, not advice to stop follow-up after it. For a Feb29 due date, Feb28 in the second non-leap year is the documented software anniversary convention; it is not attributed to clinical guidance.
6. Otherwise: calculated arithmetic result, chronological duration, correction interval and corrected duration, alongside the source/version and arithmetic-only caveat.

No dosing, vaccination-age choice, developmental diagnosis, prediction or treatment advice; no real patient persistence or external service. Inputs are local and resettable. Calculate/Reset are keyboard-accessible; invalid fields receive useful errors. Source disabled, native fieldsets/first legend, cancellation, replacement, disposal and native form reset must use the current common lifecycle. Reset restores supplied values; later input wins. No fake loading delay or automatic success state.

## Independent verification gates before implementation count

- Independently derive date vectors with a separate standard date implementation and manually check whole-week examples, zero corrected days, week/day remainders, leap days, year boundary, both equivalent bases and window boundary.
- Property checks: correctedDays=observationDueDifference; advancing observation by one civil day advances valid result by one; equivalent gestation/due-date inputs match; invalid/unknown values never produce a numeric result.
- Check cross-time-zone invariance; no use of local midnight milliseconds/24hours.
- Review unsupported cases and the documented leap-anniversary convention separately from arithmetic correctness.
- Exercise original synthetic inputs only. Author tests, independent review and actual public runtime workflows must pass before any canonical count changes. Native and clinical validation remain separate claims.


## Public input and local UI

Protocol type: `calculator-corrected-adjusted-age-of-preterm-infants`. Supply `label` and optional `initial` containing `basis` (`gestation` or `due-date`), `birthDate`, `observationDate`, `gestationalWeeks`, `gestationalDays`, `dueDate`, and `confirmedPreterm`. Exactly one basis is used; conflicting supplied fields are reported as invalid. `disabled`, `calculateLabel`, and `resetLabel` are optional. Within the protocol’s structural types, empty/null or malformed date and unit fields are represented as unavailable/invalid outcomes rather than coerced into numbers. The basis enum is gestation/due-date/null; an unknown enum or non-boolean confirmation is a schema error. Integer unit strings are accepted from local text controls; blanks do not mean zero.

`calculateCorrectedAge(input)` is a pure exported function. Its result is discriminated by `status`: invalid, incomplete, unsupported, before-due-date, outside-supported-window, or calculated. Only calculated results contain age durations. Before-due results contain only a due date and days remaining; outside-window results contain only the reason and window-end date. `remainingDays` in a calculated result is the remainder after complete weeks; before-due uses it solely for days until the due date.

The widget edits a local draft and computes only when Calculate is accepted. `iui:corrected-age` is a bubbling, cancelable, non-composed event whose frozen detail contains `id`, `intent` (`calculate` or `reset`), and, for calculate, a frozen result. It does not submit, transmit, store or log medical data. The embedding application controls its own event handlers and privacy obligations. Local Reset restores the supplied initial draft; native host-form reset uses after-default cancellation checks, current ownership, and newer-input priority. No system clock, patient lookup, remote service or scoring model is used.

The default labels distinguish the interval until a due date from the complete-week remainder. The visible arithmetic-only notice is not an optional label override. Extremely small positive gestation values remain software arithmetic inputs, not clinical plausibility or viability claims; use supplied qualified records. Product boundaries do not replace follow-up or professional assessment.

If accepted Reset changes the basis and hides the focused input, focus returns to the visible Reset action. Canceled reset and still-visible fields retain their focus.
