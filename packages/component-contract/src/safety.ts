import type { Budget, Issue } from './types';
export const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
export class ContractError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = 'ContractError'; }
}
export function createBudget(limit = 100_000): Budget {
  if (!Number.isSafeInteger(limit) || limit < 1) throw new ContractError('invalid-budget', 'Budget must be a positive safe integer.');
  let remaining = limit;
  return { get remaining() { return remaining; }, consume(units = 1) {
    if (!Number.isSafeInteger(units) || units < 1 || remaining < units) throw new ContractError('budget-exceeded', 'Contract validation budget exceeded.');
    remaining -= units;
  } };
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
/** Boundary expects JSON-like data. Reject accessors, cycles and prototype keys before schema code. */
export function inspectData(value: unknown, budget: Budget, maxDepth = 64): readonly Issue[] {
  const ancestors = new Set<object>();
  const walk = (value: unknown, path: string, depth: number): Issue | undefined => {
    budget.consume();
    if (depth > maxDepth) return { code: 'depth-exceeded', path, message: 'Data nesting exceeds contract limit.' };
    if (value === null || typeof value === 'boolean' || typeof value === 'string') return;
    if (typeof value === 'number') return Number.isFinite(value) ? undefined : { code: 'non-finite', path, message: 'Numbers must be finite.' };
    if (!Array.isArray(value) && !isRecord(value)) return { code: 'non-json', path, message: 'Only plain JSON data is accepted.' };
    if (ancestors.has(value)) return { code: 'cyclic-data', path, message: 'Cyclic input is not supported.' };
    ancestors.add(value);
    for (const key of Reflect.ownKeys(value)) {
      budget.consume();
      if (Array.isArray(value) && key === 'length') continue;
      if (Array.isArray(value) && (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key))) return { code: 'non-json', path, message: 'Array properties must be numeric indices.' };
      if (typeof key !== 'string' || FORBIDDEN_KEYS.has(key)) return { code: 'forbidden-key', path, message: 'Forbidden data key.' };
      const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
      if (!('value' in descriptor) || !descriptor.enumerable) return { code: 'non-json', path, message: 'Accessors and non-enumerable data are not supported.' };
      if (descriptor.value === undefined) return { code: 'non-json', path: `${path}/${key}`, message: 'Undefined is not JSON data; omit optional fields.' };
      const issue = walk(descriptor.value, `${path}/${key}`, depth + 1); if (issue) return issue;
    }
    ancestors.delete(value);
    return;
  };
  const issue = walk(value, '', 0); return issue ? [issue] : [];
}
export function freezeData<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeData(child);
    Object.freeze(value);
  }
  return value;
}
export function assertName(name: string, kind: string): void {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name) || FORBIDDEN_KEYS.has(name.toLowerCase())) throw new ContractError('invalid-name', `${kind} name is not a stable PascalCase identifier: ${name}`);
}
