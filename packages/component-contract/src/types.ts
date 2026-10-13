import type { z } from 'zod/v4';
import type { DefinedComponent, LibraryJSONSchema } from '../vendor/openui/src/library';

export type Layer = 'base' | 'layout' | 'control' | 'chart' | 'domain';
export type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };
export type Issue = Readonly<{ code: string; path: string; message: string }>;
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; issues: readonly Issue[] };
export interface ElementNode {
  type: 'element'; typeName: string; props: Record<string, unknown>; partial: boolean;
  statementId?: string; hasDynamicProps?: boolean; bindings?: Readonly<Record<string, BindingHandle>>;
}
export interface Budget {
  consume(units?: number): void;
  readonly remaining: number;
}
/** Host-owned, revision-scoped state. Every transaction MUST re-evaluate and validate before commit. */
export interface StatePort {
  read(path: readonly string[]): Json;
  transaction(updates: readonly { path: readonly string[]; value: Json }[]): ValidationResult<null>;
  subscribe(listener: () => void): () => void;
}
export interface BindingHandle { readonly kind: 'inform-binding'; readonly id: string; readonly name: string }
export interface ActionHandle { readonly kind: 'inform-action'; readonly id: string }
export interface RenderContext {
  document: Document;
  partial?: boolean;
  signal?: AbortSignal;
  bindings?: Readonly<Record<string, BindingHandle>>;
  writeBinding?(prop: string, value: Json): ValidationResult<null>;
  renderChild(node: ElementNode): RenderHandle;
  state?: StatePort;
  /** Local action interpreter only. No Query, Mutation, URL opening or host tools. */
  dispatchLocal?(action: unknown): ValidationResult<null>;
  budget: Budget;
}
export interface RenderHandle { element: HTMLElement | SVGElement; dispose(): void }
export type RendererAdapter = Readonly<
  { kind: 'dom'; key: string; create(props: Record<string, unknown>, context: RenderContext): RenderHandle }
  | { kind: 'react'; key: string; component: unknown }
  | { kind: 'unbound'; key: string }
>;
export type SemanticHook = (props: Readonly<Record<string, unknown>>, context: { budget: Budget }) => readonly Issue[];
export interface SlotSpec { readonly min: number; readonly max: number; readonly accepts: 'all' | readonly string[] }
export interface SchemaContext {
  /** A bounded component slot, compiled against the selected immutable profile. */
  children(spec?: Partial<SlotSpec>): z.ZodType;
  /** Name is a declared data constructor, never a renderer. */
  data(name: string): z.ZodType;
  action(): z.ZodType;
  /** Marks a scalar prop as writable through a declared $state binding. */
  binding<T extends z.ZodType>(schema: T): T;
}
export interface ComponentExample { id: string; description: string; source: string; props?: Record<string, unknown> }
export interface ComponentDefinition {
  name: string;
  layer: Layer;
  description: string;
  /** Stable positional ABI, checked against the sole Zod object shape. */
  orderedProps: readonly string[];
  props(context: SchemaContext): z.ZodObject;
  semantics: { static: readonly SemanticHook[]; evaluated: readonly SemanticHook[] };
  renderer: RendererAdapter;
  docs: string;
  examples: readonly ComponentExample[];
  capabilities: readonly ('display' | 'local-state' | 'local-action')[];
  limitations: readonly string[];
}
export interface DataDefinition {
  name: string; schema: z.ZodObject; description: string; orderedProps: readonly string[];
}
export interface ModuleDefinition {
  id: string; layer: Layer;
  /** Schema/contract dependency closure. */
  dependsOn: readonly string[];
  /** Runtime resources are trusted build-time keys, never URLs/import instructions. */
  runtimeRequires: readonly string[];
  components: readonly ComponentDefinition[];
  data?: readonly DataDefinition[];
}
export interface RuntimeResource { id: string; kind: 'kernel' | 'style' | 'renderer'; dependsOn: readonly string[] }
export interface ComponentRule {
  orderedProps: readonly string[];
  childSlots: readonly string[];
  slots: Readonly<Record<string, SlotSpec>>;
  bindingProps: readonly string[];
  actionProps: readonly string[];
  /** Validates complete evaluated values. Binding handles must be unwrapped by the state owner. */
  validateProps(props: unknown, options?: { phase?: 'static' | 'evaluated'; budget?: Budget; isActionHandle?: (value: unknown) => boolean }): ValidationResult<Record<string, unknown>>;
}
export interface InformProfile {
  id: string; root: string;
  modules: readonly string[]; runtimeResources: readonly string[];
  components: Readonly<Record<string, ComponentDefinition>>;
  data: Readonly<Record<string, DataDefinition>>;
  componentRules: Readonly<Record<string, ComponentRule>>;
  openuiComponents: Readonly<Record<string, DefinedComponent>>;
  schema: LibraryJSONSchema;
  dataShapeRules: Readonly<Record<string, { orderedProps: readonly string[]; validateProps(props: unknown): ValidationResult<Record<string, unknown>> }>>;
  prompt(options?: { bindings?: boolean; builtinFunctions?: boolean }): string;
  manifest(): Record<string, unknown>;
  validateTree(root: unknown, options?: { budget?: Budget; maxDepth?: number; maxNodes?: number }): ValidationResult<ElementNode>;
}
