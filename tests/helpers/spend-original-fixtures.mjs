/** Fictional teaching series. All values and display labels are explicitly supplied. */
export function spendSeriesFixtures() {
  const point = (day, value, label, future = false) => ({ day, value, label, future });
  const months = [
    { id: 'month_june', month: '2026-06', label: 'Original June teaching period', current: false, observedThroughDay: 30, totalLabel: '900 supplied credits', points: [point(1, 0, 'Zero supplied credits'), point(2, 8, '8 supplied credits'), point(9, null, 'Unknown supplied observation'), point(18, -3, 'Minus3 supplied credits'), point(28, 60, '60 supplied credits')] },
    { id: 'month_july', month: '2026-07', label: 'Original July teaching period', current: false, observedThroughDay: 31, totalLabel: '1200 supplied credits', points: [point(1, 0, 'Zero supplied credits'), point(3, 12, '12 supplied credits'), point(10, 20, '20 supplied credits'), point(19, null, 'Unknown supplied observation'), point(31, 45, '45 supplied credits')] },
    { id: 'month_august', month: '2026-08', label: 'Original current teaching period', current: true, observedThroughDay: 12, totalLabel: '777 supplied credits', points: [point(1, 0, 'Zero supplied credits'), point(2, 7, '7 supplied credits'), point(9, -2, 'Minus2 supplied credits'), point(12, 42, '42 supplied credits'), point(18, null, 'Future supplied slot', true), point(28, null, 'Future supplied slot', true)] }
  ];
  const average = { id: 'average', label: 'Original supplied average reference', points: [point(1, 1, '1 supplied reference credit'), point(4, null, 'Unknown supplied reference'), point(12, 15, '15 supplied reference credits'), point(20, 28, '28 supplied reference credits'), point(28, 34, '34 supplied reference credits')] };
  const previous = { month_june: { id: 'previous_june', label: 'Original supplied earlier reference', points: [point(1, 0, 'Zero supplied reference credits'), point(12, 5, '5 supplied reference credits'), point(28, 11, '11 supplied reference credits')] }, month_july: { id: 'previous_july', label: 'Original supplied previous reference', points: structuredClone(months[0].points) }, month_august: { id: 'previous_august', label: 'Original supplied previous reference', points: structuredClone(months[1].points) } };
  return { months, average, previous, initialMonthId: 'month_august', initialComparison: 'average', scenarios: ['explicit current and historical months', 'supplied previous and average references', 'a different supplied month comparison', 'the selected month cannot compare with itself', 'irregular day positions', 'null gaps stay unknown', 'true zero and negative observations remain supplied', 'future current-month slots remain separate', 'header total is independent of series values'] };
}
/** Fixture oracle only: this does not select or render a runtime comparison. */
export function comparisonChoices(sample, selectedMonthId) {
  return ['previous', 'average', ...sample.months.filter(m => m.id !== selectedMonthId).map(m => m.id)];
}
