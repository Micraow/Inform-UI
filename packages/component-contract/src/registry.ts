import { z } from './zod';
import { createLibrary, defineComponent, tagSchemaId } from '../vendor/openui/src/library';
import { generatePrompt } from '../vendor/openui/src/parser/prompt';
import { isBuiltin, isReservedCall } from '../vendor/openui/src/parser/builtins';
import { markReactive } from '../vendor/openui/src/reactive';
import { schemaSignature } from '../vendor/openui/src/signature';
import { assertName, ContractError, createBudget, freezeData, inspectData, isRecord, FORBIDDEN_KEYS } from './safety';
import type { ComponentDefinition, ComponentRule, DataDefinition, ElementNode, InformProfile, Issue, ModuleDefinition, RuntimeResource, SchemaContext, SlotSpec, ValidationResult } from './types';

const slotTags = new WeakMap<object, SlotSpec>();
const bindingTags = new WeakSet<object>();
const actionTags = new WeakSet<object>();
const mandatoryResource = 'inform/safety-kernel';
function assertUnique(items: readonly string[], label: string) {
  if (new Set(items).size !== items.length) throw new ContractError('duplicate', `Duplicate ${label}.`);
}
function closure<T extends { id: string; dependsOn: readonly string[] }>(catalog: readonly T[], requested: readonly string[], label: string): T[] {
  const byId = new Map<string, T>();
  for (const item of catalog) {
    if (!/^[a-z][a-z0-9/-]*$/.test(item.id) || item.id.split('/').some(key => FORBIDDEN_KEYS.has(key))) throw new ContractError('invalid-id', `Invalid ${label} ID: ${item.id}`);
    if (byId.has(item.id)) throw new ContractError('duplicate', `Duplicate ${label}: ${item.id}`);
    assertUnique(item.dependsOn, `${label} dependency`); byId.set(item.id, item);
  }
  const result: T[] = [], active = new Set<string>(), seen = new Set<string>();
  const visit = (id: string) => {
    const item = byId.get(id); if (!item) throw new ContractError('unknown-dependency', `Unknown ${label}: ${id}`);
    if (active.has(id)) throw new ContractError('dependency-cycle', `Cycle in ${label}: ${[...active, id].join(' -> ')}`);
    if (seen.has(id)) return;
    active.add(id); for (const dep of [...item.dependsOn].sort()) visit(dep); active.delete(id);
    seen.add(id); result.push(item);
  };
  for (const id of [...requested].sort()) visit(id);
  return result;
}
function issue(code: string, path: string, message: string): Issue { return { code, path, message }; }
const elementKeys = new Set(['type', 'typeName', 'props', 'partial', 'statementId', 'hasDynamicProps', 'bindings']);
function isCompleteElement(value: unknown): value is Record<string, unknown> & { type: 'element'; typeName: string; props: Record<string, unknown>; partial: false } {
  if (!isRecord(value)) return false;
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !elementKeys.has(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (!('value' in descriptor) || !descriptor.enumerable) return false;
  }
  return value.type === 'element' && typeof value.typeName === 'string' && value.partial === false && isRecord(value.props)
    && (value.statementId === undefined || typeof value.statementId === 'string')
    && (value.hasDynamicProps === undefined || typeof value.hasDynamicProps === 'boolean')
    && (value.bindings === undefined || isRecord(value.bindings));
}
function checkOrder(name: string, schema: z.ZodObject, order: readonly string[]) {
  if (schema._zod.def.catchall?._zod.def.type !== 'never') throw new ContractError('loose-schema', `${name} must use z.strictObject.`);
  if (Object.keys(schema.shape).join('\0') !== order.join('\0')) throw new ContractError('parameter-order', `${name} orderedProps does not match its Zod key order.`);
  for (const key of order) if (FORBIDDEN_KEYS.has(key)) throw new ContractError('forbidden-key', `${name} contains forbidden prop.`);
}
function assertRefs(schema: unknown, defs: Set<string>) {
  if (Array.isArray(schema)) { schema.forEach(item => assertRefs(item, defs)); return; }
  if (!isRecord(schema)) return;
  if (typeof schema.$ref === 'string') {
    const match = /^#\/\$defs\/([A-Za-z0-9_]+)$/.exec(schema.$ref);
    if (!match || !defs.has(match[1])) throw new ContractError('unresolved-ref', `Schema reference is not closed: ${schema.$ref}`);
  }
  Object.values(schema).forEach(item => assertRefs(item, defs));
}
export function buildProfile(options: {
  id: string; root: string; modules: readonly ModuleDefinition[]; select: readonly string[]; resources: readonly RuntimeResource[];
}): InformProfile {
  if (!options.id.trim()) throw new ContractError('invalid-profile', 'Profile ID is required.');
  assertUnique(options.select, 'selected module');
  const selected = closure(options.modules, options.select, 'module');
  const modulesById = new Map(options.modules.map(mod => [mod.id, mod]));
  for (const mod of selected) {
    if (mod.layer !== 'domain' && mod.dependsOn.some(id => modulesById.get(id)?.layer === 'domain')) throw new ContractError('layer-inversion', `Base module ${mod.id} depends on a domain.`);
    if (mod.components.some(def => def.layer !== mod.layer)) throw new ContractError('layer-mismatch', `Component layer disagrees with ${mod.id}.`);
  }
  const runtimeResources = closure(options.resources, [mandatoryResource, ...new Set(selected.flatMap(mod => [...mod.runtimeRequires]))], 'runtime resource');
  const components: Record<string, ComponentDefinition> = Object.create(null), data: Record<string, DataDefinition> = Object.create(null);
  for (const mod of selected) for (const item of [...mod.components, ...mod.data ?? []]) {
    assertName(item.name, 'Definition');
    if (isBuiltin(item.name) || isReservedCall(item.name) || item.name === 'ActionExpression') throw new ContractError('reserved-name', `Reserved name: ${item.name}`);
    if (components[item.name] || data[item.name]) throw new ContractError('duplicate', `Duplicate definition: ${item.name}`);
    if ('renderer' in item) {
      if (item.renderer.kind === 'unbound') throw new ContractError('renderer-unavailable', `${item.name} has no trusted renderer adapter.`);
      if (!item.docs.trim() || !item.examples.length) throw new ContractError('missing-contract', `${item.name} needs docs and examples.`);
      components[item.name] = Object.freeze({ ...item, orderedProps: Object.freeze([...item.orderedProps]),
        semantics: Object.freeze({ static: Object.freeze([...item.semantics.static]), evaluated: Object.freeze([...item.semantics.evaluated]) }),
        renderer: Object.freeze({ ...item.renderer }), capabilities: Object.freeze([...item.capabilities]), limitations: Object.freeze([...item.limitations]),
        examples: freezeData(item.examples.map(example => ({ ...example, ...(example.props ? { props: structuredClone(example.props) } : {}) }))),
      });
    } else { checkOrder(item.name, item.schema, item.orderedProps); tagSchemaId(item.schema, item.name); data[item.name] = Object.freeze({ ...item, orderedProps: Object.freeze([...item.orderedProps]) }); }
  }
  if (!components[options.root]) throw new ContractError('missing-root', `Root ${options.root} is not in the selected profile.`);
  const compiled: Record<string, ReturnType<typeof defineComponent>> = Object.create(null);
  const ctx: SchemaContext = {
    children(input = {}) {
      const spec: SlotSpec = Object.freeze({ min: input.min ?? 0, max: input.max ?? 128, accepts: input.accepts ?? 'all' });
      if (!Number.isSafeInteger(spec.min) || !Number.isSafeInteger(spec.max) || spec.min < 0 || spec.max < spec.min || spec.max > 4096) throw new ContractError('invalid-slot', 'Child slot bounds are invalid.');
      if (spec.accepts !== 'all') for (const name of spec.accepts) if (!components[name]) throw new ContractError('unknown-slot-component', `Slot refers to unavailable component ${name}.`);
      const node = z.lazy(() => {
        const defs = (spec.accepts === 'all' ? Object.keys(compiled) : spec.accepts).map(name => compiled[name].props as unknown as z.ZodType);
        return defs.length === 1 ? defs[0] : z.union(defs as [z.ZodType, z.ZodType, ...z.ZodType[]]);
      });
      tagSchemaId(node, spec.accepts === 'all' ? 'Component' : spec.accepts.join(' | '));
      const result = z.array(node).min(spec.min).max(spec.max); slotTags.set(result, spec); return result;
    },
    data(name) { if (!data[name]) throw new ContractError('undeclared-data', `Data constructor ${name} is not in the dependency closure.`); return data[name].schema; },
    binding(schema) { bindingTags.add(schema); markReactive(schema); return schema; },
    action() { const result = z.unknown(); actionTags.add(result); tagSchemaId(result, 'ActionExpression'); return result; },
  };
  for (const [name, def] of Object.entries(components)) {
    const props = def.props(ctx); checkOrder(name, props, def.orderedProps);
    compiled[name] = defineComponent({ name, props, description: def.description, component: def.renderer });
  }
  const upstream = createLibrary({ id: options.id, root: options.root, components: Object.values(compiled), componentGroups: selected.filter(mod => mod.components.length).map(mod => ({ name: mod.id, components: mod.components.map(def => def.name) })) });
  const schema = upstream.toJSONSchema();
  schema.$defs ??= {};
  for (const [name, def] of Object.entries(data)) {
    const { $schema: ignored, ...definition } = z.toJSONSchema(def.schema);
    schema.$defs[name] = { ...definition, description: def.description };
  }
  assertRefs(schema, new Set(Object.keys(schema.$defs)));
  const rules: Record<string, ComponentRule> = Object.create(null);
  for (const [name, component] of Object.entries(compiled)) {
    const def = components[name], shape = (component.props as z.ZodObject).shape;
    const slots = Object.fromEntries(Object.entries(shape).filter(([, field]) => slotTags.has(field as object)).map(([key, field]) => [key, slotTags.get(field as object)!]));
    const bindingProps = Object.entries(shape).filter(([, field]) => bindingTags.has(field as object)).map(([key]) => key);
    const actionProps = Object.entries(shape).filter(([, field]) => actionTags.has(field as object)).map(([key]) => key);
    const scalarShape = Object.fromEntries(Object.entries(shape).filter(([key]) => !(key in slots) && !actionProps.includes(key)));
    const scalarSchema = z.strictObject(scalarShape as Record<string, z.ZodType>);
    rules[name] = Object.freeze({ orderedProps: Object.freeze([...def.orderedProps]), childSlots: Object.freeze(Object.keys(slots)), slots: freezeData(slots), bindingProps: Object.freeze(bindingProps), actionProps: Object.freeze(actionProps),
      validateProps(input: unknown, validation: Parameters<ComponentRule['validateProps']>[1] = {}): ValidationResult<Record<string, unknown>> {
        const budget = validation.budget ?? createBudget();
        try {
          budget.consume();
          if (!isRecord(input)) return { ok: false, issues: [issue('invalid-props', '', `${name} props must be an object.`)] };
          const errors: Issue[] = [], scalars: Record<string, unknown> = {}, preserved: Record<string, unknown> = {};
          for (const key of Reflect.ownKeys(input)) {
            budget.consume();
            if (typeof key !== 'string' || FORBIDDEN_KEYS.has(key) || !Object.hasOwn(shape, key)) { errors.push(issue('unknown-prop', `/${String(key)}`, `Unknown prop on ${name}.`)); continue; }
            const descriptor = Object.getOwnPropertyDescriptor(input, key)!;
            if (!('value' in descriptor) || !descriptor.enumerable) { errors.push(issue('non-json', `/${key}`, 'Accessors are forbidden.')); continue; }
            const value = descriptor.value;
            if (key in slots) {
              const spec = slots[key];
              if (!Array.isArray(value) || value.length < spec.min || value.length > spec.max) errors.push(issue('invalid-slot', `/${key}`, 'Child slot violates its array bounds.'));
              else {
                for (let i = 0; i < value.length; i++) {
                  budget.consume(); const child = value[i];
                  if (!isCompleteElement(child) || !components[child.typeName] || (spec.accepts !== 'all' && !spec.accepts.includes(child.typeName))) errors.push(issue('invalid-child', `/${key}/${i}`, 'Expected a complete component available in this profile.'));
                }
                preserved[key] = value;
              }
            } else if (actionProps.includes(key)) {
              if (!validation.isActionHandle?.(value)) errors.push(issue('action-not-authorized', `/${key}`, 'Only runtime-issued local action handles are accepted.'));
              else preserved[key] = value;
            } else scalars[key] = value;
          }
          for (const key of [...Object.keys(slots), ...actionProps]) if (!Object.hasOwn(input, key)) errors.push(issue('missing-prop', `/${key}`, `Missing required ${key}.`));
          const dataIssues = inspectData(scalars, budget); errors.push(...dataIssues);
          if (!dataIssues.length) {
            const parsed = scalarSchema.safeParse(scalars, { jitless: true });
            if (!parsed.success) for (const err of parsed.error.issues) errors.push(issue('schema', '/' + err.path.map(String).join('/'), err.message));
            else Object.assign(scalars, parsed.data);
          }
          if (errors.length) return { ok: false, issues: errors };
          const normalized = { ...scalars, ...preserved };
          for (const hook of validation.phase === 'static' ? def.semantics.static : [...def.semantics.static, ...def.semantics.evaluated]) { budget.consume(); errors.push(...hook(normalized, { budget })); }
          return errors.length ? { ok: false, issues: errors } : { ok: true, value: normalized };
        } catch (error) {
          if (error instanceof ContractError) return { ok: false, issues: [issue(error.code, '', error.message)] };
          throw error;
        }
      },
    });
  }
  const dataShapeRules = Object.fromEntries(Object.entries(data).map(([name, def]) => [name, Object.freeze({
    orderedProps: def.orderedProps,
    validateProps(input: unknown): ValidationResult<Record<string, unknown>> {
      const issues = inspectData(input, createBudget()); if (issues.length) return { ok: false, issues };
      const parsed = def.schema.safeParse(input, { jitless: true });
      return parsed.success ? { ok: true, value: parsed.data } : { ok: false, issues: parsed.error.issues.map(err => issue('schema', '/' + err.path.map(String).join('/'), err.message)) };
    },
  })]));
  const profile: InformProfile = {
    id: options.id, root: options.root, modules: Object.freeze(selected.map(mod => mod.id)), runtimeResources: Object.freeze(runtimeResources.map(resource => resource.id)), components: Object.freeze(components), data: Object.freeze(data), openuiComponents: Object.freeze(compiled), schema: freezeData(schema), componentRules: Object.freeze(rules), dataShapeRules: Object.freeze(dataShapeRules),
    prompt(promptOptions = {}) {
      const rootSlots = rules[options.root].childSlots;
      const allExamples = Object.values(components).flatMap(def => def.examples.flatMap(example => {
        if (def.name === options.root) return [example.source];
        if (rootSlots[0] === 'children' && components[options.root].orderedProps[0] === 'children') return [example.source.replace(/^root = (.+)$/m, `root = ${options.root}([$1])`)];
        return [];
      }));
      // Keep prompt examples bounded; binary/media fixtures belong in the searchable manifest.
      const examples = allExamples.filter(source => source.length <= 4000 && !/data:[^,]*;base64,/i.test(source)).slice(0, 6);
      const promptSpec = upstream.toSpec();
      if (compiled.Icon && (compiled.Icon.props as z.ZodObject).shape.name) {
        const promptProps = z.strictObject({...((compiled.Icon.props as z.ZodObject).shape), name:z.string()});
        promptSpec.components = {...promptSpec.components, Icon:{...promptSpec.components.Icon,signature:schemaSignature('Icon',promptProps)}};
      }
      const dataSignatures = Object.values(data).map(def => `${schemaSignature(def.name, def.schema)}: ${def.description}`).join('\n');
      const generated = generatePrompt({ ...promptSpec, allowedActionSteps: ['Set','Reset'], toolCalls: false, bindings: promptOptions.bindings ?? true, builtinFunctions: promptOptions.builtinFunctions ?? true,
        preamble: 'Generate an Inform UI 2 document using the pinned OpenUI language. This profile is local-only. Use only the component and data constructors listed below.',
        examples,
        additionalRules: [
          'Component means any available UI component in this profile. Data constructors are not UI children.',
          'The positional parameter order is an ABI. Never emit named arguments, unknown props, callback functions, raw HTML, arbitrary CSS, imports, Query, Mutation, @Run, @OpenUrl or @ToAssistant.',
          'All mutable variables must be explicitly declared. Use direct declared $variables for ordinary writable bindings. $value is reserved for assignment-binding input; it is not standalone state. Arbitrary callbacks or JavaScript functions are forbidden.',
          'Only @Set, @Reset and Action([...]) are local action syntax. Actions have no authority to call external services.',
          'Output must be complete. Partial streaming is preview-only. Invalid values or unknown components reject the document, rather than silently dropping content.',
          'Numbers are finite. Division and remainder by zero are errors. Do not depend on implicit numeric coercion or unsafe object keys.',
          'Inform semantics: == and != compare scalar values strictly; logical operators require booleans. Sort uses deterministic lexicographic string order and rejects mixed number/string keys. Filter relational operators require numbers. @Each uses an inline template with a named item, no index parameter or JavaScript lambda.',
          'Display supplied facts accurately. Domain modules do not fetch, verify or transact on data.',
          ...(components.Icon ? ['Icon.name must match an exact name from the bundled searchable icon catalog. Search the catalog by purpose and include only the names needed for this answer; the runtime still validates its full enum.'] : []),
          ...Object.values(components).flatMap(def => def.limitations.map(limit => `${def.name}: ${limit}`)),
          ...(dataSignatures ? [`Data constructors (not renderers):\n${dataSignatures}`] : []),
        ] });
      return generated.replace('Undeclared $variables are auto-created with null default.', 'Undeclared $variables are errors in Inform UI.')
        .replace('Unreferenced variables are silently dropped and will NOT render.', 'Unreferenced variables do not render; connect intended output to root.')
        .replace('colon syntax is NOT supported and silently breaks', 'colon syntax is rejected');
    },
    manifest() { return {
      format: 'inform-component-contract/2', id: options.id, root: options.root, openuiRevision: 'cf615ae1401d78eee1a4dcc1ef0e2e6d61f373d7',
      requestedModules: [...options.select], modules: [...profile.modules], runtimeResources: [...profile.runtimeResources],
      moduleDefinitions:selected.map(mod=>({id:mod.id,layer:mod.layer,dependsOn:[...mod.dependsOn],runtimeRequires:[...mod.runtimeRequires],components:mod.components.map(c=>c.name),dataShapes:(mod.data??[]).map(d=>d.name)})),
      components: Object.values(components).map(def => ({ name: def.name, moduleId:selected.find(mod=>mod.components.some(item=>item.name===def.name))!.id, layer: def.layer, orderedProps: [...def.orderedProps], slots: rules[def.name].slots, bindingProps: rules[def.name].bindingProps, actionProps: rules[def.name].actionProps, renderer: { kind: def.renderer.kind, key: def.renderer.key }, capabilities: def.capabilities, limitations: def.limitations, docs: def.docs, examples: def.examples })),
      dataShapes: Object.values(data).map(def => ({ name: def.name, moduleId:selected.find(mod=>mod.data?.some(item=>item.name===def.name))!.id, orderedProps: def.orderedProps, description: def.description })),
      externalServices: [],
    }; },
    validateTree(input, validation = {}) {
      const budget = validation.budget ?? createBudget(); let nodes = 0;
      const active = new Set<object>();
      const walk = (input: unknown, path: string, depth: number): ValidationResult<ElementNode> => {
        budget.consume();
        if (++nodes > (validation.maxNodes ?? 2048) || depth > (validation.maxDepth ?? 32)) return { ok: false, issues: [issue('tree-limit', path, 'Component tree limit exceeded.')] };
        if (!isCompleteElement(input) || !rules[input.typeName]) return { ok: false, issues: [issue('invalid-element', path, 'Expected a complete known element.')] };
        if (active.has(input)) return { ok: false, issues: [issue('cyclic-tree', path, 'Cyclic component tree.')] };
        active.add(input);
        const parsed = rules[input.typeName].validateProps(input.props, { budget });
        if (!parsed.ok) return { ok: false, issues: parsed.issues.map(err => ({ ...err, path: path + '/props' + err.path })) };
        const props = { ...parsed.value };
        for (const slot of rules[input.typeName].childSlots) {
          const children: ElementNode[] = [];
          for (const [index, child] of (props[slot] as unknown[]).entries()) {
            const result = walk(child, `${path}/props/${slot}/${index}`, depth + 1); if (!result.ok) return result; children.push(result.value);
          }
          props[slot] = children;
        }
        active.delete(input);
        return { ok: true, value: { type: 'element', typeName: input.typeName, props, partial: false, ...(typeof input.statementId === 'string' ? { statementId: input.statementId } : {}) } };
      };
      try { return walk(input, '', 0); } catch (error) { if (error instanceof ContractError) return { ok: false, issues: [issue(error.code, '', error.message)] }; throw error; }
    },
  };
  return Object.freeze(profile);
}
