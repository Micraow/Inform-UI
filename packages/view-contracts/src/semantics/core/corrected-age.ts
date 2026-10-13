/** Original bounded civil-date arithmetic. No clinical interpretation or current-date inference. */
export interface CorrectedAgeInput {
  basis?: 'gestation' | 'due-date' | null;
  birthDate?: string | null;
  observationDate?: string | null;
  dueDate?: string | null;
  gestationalWeeks?: number | string | null;
  gestationalDays?: number | string | null;
  confirmedPreterm?: boolean | null;
}
export interface CorrectedAgeIssue { field: keyof CorrectedAgeInput; code: string }
export type CorrectedAgeResult =
  | { status: 'invalid'; issues: readonly CorrectedAgeIssue[] }
  | { status: 'incomplete'; missing: readonly (keyof CorrectedAgeInput)[] }
  | { status: 'unsupported'; reason: 'not-confirmed-preterm' | 'gestation-at-least-37-weeks' }
  | { status: 'before-due-date'; dueDate: string; remainingDays: number }
  | { status: 'outside-supported-window'; windowEndDate: string; reason: 'after-second-due-date-anniversary' }
  | { status: 'calculated'; dueDate: string; windowEndDate: string; atWindowBoundary: boolean; correctionDays: number; chronologicalDays: number; correctedDays: number; correctedWeeks: number; remainingDays: number };
interface CivilDate { year: number; month: number; day: number; ordinal: number }
const leap = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
const lengths = (year: number) => [31, leap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const beforeYear = (year: number) => { const y = year - 1; return y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400); };
function ordinal(year: number, month: number, day: number): number {
  return beforeYear(year) + lengths(year).slice(0, month - 1).reduce((a, b) => a + b, 0) + day - 1;
}
function parseDate(value: unknown): CivilDate | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2199 || month < 1 || month > 12 || day < 1 || day > lengths(year)[month - 1]) return;
  return {year, month, day, ordinal: ordinal(year, month, day)};
}
function civil(dayNumber: number): CivilDate {
  let year = 1900;
  while (beforeYear(year + 1) <= dayNumber) year++;
  let remainder = dayNumber - beforeYear(year), month = 1;
  const months = lengths(year);
  while (remainder >= months[month - 1]) remainder -= months[month++ - 1];
  return {year, month, day: remainder + 1, ordinal: dayNumber};
}
const format = (date: CivilDate) => `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
const absent = (value: unknown) => value === undefined || value === null || value === '';
function unit(value: unknown, max: number): number | undefined {
  if (typeof value === 'string' && !/^\d{1,2}$/.test(value)) return;
  if (typeof value !== 'string' && typeof value !== 'number') return;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : undefined;
}
/** Input ranges and the two-year output window are software bounds, not clinical validation. */
export function calculateCorrectedAge(input: CorrectedAgeInput): CorrectedAgeResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {status: 'invalid', issues: [{field: 'basis', code: 'INVALID_INPUT'}]};
  const issues: CorrectedAgeIssue[] = [], missing: (keyof CorrectedAgeInput)[] = [];
  const fail = (field: keyof CorrectedAgeInput, code: string) => issues.push({field, code});
  const dates: Partial<Record<'birthDate' | 'observationDate' | 'dueDate', CivilDate>> = {};
  for (const field of ['birthDate', 'observationDate', 'dueDate'] as const) {
    if (!absent(input[field])) { const date = parseDate(input[field]); if (!date) fail(field, 'INVALID_DATE'); else dates[field] = date; }
  }
  const units: Partial<Record<'gestationalWeeks' | 'gestationalDays', number>> = {};
  for (const [field, max] of [['gestationalWeeks', 99], ['gestationalDays', 6]] as const) {
    if (!absent(input[field])) { const n = unit(input[field], max); if (n === undefined) fail(field, 'INVALID_UNIT'); else units[field] = n; }
  }
  if (!absent(input.basis) && input.basis !== 'gestation' && input.basis !== 'due-date') fail('basis', 'INVALID_BASIS');
  if (!absent(input.confirmedPreterm) && typeof input.confirmedPreterm !== 'boolean') fail('confirmedPreterm', 'INVALID_CONFIRMATION');
  const anyGestation = !absent(input.gestationalWeeks) || !absent(input.gestationalDays);
  if ((!absent(input.dueDate) && anyGestation) || (input.basis === 'gestation' && !absent(input.dueDate)) || (input.basis === 'due-date' && anyGestation)) fail('basis', 'AMBIGUOUS_BASIS');
  if (dates.birthDate && dates.observationDate && dates.observationDate.ordinal < dates.birthDate.ordinal) fail('observationDate', 'OBSERVATION_BEFORE_BIRTH');
  let gestation: number | undefined;
  if (units.gestationalWeeks !== undefined && units.gestationalDays !== undefined) {
    gestation = units.gestationalWeeks * 7 + units.gestationalDays;
    if (gestation === 0) fail('gestationalWeeks', 'ZERO_GESTATION');
  }
  if (input.basis === 'due-date' && dates.birthDate && dates.dueDate) {
    const interval = dates.dueDate.ordinal - dates.birthDate.ordinal;
    if (interval < 22 || interval > 279) fail('dueDate', 'INCONSISTENT_PRETERM_BASIS');
  }
  if (issues.length) return {status: 'invalid', issues};
  for (const field of ['basis', 'birthDate', 'observationDate'] as const) if (absent(input[field])) missing.push(field);
  if (input.basis === 'gestation') for (const field of ['gestationalWeeks', 'gestationalDays'] as const) { if (absent(input[field])) missing.push(field); }
  if (input.basis === 'due-date') for (const field of ['dueDate', 'confirmedPreterm'] as const) { if (absent(input[field])) missing.push(field); }
  if (missing.length) return {status: 'incomplete', missing};
  if (input.basis === 'due-date' && input.confirmedPreterm !== true) return {status: 'unsupported', reason: 'not-confirmed-preterm'};
  if (input.basis === 'gestation' && gestation! >= 259) return {status: 'unsupported', reason: 'gestation-at-least-37-weeks'};
  const birth = dates.birthDate!, observation = dates.observationDate!;
  const due = input.basis === 'due-date' ? dates.dueDate! : civil(birth.ordinal + 280 - gestation!);
  const correctedDays = observation.ordinal - due.ordinal;
  if (correctedDays < 0) return {status: 'before-due-date', dueDate: format(due), remainingDays: -correctedDays};
  const boundaryYear = due.year + 2, boundaryDay = Math.min(due.day, lengths(boundaryYear)[due.month - 1]);
  const boundary = {year: boundaryYear, month: due.month, day: boundaryDay, ordinal: ordinal(boundaryYear, due.month, boundaryDay)};
  if (observation.ordinal > boundary.ordinal) return {status: 'outside-supported-window', windowEndDate: format(boundary), reason: 'after-second-due-date-anniversary'};
  return {status: 'calculated', dueDate: format(due), windowEndDate: format(boundary), atWindowBoundary: observation.ordinal === boundary.ordinal, correctionDays: due.ordinal - birth.ordinal, chronologicalDays: observation.ordinal - birth.ordinal, correctedDays, correctedWeeks: Math.floor(correctedDays / 7), remainingDays: correctedDays % 7};
}

export interface CorrectedAgeNode {
  type: 'calculator-corrected-adjusted-age-of-preterm-infants';
  id?: string;
  label: string;
  initial?: CorrectedAgeInput;
  disabled?: boolean;
  calculateLabel?: string;
  resetLabel?: string;
}
export interface CorrectedAgeDetail {
  readonly id: string | null;
  readonly intent: 'calculate' | 'reset';
  readonly result?: CorrectedAgeResult;
}
export function inspectCorrectedAge(node: CorrectedAgeNode, path: string, add: (issue: {code: string; path: string; message: string}) => void): void {
  for (const key of ['label', 'calculateLabel', 'resetLabel'] as const) if (node[key] !== undefined && !node[key]!.trim()) add({code: 'CORRECTED_AGE_LABEL', path: path + '/' + key, message: 'Supply a nonblank accessible label.'});
}
