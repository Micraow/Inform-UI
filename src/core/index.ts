import {inspectEntityFacts} from './entity-facts.js';
import {inspectSourceCitation} from './source-citations.js';
import {inspectVocabulary} from './vocabulary.js';
import {inspectActivityPlanning} from './activity-planning.js';
import {inspectFlightDiscovery} from './flight-discovery.js';
import {inspectLocalPlace} from './local-places.js';
import {inspectDecisionCard} from './decision-cards.js';
import {inspectMailFiles} from './mail-files.js';
import {inspectPoll} from './poll.js';
import {inspectTracker} from './trackers.js';
import {inspectOnboarding} from './onboarding.js';
import {inspectFlightOption,inspectArtistEvents} from './travel-events.js';
import {inspectLocationChoice,inspectBusinessGallery} from './choice-gallery.js';
import {inspectLedger} from './ledger.js';
import {inspectAvailability} from './availability.js';
import {inspectThread} from './thread.js';
import {inspectNewsArticle} from './news.js';
import {inspectEntityReviews} from './entity-reviews.js';
import {inspectPersonProfile} from './person-profile.js';
import {inspectAgenda} from './agenda.js';
import {ratingValueIssue} from './rating.js';
import {inspectVocabCard} from './vocab.js';
import {inspectConverters} from './converters.js';
import {inspectClock} from './time.js';
import {tableLayout, isTableCellObject, TableLayoutError} from './table.js';
import {inspectHeatmap} from './heatmap.js';
import {isFinance,inspectFinance} from './finance.js';
import {inspectMenu} from './menu.js';
import {inspectSuggestions} from './suggestions.js';
import {inspectChecklist} from './checklist.js';
import {inspectFillBlank} from './fill-blank.js';
import {inspectSentenceBuilder} from './sentence-builder.js';
import {isLearning,inspectLearning} from './learning.js';
import {isSports,inspectSports} from './sports.js';
import {inspectExtension,timestamp,chartXDomain,chartYDomain,isField,fieldTypeIssue} from './extensions.js';
import validateSchema from '../schema/validator.cjs';
import type { IUIDocument, Node, Value } from '../schema/document.js';
export type { IUIDocument, Node, Value } from '../schema/document.js';

export type Scalar = string | number | boolean | null;
export type StateValue = Exclude<Scalar, null>;
export interface Issue { code: string; path: string; message: string }
export type ValidationResult = { ok: true; document: IUIDocument } | { ok: false; issues: Issue[] };
export type StateResult = { ok: true; state: Readonly<Record<string, StateValue>>; computed: Readonly<Record<string, Scalar>> } | { ok: false; issues: Issue[] };
export const LIMITS = Object.freeze({ depth: 64, nodes: 2000, values: 50000, text: 2_000_000, issues: 40 });
const reserved = new Set(['__proto__', 'prototype', 'constructor']);
const own = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);
const pointer = (path: string, key: string | number) => `${path}/${String(key).replace(/~/g, '~0').replace(/\//g, '~1')}`;
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const issue = (code: string, path: string, message: string): Issue => ({ code, path, message });

export class EvaluationError extends Error {
  readonly code: string;
  readonly path: string;
  constructor(code: string, path: string, message: string) { super(message); this.name = 'EvaluationError'; this.code = code; this.path = path; }
}
const fail = (code: string, path: string, message: string): never => { throw new EvaluationError(code, path, message); };
/** JSON Schema maxLength counts Unicode code points, not UTF-16 code units.
 * Fast-path BMP text; scan only the bounded ambiguous range without allocating
 * a code-point array. Unpaired surrogates count once, matching schema traversal. */
function withinValueTextLimit(value: string): boolean {
  if (value.length <= 12000) return true;
  if (value.length > 24000) return false;
  let count = 0;
  for (const _point of value) if (++count > 12000) return false;
  return true;
}
/** Resource budget is deliberately different: UTF-16 storage units, including
 * keys. Only called on already-inspected JSON clones, never untrusted getters. */
function textUnits(value: unknown): number {
  if (typeof value === 'string') return value.length;
  if (!value || typeof value !== 'object') return 0;
  let total = 0;
  for (const [key, child] of Object.entries(value)) total += key.length + textUnits(child);
  return total;
}

const toIssue = (error: unknown): Issue => error instanceof EvaluationError ? issue(error.code, error.path, error.message) : issue('INVALID_INPUT', '', 'Input could not be safely inspected.');

/** Clone only JSON data; reject accessors, custom prototypes, cycles and oversized inputs before schema traversal. */
function cloneJSON(input: unknown): unknown {
  const active = new WeakSet<object>();
  let values = 0, nodes = 0, text = 0;
  const visit = (value: unknown, path: string, depth: number): unknown => {
    if (++values > LIMITS.values) fail('VALUE_LIMIT', path, `At most ${LIMITS.values} JSON values are allowed.`);
    if (depth > LIMITS.depth) fail('DEPTH_LIMIT', path, `Nesting may not exceed ${LIMITS.depth}.`);
    if (typeof value === 'number') { if (!Number.isFinite(value)) fail('NON_FINITE', path, 'Numbers must be finite.'); return value; }
    if (typeof value === 'string') { text += value.length; if (text > LIMITS.text) fail('TEXT_LIMIT', path, 'The total text budget was exceeded.'); return value; }
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value !== 'object') fail('JSON_TYPE', path, 'Only JSON values are allowed.');
    const obj = value as object;
    if (active.has(obj)) fail('CYCLIC_INPUT', path, 'JSON data cannot contain cycles.');
    const isArray = Array.isArray(obj);
    const proto = Object.getPrototypeOf(obj);
    if ((!isArray && proto !== Object.prototype && proto !== null) || (isArray && proto !== Array.prototype)) fail('JSON_TYPE', path, 'Only plain JSON objects and arrays are allowed.');
    if (Object.getOwnPropertySymbols(obj).length) fail('JSON_TYPE', path, 'Symbol properties are not JSON.');
    const keys = Object.keys(obj);
    if (keys.length > LIMITS.values || (isArray && (obj as unknown[]).length > LIMITS.values)) fail('VALUE_LIMIT', path, 'Object or array exceeds the value budget.');
    active.add(obj);
    const result: Record<string, unknown> | unknown[] = isArray ? [] : {};
    if (isArray && keys.length !== (obj as unknown[]).length) fail('JSON_TYPE', path, 'Sparse arrays and array properties are not allowed.');
    for (const key of keys) {
      const next = pointer(path, key);
      text += key.length; if (text > LIMITS.text) fail('TEXT_LIMIT', next, 'The total text budget was exceeded.');
      if (reserved.has(key)) fail('RESERVED_KEY', next, 'This property name is reserved.');
      const descriptor = Object.getOwnPropertyDescriptor(obj, key);
      if (!descriptor || !('value' in descriptor)) return fail('JSON_TYPE', next, 'Accessors are not JSON data.');
      if (isArray && !/^(0|[1-9]\d*)$/.test(key)) fail('JSON_TYPE', next, 'Arrays may contain only indexed elements.');
      if (key === 'type' && typeof descriptor.value === 'string' && ++nodes > LIMITS.nodes) fail('NODE_LIMIT', next, `At most ${LIMITS.nodes} nodes are allowed.`);
      (result as Record<string, unknown>)[key] = visit(descriptor.value, next, depth + 1);
    }
    active.delete(obj);
    return result;
  };
  return visit(input, '', 0);
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}

type Expression = { op: string; args: Value[] };
const arities: Readonly<Record<string, readonly [number, number]>> = Object.freeze({ add: [1, 12], sub: [2, 2], mul: [1, 12], div: [2, 2], min: [1, 12], max: [1, 12], round: [1, 2], abs: [1, 1], clamp: [3, 3], gt: [2, 2], lt: [2, 2], eq: [2, 2], if: [3, 3], format: [1, 2] });
function expression(value: Record<string, unknown>, path: string): Expression {
  if (Object.keys(value).length !== 2 || typeof value.op !== 'string' || !own(arities, value.op) || !Array.isArray(value.args)) fail('EXPRESSION_SHAPE', path, 'Expected a supported operator and an args array.');
  const [min, max] = arities[value.op as string];
  const args = value.args as Value[];
  if (args.length < min || args.length > max) fail('OPERATOR_ARITY', pointer(path, 'args'), `${value.op} needs ${min === max ? min : `${min}–${max}`} arguments.`);
  return value as unknown as Expression;
}
function createEvaluator(state: Readonly<Record<string, Scalar>>, computed: Readonly<Record<string, Value>>) {
  const cache: Record<string, Scalar> = Object.create(null);
  const active = new Set<string>();
  const valueOf = (value: unknown, path = '', depth = 0): Scalar => {
    if (depth > LIMITS.depth) fail('DEPTH_LIMIT', path, 'Expression nesting is too deep.');
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'string') { if (!withinValueTextLimit(value)) fail('TEXT_LIMIT', path, 'Value strings are limited to 12000 Unicode code points.'); return value; }
    if (typeof value === 'number') { if (!Number.isFinite(value)) fail('NON_FINITE', path, 'Numbers must be finite.'); return value; }
    if (!record(value)) fail('EXPRESSION_SHAPE', path, 'Expected a scalar or an expression.');
    const object = value as Record<string, unknown>;
    if (own(object, '$')) {
      const name = object.$;
      if (Object.keys(object).length !== 1 || typeof name !== 'string' || reserved.has(name)) fail('REFERENCE', path, 'Invalid reference.');
      const key = name as string;
      if (own(state, key)) return valueOf(state[key], path, depth + 1);
      if (own(cache, key)) return cache[key];
      if (!own(computed, key)) fail('UNKNOWN_REFERENCE', pointer(path, '$'), `Unknown reference: ${key}.`);
      if (active.has(key)) fail('COMPUTED_CYCLE', pointer(path, '$'), `Computed dependency cycle at ${key}.`);
      active.add(key);
      try { const result = valueOf(computed[key], pointer('/computed', key), depth + 1); cache[key] = result; return result; } finally { active.delete(key); }
    }
    const { op, args } = expression(object, path);
    const at = (i: number) => valueOf(args[i], pointer(pointer(path, 'args'), i), depth + 1);
    const num = (i: number): number => { const result = at(i); if (typeof result !== 'number') fail('OPERATOR_TYPE', pointer(pointer(path, 'args'), i), `${op} requires a number.`); return result as number; };
    const precision = () => { const p = args.length === 2 ? num(1) : 0; if (!Number.isInteger(p) || p < 0 || p > 6) fail('NUMERIC_BOUNDARY', pointer(pointer(path, 'args'), 1), 'Precision must be an integer between 0 and 6.'); return p; };
    if (op === 'if') { const condition = at(0); if (typeof condition !== 'boolean') fail('OPERATOR_TYPE', pointer(pointer(path, 'args'), 0), 'if requires a boolean condition.'); return at(condition ? 1 : 2); }
    if (op === 'eq') return at(0) === at(1);
    if (op === 'gt') return num(0) > num(1);
    if (op === 'lt') return num(0) < num(1);
    if (op === 'format') return num(0).toFixed(precision());
    let result: number;
    switch (op) {
      case 'add': result = args.reduce<number>((a, _v, i) => a + num(i), 0); break;
      case 'mul': result = args.reduce<number>((a, _v, i) => a * num(i), 1); break;
      case 'sub': result = num(0) - num(1); break;
      case 'div': { const numerator = num(0), denominator = num(1); if (denominator === 0) fail('DIVISION_BY_ZERO', path, 'Division by zero is not allowed.'); result = numerator / denominator; break; }
      case 'min': result = Math.min(...args.map((_v, i) => num(i))); break;
      case 'max': result = Math.max(...args.map((_v, i) => num(i))); break;
      case 'abs': result = Math.abs(num(0)); break;
      case 'round': { const n = num(0), factor = 10 ** precision(); const scaled = n * factor; if (!Number.isFinite(scaled)) fail('NON_FINITE_RESULT', path, 'Rounding overflowed.'); result = Math.round(scaled) / factor; break; }
      case 'clamp': { const n = num(0), low = num(1), high = num(2); if (low > high) fail('NUMERIC_BOUNDARY', path, 'Clamp lower bound must not exceed upper bound.'); result = Math.max(low, Math.min(high, n)); break; }
      default: return fail('EXPRESSION_SHAPE', path, 'Unknown expression operator.');
    }
    if (!Number.isFinite(result)) fail('NON_FINITE_RESULT', path, 'Expression result must be finite.');
    return result;
  };
  return valueOf;
}

/** Evaluate declarative data. computed accepts expression definitions or already-resolved scalars. */
export function evaluateValue(value: Value, state: Readonly<Record<string, Scalar>> = {}, computed: Readonly<Record<string, Value>> = {}): Scalar {
  const copied = cloneJSON({ value, state, computed }) as { value: Value; state: Record<string, Scalar>; computed: Record<string, Value> };
  if (!record(copied.state) || !record(copied.computed)) fail('INPUT_TYPE', '', 'State and computed definitions must be JSON objects.');
  for (const [key, entry] of Object.entries(copied.state)) if (entry !== null && !['string', 'number', 'boolean'].includes(typeof entry)) fail('INPUT_TYPE', pointer('/state', key), 'State values must be primitive scalars.');
  for (const key of Object.keys(copied.state)) if (own(copied.computed, key)) fail('NAME_COLLISION', pointer('/computed', key), 'State and computed names must be distinct.');
  return createEvaluator(copied.state, copied.computed)(copied.value);
}

/** URL policy deliberately excludes relative URLs, credentials, SVG data and browser-internal schemes. */
export function isSafeURL(value: string, kind: 'link' | 'image' = 'link'): boolean {
  if (!value || value.trim() !== value || /[\u0000-\u0020\u007f\\]/.test(value)) return false;
  if (kind === 'image' && /^data:image\/(?:png|jpeg|gif|webp);base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/i.test(value)) return value.split(',')[1].length > 0;
  if (kind === 'link' && /^#[A-Za-z0-9_.:-]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    if (url.protocol === 'https:' || url.protocol === 'http:') return !!url.hostname;
    if (kind === 'link' && url.protocol === 'mailto:') return !!url.pathname && !/[?]/.test(value) && !/%0[ad]/i.test(value);
    if (kind === 'link' && url.protocol === 'tel:') return /^tel:\+?[0-9().-]+$/i.test(value);
    return false;
  } catch { return false; }
}

const svgNumeric = new Set(['x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'font-size', 'dx', 'dy']);
const svgAttributes = new Set([...svgNumeric, 'fill', 'stroke', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'd', 'points', 'text-anchor', 'dominant-baseline', 'font-weight', 'transform']);
const paint = /^(?:none|currentColor|transparent|black|white|red|green|blue|gray|grey|orange|purple|#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|(?:rgb|rgba|hsl|hsla)\([\d.%,\s+-]+\))$/i;
const numericText = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i;
function inspectSvg(node: Extract<Node, { type: 'svg' }>, path: string, add: (issue: Issue) => void) {
  const box = node.viewBox.split(/\s+/).map(Number);
  if (box.some((v) => !Number.isFinite(v)) || box[2] <= 0 || box[3] <= 0 || !Number.isFinite(box[2] * box[3])) add(issue('SVG_VIEWBOX', pointer(path, 'viewBox'), 'SVG width and height must be positive finite values.'));
  node.shapes.forEach((shape, i) => {
    const base = `${path}/shapes/${i}/attrs`;
    for (const [key, value] of Object.entries(shape.attrs)) {
      const at = pointer(base, key), str = String(value);
      if (['d', 'points', 'stroke-dasharray', 'transform'].includes(key)) {
        const numericTokens = str.match(/[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
        if (numericTokens.some((token) => !Number.isFinite(Number(token)))) add(issue('SVG_NUMBER', at, 'SVG numeric lists must contain finite numbers.'));
      }
      if (!svgAttributes.has(key)) { add(issue('SVG_ATTRIBUTE', at, `Unsupported SVG attribute: ${key}.`)); continue; }
      if ((key === 'fill' || key === 'stroke') && !paint.test(str)) add(issue('SVG_PAINT', at, 'SVG paint must be a safe literal color.'));
      if (svgNumeric.has(key)) {
        const n = Number(value);
        if (!numericText.test(str) || !Number.isFinite(n)) add(issue('SVG_NUMBER', at, 'SVG numeric attributes must be finite unitless numbers.'));
        else if ((['r', 'rx', 'ry', 'width', 'height', 'stroke-width', 'font-size'].includes(key) && n < 0) || (key.endsWith('opacity') && (n < 0 || n > 1))) add(issue('SVG_NUMBER', at, 'SVG dimension or opacity is outside its valid range.'));
      }
      if (key === 'd' && !/^[MmZzLlHhVvCcSsQqTtAa\d\s.,eE+-]*$/.test(str)) add(issue('SVG_PATH', at, 'SVG path contains unsupported characters.'));
      if ((key === 'points' || key === 'stroke-dasharray') && !(key === 'stroke-dasharray' && str === 'none') && !/^[-+\d.eE,\s]+$/.test(str)) add(issue('SVG_NUMBER', at, 'Expected a numeric SVG list.'));
      if (key === 'transform' && !/^(?:(?:translate|scale|rotate|matrix|skewX|skewY)\(\s*[-+\d.eE,\s]+\)\s*)+$/.test(str)) add(issue('SVG_TRANSFORM', at, 'Only numeric SVG transforms are supported.'));
      const enums: Record<string, string[]> = { 'stroke-linecap': ['butt', 'round', 'square'], 'stroke-linejoin': ['miter', 'round', 'bevel'], 'text-anchor': ['start', 'middle', 'end'], 'dominant-baseline': ['auto', 'middle', 'central', 'hanging', 'text-before-edge', 'text-after-edge', 'alphabetic'], 'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] };
      if (enums[key] && !enums[key].includes(str)) add(issue('SVG_ATTRIBUTE', at, `Invalid ${key} value.`));
    }
  });
}

function walkNodes(document: IUIDocument, visit: (node: Node, path: string, parent?: Node) => void) {
  const walk = (node: Node, path: string, parent?: Node) => {
    visit(node, path, parent);
    if ('children' in node) node.children.forEach((child, i) => walk(child, `${path}/children/${i}`, node));
    if (node.type === 'list') node.items.forEach((item, i) => { if (record(item) && 'type' in item) walk(item as Node, `${path}/items/${i}`, node); });
  };
  document.body.forEach((node, i) => walk(node, `/body/${i}`));
}
function nodeValues(node: Node, path: string): [Value, string][] {
  const values: [Value, string][] = [];
  for (const key of ['disabled', 'error'] as const) if (key in node) { const v=(node as unknown as Record<string,Value>)[key]; if(v!==undefined)values.push([v,`${path}/${key}`]); }
  if ('value' in node && node.value !== undefined) values.push([node.value, `${path}/value`]);
  if (node.type === 'loading' && node.progress !== undefined) values.push([node.progress, `${path}/progress`]);
  if (node.type === 'checklist') node.items.forEach((item,i)=>{if(item.disabled!==undefined)values.push([item.disabled, `${path}/items/${i}/disabled`]);});
  if (node.type === 'text') node.runs?.forEach((run, i) => values.push([run.value, `${path}/runs/${i}/value`]));
  if (node.type === 'list') node.items.forEach((item, i) => { if (!record(item) || !('type' in item)) values.push([item as Value, `${path}/items/${i}`]); });
  if (node.type === 'table') {
    const rows = (items: typeof node.rows, at: string) => items?.forEach((row, i) => row.forEach((cell, j) => values.push(isTableCellObject(cell) ? [cell.value, `${at}/${i}/${j}/value`] : [cell, `${at}/${i}/${j}`])));
    rows(node.rows, `${path}/rows`); node.sections?.forEach((section, i) => rows(section.rows, `${path}/sections/${i}/rows`));
  }
  if (node.type === 'topology') node.links.forEach((link, i) => { if (link.load !== undefined) values.push([link.load, `${path}/links/${i}/load`]); });
  if (node.type === 'chart') node.data.forEach((row, i) => Object.entries(row).forEach(([key, value]) => { if (value !== undefined) values.push([value, pointer(`${path}/data/${i}`, key)]); }));
  return values;
}

function semanticIssues(document: IUIDocument, state: Record<string, Scalar>): Issue[] {
  const issues: Issue[] = [];
  const add = (error: Issue) => { if (issues.length < LIMITS.issues) issues.push(error); };
  const capture = (fn: () => void) => { try { fn(); } catch (e) { add(toIssue(e)); } };
  const computed = document.computed ?? {};
  for (const key of Object.keys(computed)) if (own(state, key)) add(issue('NAME_COLLISION', pointer('/computed', key), 'State and computed names must be distinct.'));
  const inferred = new Map<string, string>();
  const active = new Set<string>();
  const infer = (value: Value, path: string): string => {
    if (value === null) return 'null';
    if (!record(value)) return typeof value;
    if ('$' in value) {
      const name = value.$ as string;
      if (own(state, name)) return typeof state[name];
      if (!own(computed, name)) return fail('UNKNOWN_REFERENCE', `${path}/$`, `Unknown reference: ${name}.`);
      if (inferred.has(name)) return inferred.get(name)!;
      if (active.has(name)) return fail('COMPUTED_CYCLE', `${path}/$`, `Computed dependency cycle at ${name}.`);
      active.add(name);
      try { const type = infer(computed[name]!, pointer('/computed', name)); inferred.set(name, type); return type; } finally { active.delete(name); }
    }
    const { op, args } = expression(value, path);
    const types = args.map((arg, i) => infer(arg, `${path}/args/${i}`));
    if (op === 'if') {
      if (types[0] !== 'boolean') fail('OPERATOR_TYPE', `${path}/args/0`, 'if requires a boolean condition.');
      return types[1] === types[2] ? types[1] : 'mixed';
    }
    if (op === 'eq') return 'boolean';
    const bad = types.findIndex((type) => type !== 'number');
    if (bad !== -1) fail('OPERATOR_TYPE', `${path}/args/${bad}`, `${op} requires numeric operands.`);
    return op === 'format' ? 'string' : op === 'gt' || op === 'lt' ? 'boolean' : 'number';
  };
  for (const [key, value] of Object.entries(computed)) if (value !== undefined) capture(() => { infer(value, pointer('/computed', key)); });
  // Index the whole document before checking references, including hidden and
  // later siblings. Authored IDs are exact strings, never DOM selectors.
  const idNodes = new Map<string, Node>();
  walkNodes(document, node => { if (node.id) idNodes.set(node.id, node); });
  const ids = new Set<string>();
  walkNodes(document, (node, path, parent) => {
    if (node.id) { if (ids.has(node.id)) add(issue('DUPLICATE_ID', `${path}/id`, `Duplicate node id: ${node.id}.`)); ids.add(node.id); }
    if (node.type === 'label') {
      const target = idNodes.get(node.target);
      if (!target) add(issue('LABEL_TARGET', `${path}/target`, 'Label target must name an authored node ID in this document.'));
      else if (!['input', 'textarea', 'slider', 'toggle', 'select'].includes(target.type)) add(issue('LABEL_TARGET_TYPE', `${path}/target`, 'Label target must be a supported native single control.'));
    }
    for (const [value, at] of nodeValues(node, path)) capture(() => { infer(value, at); });
    inspectExtension(node,path,state,add);
    if(isSports(node))inspectSports(node,path,add,isSafeURL);
    if(isLearning(node))inspectLearning(node,path,add);
    if(node.type==='vocab-card')inspectVocabCard(node,path,add);
    if(node.type==='restaurant-menu')inspectMenu(node,path,add,isSafeURL);
    if(node.type==='prompt-suggestions')inspectSuggestions(node,path,add);
    if(node.type==='fill-blank')inspectFillBlank(node,path,add);
    if(node.type==='checklist')inspectChecklist(node,path,state,add);
    if(node.type==='sentence-builder')inspectSentenceBuilder(node,path,add);
    if(isFinance(node))inspectFinance(node,path,add,isSafeURL);
    if(node.type==='asset-distribution'||node.type==='transaction-list')inspectLedger(node,path,add,isSafeURL);
    if(node.type==='finance-heatmap')inspectHeatmap(node,path,add,isSafeURL);
    if(node.type==='unit-converter'||node.type==='currency-converter')inspectConverters(node,path,add,isSafeURL);
    if(node.type==='clock')inspectClock(node,path,add);
    if(node.type==='person-profile')inspectPersonProfile(node,path,add,isSafeURL);
    if(node.type==='news-article')inspectNewsArticle(node,path,add,isSafeURL);
    if(node.type==='entity-reviews')inspectEntityReviews(node,path,add,isSafeURL);
    if(node.type==='package-tracker'||node.type==='flight-tracker')inspectTracker(node,path,add,isSafeURL);
    if(node.type==='sidebar-fact-table'||node.type==='entity-thumbnail-list')inspectEntityFacts(node,path,add,isSafeURL,url=>isSafeURL(url,'image'));
    if(node.type==='code-cite'||node.type==='file-cite')inspectSourceCitation(node,path,add,isSafeURL);
    if(node.type==='word-card'||node.type==='copy-words')inspectVocabulary(node,path,add,isSafeURL);
    if(node.type==='shared-activity-planner'||node.type==='event-sidebar')inspectActivityPlanning(node,path,add,isSafeURL);
    if(node.type==='flight-search-form'||node.type==='flight-results')inspectFlightDiscovery(node,path,add,isSafeURL);
    if(node.type==='local-business'||node.type==='restaurant-reviews')inspectLocalPlace(node,path,add,isSafeURL);
    if(node.type==='jobs'||node.type==='product-card')inspectDecisionCard(node,path,add,isSafeURL,url=>isSafeURL(url,'image'));
    if(node.type==='email-preview'||node.type==='file-nav-list')inspectMailFiles(node,path,add,isSafeURL);
    if(node.type==='create-interactive-poll')inspectPoll(node,path,add);
    if(node.type==='onboarding-selection')inspectOnboarding(node,path,add);
    if(node.type==='location-choice-request')inspectLocationChoice(node,path,add,isSafeURL);
    if(node.type==='business-gallery')inspectBusinessGallery(node,path,add,url=>isSafeURL(url,'image'));
    if(node.type==='flight-option')inspectFlightOption(node,path,add,isSafeURL);
    if(node.type==='artist-upcoming-events')inspectArtistEvents(node,path,add,isSafeURL);
    if(node.type==='restaurant-availability')inspectAvailability(node,path,add,isSafeURL);
    if(node.type==='reddit-thread-card')inspectThread(node,path,add,isSafeURL);
    if(node.type==='agenda')inspectAgenda(node,path,add,isSafeURL);
    if(node.type==='weather'&&node.source.url&&!isSafeURL(node.source.url))add(issue('UNSAFE_URL',`${path}/source/url`,'Weather source URL is outside the allowed policy.'));
    if (node.type === 'native') add(issue('UNSUPPORTED_NATIVE', path, 'Native-runtime nodes are recognized for compatibility but are not supported. Use portable node types.'));
    if (node.type === 'citation' || node.type === 'web-link-cards') {
      const links = node.type === 'citation' ? [[node.url, `${path}/url`]] : node.items.map((item, i) => [item.url, `${path}/items/${i}/url`]);
      for (const [url, at] of links) if (!/^https?:\/\//i.test(url) || !isSafeURL(url, 'link')) add(issue('UNSAFE_URL', at, 'Source URLs require allowed absolute HTTP(S) destinations.'));
    }
    if (node.type === 'link' && !isSafeURL(node.href)) add(issue('UNSAFE_URL', `${path}/href`, 'Link URL is outside the allowed policy.'));
    if (node.type === 'text') node.runs?.forEach((run, i) => { if (run.href && !isSafeURL(run.href)) add(issue('UNSAFE_URL', `${path}/runs/${i}/href`, 'Inline link URL is outside the allowed policy.')); });
    if (node.type === 'blockquote' && node.cite && !isSafeURL(node.cite)) add(issue('UNSAFE_URL', `${path}/cite`, 'Quote source URL is outside the allowed policy.'));
    if (node.type === 'tab-panel' && parent?.type !== 'tab-group') add(issue('TAB_PARENT', path, 'tab-panel must be a direct child of tab-group.'));
    if (node.type === 'tab-group') {
      const enabled = node.children.filter(child => !child.disabled);
      if (!enabled.length) add(issue('TAB_SELECTION', path + '/children', 'A tab group needs at least one enabled panel.'));
      if (node.initial !== undefined && !enabled.some(child => child.id === node.initial)) add(issue('TAB_SELECTION', path + '/initial', 'Initial tab must name an enabled direct panel.'));
    }
    if (node.type === 'grid-item') {
      if (parent?.type !== 'grid') add(issue('GRID_ITEM_PARENT', path, 'grid-item must be a direct child of grid.'));
      else {
        if ((node.colSpan ?? 1) > (parent.columns ?? 2)) add(issue('GRID_SPAN', `${path}/colSpan`, 'Grid item span exceeds its desktop columns.'));
        if ((node.mobileColSpan ?? 1) > (parent.mobileColumns ?? 1)) add(issue('GRID_SPAN', `${path}/mobileColSpan`, 'Grid item span exceeds its mobile columns.'));
      }
    }
    if (node.type === 'favicon' && node.src!==undefined && !isSafeURL(node.src, 'image')) add(issue('UNSAFE_URL', `${path}/src`, 'Favicon requires an explicitly supplied allowed image URL.'));
    if (node.type === 'image' && !isSafeURL(node.src, 'image')) add(issue('UNSAFE_URL', `${path}/src`, 'Images must use HTTP(S) or base64 PNG, JPEG, GIF or WebP.'));
    if (node.type === 'svg') inspectSvg(node, path, add);
    if (node.type === 'table') try { tableLayout(node); } catch (error) { if (error instanceof TableLayoutError) add(issue(error.code, path + error.path, error.message)); else throw error; }
    if (node.type === 'topology') {
      const local = new Set<string>();
      node.nodes.forEach((n, i) => { if (local.has(n.id)) add(issue('DUPLICATE_ID', `${path}/nodes/${i}/id`, `Duplicate topology id: ${n.id}.`)); local.add(n.id); });
      node.links.forEach((link, i) => { for (const key of ['from', 'to'] as const) if (!local.has(link[key])) add(issue('TOPOLOGY_ENDPOINT', `${path}/links/${i}/${key}`, `Unknown topology endpoint: ${link[key]}.`)); });
    }
    if (node.type === 'slider' || node.type === 'toggle' || node.type === 'select' || node.type === 'rating') {
      if (!own(state, node.bind)) add(issue('UNKNOWN_BIND', `${path}/bind`, `Input binding must name initial state: ${node.bind}.`));
      if (node.type === 'slider') {
        if (!(node.min < node.max) || !Number.isFinite(node.max - node.min) || node.step > node.max - node.min || !Number.isFinite((node.max - node.min) / node.step) || (node.max - node.min) / node.step > Number.MAX_SAFE_INTEGER || node.min + node.step === node.min || node.max - node.step === node.max) add(issue('INPUT_RANGE', path, 'Slider needs ordered finite bounds and a usable positive step.'));
        node.marks?.forEach((mark, i) => { if (mark.value < node.min || mark.value > node.max) add(issue('INPUT_RANGE', `${path}/marks/${i}/value`, 'Slider marks must lie inside its range.')); });
      }
      if (node.type === 'select') {
        const options = new Set<Scalar>();
        node.options.forEach((option, i) => { if (options.has(option.value)) add(issue('DUPLICATE_OPTION', `${path}/options/${i}/value`, 'Select values must be unique.')); options.add(option.value); });
      }
    }
    if (node.type === 'button') {
      const action = node.action;
      if (action.kind === 'reset' && (own(action, 'bind') || own(action, 'value'))) add(issue('BUTTON_ACTION', `${path}/action`, 'Reset actions cannot contain bind or value.'));
      if (action.kind === 'set') {
        if (!action.bind || !own(state, action.bind) || !own(action, 'value')) add(issue('BUTTON_ACTION', `${path}/action`, 'Set actions require a known state bind and a value.'));
        else if (typeof action.value !== typeof state[action.bind]) add(issue('INPUT_TYPE', `${path}/action/value`, 'Button value must preserve the initial state type.'));
      }
    }
    if (node.type === 'chart') {
      if (node.yMin !== undefined && node.yMax !== undefined && (!(node.yMin < node.yMax) || !Number.isFinite(node.yMax - node.yMin))) add(issue('CHART_BOUNDS', path, 'Chart yMin must be smaller than yMax with a finite span.'));
      const keys = new Set<string>();
      node.series.forEach((series, i) => { if (keys.has(series.key) || series.key === node.xKey) add(issue('CHART_SERIES', `${path}/series/${i}/key`, 'Series keys must be distinct from each other and the x key.')); keys.add(series.key); });
      node.data.forEach((row, i) => { for (const key of [node.xKey, ...keys]) if (!own(row, key)) add(issue('CHART_MISSING', pointer(`${path}/data/${i}`, key), 'Required chart cells must be present; use null for missing y observations.')); });
    }
  });
  return issues;
}

function controlIssue(node: Node, value: Scalar | undefined, path: string): Issue | undefined {
  if (isField(node)) return fieldTypeIssue(node, value, path);
  if (node.type === 'rating') return ratingValueIssue(node,value,path);
  if (node.type === 'slider') {
    if (typeof value !== 'number') return issue('INPUT_TYPE', path, 'Slider bindings must be numeric.');
    if (value < node.min || value > node.max) return issue('INPUT_RANGE', path, 'Slider value is outside its bounds.');
    const steps = (value - node.min) / node.step;
    if (Number.isFinite(steps) && Math.abs(steps - Math.round(steps)) > Number.EPSILON * 16 * Math.max(1, Math.abs(steps))) return issue('INPUT_STEP', path, 'Slider value must align to its step from the minimum.');
  }
  if (node.type === 'toggle' && typeof value !== 'boolean') return issue('INPUT_TYPE', path, 'Toggle bindings must be boolean.');
  if (node.type === 'select' && !node.options.some((option) => option.value === value)) return issue('INPUT_OPTION', path, 'Select binding must match an available option.');
  return undefined;
}
function resolveState(document: IUIDocument, state: Record<string, Scalar>): StateResult {
  const issues: Issue[] = [];
  const add = (e: Issue) => { if (issues.length < LIMITS.issues) issues.push(e); };
  const capture = (fn: () => void) => { try { fn(); } catch (error) { add(toIssue(error)); } };
  const computed: Record<string, Scalar> = {};
  const evaluate = createEvaluator(state, document.computed ?? {});
  for (const key of Object.keys(document.computed ?? {})) capture(() => { computed[key] = evaluate({ $: key }, pointer('/computed', key)); });
  const controls: [Node, string][] = [];
  let largestValueText = 0;
  walkNodes(document, (node, path) => {
    for (const [value, at] of nodeValues(node, path)) capture(() => { largestValueText = Math.max(largestValueText, textUnits(value)); const resolved=evaluate(value, at); if((at===`${path}/disabled`||(node.type==='checklist'&&/^\/items\/\d+\/disabled$/.test(at.slice(path.length))))&&typeof resolved!=='boolean') add(issue('INPUT_TYPE',at,'disabled must resolve to a boolean.')); if(at===`${path}/error`&&typeof resolved!=='string') add(issue('INPUT_TYPE',at,'error must resolve to a string.')); });
    if (node.type === 'loading' && node.progress !== undefined) capture(() => {
      const at = `${path}/progress`, value = evaluate(node.progress!, at);
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) add(issue('LOADING_PROGRESS', at, 'Loading progress must resolve to a finite number from 0 to 100.'));
    });
    if (node.type === 'slider' || node.type === 'toggle' || node.type === 'select' || node.type === 'rating' || isField(node)) {
      controls.push([node, path]);
      const e = controlIssue(node, state[node.bind], pointer('/state', node.bind)); if (e) add(e);
      if (node.type === 'select') node.options.forEach((option, i) => { if (typeof option.value !== typeof state[node.bind]) add(issue('INPUT_TYPE', `${path}/options/${i}/value`, 'All select options must preserve the initial state type.')); });
    }
    if (node.type === 'topology') node.links.forEach((link, i) => {
      if (link.load !== undefined) capture(() => { const value = evaluate(link.load, `${path}/links/${i}/load`); if (typeof value !== 'number' || value < 0) add(issue('TOPOLOGY_LOAD', `${path}/links/${i}/load`, 'Topology load must be a nonnegative finite number.')); });
    });
    if (node.type === 'chart') {
      let observations = 0;
      const numeric: number[] = [];
      const xs:number[]=[]; const scale=node.xScale??'category';
      node.data.forEach((row, i) => {
        capture(() => { const at=pointer(`${path}/data/${i}`,node.xKey),x=evaluate(row[node.xKey],at); if(scale==='category'){if(typeof x!=='string'&&typeof x!=='number')add(issue('CHART_X',at,'Category values must be strings or numbers.'));}else{const n=scale==='time'?timestamp(x):typeof x==='number'?x:NaN; if(!Number.isFinite(n))add(issue('CHART_X',at,'Numeric axes require finite numbers; time axes require epoch milliseconds or ISO timestamps with offset.'));else{if((node.xMin!==undefined&&n<node.xMin)||(node.xMax!==undefined&&n>node.xMax))add(issue('CHART_BOUNDS',at,'Observation is outside stated x bounds.'));if(node.kind!=='scatter'&&xs.length&&n<=xs.at(-1)!)add(issue('CHART_ORDER',at,'Line, area and bar numeric x values must be strictly increasing.'));xs.push(n);}} });
        node.series.forEach((series) => capture(() => {
          const at = pointer(`${path}/data/${i}`, series.key), value = evaluate(row[series.key], at);
          if (value !== null && typeof value !== 'number') add(issue('CHART_VALUE', at, 'Chart y values must be numbers or explicit null gaps.'));
          if (typeof value === 'number') { if((node.kind==='donut'||node.kind==='pie')&&value<0)add(issue(node.kind==='pie'?'CHART_PIE':'CHART_DONUT',at,`${node.kind==='pie'?'Pie':'Donut'} values must be nonnegative.`)); observations++; numeric.push(value); if ((node.yMin !== undefined && value < node.yMin) || (node.yMax !== undefined && value > node.yMax)) add(issue('CHART_BOUNDS', at, 'Observation lies outside the stated y bounds.')); }
        }));
      });
      if(xs.length&&(()=>{const [a,b]=chartXDomain(xs,node.xMin,node.xMax,scale==='time');return !(a<b)||!Number.isFinite(b-a)||(scale==='time'&&(Math.abs(a)>8.64e15||Math.abs(b)>8.64e15));})())add(issue('CHART_BOUNDS',`${path}/data`,'X domain span must be finite.'));
      if((node.kind==='donut'||node.kind==='pie')&&!Number.isFinite(numeric.reduce((a,b)=>a+b,0)))add(issue(node.kind==='pie'?'CHART_PIE':'CHART_DONUT',`${path}/data`,`${node.kind==='pie'?'Pie':'Donut'} total must be finite.`));
      if (numeric.length) {
        const [low,high] = chartYDomain(numeric,node.yMin,node.yMax);
        if (!(low < high) || !Number.isFinite(high - low)) add(issue('CHART_BOUNDS', `${path}/data`, 'The effective chart domain must have an ordered, positive finite span.'));
      }
    }
  });
  walkNodes(document, (node, path) => {
    if (node.type !== 'button' || node.action.kind !== 'set' || !node.action.bind) return;
    for (const [control] of controls) if ('bind' in control && control.bind === node.action.bind) { const e = controlIssue(control, node.action.value, `${path}/action/value`); if (e) add(e); }
  });
  // The public evaluator inspects {value,state,computed}. Validate the same
  // bounded resolved context before mount/refresh, rather than accepting a
  // document which fails only after DOM rendering begins. No budget increase.
  if (textUnits({ state, computed }) + 'value'.length + largestValueText > LIMITS.text) add(issue('TEXT_LIMIT', '/computed', 'The resolved evaluation text budget was exceeded.'));
  return issues.length ? { ok: false, issues } : { ok: true, state: freeze({ ...state }) as Readonly<Record<string, StateValue>>, computed: freeze(computed) };
}

// Cache immutable non-state text cost; state transitions cannot enlarge the
// existing whole-document resource budget by replacing one small value at a time.
const trusted = new WeakMap<object, number>();
function schemaIssues(input: unknown): Issue[] {
  if (validateSchema(input)) return [];
  const all = validateSchema.errors ?? [];
  const filtered = all.filter((error) => error.keyword !== 'oneOf' && error.keyword !== 'anyOf');
  return (filtered.length ? filtered : all).slice(0, LIMITS.issues).map((error) => {
    let path = error.instancePath;
    if (error.keyword === 'required') path = pointer(path, error.params.missingProperty as string);
    if (error.keyword === 'additionalProperties') path = pointer(path, error.params.additionalProperty as string);
    return issue('SCHEMA', path, `${error.message ?? 'Invalid document structure.'}`);
  });
}

/** Validate a project iui/1 document; success owns a detached, deeply frozen normalized clone. */
export function validateDocument(input: unknown): ValidationResult {
  let copied: unknown;
  try { copied = cloneJSON(input); } catch (error) { return { ok: false, issues: [toIssue(error)] }; }
  const structural = schemaIssues(copied);
  if (structural.length) return { ok: false, issues: structural };
  const document = copied as IUIDocument;
  document.theme ??= 'auto'; document.state ??= {}; document.computed ??= {};
  const semantic = semanticIssues(document, document.state);
  if (semantic.length) return { ok: false, issues: semantic };
  const evaluated = resolveState(document, document.state);
  if (!evaluated.ok) return evaluated;
  const fixedText = textUnits(document) - textUnits(document.state);
  if (fixedText + textUnits(document.state) > LIMITS.text) return { ok: false, issues: [issue('TEXT_LIMIT', '', 'The total text budget was exceeded.')] };
  freeze(document); trusted.set(document, fixedText);
  return { ok: true, document };
}

/** Merge state overrides, then atomically evaluate every computed value and dynamic data constraint. */
export function evaluateState(document: IUIDocument, stateOverride: Readonly<Record<string, Scalar>> = {}): StateResult {
  if (!trusted.has(document)) {
    const result = validateDocument(document);
    if (!result.ok) return result;
    document = result.document;
  }
  let override: unknown;
  try { override = cloneJSON(stateOverride); } catch (error) { return { ok: false, issues: [toIssue(error)] }; }
  if (!record(override)) return { ok: false, issues: [issue('INPUT_TYPE', '/state', 'State overrides must be a JSON object.')] };
  const initial = document.state ?? {};
  const state: Record<string, Scalar> = { ...initial };
  for (const [key, value] of Object.entries(override)) {
    const path = pointer('/state', key);
    if (!own(initial, key)) return { ok: false, issues: [issue('UNKNOWN_BIND', path, 'State override contains an unknown binding.')] };
    if (typeof value !== typeof initial[key] || value === null || typeof value === 'object') return { ok: false, issues: [issue('INPUT_TYPE', path, 'State override must preserve the initial primitive type.')] };
    if (typeof value === 'string' && !withinValueTextLimit(value)) return { ok: false, issues: [issue('TEXT_LIMIT', path, 'State strings are limited to 12000 Unicode code points.')] };
    state[key] = value as Scalar;
  }
  if (trusted.get(document)! + textUnits(state) > LIMITS.text) return { ok: false, issues: [issue('TEXT_LIMIT', '/state', 'The total text budget was exceeded.')] };
  return resolveState(document, state);
}
